import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

        // ── 5. AI Chatbot Motoru ───────────────────────────────────────
        // Dinamik AI provider ve key çözümleme
        const resolvedAi = resolveAiProvider(tenantData);

        if (aiEnabled && resolvedAi) {
            try {
                console.log(`🤖 AI aktif, yanıt üretiliyor (${resolvedAi.provider})...`);

                // Son 20 mesajı context olarak çek
                const { data: history } = await supabase
                    .from('whatsapp_messages')
                    .select('role, content')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })
                    .limit(20);

                const chatHistory = (history || []).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                }));

                // CRM envanter bilgisi devre dışı - proje bilgileri system prompt'taki web sitesinden alınan Bilgi Bankası'ndan geliyor
                // Units tablosundaki veriler eksik/güncel olmayabilir, AI'ı yanıltıyor
                const crmContext = '';

                // Müşteri bilgisi contexti (AI'ın zaten sahip olduğu bilgiler)
                let customerContext = `\n\n--- MÜŞTERİ BİLGİSİ (SİSTEM İÇİ - MÜŞTERİYE BUNLARI SÖYLEME) ---
Müşteri Telefonu: ${normalizedPhone}
Müşteri WhatsApp Adı: ${payload.name}
ÖNEMLİ: Müşteriye "numaranız kayıtlı", "sistemimizde kayıtlısınız" gibi ifadeler KULLANMA. Bu bilgileri sadece kendi referansın için kullan.`;

                // CRM'de eşleşen müşteri varsa bilgilerini ekle
                const phoneVariants = [normalizedPhone];
                if (normalizedPhone.startsWith('90') && normalizedPhone.length > 10) {
                    phoneVariants.push(normalizedPhone.substring(2));
                }
                for (const variant of phoneVariants) {
                    const { data: crmCustomer } = await supabase
                        .from('customers')
                        .select('id, full_name, email, notes, contact_type, budget_min, budget_max, desired_rooms, desired_districts')
                        .eq('tenant_id', tenantId)
                        .eq('phone', variant)
                        .single();
                    if (crmCustomer) {
                        customerContext += `\nCRM Kayıtlı İsim: ${crmCustomer.full_name}`;
                        if (crmCustomer.notes) customerContext += `\nMüşteri Notları: ${crmCustomer.notes}`;
                        if (crmCustomer.budget_min || crmCustomer.budget_max) customerContext += `\nBütçe: ${crmCustomer.budget_min || '?'} - ${crmCustomer.budget_max || '?'} TL`;
                        if (crmCustomer.desired_rooms) customerContext += `\nAranan Oda Sayısı: ${crmCustomer.desired_rooms}`;
                        if (crmCustomer.desired_districts) customerContext += `\nAranan Bölge: ${crmCustomer.desired_districts}`;

                        // Müşterinin aktivite/lead geçmişini çek
                        const { data: activities } = await supabase
                            .from('activities')
                            .select('type, summary, description, topic, status, notes, project_id, projects(name), created_at')
                            .eq('customer_id', crmCustomer.id)
                            .order('created_at', { ascending: false })
                            .limit(5);

                        if (activities && activities.length > 0) {
                            customerContext += `\n\n📋 MÜŞTERİ GEÇMİŞİ (Son ${activities.length} aktivite):`;
                            for (const act of activities) {
                                const projectName = (act as any).projects?.name;
                                customerContext += `\n- [${act.type}] ${act.summary}`;
                                if (projectName) customerContext += ` | Proje: ${projectName}`;
                                if (act.description && act.description !== act.summary) customerContext += ` | ${act.description}`;
                                if (act.status) customerContext += ` (${act.status})`;
                            }
                            customerContext += `\nBu geçmişi kullanarak müşterinin daha önce ilgilendiği projelere referans ver, "Daha önce ... projemizle ilgilenmiştiniz" gibi doğal geçişler yap.`;
                        }

                        customerContext += `\nMüşterinin adı ve telefonu zaten biliniyor. Bu bilgileri SORMA ve müşteriye kayıtlısınız veya numaranız bizde var gibi şeyler ASLA SÖYLEME. Doğrudan sorusuna cevap ver.`;
                        break;
                    }
                }
                customerContext += `\n------------------------------------------------`;

                // Base AI system rules
                const strictHumanPersona = `\n\nDAVRANIŞ KURALLARI:
1. Sen Novo'da çalışan deneyimli bir satış danışmanısın. Kendini tanıtma, kimliğinden bahsetme, doğrudan konuşmaya odaklan.
2. ASLA "insanım", "yapay zekayım", "asistanım" gibi kelimeler kullanma.
3. KONU DIŞI SORULAR: Müşteri futbol, hava durumu, siyaset gibi işle alakasız bir şey sorarsa, kısaca ve samimi şekilde cevapla. Sonra nazikçe konuyu gayrimenkule getir.
4. TEKRAR YAPMA: Önceki mesajlarda zaten söylediğin bilgileri tekrar etme. Yeni bilgi ver veya sorduğu soruya odaklan.
5. DOĞAL KONUŞMA: Her mesajda "Merhaba" deme. Kısa ve öz cevaplar ver. Uzun paragraflar yazma.
6. LEAD KALİFİKASYONU: Telefon numarasını ASLA sorma. Adını sadece ilk mesajda doğal bir şekilde sor.
7. CRM verilerini kullanarak müşteriye bütçe/bölge tercihine göre proje öner.
8. KESİN YASAK: Müşteriye ASLA şunları söyleme: "numaranız kayıtlı", "numaranız bizde mevcut", "sistemimizde kayıtlısınız", "numaranız bizde var", "WhatsApp üzerinden iletişimde olduğumuza göre". Bu tarz CRM/sistem bilgilerini müşteriye AÇIKLAMA. Doğrudan sorduğu soruya cevap ver.

GİZLİ SİSTEM KOMUTLARI (SADECE ŞARTLAR SAĞLANDIĞINDA YANITININ EN SONUNA EKLE, MÜŞTERİ GÖRMEZ):
- Müşterinin Adını öğrendiğinde ve ilgi gösterdiğinde:
[LEAD_DATA: {"first_name": "Ad", "last_name": "Soyad", "notes": "Bütçe ve ilgi"}]
- HER YANITININ EN SONUNA, sohbetin genel havasına göre lead sıcaklık etiketi ekle:
  * Müşteri hemen almak istiyor, fiyat soruyor, randevu istiyor -> [LEAD_SCORE:hot]
  * Müşteri ilgili, soru soruyor, düşünüyor, bilgi topluyor -> [LEAD_SCORE:warm]
  * Müşteri ilgisiz, sadece baktı, kısa/soğuk yanıtlar veriyor -> [LEAD_SCORE:cold]
  Bu etiketi HER yanıtına MUTLAKA ekle.`;

                // AI'dan yanıt al
                const finalPrompt = (tenantData.ai_system_prompt || tenantData.ai_assistant_instructions || getDefaultSystemPrompt()) + crmContext + customerContext + strictHumanPersona;

                let aiReply = await generateAIReply(
                    resolvedAi.provider,
                    resolvedAi.apiKey,
                    finalPrompt,
                    chatHistory,
                    resolvedAi.model
                );

                if (aiReply) {
                    // GİZLİ KOMUTLARI İŞLE VE METİNDEN TEMİZLE

                    // 1. Lead Sıcaklık Skoru
                    let leadScore = 'unknown';
                    const scoreMatch = aiReply.match(/\[LEAD_SCORE:(hot|warm|cold)\]/);
                    if (scoreMatch) {
                        leadScore = scoreMatch[1];
                        aiReply = aiReply.replace(scoreMatch[0], '').trim();
                        console.log(`🌡️ Lead Score: ${leadScore}`);

                        // Conversation'ın lead_score'unu güncelle
                        await supabase.from('whatsapp_conversations').update({
                            lead_score: leadScore,
                        }).eq('id', conversationId);
                    }

                    // 2. HOT LEAD tespiti (eski format uyumluluğu + yeni skor)
                    let isHotLead = leadScore === 'hot' || aiReply.includes('[HOT_LEAD]');
                    if (aiReply.includes('[HOT_LEAD]')) {
                        aiReply = aiReply.replace('[HOT_LEAD]', '').trim();
                    }

                    // Dedup: Bu konuşma için daha önce bildirim gönderilmiş mi kontrol et
                    let alreadyNotified = false;
                    if (isHotLead) {
                        const { data: convCheck } = await supabase
                            .from('whatsapp_conversations')
                            .select('hot_lead_notified')
                            .eq('id', conversationId)
                            .single();
                        alreadyNotified = convCheck?.hot_lead_notified === true;
                    }

                    if (isHotLead && !alreadyNotified) {
                        // Yüksek öncelikli bildirim/aktivite oluştur
                        await supabase.from('activities').insert({
                            tenant_id: tenantId,
                            type: 'Call',
                            topic: 'Sales',
                            summary: '🔥 ACİL SATIŞ (HOT LEAD)',
                            description: `Novo AI bir satış kapatmak üzere! Müşteri hemen satın almak istiyor. Telefon: ${normalizedPhone}`,
                            status: 'Pending',
                            priority: 'High',
                        });
                        console.log('🔥 HOT LEAD DETECTED AND ALERT CREATED');

                        // ── Hot Lead Manager WhatsApp Bildirimi ──
                        try {
                            // Tüm hot lead manager'ları bul
                            const { data: hotLeadManagers } = await supabase
                                .from('profiles')
                                .select('id, full_name, phone')
                                .eq('tenant_id', tenantId)
                                .eq('is_hot_lead_manager', true)
                                .eq('is_active', true);

                            if (hotLeadManagers && hotLeadManagers.length > 0) {
                                // Konuşma özetini oluştur (son 10 mesaj)
                                const { data: recentMessages } = await supabase
                                    .from('whatsapp_messages')
                                    .select('role, content, created_at')
                                    .eq('conversation_id', conversationId)
                                    .order('created_at', { ascending: false })
                                    .limit(10);

                                let conversationSummary = '';
                                if (recentMessages && recentMessages.length > 0) {
                                    conversationSummary = recentMessages
                                        .reverse()
                                        .map((m: any) => `${m.role === 'user' ? '👤 Müşteri' : '🤖 AI'}: ${m.content.substring(0, 120)}`)
                                        .join('\n');
                                }

                                // Müşteri adını bul (CRM veya WhatsApp adı)
                                let customerName = payload.name || 'Bilinmiyor';
                                const phoneVariantsForLookup = [normalizedPhone];
                                if (normalizedPhone.startsWith('90') && normalizedPhone.length > 10) {
                                    phoneVariantsForLookup.push(normalizedPhone.substring(2));
                                }
                                for (const variant of phoneVariantsForLookup) {
                                    const { data: cust } = await supabase
                                        .from('customers')
                                        .select('full_name')
                                        .eq('tenant_id', tenantId)
                                        .eq('phone', variant)
                                        .single();
                                    if (cust?.full_name) {
                                        customerName = cust.full_name;
                                        break;
                                    }
                                }

                                // Bildirim mesajını formatla
                                const notificationMessage =
                                    `🔥 *HOT LEAD TESPİT EDİLDİ!*\n\n` +
                                    `👤 *Müşteri:* ${customerName}\n` +
                                    `📞 *Telefon:* ${normalizedPhone}\n` +
                                    `⏰ *Zaman:* ${new Date().toLocaleString('tr-TR')}\n\n` +
                                    `📋 *Konuşma Özeti:*\n${conversationSummary ? conversationSummary.substring(0, 900) : 'Özet oluşturulamadı'}\n\n` +
                                    `💡 _Bu müşteri satın alma niyeti gösteriyor. Hemen iletişime geçin!_`;

                                // Her hot lead manager'a WhatsApp mesajı gönder
                                const accessToken = tenantData.wa_access_token;
                                for (const manager of hotLeadManagers) {
                                    if (manager.phone && accessToken && tenantData.wa_phone_number_id) {
                                        try {
                                            await sendWhatsAppMessage(
                                                manager.phone,
                                                notificationMessage,
                                                tenantData.wa_phone_number_id,
                                                accessToken
                                            );
                                            console.log(`🔥 Hot Lead bildirimi gönderildi: ${manager.full_name} (${manager.phone})`);
                                        } catch (sendErr) {
                                            console.error(`Hot Lead bildirim hatası (${manager.full_name}):`, sendErr);
                                        }
                                    }
                                }
                            }
                        } catch (hotLeadNotifyError) {
                            console.error('Hot Lead Manager bildirim hatası:', hotLeadNotifyError);
                        }

                        // Bu konuşma için bildirim gönderildiğini işaretle (tekrar gönderilmesini önle)
                        await supabase.from('whatsapp_conversations').update({
                            hot_lead_notified: true,
                        }).eq('id', conversationId);
                        console.log('✅ Konuşma hot_lead_notified olarak işaretlendi');
                    }

                    const leadMatch = aiReply.match(/\[LEAD_DATA:\s*(\{.*?\})\s*\]/);
                    if (leadMatch) {
                        try {
                            const leadData = JSON.parse(leadMatch[1]);
                            aiReply = aiReply.replace(leadMatch[0], '').trim();
                            
                            // CRM'de müşteri oluştur veya güncelle
                            const { data: existingCust } = await supabase.from('customers').select('id').eq('phone', normalizedPhone).single();
                            if (!existingCust) {
                                const fullName = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'WhatsApp Lead';
                                await supabase.from('customers').insert({
                                    tenant_id: tenantId,
                                    full_name: fullName,
                                    phone: normalizedPhone,
                                    email: leadData.email || '',
                                    source: payload.channel,
                                    contact_type: 'buyer',
                                    notes: leadData.notes || null,
                                });
                                console.log(`✅ YENİ LEAD OLUŞTURULDU: ${fullName}`);
                            }
                        } catch (e) {
                            console.error('Lead data parse error:', e);
                        }
                    }

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


// ═══════════════════════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tenant ayarlarından aktif AI provider, model ve API key'i dinamik olarak çözer.
 * Model adı tenant'ta tanımlıysa onu kullanır, yoksa default kullanır.
 */
function resolveAiProvider(tenant: any): { provider: string; apiKey: string; model: string } | null {
    const geminiModel = tenant.gemini_model || 'gemini-2.5-flash';
    const openaiModel = tenant.openai_model || 'gpt-4o-mini';

    // 1. Gemini aktif ve key varsa
    if (tenant.is_gemini_enabled && tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    // 2. OpenAI aktif ve key varsa
    if (tenant.is_openai_enabled && tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    // 3. Eski ai_api_key fallback
    if (tenant.ai_api_key) {
        const p = tenant.ai_provider || 'gemini';
        return { provider: p, apiKey: tenant.ai_api_key, model: p === 'openai' ? openaiModel : geminiModel };
    }
    // 4. Key var ama toggle açık değilse yine kullan
    if (tenant.gemini_api_key) {
        return { provider: 'gemini', apiKey: tenant.gemini_api_key, model: geminiModel };
    }
    if (tenant.openai_api_key) {
        return { provider: 'openai', apiKey: tenant.openai_api_key, model: openaiModel };
    }
    return null;
}

interface IncomingPayload {
    channel: 'whatsapp' | 'messenger';
    phone: string;
    external_user_id: string;
    name: string;
    message: string;
    timestamp: string;
    message_id: string;
    phoneNumberId: string;
}

/**
 * Meta webhook body'sini normalize eder (WhatsApp veya Messenger)
 */
function parseIncomingPayload(body: any): IncomingPayload | null {
    // WhatsApp Business
    if (body.object === 'whatsapp_business_account') {
        if (
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        ) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const contact = body.entry[0].changes[0].value.contacts?.[0];
            const meta = body.entry[0].changes[0].value.metadata;
            return {
                channel: 'whatsapp',
                phone: msg.from,
                external_user_id: contact?.wa_id || msg.from,
                name: contact?.profile?.name || 'WhatsApp User',
                message: msg.text?.body || '',
                timestamp: msg.timestamp,
                message_id: msg.id,
                phoneNumberId: meta?.phone_number_id || '',
            };
        }
    }

    // Facebook Messenger
    if (body.object === 'page') {
        const msgData = body.entry?.[0]?.messaging?.[0];

        // Skip echo messages (our own outgoing messages reflected back)
        if (msgData?.message?.is_echo) {
            console.log('📤 Echo mesajı atlandı (kendi gönderdiğimiz mesaj)');
            return null;
        }

        if (msgData?.message?.text) {
            return {
                channel: 'messenger',
                phone: msgData.sender.id,
                external_user_id: msgData.sender.id,
                name: `FB User ${String(msgData.sender.id).slice(-4)}`,
                message: msgData.message.text,
                timestamp: String(msgData.timestamp),
                message_id: msgData.message.mid,
                phoneNumberId: body.entry[0].id,
            };
        }
    }

    return null;
}

/**
 * Tenant'ı kanal türüne göre eşleştirir.
 * WhatsApp → wa_phone_number_id, Messenger → fb_page_id
 */
async function findTenant(supabase: any, phoneNumberId: string, channel?: string) {
    const selectFields = 'id, ai_provider, ai_api_key, ai_system_prompt, ai_assistant_instructions, wa_phone_number_id, wa_access_token, fb_page_id, gemini_api_key, openai_api_key, is_gemini_enabled, is_openai_enabled, gemini_model, openai_model, name';

    // Messenger ise önce fb_page_id ile dene
    if (channel === 'messenger') {
        const { data } = await supabase
            .from('tenants')
            .select(selectFields)
            .eq('fb_page_id', phoneNumberId)
            .single();
        if (data) return data;
    }

    // WhatsApp veya fallback: wa_phone_number_id ile dene
    const { data } = await supabase
        .from('tenants')
        .select(selectFields)
        .eq('wa_phone_number_id', phoneNumberId)
        .single();
    if (data) return data;

    // Son fallback: ilk tenant'ı al (tek-tenant kurulumlar için)
    const { data: fallback } = await supabase
        .from('tenants')
        .select(selectFields)
        .limit(1)
        .single();

    return fallback || null;
}

/**
 * Telefon numarasına göre sohbet bul veya yeni oluştur
 */
async function findOrCreateConversation(
    supabase: any, tenantId: string, phone: string, messagePreview: string, channel: string = 'whatsapp', contactName?: string
) {
    // Telefon numarasından müşteri eşleştir (hem 905xx hem 5xx formatıyla ara)
    let customerId: string | null = null;
    const phoneVariants = [phone]; // e.g. 905335914389
    if (phone.startsWith('90') && phone.length > 10) {
        phoneVariants.push(phone.substring(2)); // 5335914389
    }
    if (!phone.startsWith('90') && phone.length === 10) {
        phoneVariants.push('90' + phone); // 905335914389
    }

    for (const variant of phoneVariants) {
        const { data: customer } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('phone', variant)
            .limit(1)
            .single();
        if (customer) {
            customerId = customer.id;
            console.log(`✅ Müşteri eşleşti: ${customerId} (phone: ${variant})`);
            break;
        }
    }

    const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('id, ai_enabled, customer_id')
        .eq('tenant_id', tenantId)
        .eq('phone_number', phone)
        .single();

    if (existing) {
        const updateData: any = {
            last_message_at: new Date().toISOString(),
            last_message_preview: messagePreview.substring(0, 50),
            unread_count: 1,
            channel,
        };
        // Eğer customer_id yoksa ve eşleştirme bulduysa güncelle
        if (!existing.customer_id && customerId) {
            updateData.customer_id = customerId;
        }
        // WhatsApp kişi adını güncelle (her zaman en güncel ismi tut)
        if (contactName && contactName !== 'WhatsApp User') {
            updateData.contact_name = contactName;
        }
        await supabase.from('whatsapp_conversations').update(updateData).eq('id', existing.id);

        return { conversationId: existing.id, aiEnabled: existing.ai_enabled };
    }

    // Yeni sohbet
    const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
        tenant_id: tenantId,
        phone_number: phone,
        customer_id: customerId, // Eşleşen müşteriyi otomatik bağla
        contact_name: (contactName && contactName !== 'WhatsApp User') ? contactName : null,
        last_message_preview: messagePreview.substring(0, 50),
        unread_count: 1,
        ai_enabled: true,
        channel,
    }).select('id').single();

    return { conversationId: newConv?.id || null, aiEnabled: true };
}

/**
 * Varsayılan AI system prompt
 */
function getDefaultSystemPrompt(): string {
    return `Sen Novo'da çalışan tecrübeli bir gayrimenkul satış danışmanısın.
Kısa, samimi ve doğal konuş. Müşteri ile gerçek bir WhatsApp sohbeti yapıyorsun.
Uzun paragraflar yazma, mesajlaşma gibi kısa tut.
Müşterinin sorduğu soruya ÖNCE cevap ver, sonra gerekirse yönlendir.
Bilmediğin bir konuda "Hemen bakıp döneyim" de, uydurma.`;
}

/**
 * AI sağlayıcısına göre yanıt üretir (Gemini veya OpenAI)
 */
async function generateAIReply(
    provider: string,
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName?: string
): Promise<string | null> {
    try {
        if (provider === 'openai') {
            return await callOpenAI(apiKey, systemPrompt, chatHistory, modelName || 'gpt-4o-mini');
        }
        return await callGemini(apiKey, systemPrompt, chatHistory, modelName || 'gemini-2.5-flash');
    } catch (error) {
        console.error(`${provider} API Error:`, error);
        return null;
    }
}

/**
 * Google Gemini AI API
 */
async function callGemini(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName: string = 'gemini-2.5-flash'
): Promise<string | null> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model fallback list if 404 occurs
    const modelOptions = [
        modelName, 
        'gemini-2.5-flash', 
        'gemini-2.5-pro'
    ];
    
    // Remove duplicates
    const uniqueModels = [...new Set(modelOptions)];
    
    let lastError = null;
    
    for (const currentModel of uniqueModels) {
        try {
            console.log(`[AI] Attempting Gemini model: ${currentModel}`);
            const isLegacy = currentModel === 'gemini-pro';
            
            // Legacy models (gemini-pro) don't support systemInstruction in v1beta via SDK easily
            const modelConfig = isLegacy ? { model: currentModel } : { 
                model: currentModel, 
                systemInstruction: systemPrompt 
            };
            
            const model = genAI.getGenerativeModel(modelConfig);

            const chat = model.startChat({ history: chatHistory.slice(0, -1) }); // Son mesaj hariç geçmiş
            const lastMessage = chatHistory[chatHistory.length - 1]?.parts?.[0]?.text || '';
            const result = await chat.sendMessage(lastMessage);
            const text = result.response.text();
            
            console.log(`[AI] Successfully generated response using ${currentModel}`);
            return text || null;
            
        } catch (error: any) {
            console.warn(`[AI] Model ${currentModel} failed:`, error.message);
            lastError = error;
            // If it's a 404, we continue to the next fallback. Otherwise, break.
            if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('not supported')) {
                continue;
            } else {
                break; // E.g., API Key invalid, Rate limit, etc.
            }
        }
    }
    
    console.error(`[AI] All Gemini models failed. Last error:`, lastError);
    throw lastError;
}

/**
 * OpenAI Chat Completion API
 */
async function callOpenAI(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[],
    modelName: string = 'gpt-4o-mini'
): Promise<string | null> {
    const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((m) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
        })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}

/**
 * Veritabanından projeler ve müsait üniteler hakkında context çeker.
 */
async function getTenantCrmContext(supabase: any, tenantId: string): Promise<string> {
    try {
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name, city, district, address, amenities, phase_count')
            .eq('tenant_id', tenantId)
            .eq('status', 'Active')
            .limit(10);

        const { data: units } = await supabase
            .from('units')
            .select('project_id, type, price, status')
            .eq('tenant_id', tenantId)
            .in('status', ['Available', 'Müsait', 'Reserved'])
            .limit(100);

        if (!projects || projects.length === 0) return '\n\n--- CRM ENVANTER BİLGİSİ ---\nŞu an aktif proje yok.';

        let context = '\n\n--- CRM ENVANTER BİLGİSİ (BU BİLGİLERİ MÜŞTERİYE SATIŞ YAPMAK İÇİN KULLAN) ---\n';
        for (const p of projects) {
            context += `\nProje Adı: ${p.name} (Şehir: ${p.city}${p.district ? ', İlçe: ' + p.district : ''})\n`;
            if (p.amenities && p.amenities.length > 0) {
                context += `  Sosyal Olanaklar: ${p.amenities.join(', ')}\n`;
            }
            const projUnits = (units || []).filter((u: any) => u.project_id === p.id);
            if (projUnits.length > 0) {
                context += `  Müsait Daire Tipleri ve Fiyatlar:\n`;
                const typeGroups: Record<string, { min: number; count: number }> = {};
                projUnits.forEach((u: any) => {
                    if (!typeGroups[u.type]) {
                        typeGroups[u.type] = { min: u.price, count: 1 };
                    } else {
                        typeGroups[u.type].count++;
                        if (u.price < typeGroups[u.type].min) typeGroups[u.type].min = u.price;
                    }
                });
                for (const [type, info] of Object.entries(typeGroups)) {
                    context += `    - ${type}: ${info.min > 0 ? info.min.toLocaleString('tr-TR') + ' TL\'den başlıyor' : 'Fiyat sorulmalı'} (${info.count} adet müsait)\n`;
                }
            } else {
                context += `  Daire detayları için yukarıdaki PROJE BİLGİ BANKASI'na bak. Bu projenin satışa kapalı olduğu ANLAMINA GELMEZ.\n`;
            }
        }
        context += '------------------------------------------------\n';
        return context;
    } catch (e) {
        console.error('Error fetching CRM context:', e);
        return '';
    }
}
