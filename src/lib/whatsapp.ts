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
        const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
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
        const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
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
    language: string = 'tr'
) {
    const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    let ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        return { success: false, error: 'WhatsApp API credentials missing' };
    }

    const cleanPhone = normalizePhone(to);

    // Build template components with parameters
    const components: any[] = [];
    
    if (Array.isArray(parameters) && parameters.length > 0) {
        // Legacy positional parameters: ['Cengiz Bey', '50000']
        components.push({
            type: 'body',
            parameters: parameters.map(p => ({
                type: 'text',
                text: p,
            })),
        });
    } else if (typeof parameters === 'object' && !Array.isArray(parameters) && Object.keys(parameters).length > 0) {
        // Named parameters: { customer_name: 'Cengiz Bey' }
        components.push({
            type: 'body',
            parameters: Object.entries(parameters).map(([name, value]) => ({
                type: 'text',
                parameter_name: name,
                text: value,
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

