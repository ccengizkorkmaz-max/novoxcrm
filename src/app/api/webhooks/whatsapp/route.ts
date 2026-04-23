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
        const tenantData = await findTenant(supabase, payload.phoneNumberId, payload.channel);
        if (!tenantData) {
            console.error('❌ Tenant bulunamadı, mesaj atılıyor.');
            return NextResponse.json({ status: 'no_tenant' }, { status: 200 });
        }

        const tenantId = tenantData.id;
        const normalizedPhone = payload.phone.replace(/\D/g, '');

        // ── 3. Sohbeti Bul veya Oluştur ────────────────────────────────
        const { conversationId, aiEnabled } = await findOrCreateConversation(
            supabase, tenantId, normalizedPhone, payload.message, payload.channel
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
        if (aiEnabled && tenantData.ai_api_key) {
            try {
                console.log(`🤖 AI aktif, yanıt üretiliyor (${tenantData.ai_provider || 'gemini'})...`);

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

                // AI'dan yanıt al
                const aiReply = await generateAIReply(
                    tenantData.ai_provider || 'gemini',
                    tenantData.ai_api_key,
                    tenantData.ai_system_prompt || getDefaultSystemPrompt(),
                    chatHistory
                );

                if (aiReply) {
                    // WhatsApp Cloud API ile gönder
                    const phoneId = tenantData.wa_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
                    const accessToken = tenantData.wa_access_token || process.env.WHATSAPP_ACCESS_TOKEN;

                    if (phoneId && accessToken) {
                        const sendResult = await sendWhatsAppMessage(normalizedPhone, aiReply, phoneId, accessToken);

                        // AI yanıtını DB'ye kaydet
                        await supabase.from('whatsapp_messages').insert({
                            conversation_id: conversationId,
                            tenant_id: tenantId,
                            wa_message_id: sendResult.data?.messages?.[0]?.id || null,
                            direction: 'outbound',
                            sender_type: 'bot',
                            content: aiReply,
                            status: sendResult.success ? 'sent' : 'failed',
                            role: 'assistant',
                        });

                        // Conversation güncelle
                        await supabase.from('whatsapp_conversations').update({
                            last_message_at: new Date().toISOString(),
                            last_message_preview: aiReply.substring(0, 50),
                        }).eq('id', conversationId);

                        console.log(`✅ AI yanıtı gönderildi: "${aiReply.substring(0, 80)}..."`);
                    }
                }
            } catch (aiError) {
                console.error('🔥 AI Chatbot Error:', aiError);
                // AI hatası mesaj kaydını engellemez, devam et
            }
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
    const selectFields = 'id, ai_provider, ai_api_key, ai_system_prompt, wa_phone_number_id, wa_access_token, fb_page_id';

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
    supabase: any, tenantId: string, phone: string, messagePreview: string, channel: string = 'whatsapp'
) {
    const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('id, ai_enabled')
        .eq('tenant_id', tenantId)
        .eq('phone_number', phone)
        .single();

    if (existing) {
        await supabase.from('whatsapp_conversations').update({
            last_message_at: new Date().toISOString(),
            last_message_preview: messagePreview.substring(0, 50),
            unread_count: 1,
            channel, // Ensure channel is always up-to-date
        }).eq('id', existing.id);

        return { conversationId: existing.id, aiEnabled: existing.ai_enabled };
    }

    // Yeni sohbet
    const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
        tenant_id: tenantId,
        phone_number: phone,
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
    return `Sen bir Türk gayrimenkul firmasının profesyonel satış asistanısın.
Adın "Novo Asistan". Kısa, nazik ve bilgilendirici yanıtlar ver.
Müşteriye proje bilgileri, fiyatlar ve randevu alma konularında yardımcı ol.
Her zaman Türkçe yanıt ver. Agresif satış yapma, danışmanlık yaklaşımı sergile.
Eğer bir soruyu cevaplayamıyorsan, "Sizi bir uzmanımıza yönlendiriyorum" de.`;
}

/**
 * AI sağlayıcısına göre yanıt üretir (Gemini veya OpenAI)
 */
async function generateAIReply(
    provider: string,
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[]
): Promise<string | null> {
    try {
        if (provider === 'openai') {
            return await callOpenAI(apiKey, systemPrompt, chatHistory);
        } else {
            // Default: Gemini
            return await callGemini(apiKey, systemPrompt, chatHistory);
        }
    } catch (error) {
        console.error(`AI (${provider}) Error:`, error);
        return null;
    }
}

/**
 * Google Gemini AI API
 */
async function callGemini(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[]
): Promise<string | null> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: chatHistory.slice(0, -1) }); // Son mesaj hariç geçmiş
    const lastMessage = chatHistory[chatHistory.length - 1]?.parts?.[0]?.text || '';
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return text || null;
}

/**
 * OpenAI Chat Completion API
 */
async function callOpenAI(
    apiKey: string,
    systemPrompt: string,
    chatHistory: { role: string; parts: { text: string }[] }[]
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
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
}
