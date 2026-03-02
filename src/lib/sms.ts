/**
 * Poli Dijital SMS Integration Service
 * Handle API communications with app.polidijital.com
 */

export interface SmsPayload {
    user: string
    pass: string
    message: string
    contacts: string[]
    header: string
    date?: string // Optional for scheduled
}

/**
 * Normalizes phone number to 90XXXXXXXXXX format
 */
export function normalizePhone(phone: string): string {
    let clean = phone.replace(/\D/g, '')
    // Turkye handling
    if (clean.length === 10) return '90' + clean
    if (clean.length === 11 && clean.startsWith('0')) return '90' + clean.substring(1)
    return clean
}

export async function sendPoliSms(payload: SmsPayload) {
    const { user, pass, message, contacts, header } = payload

    // Port updated from docs: 9587 is used in the official Postman collection
    const API_URL = 'http://app.polidijital.com:9587/sms/create'
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')

    const targetNumber = normalizePhone(contacts[0])

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 1,
                sendingType: 0,
                title: 'NovoCRM_Notification',
                content: message,
                number: targetNumber,
                sender: header || 'NOVOEMLAK',
                encoding: 0
            })
        })

        const result = await response.json()

        if (response.ok && (result.err === null || result.data?.pkgID)) {
            return { success: true, messageId: result.data?.pkgID || 'OK' }
        } else {
            console.error('Poli Dijital SMS API Response:', JSON.stringify(result, null, 2))
            return {
                success: false,
                error: result.err?.message || result.message || 'Hatalı Kimlik Bilgileri veya IP Kısıtı (401/403)'
            }
        }
    } catch (error: any) {
        console.error('Poli Dijital Connection Error:', error)
        return { success: false, error: 'Bağlantı hatası: ' + (error.message || 'Sunucuya ulaşılamadı') }
    }
}
