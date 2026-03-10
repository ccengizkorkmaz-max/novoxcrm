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
export async function sendWhatsAppMessage(to: string, message: string) {
    const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
        console.error('WhatsApp API credentials missing in .env.local');
        return { success: false, error: 'Credentials missing' };
    }

    const cleanPhone = normalizePhone(to);

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

