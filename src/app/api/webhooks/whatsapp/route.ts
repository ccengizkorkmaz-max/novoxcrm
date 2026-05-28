import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
                    const scoreResult = await extractAndUpdateLeadScore(supabase, tenantId, conversationId, aiReply);
                    aiReply = scoreResult.aiReply;

                    aiReply = await processHotLeadDetection(
                        supabase, tenantId, tenantData, conversationId, normalizedPhone, payload.name, aiReply, scoreResult.leadScore
                    );

                    aiReply = await extractAndCreateLead(supabase, tenantId, normalizedPhone, payload.channel, aiReply);

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
