/**
 * WhatsApp Integration Utilities
 * Constructing wa.me links and Cloud API Sending
 */

export function normalizePhone(phone: string) {
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '90' + cleanPhone.substring(1)
    } else if (cleanPhone.length === 10) {
        cleanPhone = '90' + cleanPhone
    }
    return cleanPhone
}

export function getWhatsAppLink(phone: string, message: string) {
    const cleanPhone = normalizePhone(phone)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Sends a WhatsApp message using the Meta Cloud API
 * Note: Free-form messages can only be sent if there is an active 24h window.
 * Otherwise, Template messages must be used.
 */
export async function sendWhatsAppMessage(to: string, message: string, phoneId?: string, accessToken?: string) {
    const PHONE_ID = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        console.error('WhatsApp API credentials missing');
        return { success: false, error: 'Credentials missing' };
    }

    const cleanPhone = normalizePhone(to);

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '');

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: { body: message },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp Send Error:', data);
            return { success: false, error: data.error?.message || 'API Error' };
        }

        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp Fetch Error:', error);
        return { success: false, error: 'Network or Fetch Error' };
    }
}

/**
 * Sends a WhatsApp media message (Image, Video, Audio, Document) using the Meta Cloud API.
 * Media is passed as a public URL.
 */
export async function sendWhatsAppMedia(
    to: string, 
    type: 'image' | 'video' | 'audio' | 'document', 
    mediaUrl: string, 
    caption?: string,
    phoneId?: string, 
    accessToken?: string
) {
    const PHONE_ID = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        console.error('WhatsApp API credentials missing');
        return { success: false, error: 'Credentials missing' };
    }

    const cleanPhone = normalizePhone(to);

    const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: type,
    };

    // The Meta API requires the specific media type key (e.g. "image": { link: "...", caption: "..." })
    payload[type] = { link: mediaUrl };
    
    // Only image, video, and document support captions. Audio does not.
    if (caption && type !== 'audio') {
        payload[type].caption = caption;
    }

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '');

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`WhatsApp ${type} Send Error:`, data);
            return { success: false, error: data.error?.message || 'API Error' };
        }

        return { success: true, data };
    } catch (error) {
        console.error(`WhatsApp ${type} Fetch Error:`, error);
        return { success: false, error: 'Network or Fetch Error' };
    }
}

export const MessageTemplates = {
    newLeadForStaff: (leadName: string, brokerName: string, project?: string) =>
        `📢 *Yeni Broker Başvurusu*\n\n` +
        `👤 *Müşteri:* ${leadName}\n` +
        `🏢 *Proje:* ${project || 'Genel'}\n` +
        `🤝 *Broker:* ${brokerName}\n\n` +
        `Lütfen CRM üzerinden müşteri kaydını kontrol edin.`,

    statusUpdateForBroker: (leadName: string, status: string) =>
        `🔔 *Bilgilendirme*\n\n` +
        `Sayın iş ortağımız, yönlendirmiş olduğunuz *${leadName}* isimli müşterinizin süreci *"${status}"* olarak güncellenmiştir.\n\n` +
        `Detayları broker panelinden görebilirsiniz.`,

    shareDocument: (projectName: string, docName: string, url: string) =>
        `📄 *${projectName} - ${docName}*\n\n` +
        `Proje ile ilgili dökümanı aşağıdaki linkten indirebilirsiniz:\n\n${url}`
}

/**
 * Sends a WhatsApp Template Message via Meta Cloud API
 * Required for business-initiated messages outside the 24-hour window.
 * Templates must be pre-approved in Meta Business Manager.
 */
export async function sendWhatsAppTemplate(
    to: string,
    templateName: string,
    parameters: string[] | Record<string, string>,
    language: string = 'tr',
    phoneId?: string,
    accessToken?: string,
    headerMedia?: { type: 'image' | 'video' | 'document'; url: string }
) {
    const PHONE_ID = (phoneId && phoneId.trim()) || process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = (accessToken && accessToken.trim()) || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        return { success: false, error: 'WhatsApp API credentials missing' };
    }

    const cleanPhone = normalizePhone(to);

    // Build template components with parameters (Meta API requires non-empty strings)
    const components: any[] = [];

    // Header component: required when template has IMAGE/VIDEO/DOCUMENT header
    if (headerMedia?.url) {
        const mediaParam: any = { type: headerMedia.type };
        mediaParam[headerMedia.type] = { link: headerMedia.url };
        components.push({
            type: 'header',
            parameters: [mediaParam],
        });
    }
    
    if (Array.isArray(parameters) && parameters.length > 0) {
        // Positional parameters: ['Cengiz Bey', '50000']
        components.push({
            type: 'body',
            parameters: parameters.map(p => ({
                type: 'text',
                text: (p && p.toString().trim()) ? p.toString().trim() : '-',
            })),
        });
    } else if (typeof parameters === 'object' && !Array.isArray(parameters) && Object.keys(parameters).length > 0) {
        // Named parameters: { customer_name: 'Cengiz Bey' }
        components.push({
            type: 'body',
            parameters: Object.entries(parameters).map(([name, value]) => ({
                type: 'text',
                parameter_name: name,
                text: (value && value.toString().trim()) ? value.toString().trim() : '-',
            })),
        });
    }

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '');

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    components,
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp Template Send Error:', data);
            return { success: false, error: data.error?.message || 'Template API Error', data };
        }

        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp Template Fetch Error:', error);
        return { success: false, error: 'Network or Fetch Error' };
    }
}

/** Outreach-specific message templates */
export const OutreachTemplates = {
    leadFollowUp: (name: string, project: string) =>
        `Merhaba ${name} 👋\n\n` +
        `*${project}* projemize gösterdiğiniz ilgi için teşekkür ederiz.\n\n` +
        `Size özel fırsatlarımız hakkında bilgi almak ister misiniz? ` +
        `Detaylı bilgi için "BİLGİ" yazabilirsiniz.`,

    missedCallFollowUp: (name: string) =>
        `Merhaba ${name},\n\n` +
        `Az önce sizi aradık ancak ulaşamadık. 📞\n\n` +
        `Müsait olduğunuzda bize dönüş yapabilirsiniz veya uygun saatinizi yazabilirsiniz.`,

    coldLeadReengagement: (name: string, project: string) =>
        `Merhaba ${name} 🏠\n\n` +
        `*${project}* projesinde son birkaç ünite kaldı!\n\n` +
        `Detaylı bilgi ve özel fiyat için "BİLGİ" yazın.`,

    appointmentReminder: (name: string, date: string) =>
        `Sayın ${name},\n\n` +
        `📅 *${date}* tarihindeki randevunuzu hatırlatmak isteriz.\n\n` +
        `Onay için *EVET*, değişiklik için *DEĞİŞTİR* yazınız.`,
}

/**
 * Sends a WhatsApp Interactive Button Message via Meta Cloud API.
 * Maximum 3 reply buttons allowed.
 */
export async function sendWhatsAppInteractiveButtons(
    to: string,
    headerText: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
    footerText?: string,
    phoneId?: string,
    accessToken?: string
) {
    const PHONE_ID = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        return { success: false, error: 'WhatsApp API credentials missing' };
    }

    const cleanPhone = normalizePhone(to);
    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '');

    const interactive: any = {
        type: 'button',
        header: { type: 'text', text: headerText },
        body: { text: bodyText },
        action: {
            buttons: buttons.slice(0, 3).map(b => ({
                type: 'reply',
                reply: { id: b.id, title: b.title.substring(0, 20) }
            }))
        }
    };

    if (footerText) {
        interactive.footer = { text: footerText };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'interactive',
                interactive,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('WhatsApp Interactive Send Error:', data);
            return { success: false, error: data.error?.message || 'API Error' };
        }
        return { success: true, data };
    } catch (error) {
        console.error('WhatsApp Interactive Fetch Error:', error);
        return { success: false, error: 'Network or Fetch Error' };
    }
}

/**
 * Logs an outbound WhatsApp message into whatsapp_conversations and whatsapp_messages
 * so it becomes immediately visible in the CRM customer chat and /conversations screen.
 */
export async function logOutboundWhatsAppMessage(params: {
    tenantId: string
    phone: string
    customerId?: string | null
    content: string
    waMessageId?: string | null
}) {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = createAdminClient()
        const cleanPhone = normalizePhone(params.phone)
        const last10 = cleanPhone.slice(-10)

        // 1. Find or match existing conversation
        let convId: string | null = null
        let existingConv: any = null

        if (params.customerId) {
            const { data: byCust } = await adminSupabase
                .from('whatsapp_conversations')
                .select('*')
                .eq('tenant_id', params.tenantId)
                .eq('customer_id', params.customerId)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .limit(1)
                .maybeSingle()
            if (byCust?.id) {
                convId = byCust.id
                existingConv = byCust
            }
        }

        if (!convId && last10.length >= 10) {
            const { data: byPhone } = await adminSupabase
                .from('whatsapp_conversations')
                .select('*')
                .eq('tenant_id', params.tenantId)
                .ilike('phone_number', `%${last10}%`)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .limit(1)
                .maybeSingle()
            if (byPhone?.id) {
                convId = byPhone.id
                existingConv = byPhone
            }
        }

        // 2. Create conversation if not found
        if (!convId) {
            const { data: newConv, error: createErr } = await adminSupabase
                .from('whatsapp_conversations')
                .insert({
                    tenant_id: params.tenantId,
                    customer_id: params.customerId || null,
                    phone_number: cleanPhone,
                    unread_count: 0,
                    last_message_at: new Date().toISOString(),
                    last_message_preview: params.content.substring(0, 100),
                    ai_enabled: false
                })
                .select('id')
                .single()
            if (!createErr && newConv?.id) {
                convId = newConv.id
            }
        } else {
            // Update last message preview and time
            await adminSupabase
                .from('whatsapp_conversations')
                .update({
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_message_preview: params.content.substring(0, 100),
                    ...(params.customerId && !existingConv?.customer_id ? { customer_id: params.customerId } : {})
                })
                .eq('id', convId)
        }

        if (!convId) {
            console.error('[logOutboundWhatsAppMessage] Could not find or create conversation for phone:', cleanPhone)
            return null
        }

        // 3. Insert message into whatsapp_messages
        const { data: msg, error: msgErr } = await adminSupabase
            .from('whatsapp_messages')
            .insert({
                conversation_id: convId,
                tenant_id: params.tenantId,
                direction: 'outbound',
                status: 'sent',
                role: 'assistant',
                wa_message_id: params.waMessageId || null,
                content: params.content,
                created_at: new Date().toISOString()
            })
            .select('id')
            .single()

        if (msgErr) {
            console.error('[logOutboundWhatsAppMessage] Insert message error:', msgErr.message)
            return null
        }

        return msg
    } catch (err: any) {
        console.error('[logOutboundWhatsAppMessage] Error:', err?.message)
        return null
    }
}


