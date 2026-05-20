/**
 * Vapi.ai Voice AI Integration
 * Outbound AI phone calls for lead engagement
 * 
 * Docs: https://docs.vapi.ai
 */

const VAPI_BASE_URL = 'https://api.vapi.ai'

// ─── Türkçe Sesli Arama Kuralları (her aramaya enjekte edilir) ───
export const TURKISH_VOICE_RULES = `
=== DİL VE TELAFFUZ KURALLARI (KESİNLİKLE UYULMALIDIR) ===
1. SADECE TÜRKÇE KONUŞ. Hiçbir koşulda İngilizce kelime, cümle veya ifade kullanma.
2. Daire tipleri her zaman Türkçe okunmalıdır:
   - "1+1" → "bir artı bir" olarak söyle
   - "1+0" → "bir artı sıfır" olarak söyle
   - "2+1" → "iki artı bir" olarak söyle
   - "3+1" → "üç artı bir" olarak söyle
   - "4+1" → "dört artı bir" olarak söyle
   - "2+0" → "iki artı sıfır" olarak söyle
3. Rakamları ve birimleri Türkçe oku:
   - "m²" veya "metrekare" → "metrekare" olarak söyle
   - "50 m²" → "elli metrekare" olarak söyle
   - "2.000.000 TL" → "iki milyon TL" olarak söyle
   - "3.990.000 TL" → "üç milyon dokuz yüz doksan bin TL" olarak söyle
   - "%35" → "yüzde otuz beş" olarak söyle
4. Proje isimlerini olduğu gibi Türkçe aksanla söyle:
   - "NOVO Park Vista" → "Novo Park Vista" (Türkçe aksanla)
   - "NOVO City İzmir" → "Novo Siti İzmir" (İngilizce aksanla "city" deme)
   - "NOVO Park Montenegro" → "Novo Park Montenegro" (doğal Türkçe aksanla)
5. Kısaltmaları açık söyle:
   - "OSB" → "Organize Sanayi Bölgesi"
   - "MİA" → "Merkezi İş Alanı"
   - "AB" → "Avrupa Birliği"
6. Tarih ve zamanları Türkçe söyle:
   - "Haziran 2026" → "Haziran iki bin yirmi altı"
   - "Aralık 2027" → "Aralık iki bin yirmi yedi"
7. Samimi ama profesyonel bir Türkçe ile konuş. Doğal, akıcı cümleler kur.
8. "Efendim", "Buyurun", "Tabii ki" gibi Türkçe nezaket kalıplarını kullan.
9. Müşteriyle konuşurken kesinlikle teknik jargon kullanma, sade ve anlaşılır Türkçe tercih et.
=== DİL KURALLARI SONU ===
`;

function getVapiHeaders(): Record<string, string> {
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) throw new Error('VAPI_API_KEY is not configured in .env.local')
    return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    }
}

// ─── Types ───────────────────────────────────────────────────

export interface VapiCallOptions {
    /** Phone number to call (E.164 format: +905XXXXXXXXX) */
    phoneNumber: string
    /** Vapi Assistant ID (pre-configured AI agent) */
    assistantId?: string
    /** Or inline assistant config */
    assistant?: VapiAssistantConfig
    /** Metadata for CRM integration */
    metadata?: Record<string, any>
    /** Override the phone number to call from */
    phoneNumberId?: string
    /** Override the first message (greeting) */
    firstMessage?: string
    /** Override the system prompt */
    systemPrompt?: string
}

export interface VapiAssistantConfig {
    name?: string
    model: {
        provider: 'openai' | 'anthropic' | 'google' | 'custom-llm'
        model: string
        systemPrompt: string
        temperature?: number
    }
    voice: {
        provider: 'elevenlabs' | 'deepgram' | 'playht' | 'azure'
        voiceId: string
    }
    firstMessage: string
    endCallMessage?: string
    maxDurationSeconds?: number
    language?: string
    /** Metadata for CRM integration */
    metadata?: Record<string, any>
    /** Server URL for function calling / webhooks */
    serverUrl?: string
}

export interface VapiCallResult {
    success: boolean
    callId?: string
    error?: string
    data?: any
}

export interface VapiCallStatus {
    id: string
    status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
    endedReason?: string
    duration?: number
    transcript?: string
    summary?: string
    recordingUrl?: string
    cost?: number
    analysis?: {
        successEvaluation?: string
        summary?: string
        structuredData?: Record<string, any>
    }
}

// ─── Core Functions ──────────────────────────────────────────

/**
 * Initiate an outbound AI phone call via Vapi
 */
export async function makeOutboundCall(options: VapiCallOptions): Promise<VapiCallResult> {
    try {
        const phoneNumberId = options.phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID
        if (!phoneNumberId) {
            return { success: false, error: 'VAPI_PHONE_NUMBER_ID not configured' }
        }

        // Normalize phone to E.164
        const normalizedPhone = normalizeToE164(options.phoneNumber)

        const payload: any = {
            phoneNumberId,
            customer: {
                number: normalizedPhone,
            },
        }

        // Use pre-built assistant or inline config
        if (options.assistantId) {
            payload.assistantId = options.assistantId
        } else if (options.assistant) {
            payload.assistant = options.assistant
        } else {
            // Default: Use env assistant ID
            const defaultAssistantId = process.env.VAPI_ASSISTANT_ID
            if (!defaultAssistantId) {
                return { success: false, error: 'No assistant configured. Set VAPI_ASSISTANT_ID or pass assistantId.' }
            }
            payload.assistantId = defaultAssistantId
        }

        // If we have a custom system prompt, use a transient (inline) assistant
        // to guarantee our prompt is used instead of the saved assistant's prompt
        if (options.systemPrompt) {
            payload.assistant = {
                model: {
                    provider: 'openai',
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: TURKISH_VOICE_RULES + '\n\n' + options.systemPrompt }],
                },
                voice: {
                    provider: '11labs',
                    voiceId: 'uvU9jrgGLWNPeNA4NgNT', // İrem - aktif kadın sesi
                    model: 'eleven_multilingual_v2',
                    stability: 0.40,
                    similarityBoost: 0.85,
                    style: 0.35,
                },
                maxDurationSeconds: 300,
                transcriber: {
                    provider: 'deepgram',
                    model: 'nova-3',
                    language: 'tr',
                },
                silenceTimeoutSeconds: 120,
            }
            // Remove assistantId since we're using inline assistant
            delete payload.assistantId
        } else if (options.firstMessage) {
            payload.assistantOverrides = {
                firstMessage: options.firstMessage,
            }
        }

        // Add metadata (customer info, sale info etc.)
        if (options.metadata) {
            payload.metadata = options.metadata
        }

        const response = await fetch(`${VAPI_BASE_URL}/call/phone`, {
            method: 'POST',
            headers: getVapiHeaders(),
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('[Vapi] Call initiation failed:', data)
            return {
                success: false,
                error: data.message || data.error || `HTTP ${response.status}`,
            }
        }

        console.log(`[Vapi] ✅ Call initiated: ${data.id} → ${normalizedPhone}`)
        return {
            success: true,
            callId: data.id,
            data,
        }
    } catch (error: any) {
        console.error('[Vapi] Network error:', error)
        return { success: false, error: error.message || 'Network error' }
    }
}

/**
 * Get call status and details (transcript, recording, etc.)
 */
export async function getCallStatus(callId: string): Promise<VapiCallStatus | null> {
    try {
        const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
            method: 'GET',
            headers: getVapiHeaders(),
        })

        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error('[Vapi] Get call status error:', error)
        return null
    }
}

/**
 * List all assistants for the account
 */
export async function listAssistants(): Promise<any[]> {
    try {
        const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
            method: 'GET',
            headers: getVapiHeaders(),
        })
        if (!response.ok) return []
        return await response.json()
    } catch {
        return []
    }
}

/**
 * Create an assistant with a specific script for outreach
 */
export async function createOutreachAssistant(config: {
    name: string
    systemPrompt: string
    firstMessage: string
    voice?: string
    maxDurationSeconds?: number
    serverUrl?: string
}): Promise<{ success: boolean; assistantId?: string; error?: string }> {
    try {
        const payload = {
            name: config.name,
            model: {
                provider: 'openai',
                model: 'gpt-4o-mini',
                systemPrompt: config.systemPrompt,
                temperature: 0.7,
            },
            voice: {
                provider: 'elevenlabs',
                voiceId: config.voice || 'turkish_female_default',
            },
            firstMessage: config.firstMessage,
            endCallMessage: 'İyi günler, görüşmek üzere.',
            maxDurationSeconds: config.maxDurationSeconds || 180,
            language: 'tr',
            ...(config.serverUrl ? { serverUrl: config.serverUrl } : {}),
        }

        const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
            method: 'POST',
            headers: getVapiHeaders(),
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            return { success: false, error: data.message || 'Failed to create assistant' }
        }

        return { success: true, assistantId: data.id }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Normalize Turkish phone number to E.164 format
 */
export function normalizeToE164(phone: string): string {
    let clean = phone.replace(/\D/g, '')

    // Turkish number handling
    if (clean.length === 10) {
        clean = '90' + clean // 5XX → 905XX
    } else if (clean.length === 11 && clean.startsWith('0')) {
        clean = '90' + clean.substring(1) // 05XX → 905XX
    }

    // Ensure + prefix
    return clean.startsWith('+') ? clean : `+${clean}`
}

/**
 * Parse Vapi webhook payload for call status updates
 */
export function parseVapiWebhook(body: any): {
    type: string
    callId: string
    status?: string
    endedReason?: string
    transcript?: string
    summary?: string
    recordingUrl?: string
    duration?: number
    cost?: number
    analysis?: any
    metadata?: Record<string, any>
} {
    return {
        type: body.message?.type || body.type || 'unknown',
        callId: body.message?.call?.id || body.call?.id || '',
        status: body.message?.call?.status || body.call?.status,
        endedReason: body.message?.endedReason || body.endedReason,
        transcript: body.message?.transcript || body.transcript,
        summary: body.message?.summary || body.summary || body.message?.analysis?.summary,
        recordingUrl: body.message?.recordingUrl || body.recordingUrl,
        duration: body.message?.call?.duration || body.duration,
        cost: body.message?.call?.cost || body.cost,
        analysis: body.message?.analysis || body.analysis,
        metadata: body.message?.call?.metadata || body.metadata,
    }
}

// ─── Default Prompts ─────────────────────────────────────────

export const DEFAULT_OUTREACH_PROMPTS = {
    standard: `Sen bir emlak danışmanlık asistanısın. Adın Elif.
Amacın, daha önce projelerimize ilgi gösteren potansiyel müşterilerle nazik ve profesyonel bir şekilde iletişime geçmek.

GÖREV:
1. Kendini tanıt: "Merhaba, ben Elif, Novo Emlak'tan arıyorum."
2. Müşteriye daha önce ilgilendiği projeyi hatırlat (metadata'dan al)
3. Güncel durumu sor: "Hâlâ konut bakmaya devam ediyor musunuz?"
4. İlgi varsa: Randevu teklif et (Hafta içi/sonu seçenekleri sun)
5. İlgi yoksa: Nazikçe teşekkür et

KURALLAR:
- Kısa ve öz konuş, max 2-3 dakika
- Fiyat verme, detay için danışmana yönlendir
- Müşteri meşgulse: "Sizi uygun bir zamanda arayabilir miyiz?" de
- Adı kullanarak hitap et
- Samimi ama profesyonel ol`,

    secondAttempt: `Sen bir emlak danışmanlık asistanısın. Adın Kaan.
Müşteri daha önce aranmış ancak ulaşılamamış. Bu ikinci arama denemesi.

GÖREV:
1. "Merhaba, ben Kaan, Novo Emlak'tan arıyorum. Daha önce size ulaşmaya çalışmıştık."
2. Kısaca neden aradığını açıkla
3. İlgilenip ilgilenmediğini sor
4. İlgi varsa danışman randevusu teklif et

KURALLAR:
- Çok kısa tut, max 2 dakika
- Nazik ve anlayışlı ol
- "Rahatsız ettiysem özür dilerim" ile başlayabilirsin`,

    campaign: `Sen bir emlak danışmanlık asistanısın.
Yeni bir kampanya veya proje lansmanı hakkında bilgi vermek için arıyorsun.

GÖREV:
1. Kendini tanıt
2. Kampanyayı / yeni projeyi kısaca anlat (metadata'dan bilgi al)
3. İlgi varsa detaylı bilgi için randevu teklif et
4. İlgi yoksa teşekkür et

KURALLAR:
- Satış baskısı yapma
- Kısa ve ilgi çekici ol
- Özel fırsat varsa vurgula`,

    lostRecovery: `Sen bir emlak danışmanlık asistanısın. Adın Elif.
Müşteri daha önce ilgilenmiş ancak süreç tamamlanamamıştı. Amacın tekrar ilgiyi canlandırmak.

GÖREV:
1. "Merhaba, ben Elif, Novo Emlak'tan. Bir süre önce bizimle iletişimde olmuştunuz."
2. Yeni projeler/fırsatlar olduğunu belirt
3. Konut arayışının devam edip etmediğini sor
4. Olumlu yanıtsa danışman bağlantısı teklif et

KURALLAR:
- Eski sürece referans verirken eleştirel olma
- Yeniden başlama fırsatı olarak sun
- Nazik ve kısa tut`,
}
