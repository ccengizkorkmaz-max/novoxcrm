/**
 * WhatsApp Integration Utilities
 * Constructing wa.me links for structured communications
 */

export function getWhatsAppLink(phone: string, message: string) {
    // Basic phone normalization (Turkiye focus)
    let cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '90' + cleanPhone.substring(1)
    } else if (cleanPhone.length === 10) {
        cleanPhone = '90' + cleanPhone
    }

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
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
