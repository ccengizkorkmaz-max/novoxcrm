import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

import { parseIncomingPayload, normalizeTurkish, findTenant, findOrCreateConversation } from '@/lib/whatsapp/parser';
import { resolveAiProvider, generateAIReply } from '@/lib/whatsapp/ai-chat';
import { fetchChatHistory, buildCustomerContext, assembleFinalPrompt } from '@/lib/whatsapp/context';
import { isCampaignReply, handleCampaignReply } from '@/lib/whatsapp/campaign';
import { extractAndUpdateLeadScore, processHotLeadDetection, extractAndCreateLead } from '@/lib/whatsapp/lead-detection';

/**
 * WHATSAPP & MESSENGER UNIFIED WEBHOOK
 *
 * Bu endpoint hem WhatsApp hem de Facebook Messenger üzerinden gelen mesajları karşılar,
 * veritabanına kaydeder, ve Native AI Chatbot motoruyla otomatik yanıt verir.
 *
 * Meta Developer Dashboard -> WhatsApp -> Configuration kısmında bu URL tanımlanmalıdır.
 * Aynı URL Facebook Messenger webhook'u olarak da kullanılabilir.
 */

// ─── Meta Webhook Doğrulaması (GET) ────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'novox_wa_secure_2024';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook Başarıyla Doğrulandı.');
            return new NextResponse(challenge, { status: 200 });
        } else {
            console.error('❌ Webhook Doğrulama Hatası: Token uyuşmuyor.');
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// ─── Gelen Mesajları İşleme (POST) ────────────────────────────────────────
export async function POST(req: NextRequest) {
    console.log('--- Webhook Triggered ---');
    try {
        const body = await req.json();
        console.log('Full Incoming Body:', JSON.stringify(body));

        // ── 1. Parse: WhatsApp veya Messenger payload'ını normalize et ──
        const payload = parseIncomingPayload(body);

        if (!payload || !payload.message) {
            // Mesaj dışı event (okundu bilgisi, status update vb.) → 200 dön
            return NextResponse.json({ status: 'event_received' }, { status: 200 });
        }

        console.log(`📩 Yeni Mesaj (${payload.channel}): ${payload.name} (${payload.phone}): ${payload.message}`);

        const supabase = createAdminClient();

        // ── 2. Tenant Eşleştir ─────────────────────────────────────────
        console.log(`🔍 Tenant aranıyor: phoneNumberId=${payload.phoneNumberId}, channel=${payload.channel}`);
        const tenantData = await findTenant(supabase, payload.phoneNumberId, payload.channel);
        if (!tenantData) {
            console.error('❌ Tenant bulunamadı, mesaj atılıyor.');
            return NextResponse.json({ status: 'no_tenant' }, { status: 200 });
        }

        const tenantId = tenantData.id;
        console.log('✅ Tenant eşleşti: ' + tenantId);
        const normalizedPhone = payload.phone.replace(/\D/g, '');

        // ── 2.5. Lead Atama Buton Yanıtları (Template Quick Reply) ────
        // Bu kontrol konuşma oluşturulmadan ÖNCE yapılır → AI devreye girmez
        const leadBtnNorm = normalizeTurkish(payload.message);
        // Genişletilmiş buton yanıt kontrolü (Görüştüm Olumlu / Aradım Olumsuz / Aradım Ulaşamadım vb.)
        const isLeadOlumlu = leadBtnNorm === 'aradim olumlu' || leadBtnNorm === 'gorustum olumlu' || leadBtnNorm === 'olumlu';
        const isLeadEle = leadBtnNorm === 'aradim ele' || leadBtnNorm === 'aradim olumsuz' || leadBtnNorm === 'olumsuz' || leadBtnNorm === 'elendi' || leadBtnNorm === 'aradim, olumsuz';
        const isLeadUlasamadim = leadBtnNorm === 'ulasamadim' || leadBtnNorm === 'aradim ulasamadim' || leadBtnNorm === 'ulasilamadi';

        if (isLeadOlumlu || isLeadEle || isLeadUlasamadim) {
            console.log(`🎯 Lead buton tespit edildi: "${payload.message}" → norm: "${leadBtnNorm}" | phone: ${normalizedPhone}`);
            try {
                const phone10 = normalizedPhone.slice(-10);
                const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, phone').eq('tenant_id', tenantId);
                const repProfile = allProfiles?.find(p => {
                    if (!p.phone) return false;
                    const clean = p.phone.replace(/\D/g, '');
                    return clean.endsWith(phone10) || clean.includes(phone10);
                }) || null;
                console.log('🔍 Rep:', repProfile ? repProfile.full_name : 'BULUNAMADI');

                if (repProfile) {
                    const isAdvance = tenantData.crm_mode === 'advance';

                    if (isAdvance) {
                        // ── ADVANCE CRM MODE: leads tablosundan son aktif lead'i çek ──
                        const { data: recentLead } = await supabase
                            .from('leads')
                            .select('id, full_name, phone, email, status, source, project_id, notes')
                            .eq('assigned_to', repProfile.id)
                            .neq('status', 'converted')
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single();
                        console.log('🔍 Lead (Advance Mode):', recentLead ? recentLead.id : 'BULUNAMADI');

                        if (recentLead) {
                            const leadName = recentLead.full_name || 'Aday Müşteri';

                            if (isLeadOlumlu) {
                                // 1. Müşteri (customer) oluştur
                                const { data: newCustomer, error: custErr } = await supabase
                                    .from('customers')
                                    .insert({
                                        tenant_id: tenantId,
                                        full_name: recentLead.full_name,
                                        phone: recentLead.phone,
                                        email: recentLead.email,
                                        source: recentLead.source || 'WhatsApp Button',
                                        contact_type: 'buyer',
                                        notes: `Lead'den dönüştürüldü (WhatsApp Buton). Orijinal lead: ${recentLead.id}${recentLead.notes ? '\n' + recentLead.notes : ''}`
                                    })
                                    .select('id')
                                    .single();

                                if (custErr || !newCustomer) {
                                    console.error('Customer creation error:', custErr);
                                    await sendWhatsAppMessage(normalizedPhone, `❌ Müşteri kaydı oluşturulamadı: ${custErr?.message || 'Bilinmeyen hata'}`, tenantData.wa_phone_number_id, tenantData.wa_access_token);
                                } else {
                                    // 2. Lead durumunu converted yap
                                    await supabase
                                        .from('leads')
                                        .update({
                                            status: 'converted',
                                            converted_customer_id: newCustomer.id,
                                            converted_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                            sub_status: 'nitelikli'
                                        })
                                        .eq('id', recentLead.id);

                                    // 3. Fırsat (opportunity) oluştur
                                    await supabase
                                        .from('opportunities')
                                        .insert({
                                            tenant_id: tenantId,
                                            customer_id: newCustomer.id,
                                            title: `${recentLead.full_name} - Fırsat`,
                                            stage: 'prospect',
                                            value: null,
                                            currency: 'TRY',
                                            assigned_to: repProfile.id,
                                            project_id: recentLead.project_id || null,
                                            notes: `Lead #${recentLead.id} dönüşümünden oluşturuldu (WhatsApp Buton).`,
                                            lead_id: recentLead.id
                                        });

                                    // 4. Satış kaydı (sales) oluştur
                                    await supabase.from('sales').insert({
                                        tenant_id: tenantId,
                                        customer_id: newCustomer.id,
                                        status: 'Prospect',
                                        project_id: recentLead.project_id || null,
                                        description: `Lead dönüşümü (WhatsApp Buton): ${recentLead.source || 'Bilinmeyen kaynak'}`,
                                        assigned_to: repProfile.id
                                    });

                                    // 5. Aktivite kaydet
                                    await supabase.from('activities').insert({
                                        customer_id: newCustomer.id,
                                        lead_id: recentLead.id,
                                        type: 'Whatsapp',
                                        topic: 'Sales',
                                        summary: 'Görüştüm Olumlu - Fırsata Dönüştürüldü',
                                        description: 'Temsilci WhatsApp butonuna tıkladı: Görüştüm Olumlu. Aday Fırsat olarak satış yönetimine aktarıldı.',
                                        due_date: new Date().toISOString(),
                                        status: 'Completed',
                                        priority: 'High'
                                    });

                                    // Temsilciye onay mesajı
                                    await sendWhatsAppMessage(normalizedPhone, `✅ *${leadName}* → Nitelikli olarak tanımlandı ve Fırsat (Prospect) olarak Satış Yönetimine aktarıldı.`, tenantData.wa_phone_number_id, tenantData.wa_access_token);
                                }
                            } else if (isLeadEle) {
                                // 1. Lead durumunu lost (elendi) yap
                                await supabase
                                    .from('leads')
                                    .update({
                                        status: 'lost',
                                        sub_status: 'elendi',
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', recentLead.id);

                                // 2. Aktivite kaydet
                                await supabase.from('activities').insert({
                                    lead_id: recentLead.id,
                                    type: 'Whatsapp',
                                    topic: 'Sales',
                                    summary: 'Lead Elendi',
                                    description: 'Temsilci WhatsApp butonuna tıkladı: Aradım Olumsuz. Aday elendi olarak işaretlendi.',
                                    due_date: new Date().toISOString(),
                                    status: 'Completed',
                                    priority: 'Medium'
                                });

                                // Temsilciye onay mesajı
                                await sendWhatsAppMessage(normalizedPhone, `⛔ *${leadName}* → Aday elendi olarak işaretlendi.`, tenantData.wa_phone_number_id, tenantData.wa_access_token);
                            } else if (isLeadUlasamadim) {
                                // 1. Lead durumunu contacted (Arandı, İletişim kurulamadı) yap
                                await supabase
                                    .from('leads')
                                    .update({
                                        status: 'contacted',
                                        sub_status: 'Arandı, İletişim kurulamadı',
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', recentLead.id);

                                // 2. Aktivite kaydet
                                await supabase.from('activities').insert({
                                    lead_id: recentLead.id,
                                    type: 'Whatsapp',
                                    topic: 'Sales',
                                    summary: 'Arandı Ulaşılamadı',
                                    description: 'Temsilci WhatsApp butonuna tıkladı: Aradım Ulaşamadım. Durum Arandı, İletişim kurulamadı olarak güncellendi.',
                                    due_date: new Date().toISOString(),
                                    status: 'Completed',
                                    priority: 'Medium'
                                });

                                // Temsilciye onay mesajı
                                await sendWhatsAppMessage(normalizedPhone, `📵 *${leadName}* → Durum 'Arandı, İletişim kurulamadı' olarak güncellendi.`, tenantData.wa_phone_number_id, tenantData.wa_access_token);
                            }
                            return NextResponse.json({ status: 'lead_button_processed' }, { status: 200 });
                        }
                    }

                    // ── BASIC CRM MODE (Veya Advance Modda lead bulunamadıysa Fallback) ──
                    const { data: recentSale } = await supabase
                        .from('sales')
                        .select('id, customer_id, status, customers(full_name)')
                        .eq('assigned_to', repProfile.id)
                        .in('status', ['Lead', 'Prospect'])
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    console.log('🔍 Sale:', recentSale ? recentSale.id : 'BULUNAMADI');

                    if (recentSale) {
                        const custName = (recentSale as any).customers?.full_name || 'Müşteri';

                        // Helper: lead_qualifications check+insert/update
                        // (customer_id'de UNIQUE constraint yok, upsert çalışmaz)
                        const updateLQ = async (fields: Record<string, any>) => {
                            const { data: existing } = await supabase
                                .from('lead_qualifications')
                                .select('id')
                                .eq('customer_id', recentSale.customer_id)
                                .limit(1)
                                .single();
                            if (existing) {
                                const { error } = await supabase
                                    .from('lead_qualifications')
                                    .update({ ...fields, updated_at: new Date().toISOString() })
                                    .eq('id', existing.id);
                                console.log('📝 LQ update:', error ? error.message : 'OK');
                            } else {
                                const { error } = await supabase
                                    .from('lead_qualifications')
                                    .insert({ customer_id: recentSale.customer_id, tenant_id: tenantId, status: 'new', ...fields });
                                console.log('📝 LQ insert:', error ? error.message : 'OK');
                            }
                        };

                        if (isLeadOlumlu) {
                            await supabase.from('sales').update({ status: 'Prospect' }).eq('id', recentSale.id);
                            await updateLQ({ interest_level: 'hot', status: 'contacted', call_notes: new Date().toLocaleString('tr-TR') + ' — Olumlu' });
                            await supabase.from('activities').insert({ customer_id: recentSale.customer_id, type: 'Phone', topic: 'Sales', summary: 'Lead Arandi - Olumlu', description: 'Temsilci aradi, olumlu sonuc. Status Prospect.', due_date: new Date().toISOString(), status: 'Completed', priority: 'High' });
                            await sendWhatsAppMessage(normalizedPhone, '✅ *' + custName + '* → Firsat (Prospect) olarak guncellendi. Lead skoru olumlu.', tenantData.wa_phone_number_id, tenantData.wa_access_token);
                        } else if (isLeadEle) {
                            await updateLQ({ interest_level: 'disqualified', status: 'disqualified', call_notes: new Date().toLocaleString('tr-TR') + ' — Elendi' });
                            await supabase.from('activities').insert({ customer_id: recentSale.customer_id, type: 'Phone', topic: 'Sales', summary: 'Lead Arandi - Elendi', description: 'Temsilci aradi, olumsuz sonuc.', due_date: new Date().toISOString(), status: 'Completed', priority: 'Medium' });
                            await sendWhatsAppMessage(normalizedPhone, '⛔ *' + custName + '* → Lead skoru Disqualified olarak isaretlendi.', tenantData.wa_phone_number_id, tenantData.wa_access_token);
                        } else if (isLeadUlasamadim) {
                            await updateLQ({ interest_level: 'warm', status: 'contacted', call_notes: new Date().toLocaleString('tr-TR') + ' — Ulasilamadi' });
                            await supabase.from('activities').insert({ customer_id: recentSale.customer_id, type: 'Phone', topic: 'Sales', summary: 'Lead Arandi - Ulasilamadi', description: 'Temsilci aradi ama ulasamadi.', due_date: new Date().toISOString(), status: 'In Progress', priority: 'Medium' });
                            await sendWhatsAppMessage(normalizedPhone, '📵 *' + custName + '* → Ulasilamadi. Lead skoru Warm olarak guncellendi.', tenantData.wa_phone_number_id, tenantData.wa_access_token);
                        }
                        return NextResponse.json({ status: 'lead_button_processed' }, { status: 200 });
                    }
                }
            } catch (err) {
                console.error('Lead buton hatasi:', err);
            }
            return NextResponse.json({ status: 'lead_button_processed' }, { status: 200 });
        }

        // ── 3. Sohbeti Bul veya Oluştur ────────────────────────────────
        const { conversationId, aiEnabled } = await findOrCreateConversation(
            supabase, tenantId, normalizedPhone, payload.message, payload.channel, payload.name
        );

        if (!conversationId) {
            console.error('❌ Conversation oluşturulamadı.');
            return NextResponse.json({ status: 'conv_error' }, { status: 200 });
        }

        // ── 4. Gelen Mesajı Kaydet ─────────────────────────────────────
        const { error: msgInsertError } = await supabase.from('whatsapp_messages').insert({
            conversation_id: conversationId,
            tenant_id: tenantId,
            wa_message_id: payload.message_id,
            direction: 'inbound',
            sender_type: 'customer',
            content: payload.message,
            status: 'received',
            role: 'user',
        });

        if (msgInsertError) {
            console.error('❌ Mesaj kaydedilemedi:', JSON.stringify(msgInsertError));
        } else {
            console.log('✅ Mesaj kaydedildi:', payload.message.substring(0, 30));
        }

        // ── 4.5. Kampanya Yanıt İşleme (Quick Reply butonları) ──────────
        const msgNormalized = normalizeTurkish(payload.message);
        if (isCampaignReply(msgNormalized)) {
            const handled = await handleCampaignReply(
                supabase, tenantId, tenantData, conversationId, normalizedPhone, msgNormalized, payload.name
            );
            if (handled) {
                return NextResponse.json({ status: 'campaign_reply_processed' }, { status: 200 });
            }
        }

        // ── 5. AI Chatbot Motoru ───────────────────────────────────────
        // Dinamik AI provider ve key çözümleme
        const resolvedAi = resolveAiProvider(tenantData);

        if (aiEnabled && resolvedAi) {
            try {
                console.log(`🤖 AI aktif, yanıt üretiliyor (${resolvedAi.provider})...`);

                const chatHistory = await fetchChatHistory(supabase, conversationId);

                // CRM envanter bilgisi devre dışı - proje bilgileri system prompt'taki web sitesinden alınan Bilgi Bankası'ndan geliyor
                const crmContext = '';
                const { getTenantDocumentsContext } = await import('@/lib/whatsapp/context');
                const documentsContext = await getTenantDocumentsContext(supabase, tenantId);
                const customerContext = await buildCustomerContext(supabase, tenantId, normalizedPhone, payload.name);
                const finalPrompt = assembleFinalPrompt(tenantData, crmContext, customerContext, documentsContext);

                let aiReply = await generateAIReply(
                    resolvedAi.provider,
                    resolvedAi.apiKey,
                    finalPrompt,
                    chatHistory,
                    resolvedAi.model
                );

                if (aiReply) {
                    // GİZLİ KOMUTLARI İŞLE VE METİNDEN TEMİZLE
                    
                    // Parse email send command: [SEND_EMAIL: {"email": "...", "project_id": "..."}]
                    const emailRegex = /\[SEND_EMAIL:\s*({[^\]]+})\s*\]/i;
                    const emailMatch = aiReply.match(emailRegex);
                    if (emailMatch) {
                        try {
                            const emailParams = JSON.parse(emailMatch[1]);
                            const { handleAndSendCatalogEmail } = await import('@/lib/email/catalog-email');
                            
                            handleAndSendCatalogEmail({
                                supabase,
                                tenantId,
                                email: emailParams.email,
                                projectId: emailParams.project_id,
                                phone: normalizedPhone
                            }).then(result => {
                                console.log('[WhatsApp Email Command] Result:', result);
                            }).catch(err => {
                                console.error('[WhatsApp Email Command] Error:', err);
                            });
                        } catch (e: any) {
                            console.error('[WhatsApp Email Command] JSON Parse Error:', e.message, emailMatch[1]);
                        }
                        // Clean tag from message
                        aiReply = aiReply.replace(emailRegex, '');
                    }

                    const scoreResult = await extractAndUpdateLeadScore(supabase, tenantId, conversationId, aiReply, payload.message);
                    aiReply = scoreResult.aiReply;

                    aiReply = await processHotLeadDetection(
                        supabase, tenantId, tenantData, conversationId, normalizedPhone, payload.name, aiReply, scoreResult.leadScore
                    );

                    aiReply = await extractAndCreateLead(supabase, tenantId, normalizedPhone, payload.channel, aiReply);

                    // WhatsApp markdown link desteği yok — [text](url) → "text: url" formatına çevir
                    aiReply = aiReply.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1: $2');
                    // Kalan markdown kalıntıları temizle (bold, italic vb. WA formatına uyumlu)
                    // **bold** → *bold* (WA formatı)
                    aiReply = aiReply.replace(/\*\*([^*]+)\*\*/g, '*$1*');

                    // Mesajı gönder
                    const accessToken = tenantData.wa_access_token;
                    let sendSuccess = false;

                    if (payload.channel === 'messenger' && accessToken) {
                        // Messenger: Facebook Graph API
                        const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recipient: { id: normalizedPhone }, message: { text: aiReply } }),
                        });
                        sendSuccess = res.ok;
                    } else if (tenantData.wa_phone_number_id && accessToken) {
                        // WhatsApp Cloud API
                        const sendResult = await sendWhatsAppMessage(normalizedPhone, aiReply, tenantData.wa_phone_number_id, accessToken);
                        sendSuccess = sendResult.success;
                    }

                    // AI yanıtını DB'ye kaydet
                    await supabase.from('whatsapp_messages').insert({
                        conversation_id: conversationId,
                        tenant_id: tenantId,
                        direction: 'outbound',
                        sender_type: 'bot',
                        content: aiReply,
                        status: sendSuccess ? 'sent' : 'failed',
                        role: 'assistant',
                    });

                    // Conversation güncelle
                    await supabase.from('whatsapp_conversations').update({
                        last_message_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        last_message_preview: aiReply.substring(0, 50),
                    }).eq('id', conversationId);

                    console.log(`✅ AI yanıtı gönderildi: "${aiReply.substring(0, 80)}..."`);
                }
            } catch (aiError) {
                console.error('🔥 AI Chatbot Error:', aiError);
                // AI hatası mesaj kaydını engellemez, devam et
            }
        } else if (aiEnabled && !resolvedAi) {
            console.log('⚠️ AI aktif ama API key tanımlı değil — yanıt üretilmedi.');
        }

        // ── 6. Outreach Yanıt Algılama ─────────────────────────────────
        try {
            const { data: activeExecs } = await supabase
                .from('outreach_executions')
                .select('id, customer_id, lead_id, customers(phone), leads(phone)')
                .in('status', ['active', 'waiting'])
                .limit(10);

            const matchingExecs = (activeExecs || []).filter((exec: any) => {
                const custPhone = (exec.customers?.phone || '').replace(/\D/g, '');
                const leadPhone = (exec.leads?.phone || '').replace(/\D/g, '');
                return (custPhone && (normalizedPhone.endsWith(custPhone) || custPhone.endsWith(normalizedPhone))) ||
                       (leadPhone && (normalizedPhone.endsWith(leadPhone) || leadPhone.endsWith(normalizedPhone)));
            });

            for (const exec of matchingExecs) {
                await supabase.from('outreach_executions')
                    .update({ status: 'converted', completed_at: new Date().toISOString() })
                    .eq('id', exec.id);

                await supabase.from('activities').insert({
                    customer_id: exec.customer_id || null,
                    lead_id: exec.lead_id || null,
                    type: 'Whatsapp',
                    topic: 'Sales',
                    summary: 'Outreach Yanıtı',
                    description: `Müşteri yanıt verdi: "${payload.message.substring(0, 200)}"`,
                    due_date: new Date().toISOString(),
                    status: 'Completed',
                    priority: 'High',
                });
            }
        } catch (outreachError) {
            console.error('Outreach check error:', outreachError);
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 });

    } catch (error: any) {
        console.error('Webhook POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
