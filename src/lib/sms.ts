/**
 * SMS Integration Service
 * Handles multiple SMS gateways (Poli Dijital, Posta Güvercini)
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
    // Türkiye handling
    if (clean.length === 10) return '90' + clean
    if (clean.length === 11 && clean.startsWith('0')) return '90' + clean.substring(1)
    return clean
}

/**
 * Send SMS via Poli Dijital Gateway
 */
export async function sendPoliSms(payload: SmsPayload) {
    const { user, pass, message, contacts, header } = payload

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

/**
 * Send SMS via Posta Güvercini Gateway (Bulk or OTP)
 */
export async function sendPostaGuverciniSms(payload: SmsPayload, isOtp: boolean = false) {
    const { user, pass, message, contacts } = payload
    
    const hostname = isOtp ? 'otpsms.postaguvercini.com' : 'www.postaguvercini.com'
    const API_URL = `https://${hostname}/api_json/v1/Sms/Send_1_N`
    
    const targetNumbers = contacts.map(c => normalizePhone(c))

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Message: message,
                Receivers: targetNumbers,
                Username: user,
                Password: pass
            })
        })

        const result = await response.json()

        if (response.ok && result.StatusCode === 200) {
            return { success: true, messageId: String(result.Result || 'OK') }
        } else {
            console.error('Posta Guvercini SMS API Response:', JSON.stringify(result, null, 2))
            return {
                success: false,
                error: result.StatusDescription || 'Gönderim başarısız'
            }
        }
    } catch (error: any) {
        console.error('Posta Guvercini Connection Error:', error)
        return { success: false, error: 'Bağlantı hatası: ' + (error.message || 'Sunucuya ulaşılamadı') }
    }
}

/**
 * Unified sendSms function that handles multiple providers
 */
export async function sendSms(payload: SmsPayload, provider: string = 'polidijital') {
    if (provider === 'postaguvercini') {
        return sendPostaGuverciniSms(payload, false)
    } else if (provider === 'postaguvercini_otp') {
        return sendPostaGuverciniSms(payload, true)
    } else {
        return sendPoliSms(payload)
    }
}
