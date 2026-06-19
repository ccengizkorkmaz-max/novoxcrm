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
        console.log(`✅ Tenant eşleşti: ${tenantId} (fb_page_id: ${tenantData.fb_page_id})`);
        const normalizedPhone = payload.phone.replace(/\D/g, '');

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

        // ── 4.6. Lead Atama Buton Yanıtları (Template Quick Reply) ─────
        // Template butonları: "Aradım Olumlu", "Aradım Ele", "Ulaşamadım"
        const leadBtnNorm = normalizeTurkish(payload.message);
        const isLeadOlumlu = leadBtnNorm === 'aradim olumlu';
        const isLeadEle = leadBtnNorm === 'aradim ele';
        const isLeadUlasamadim = leadBtnNorm === 'ulasamadim';

        if (isLeadOlumlu || isLeadEle || isLeadUlasamadim) {
            try {
                // Temsilciyi telefon numarasından bul
                const phone10 = normalizedPhone.slice(-10);
                const { data: repProfile } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .or(`phone.ilike.%${phone10}%`)
                    .eq('tenant_id', tenantId)
                    .limit(1)
                    .single();

                if (repProfile) {
                    // Bu temsilciye en son atanmış Lead'i bul
                    const { data: recentSale } = await supabase
                        .from('sales')
                        .select('id, customer_id, status, customers(full_name)')
                        .eq('assigned_to', repProfile.id)
                        .in('status', ['Lead', 'Prospect'])
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (recentSale) {
                        const custName = (recentSale as any).customers?.full_name || 'Müşteri';

                        if (isLeadOlumlu) {
                            // ✅ OLUMLU: Status → Prospect, Lead Skor → hot + ⭐
                            await supabase.from('sales')
                                .update({ status: 'Prospect', updated_at: new Date().toISOString() })
                                .eq('id', recentSale.id);

                            await supabase.from('lead_qualifications')
                                .update({
                                    interest_level: 'hot',
                                    status: 'contacted',
                                    call_notes: (new Date().toLocaleString('tr-TR')) + ' — ⭐ Temsilci aradı, olumlu sonuç.',
                                    updated_at: new Date().toISOString()
                                })
                                .eq('customer_id', recentSale.customer_id);

                            await supabase.from('activities').insert({
                                customer_id: recentSale.customer_id,
                                type: 'Phone', topic: 'Sales',
                                summary: '✅ Lead Arandı — Olumlu',
                                description: `Temsilci ${repProfile.full_name} lead'i aradı ve olumlu sonuç aldı. Status → Prospect.`,
                                due_date: new Date().toISOString(),
                                status: 'Completed', priority: 'High',
                            });

                            console.log(`✅ Lead ${recentSale.id} → Prospect (olumlu) by ${repProfile.full_name}`);

                            await sendWhatsAppMessage(
                                normalizedPhone,
                                `✅ *${custName}* → *Fırsat (Prospect)* olarak güncellendi.\n\n⭐ Lead skoru olumlu olarak işaretlendi.`,
                                tenantData.wa_phone_number_id,
                                tenantData.wa_access_token
                            );

                        } else if (isLeadEle) {
                            // ⛔ ELE: Lead Skor → Disqualified
                            await supabase.from('lead_qualifications')
                                .update({
                                    interest_level: 'disqualified',
                                    status: 'disqualified',
                                    call_notes: (new Date().toLocaleString('tr-TR')) + ' — Temsilci aradı, olumsuz sonuç. Elendi.',
                                    updated_at: new Date().toISOString()
                                })
                                .eq('customer_id', recentSale.customer_id);

                            await supabase.from('activities').insert({
                                customer_id: recentSale.customer_id,
                                type: 'Phone', topic: 'Sales',
                                summary: '⛔ Lead Arandı — Elendi',
                                description: `Temsilci ${repProfile.full_name} lead'i aradı, olumsuz sonuç. Lead disqualified.`,
                                due_date: new Date().toISOString(),
                                status: 'Completed', priority: 'Medium',
                            });

                            console.log(`⛔ Lead ${recentSale.id} → Disqualified by ${repProfile.full_name}`);

                            await sendWhatsAppMessage(
                                normalizedPhone,
                                `⛔ *${custName}* → Lead skoru *Disqualified* olarak işaretlendi.`,
                                tenantData.wa_phone_number_id,
                                tenantData.wa_access_token
                            );

                        } else if (isLeadUlasamadim) {
                            // 🌡️ ULAŞAMADIM: Lead Skor → Warm, takip devam
                            await supabase.from('lead_qualifications')
                                .update({
                                    interest_level: 'warm',
                                    status: 'contacted',
                                    call_notes: (new Date().toLocaleString('tr-TR')) + ' — Temsilci aradı, ulaşamadı. Tekrar aranacak.',
                                    updated_at: new Date().toISOString()
                                })
                                .eq('customer_id', recentSale.customer_id);

                            await supabase.from('activities').insert({
                                customer_id: recentSale.customer_id,
                                type: 'Phone', topic: 'Sales',
                                summary: '📵 Lead Arandı — Ulaşılamadı',
                                description: `Temsilci ${repProfile.full_name} lead'i aradı ama ulaşamadı. Tekrar aranacak.`,
                                due_date: new Date().toISOString(),
                                status: 'In Progress', priority: 'Medium',
                            });

                            console.log(`📵 Lead ${recentSale.id} → Warm (ulaşılamadı) by ${repProfile.full_name}`);

                            await sendWhatsAppMessage(
                                normalizedPhone,
                                `📵 *${custName}* → Ulaşılamadı. Lead skoru *Warm* olarak güncellendi, tekrar aranacak.`,
                                tenantData.wa_phone_number_id,
                                tenantData.wa_access_token
                            );
                        }

                        return NextResponse.json({ status: 'lead_button_processed' }, { status: 200 });
                    }
                }
            } catch (err) {
                console.error('Lead buton yanıtı işlenirken hata:', err);
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
                const customerContext = await buildCustomerContext(supabase, tenantId, normalizedPhone, payload.name);
                const finalPrompt = assembleFinalPrompt(tenantData, crmContext, customerContext);

                let aiReply = await generateAIReply(
                    resolvedAi.provider,
                    resolvedAi.apiKey,
                    finalPrompt,
                    chatHistory,
                    resolvedAi.model
                );

                if (aiReply) {
                    // GİZLİ KOMUTLARI İŞLE VE METİNDEN TEMİZLE
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
                .select('id, customer_id, customers!inner(phone)')
                .in('status', ['active', 'waiting'])
                .limit(10);

            const matchingExecs = (activeExecs || []).filter((exec: any) => {
                const custPhone = (exec.customers?.phone || '').replace(/\D/g, '');
                return custPhone && (normalizedPhone.endsWith(custPhone) || custPhone.endsWith(normalizedPhone));
            });

            for (const exec of matchingExecs) {
                await supabase.from('outreach_executions')
                    .update({ status: 'converted', completed_at: new Date().toISOString() })
                    .eq('id', exec.id);

                await supabase.from('activities').insert({
                    customer_id: exec.customer_id,
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
