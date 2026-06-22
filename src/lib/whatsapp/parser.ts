/**
 * WhatsApp Webhook – Payload Parsing & Conversation Management
 *
 * Meta webhook body'sini normalize eder (WhatsApp veya Messenger),
 * Tenant eşleştirme, sohbet bulma/oluşturma.
 */

import type { IncomingPayload } from './types';

/**
 * Türkçe locale duyarlı normalizasyon
 */
export function normalizeTurkish(str: string): string {
    if (!str) return '';
    return str
        .replace(/I/g, 'ı')
        .replace(/İ/g, 'i')
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();
}

/**
 * Meta webhook body'sini normalize eder (WhatsApp veya Messenger)
 */
export function parseIncomingPayload(body: any): IncomingPayload | null {
    // WhatsApp Business
    if (body.object === 'whatsapp_business_account') {
        if (
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
        ) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const contact = body.entry[0].changes[0].value.contacts?.[0];
            const meta = body.entry[0].changes[0].value.metadata;
            
            let messageText = msg.text?.body || '';
            let buttonReplyId: string | undefined;
            if (msg.type === 'interactive') {
                if (msg.interactive?.type === 'button_reply') {
                    messageText = msg.interactive.button_reply.title || '';
                    buttonReplyId = msg.interactive.button_reply.id;
                } else if (msg.interactive?.type === 'list_reply') {
                    messageText = msg.interactive.list_reply.title || '';
                }
            } else if (msg.type === 'button') {
                messageText = msg.button?.text || '';
            }

            return {
                channel: 'whatsapp',
                phone: msg.from,
                external_user_id: contact?.wa_id || msg.from,
                name: contact?.profile?.name || 'WhatsApp User',
                message: messageText,
                timestamp: msg.timestamp,
                message_id: msg.id,
                phoneNumberId: meta?.phone_number_id || '',
                button_reply_id: buttonReplyId,
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
export async function findTenant(supabase: any, phoneNumberId: string, channel?: string) {
    const selectFields = 'id, crm_mode, ai_provider, ai_api_key, ai_system_prompt, ai_assistant_instructions, ai_knowledge_base, wa_phone_number_id, wa_access_token, fb_page_id, gemini_api_key, openai_api_key, is_gemini_enabled, is_openai_enabled, gemini_model, openai_model, name';

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
export async function findOrCreateConversation(
    supabase: any, tenantId: string, phone: string, messagePreview: string, channel: string = 'whatsapp', contactName?: string
) {
    // Telefon numarasından müşteri eşleştir (tüm olası formatlarla ara)
    let customerId: string | null = null;
    const phoneVariants = [phone]; // e.g. 905335914389
    if (phone.startsWith('90') && phone.length > 10) {
        phoneVariants.push(phone.substring(2));        // 5335914389
        phoneVariants.push('+' + phone);               // +905335914389
        phoneVariants.push('0' + phone.substring(2));  // 05335914389
    }
    if (!phone.startsWith('90') && phone.length === 10) {
        phoneVariants.push('90' + phone);              // 905335914389
        phoneVariants.push('+90' + phone);             // +905335914389
        phoneVariants.push('0' + phone);               // 05335914389
    }

    let leadId: string | null = null;
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

    if (!customerId) {
        for (const variant of phoneVariants) {
            const { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone', variant)
                .limit(1)
                .single();
            if (lead) {
                leadId = lead.id;
                console.log(`✅ Lead eşleşti: ${leadId} (phone: ${variant})`);
                break;
            }
        }
    }

    const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('id, ai_enabled, customer_id, lead_id')
        .eq('tenant_id', tenantId)
        .eq('phone_number', phone)
        .single();

    if (existing) {
        const updateData: any = {
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_message_preview: messagePreview.substring(0, 50),
            unread_count: 1,
            channel,
        };
        // Eğer customer_id yoksa ve eşleştirme bulduysa güncelle
        if (!existing.customer_id && customerId) {
            updateData.customer_id = customerId;
        }
        if (!existing.lead_id && leadId) {
            updateData.lead_id = leadId;
        }
        
        await supabase.from('whatsapp_conversations').update(updateData).eq('id', existing.id);

        return { conversationId: existing.id, aiEnabled: existing.ai_enabled };
    }

    // Yeni sohbet
    const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
        tenant_id: tenantId,
        phone_number: phone,
        customer_id: customerId, // Eşleşen müşteriyi otomatik bağla
        lead_id: leadId,         // Eşleşen lead'i otomatik bağla
        last_message_preview: messagePreview.substring(0, 50),
        unread_count: 1,
        ai_enabled: true,
        channel,
    }).select('id').single();

    return { conversationId: newConv?.id || null, aiEnabled: true };
}
