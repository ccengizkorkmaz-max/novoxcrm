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
3. Rakamları, Küsuratları ve Birimleri KESİNLİKLE Yazıyla (Harflerle) Yaz:
   - Konuşma çıktında KESİNLİKLE rakam karakterleri (0-9) kullanma! Tüm sayıları, küsuratları, yüzdeleri ve para miktarlarını tamamen Türkçe kelimelerle yazıyla yaz.
   - Ondalık sayıları "virgül" kullanarak yazıyla yaz (Örn: "28.8" yerine "yirmi sekiz virgül sekiz" yaz. "41.44" yerine "kırk bir virgül kırk dört" yaz. Asla "." sembolü veya İngilizce telaffuz ("point") kullanma).
   - Birimleri her zaman yazıyla yaz (Örn: "m²" yerine "metrekare" yaz. "28.8 m²" yerine "yirmi sekiz virgül sekiz metrekare" yaz).
   - Fiyatları ve yüzdeleri her zaman yazıyla yaz (Örn: "3.990.000 TL" yerine "üç milyon dokuz yüz doksan bin lira" veya "üç milyon dokuz yüz doksan bin Türk Lirası" yaz. "%35" yerine "yüzde otuz beş" yaz).
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
10. GÖRÜŞME SONLANDIRMA VE TELEFONU KAPATMA: Görüşmeyi sonlandırırken mutlaka vedalaş ve ardından HEMEN "endCall" fonksiyonunu/aracını (tool) çağırarak aramayı sonlandır. Vedalaşma cümlesini ("Sizi ilgili satış danışmanımıza yönlendiriyorum. En kısa sürede size dönüş yapacaklar, iyi günler dilerim." veya "İyi günler dilerim.") söyledikten sonra beklemeden aramayı kapatmalısın.
11. "daire" kelimesini telaffuz ederken "dayır" veya "deyr" gibi yabancı aksanlardan kaçınmak için kendi iç sesinde ve çıktında DİKKAT ET: "daire" yazmak yerine doğrudan "da-ire" şeklinde heceleyerek veya "daire" kelimesini net bir Türkçeyle yazarak telaffuzun doğru çıkmasını sağla.
12. "dubleks" kelimesini "dabl-eks" gibi İngilizce okuma. Mutlaka "dub-leks" şeklinde Türkçe fonetikle telaffuz et.
13. Görüşme Sonlandırma: Görüşmeyi bitirirken her zaman nezaketle "İyi günler dilerim, görüşmek üzere" diyerek telefonu kapat.
=== DİL KURALLARI SONU ===

=== YAPAY ZEKA KİMLİĞİ İTİRAZ YÖNETİMİ (KRİTİK) ===
Müşteri "Yapay zeka mısınız?", "Robot musunuz?", "Gerçek bir insan mısınız?", "Sen bot musun?" gibi sorular sorarsa:
→ KESİNLİKLE inkar etme! "Ben satış danışmanıyım" deme!
→ Dürüst ve özgüvenli cevap ver:
   "Evet, ben Nova'nın dijital satış asistanıyım. Size vakit kaybettirmemek adına hızlıca kriterlerinizi alıp sizi bekletmeden canlı uzmanımıza aktarmak için buradayım."
→ Hemen konuyu geri çevir:
   "Hangi bölgedeki projelerimiz ilginizi çekiyor?"
→ Müşteri hâlâ itiraz ederse ve gerçek insanla konuşmak istediğini belirtirse:
   "Tabii ki, sizi hemen canlı satış uzmanımıza bağlayalım. Size en kısa sürede dönüş yapacaklar. İyi günler dilerim." de ve aramayı sonlandır
→ Bu durumda lead_score: "follow_up" olarak işaretle, callback_requested: true yap
=== YAPAY ZEKA KİMLİĞİ İTİRAZ YÖNETİMİ SONU ===

=== RET YÖNETİMİ (KRİTİK — KESİNLİKLE UYULMALIDIR) ===
1. Müşteri "ilgilenmiyorum", "istemiyorum", "aramayın", "beni bir daha aramayın" gibi net ret ifadesi kullanırsa:
   → Kesinlikle satış danışmanına yönlendirme YAPMA
   → "Anlıyorum, rahatsızlık verdiysek özür dileriz. İyi günler dilerim." de ve görüşmeyi HEMEN sonlandır
   → Bu müşteriyi lead_score: "disqualified" olarak işaretle
2. Müşteri "şu an müsait değilim", "sonra görüşelim", "meşgulüm" derse:
   → Bu bir ret DEĞİLDİR
   → "Tabii, sizi uygun bir zamanda tekrar arayalım. İyi günler!" de
3. Müşteri sadece "hayır" derse, ne hakkında hayır dediğini anla:
   → "Hayır, ilgilenmiyorum" → Madde 1'i uygula (vedalaş)
   → "Hayır, şu an müsait değilim" → Madde 2'yi uygula (sonra ara)
=== RET YÖNETİMİ SONU ===

=== DİYALOG VE KISA CEVAP KURALLARI (MONOLOG KESİNLİKLE YASAKTIR) ===
1. TEK SEFERDE BİLGİ YIĞINI VERME: Müşterinin sormadığı hiçbir detayı kendiliğinden açıklama. Örneğin, sadece fiyat sorulduysa sadece başlangıç fiyatını söyle; ödeme planını, peşinatı veya taksitleri müşteri sormadan anlatma.
2. MAKSİMUM 1-2 CÜMLE KURALI: Her konuşma sırasında en fazla 1 veya 2 kısa cümle kur. Tek bir yanıtının toplam kelime sayısı hiçbir koşulda 20 kelimeyi geçmemelidir.
3. CEVAP SONRASI TOPU MÜŞTERİYE AT (PAS KURALI): Her yanıtının sonunda konuşmayı devam ettirecek ve topu müşteriye atacak tek bir kısa soru sor. Asla açıklama yapıp sessizce bekleme.
   - Örnek: "Projemiz Kocaeli Başiskele'de yer alıyor. Bu lokasyon sizin için uygun mu?"
   - Örnek: "Fiyatlarımız 3 milyon 990 bin liradan başlıyor. Ödeme planı detaylarını aktarmamı ister misiniz?"
4. SIRALI BİLGİLENDİRME: Tüm projeleri veya proje detaylarını bir kerede vermek yerine parça parça ver. Önce en can alıcı tek bir bilgiyi söyle, diğer tüm detayları müşterinin sonraki sorularına sakla.
5. MÜŞTERİNİN SÖZÜNÜ KESME VE DİNLE: Müşteri konuşmaya başladığı an sus ve dinle. Asla robotik bir şekilde önceden hazırladığın uzun metni okumaya devam etme.
=== DİYALOG VE KISA CEVAP KURALLARI SONU ===
`;


// ─── DB-Backed Prompt Versioning ─────────────────────────────

/**
 * Get the active prompt from DB (ai_prompt_versions table).
 * Falls back to the hardcoded default if no DB version is active.
 */
export async function getActivePrompt(tenantId: string, promptType: string): Promise<string> {
    try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()

        const { data } = await supabase
            .from('ai_prompt_versions')
            .select('prompt_content')
            .eq('tenant_id', tenantId)
            .eq('prompt_type', promptType)
            .eq('is_active', true)
            .maybeSingle()

        if (data?.prompt_content) {
            console.log(`[Vapi] Using DB prompt v for type: ${promptType}`)
            return data.prompt_content
        }
    } catch (e) {
        console.warn('[Vapi] Failed to fetch DB prompt, using default:', e)
    }

    // Fallback to hardcoded
    if (promptType === 'voice_rules') return TURKISH_VOICE_RULES
    return (DEFAULT_OUTREACH_PROMPTS as any)[promptType] || DEFAULT_OUTREACH_PROMPTS.standard
}


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
    /** Override the end call message */
    endCallMessage?: string
    /** Override the system prompt */
    systemPrompt?: string
    /** Override the voice (ElevenLabs voiceId) */
    voiceId?: string
    /** Override the server/webhook URL */
    serverUrl?: string
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
    startedAt?: string
    endedAt?: string
    transcript?: string
    summary?: string
    recordingUrl?: string
    cost?: number
    costBreakdown?: { total?: number }
    metadata?: Record<string, any>
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
            return { success: false, error: translateVapiError('VAPI_PHONE_NUMBER_ID not configured') }
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
                return { success: false, error: translateVapiError('No assistant configured. Set VAPI_ASSISTANT_ID or pass assistantId.') }
            }
            payload.assistantId = defaultAssistantId
        }

        // If we have a custom system prompt, use a transient (inline) assistant
        // to guarantee our prompt is used instead of the saved assistant's prompt
        if (options.systemPrompt) {
            // IMPORTANT: Always use production domain for webhook URL.
            // Vercel serverless functions resolve headers().host to deployment-specific URLs
            // (e.g. novocrm-abc123.vercel.app) which causes webhooks to go to wrong endpoint.
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.novoxcrm.com'
            const resolvedServerUrl = options.serverUrl || `${siteUrl}/api/webhooks/vapi`

            payload.assistant = {
                serverUrl: resolvedServerUrl,
                serverMessages: ['end-of-call-report', 'status-update', 'function-call'],
                server: {
                    url: resolvedServerUrl,
                    secret: process.env.VAPI_WEBHOOK_SECRET || undefined,
                    timeoutSeconds: 20,
                },
                firstMessage: options.firstMessage || undefined,
                endCallMessage: options.endCallMessage || 'İyi günler, görüşmek üzere. Hoşçakalın.',
                firstMessageMode: options.firstMessage ? 'assistant-speaks-first' : 'assistant-waits-for-user',
                startSpeakingPlan: {
                    waitSeconds: 0.8
                },
                stopSpeakingPlan: {
                    numWords: 1, // Require at least 1 word to stop speaking, avoiding stopping on mere breath/ambient clicks
                    voiceSeconds: 0.25,
                    backoffSeconds: 0.8
                },
                backgroundSpeechDenoisingPlan: {
                    smartDenoisingPlan: {
                        enabled: true
                    }
                },
                model: {
                    provider: 'openai',
                    model: 'gpt-4o',
                    messages: [{ role: 'system', content: TURKISH_VOICE_RULES + '\n\n' + options.systemPrompt }],
                    tools: [
                        {
                            type: 'endCall'
                        }
                    ],
                },
                voice: {
                    provider: '11labs',
                    voiceId: options.voiceId || 'uvU9jrgGLWNPeNA4NgNT', // Maya - aktif kadın sesi
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
                    keywords: [
                        'Novapark:3', 'Vista:3', 'Viva:3', 'NovoCity:3', 'Novo:2',
                        'Nova:2', 'Montenegro:2',
                        'Turkcell:2', 'Vodafone:2', 'Telekom:2',
                        'metrekare:2', 'dubleks:2', 'daire:2',
                        'Kocaeli:2', 'Körfez:2', 'Torbalı:2', 'İzmir:2',
                        'telesekreter:3', 'ulaşılamıyor:3',
                    ],
                },
                silenceTimeoutSeconds: 45,
                analysisPlan: {
                    structuredDataPrompt: 'Görüşme transkriptini analiz et ve aşağıdaki JSON yapısını doldur. Eğer müşteri ilgili ama şu an müsait değilse veya daha sonra aranmak istiyorsa lead_score "follow_up" olmalıdır. callback_datetime alanına müşterinin belirttiği zaman bilgisini aynen yaz. Müşteri "aramayın", "bir daha arasanız şikayet ederim", "numaramı silin", "beni rahatsız etmeyin", "istemiyorum" gibi kesin ret ve iletişim kesme ifadeleri kullanıyorsa do_not_contact alanını true yap.',
                    structuredDataSchema: {
                        type: 'object',
                        properties: {
                            lead_score: { type: 'string', enum: ['hot', 'warm', 'follow_up', 'disqualified'], description: 'Müşterinin sıcaklık skoru. Müsait değilse veya daha sonra aranmak istiyorsa "follow_up" kullan.' },
                            interested: { type: 'boolean', description: 'Müşteri projeye/ürüne ilgi gösteriyor mu?' },
                            available: { type: 'boolean', description: 'Müşteri şu an konuşmaya müsait miydi? (false = müsait değildi, meşguldü, devlet dairesindeydi, toplantıdaydı, daha sonra aranmak istedi vb.)' },
                            callback_requested: { type: 'boolean', description: 'Müşteri daha sonra tekrar aranmak istedi mi? (Örn: "sonra arayın", "şimdi müsait değilim ama ilgileniyorum")' },
                            callback_datetime: { type: 'string', description: 'Müşteri tekrar aranmak istiyorsa, belirttiği tarih/saat ifadesi. Örnekler: "yarın saat 5", "yarın öğlen". Müşterinin söylediği ifadeyi aynen yaz.' },
                            wants_catalog: { type: 'boolean', description: 'Müşteri katalog, broşür, fiyat listesi veya doküman istedi mi?' },
                            project_interested: { type: 'string', description: 'Müşterinin ilgilendiği proje adı (Novapark Vista, NovoCity İzmir, Novapark Viva Körfez, Novapark Montenegro vb.)' },
                            notes: { type: 'string', description: 'Görüşme hakkında kısa not (Türkçe)' },
                            do_not_contact: { type: 'boolean', description: 'Müşteri kesinlikle aranmak veya mesaj almak istemediğini belirtti mi? "aramayın", "numaramı silin", "rahatsız etmeyin", "şikayet ederim" gibi ifadeler kullandıysa true.' }
                        },
                        required: ['lead_score', 'interested', 'available', 'notes'],
                    },
                    summaryPrompt: 'Bu telefon görüşmesini Türkçe olarak 2-3 cümleyle özetle.',
                    successEvaluationPrompt: 'Müşteri randevu aldı veya detaylı bilgi talep etti ise başarılı say.',
                    successEvaluationRubric: 'PassFail',
                },
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

        let data: any = {}
        const text = await response.text()
        try {
            data = JSON.parse(text)
        } catch (e) {
            data = { error: text || `HTTP ${response.status}` }
        }

        if (!response.ok) {
            console.error('[Vapi] Call initiation failed:', data)
            let errorMessage = data.message || data.error || `HTTP ${response.status}`

            // Detect billing / insufficient funds errors (402 or keyword match)
            if (response.status === 402 || (typeof errorMessage === 'string' && errorMessage.toLowerCase().match(/billing|balance|funds|payment|credit/))) {
                errorMessage = 'INSUFFICIENT_FUNDS: ' + errorMessage
            }

            return {
                success: false,
                error: translateVapiError(errorMessage),
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
        return { success: false, error: translateVapiError(error.message || 'Network error') }
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
 * Aktif bir aramayı durdur / sonlandır
 */
export async function stopCall(callId: string): Promise<boolean> {
    try {
        const response = await fetch(`${VAPI_BASE_URL}/call/${callId}/stop`, {
            method: 'POST',
            headers: getVapiHeaders(),
        })
        return response.ok
    } catch (error) {
        console.error('[Vapi] Stop call error:', error)
        return false
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
                model: 'gpt-4o',
                systemPrompt: config.systemPrompt,
                temperature: 0.7,
            },
            voice: {
                provider: 'elevenlabs',
                voiceId: config.voice || 'uvU9jrgGLWNPeNA4NgNT', // Maya - aktif kadın sesi
            },
            firstMessage: config.firstMessage,
            endCallMessage: 'İyi günler, görüşmek üzere.',
            maxDurationSeconds: config.maxDurationSeconds || 180,
            language: 'tr',
            startSpeakingPlan: {
                waitSeconds: 0.8
            },
            stopSpeakingPlan: {
                numWords: 1,
                voiceSeconds: 0.25,
                backoffSeconds: 0.8
            },
            backgroundSpeechDenoisingPlan: {
                smartDenoisingPlan: {
                    enabled: true
                }
            },
            silenceTimeoutSeconds: 45,
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
 * Translates Vapi API error messages to Turkish for user display
 */
export function translateVapiError(error: string | undefined | null): string {
    if (!error) return 'Bilinmeyen bir hata oluştu.';
    
    const msg = error.toLowerCase();
    
    if (msg.includes('insufficient_funds') || msg.includes('insufficient funds') || msg.includes('balance') || msg.includes('funds') || msg.includes('credit')) {
        return 'Sistem bakiyesi yetersiz. Lütfen Vapi hesabının bakiyesini kontrol edin.';
    }
    if (msg.includes('e.164') || msg.includes('valid phone number') || msg.includes('missing the country code') || msg.includes('phone format')) {
        return 'Müşteri numarası geçerli bir telefon numarası formatında (E.164) olmalıdır. Lütfen numaranın ülke koduyla birlikte (Örn: +905XXXXXXXXX) ve doğru yazıldığından emin olun.';
    }
    if (msg.includes('concurrency') || msg.includes('rate limit') || msg.includes('too many requests')) {
        return 'Eşzamanlı arama limitine ulaşıldı. Arama kuyruğa alındı ve daha sonra tekrar denenecek.';
    }
    if (msg.includes('phone number is not verified') || msg.includes('unverified')) {
        return 'Telefon numarası doğrulanmamış. Lütfen alıcı numarasını kontrol edin.';
    }
    if (msg.includes('unauthorized') || msg.includes('api key') || msg.includes('invalid credentials')) {
        return 'Vapi API bağlantı yetkilendirme hatası. Lütfen API anahtarlarını kontrol edin.';
    }
    if (msg.includes('vapi_phone_number_id not configured') || msg.includes('phone number id')) {
        return 'Vapi Telefon Numarası Kimliği (Phone Number ID) yapılandırılmamış.';
    }
    if (msg.includes('no assistant configured') || msg.includes('assistant id')) {
        return 'Arama asistanı yapılandırılmamış veya bulunamadı.';
    }
    
    return error;
}

/**
 * Normalize Turkish and International phone numbers to E.164 format
 */
export function normalizeToE164(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digits
    let clean = phone.replace(/\D/g, '');
    
    // Check if it starts with explicit international prefix (starts with '+' and not '+90', or starts with '00' and not '0090')
    const isExplicitInternational = (phone.startsWith('+') && !phone.startsWith('+90')) || 
                                    (phone.startsWith('00') && !phone.startsWith('0090'));
    
    if (!isExplicitInternational) {
        // Extract the last 10 digits
        const last10 = clean.slice(-10);
        // Turkish mobile and landline area codes start with 2, 3, 4, 5, 8, 9
        if (last10.length === 10 && /^[234589]/.test(last10)) {
            return `+90${last10}`;
        }
    }
    
    // For international or fallback, just format with '+'
    if (phone.startsWith('+')) {
        return `+${clean}`;
    }
    if (phone.startsWith('00')) {
        return `+${clean.substring(2)}`;
    }
    return `+${clean}`;
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
    // Vapi sends data in multiple locations depending on version/event type:
    // - Older: body.message.transcript, body.message.recordingUrl
    // - Newer (end-of-call-report): body.message.artifact.transcript, body.message.artifact.recordingUrl
    // - Call object: body.message.call.transcript
    const artifact = body.message?.artifact || {}

    const startedAt = body.message?.call?.startedAt || body.call?.startedAt || body.startedAt
    const endedAt = body.message?.call?.endedAt || body.call?.endedAt || body.endedAt
    let duration = body.message?.call?.duration || body.call?.duration || body.duration
    if (!duration && startedAt && endedAt) {
        duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    }

    // Build transcript from artifact.messages[] if plain transcript is missing
    let transcript = body.message?.transcript || body.transcript || artifact.transcript || body.message?.call?.transcript || body.call?.transcript
    if (!transcript && artifact.messages && Array.isArray(artifact.messages)) {
        transcript = artifact.messages
            .filter((m: any) => m.role && m.message)
            .map((m: any) => `${m.role === 'assistant' ? 'AI' : m.role === 'user' ? 'User' : m.role}: ${m.message}`)
            .join('\n')
    }

    return {
        type: body.message?.type || body.type || 'unknown',
        callId: body.message?.call?.id || body.call?.id || body.id || '',
        status: body.message?.status || body.message?.call?.status || body.call?.status || body.status,
        endedReason: body.message?.endedReason || body.endedReason || body.message?.call?.endedReason || body.call?.endedReason,
        transcript: transcript || undefined,
        summary: body.message?.summary || body.summary || body.message?.analysis?.summary || artifact.summary || body.message?.call?.summary || body.call?.summary,
        recordingUrl: body.message?.recordingUrl || body.recordingUrl || artifact.recordingUrl || artifact.stereoRecordingUrl || body.message?.call?.recordingUrl || body.call?.recordingUrl,
        duration: duration ? Number(duration) : undefined,
        cost: body.message?.call?.cost || body.call?.cost || body.cost || body.message?.call?.costBreakdown?.total || body.costBreakdown?.total,
        analysis: body.message?.analysis || body.analysis || body.message?.call?.analysis || body.call?.analysis,
        metadata: body.message?.call?.metadata || body.call?.metadata || body.metadata,
    }
}

// ─── Default Prompts ─────────────────────────────────────────

export const DEFAULT_OUTREACH_PROMPTS = {
    standard: `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Amacın, daha önce projelerimizle ilgilendiğini belirten potansiyel müşterilerle nazik, profesyonel ve etkileşimli (diyalog-bazlı) bir ön görüşme yapmak.

=== KONUŞMA AKIŞI (KESİNLİKLE DİYALOG-BAZLI OLMALIDIR) ===
1. GİRİŞ: Karşı tarafı adıyla ve cinsiyetine uygun hitapla (Erkek ise "Bey", Kadın ise "Hanım" ekleyerek) nazikçe selamla. Kendini ve firmayı tanıt.
   "Merhaba {customer_name}, size Novo İnşaat'tan ulaşıyorum. Ben Maya. Nasılsınız?"
2. UYGUNLUK TEYİDİ: Müşteri yanıt verdikten sonra, projemizle ilgili bilgi vermek için uygun olup olmadığını mutlaka sor.
   "Daha önce {project_name} projemize ilgi göstermiştiniz. Kısaca bilgi vermek istiyorum, uygun musunuz?"
   - Müşteri meşgul veya müsait değilse: "Tabii, sizi uygun bir zamanda tekrar arayalım. İyi günler!" de ve "endCall" fonksiyonunu çağırarak aramayı sonlandır.
3. KISA VE ETKİLEŞİMLİ BİLGİLENDİRME:
   - Kesinlikle upuzun paragraflar (monolog) okuma! Bilgileri adım adım ver ve müşterinin araya girmesine, soru sormasına fırsat tanı.
   - Her cümleden sonra müşterinin tepkisini bekle. Cümlelerin en fazla 15-20 kelime olsun.
   - Örnek: "Projemiz İzmir Torbalı'da, sanayi aksına çok yakın bir konumda yer alıyor. Yatırım veya oturum amacıyla mı ilgilenmiştiniz?"
4. FİYAT VE ÖDEME DETAYLARI:
   - Fiyatları müşteriye sormadan tek seferde dökme. Önce ilgi seviyesini ölç.
   - Müşteri fiyat sorduğunda ya da ödeme koşullarını merak ettiğinde:
     "Vadeli fiyatlarımız 1+0 daireler için 1 milyon 990 bin TL'den başlıyor. Yüzde 35 peşinat ve 24 ay faizsiz taksit seçeneğimiz var. Ödeme koşulları sizin için uygun görünyor mu?"
5. YÖNLENDİRME VE SONLANDIRMA:
   - Müşteri daha detaylı görüşmek istediğini veya ilgilendiğini belirttiğinde, onu satış uzmanına yönlendireceğini söyle:
     "Sizi bu projeyle ilgilenen satış danışmanımıza yönlendiriyorum. Kendisi size detaylı bilgi sunacaktır. İyi günler dilerim."
     Vedalaşmanın ardından HEMEN "endCall" aracını çağırarak telefonu kapat.

=== İLAVE HİTAP VE DAVRANIŞ KURALLARI ===
- ⚠️ KRİTİK: Müşteri "satış danışmanı ile görüşmek istiyorum", "bir yetkili ile konuşayım", "biri beni arasın", "gidip görüşmek istiyorum" gibi doğrudan bir kişiyle konuşma veya yüz yüze görüşme talebi iletirse, ASLA sadece vedalaşıp kapatma! HARFİ HARFİNE şu cümleyi söyle (kısaltma, değiştirme yapma): "Elbette, en kısa sürede bir satış danışmanımız sizi arayacaktır. İyi günler dilerim." Bu cümleyi BİREBİR söyledikten sonra "endCall" aracıyla görüşmeyi sonlandır.
- Karşı taraf "ilgilenmiyorum", "istemiyorum" gibi kesin ret ifadeleri kullanırsa satış yapmaya çalışma! "Anlıyorum, rahatsızlık verdiysek özür dileriz. İyi günler dilerim." de ve HEMEN "endCall" aracıyla görüşmeyi bitir.
- Müşterinin sözünü kesme, araya girmesine ve cevap vermesine izin ver.`,

    secondAttempt: `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Müşteri daha önce aranmış ancak ulaşılamamış. Bu ikinci arama denemesi. Amacın, nazikçe bağlantı kurup ilgisini anlamak.

=== KONUŞMA AKIŞI ===
1. GİRİŞ: Karşı tarafı adıyla ve cinsiyetine uygun hitapla (Erkek ise "Bey", Kadın ise "Hanım" ekleyerek) nazikçe selamla.
   "Merhaba {customer_name}, size Novo İnşaat'tan ulaşıyorum. Ben Maya. Daha önce size ulaşmaya çalışmıştık, nasılsınız?"
2. UYGUNLUK VE İLGİ TEYİDİ:
   "Daha önce ilgilendiğiniz {project_name} projemiz hakkında bilgi vermek istiyoruz. Müsait misiniz?"
   - Müşteri müsait değilse: "Tabii, daha sonra tekrar iletişime geçelim. İyi günler!" de ve "endCall" ile kapat.
3. KISA DİYALOG:
   - "Aramamızın sebebi, {project_name} projemizdeki son fırsatları paylaşmak. Konut arayışınız hâlâ devam ediyor mu?"
   - Müşteri ilgileniyorsa, detaylı bilgi veya danışman randevusu teklif et.
   - Müşteri ilgilenmiyorsa: "Anlıyorum, ilginiz için teşekkürler. İyi günler!" de ve kapat.
4. SONLANDIRMA:
   "Sizi ilgili satış uzmanımıza yönlendiriyorum, en kısa sürede size dönüş sağlayacaktır. İyi günler dilerim." de ve "endCall" aracıyla telefonu kapat.

=== KURALLAR ===
- Asla monolog okuma! Kısa tut, max 1.5-2 dakika konuş.
- Müşteri meşgulse ısrarcı olma.
- Ret durumunda anında vedalaş ve kapat.
- ⚠️ KRİTİK: Müşteri "satış danışmanı ile görüşmek istiyorum", "bir yetkili ile konuşayım", "gidip görüşmek istiyorum" gibi doğrudan biriyle konuşma veya yüz yüze görüşme talebi iletirse, ASLA sadece vedalaşıp kapatma! HARFİ HARFİNE şu cümleyi söyle: "Elbette, en kısa sürede bir satış danışmanımız sizi arayacaktır. İyi günler dilerim." Bu cümleyi BİREBİR söyledikten sonra "endCall" ile kapat.`,

    campaign: `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Müşteriyi yeni lansman/kampanya veya özel fırsatlar hakkında bilgilendirmek için arıyorsun.

=== KONUŞMA AKIŞI ===
1. GİRİŞ: Karşı tarafı adıyla ve cinsiyetine uygun hitapla (Erkek ise "Bey", Kadın ise "Hanım" ekleyerek) nazikçe selamla.
   "Merhaba {customer_name}, size Novo İnşaat'tan ulaşıyorum. Ben Maya, nasılsınız?"
2. KAMPANYA TANITIMI (İNTERAKTİF):
   - Kampanyayı bir kerede upuzun anlatma. Önce ilgi teyidi al.
   - "Lansmana özel yüzde 24 ay faizsiz taksit ve peşin alımlarda özel indirimlerin olduğu yeni bir kampanya başlattık. Kısa bir bilgi aktarmam için uygun musunuz?"
   - Uygun değilse, daha sonra arayacağını belirtip kapat.
3. DETAYLARI PARÇA PARÇA SUNMA:
   - Müşteri "nedir kampanya?" dediğinde sadece en can alıcı noktayı söyle:
     "Örneğin, 1+0 dairelerimizde peşin fiyatlar 1 milyon 500 bin TL'den başlıyor veya kredi kartına vade farksız 12 taksit yapabiliyoruz. Bu alternatifler bütçenize hitap ediyor mu?"
4. SONLANDIRMA:
   - Müşteri ilgilendiğinde: "Detayları size hemen WhatsApp'tan da gönderip satış danışmanımıza yönlendiriyorum. İyi günler dilerim." de ve "endCall" aracıyla kapat.

=== KURALLAR ===
- Satış baskısı yapma, kampanya heyecanını doğal bir tonla yansıt.
- Müşteriye söz hakkı tanı. Her sorudan sonra müşterinin cevabını bekle.
- ⚠️ KRİTİK: Müşteri "satış danışmanı ile görüşmek istiyorum", "bir yetkili ile konuşayım", "gidip görüşmek istiyorum" gibi doğrudan biriyle konuşma veya yüz yüze görüşme talebi iletirse, ASLA sadece vedalaşıp kapatma! HARFİ HARFİNE şu cümleyi söyle: "Elbette, en kısa sürede bir satış danışmanımız sizi arayacaktır. İyi günler dilerim." Bu cümleyi BİREBİR söyledikten sonra "endCall" ile kapat.`,

    lostRecovery: `Sen Novo İnşaat için çalışan profesyonel sesli yapay zeka asistanısın. Adın Maya.
Müşteri daha önce projelerimizle ilgilenmiş ancak süreç tamamlanamamıştı. Amacın, nazik ve samimi bir diyalogla ilgiyi yeniden canlandırmak.

=== KONUŞMA AKIŞI ===
1. GİRİŞ: Karşı tarafı adıyla ve cinsiyetine uygun hitapla (Erkek ise "Bey", Kadın ise "Hanım" ekleyerek) nazikçe selamla.
   "Merhaba {customer_name}, size Novo İnşaat'tan ulaşıyorum. Ben Maya. Nasılsınız?"
2. DURUM GÜNCELLEMESİ (İNTERAKTİF):
   - "Bir süre önce projelerimizle ilgilenmiştiniz. Konut arayışınız veya yatırım planlarınız hâlâ devam ediyor mu?"
   - Müşteri "hayır, aldım" veya "ilgilenmiyorum" derse: "Anlıyorum, hayırlı olsun. İyi günler dilerim!" de ve kapat.
   - Müşteri "evet, devam ediyor" derse:
     "Çok sevinirim. {project_name} projemizde teslimler Aralık 2027'de başlıyor ve şu an kaçırılmayacak ödeme kolaylıkları var. Güncel fiyatları aktarmamı ister misiniz?"
3. SONLANDIRMA:
   - Müşteri ilgi gösterirse satış uzmanına yönlendir ve "endCall" ile kapat.

=== KURALLAR ===
- ⚠️ KRİTİK: Müşteri "satış danışmanı ile görüşmek istiyorum", "bir yetkili ile konuşayım", "gidip görüşmek istiyorum" gibi doğrudan biriyle konuşma veya yüz yüze görüşme talebi iletirse, ASLA sadece vedalaşıp kapatma! HARFİ HARFİNE şu cümleyi söyle: "Elbette, en kısa sürede bir satış danışmanımız sizi arayacaktır. İyi günler dilerim." Bu cümleyi BİREBİR söyledikten sonra "endCall" ile kapat.`
}

/**
 * Called by the Vapi webhook when a manual call ends.
 * Logs the call to the customer's timeline and updates CRM lead states.
 */
export async function handleManualVapiCallResult(callData: {
    callId: string
    status: string
    endedReason?: string
    transcript?: string
    summary?: string
    recordingUrl?: string
    duration?: number
    cost?: number
    analysis?: any
    metadata?: Record<string, any>
}) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    let customerId = callData.metadata?.customer_id
    const saleId = callData.metadata?.sale_id
    let tenantId = callData.metadata?.tenant_id
    const callerPhone = callData.metadata?.caller_phone
    let isInbound = callData.metadata?.call_direction === 'inbound'

    // ─── Fallback: metadata eksikse inbound_calls tablosundan kontrol et ───
    if (callData.callId && (!tenantId || !isInbound)) {
        const { data: inboundRecord } = await supabase
            .from('inbound_calls')
            .select('tenant_id, customer_id, caller_phone')
            .eq('vapi_call_id', callData.callId)
            .maybeSingle()

        if (inboundRecord) {
            isInbound = true
            if (!tenantId) tenantId = inboundRecord.tenant_id
            if (!customerId) customerId = inboundRecord.customer_id
            console.log(`[Vapi Webhook] 📞 Inbound call detected via inbound_calls table fallback (callId: ${callData.callId})`)
        }
    }

    // ─── Fallback 2: customerId yoksa veritabanından telefon numarasına göre eşleştir ───
    if (!customerId) {
        let searchPhone = callerPhone
        if (!searchPhone && callData.callId) {
            const { data: inboundRecord } = await supabase
                .from('inbound_calls')
                .select('caller_phone')
                .eq('vapi_call_id', callData.callId)
                .maybeSingle()
            if (inboundRecord?.caller_phone) {
                searchPhone = inboundRecord.caller_phone
            }
        }
        if (searchPhone) {
            let cleanPhone = searchPhone.replace(/\D/g, '')
            if (cleanPhone.length > 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length - 10)
            }
            const { data: matchedCust } = await supabase
                .from('customers')
                .select('id, tenant_id')
                .ilike('phone', `%${cleanPhone}%`)
                .limit(1)
                .maybeSingle()

            if (matchedCust) {
                customerId = matchedCust.id
                if (!tenantId) tenantId = matchedCust.tenant_id
                console.log(`[Vapi Webhook] 📞 Customer matched via end-of-call phone fallback: ${customerId} under tenant ${tenantId}`)
            }
        }
    }

    if (!tenantId) {
        console.warn('[Vapi Webhook] Manual call finished but missing tenant_id in metadata')
        return
    }

    console.log(`[Vapi Webhook] Processing ${isInbound ? 'inbound' : 'manual'} call result — customer: ${customerId || 'unknown'}, phone: ${callerPhone}`)

    // Determine call outcome/status
    let outcome: 'Success' | 'Failed' | 'Busy' | 'No Answer' = 'No Answer'
    let logStatus: string = 'no_answer'

    const hasTranscript = !!(callData.transcript && callData.transcript.trim().length > 0)
    const transcriptText = callData.transcript || ''

    // Check if the customer actually spoke (presence of User: or Customer:)
    const customerSpoke = hasTranscript && (
        transcriptText.toLowerCase().includes('user:') ||
        transcriptText.toLowerCase().includes('customer:') ||
        transcriptText.toLowerCase().includes('user (customer):')
    )

    // Check for Turkish voicemail carrier messages
    const voicemailKeywords = [
        'sekreter',
        'en uzun kayıt',
        'mesajınız',
        'sinyal sesinden',
        'ulaşılamıyor',
        'telesekreter',
        'mesaj bırakın'
    ]
    const isVoicemail = customerSpoke && voicemailKeywords.some(keyword =>
        transcriptText.toLowerCase().includes(keyword)
    )

    if (callData.endedReason === 'customer-busy') {
        outcome = 'Busy'
        logStatus = 'busy'
    } else if (callData.endedReason === 'customer-did-not-answer' || isVoicemail || (hasTranscript && !customerSpoke)) {
        outcome = 'No Answer'
        logStatus = 'no_answer'
    } else if (callData.endedReason === 'customer-ended-call' || callData.endedReason === 'assistant-ended-call' || customerSpoke) {
        // Customer answered and spoke (not voicemail)
        if (callData.duration && callData.duration > 30) {
            outcome = 'Success'
            logStatus = 'answered'
        } else {
            outcome = 'Failed'
            logStatus = 'answered'
        }
    }

    // Check structured data
    const structuredData = callData.analysis?.structuredData
    const interested = structuredData?.interested
    const leadScore = structuredData?.lead_score // hot, warm, follow_up, disqualified
    const notes = structuredData?.notes
    const extractedCustomerName = structuredData?.customer_name

    if (extractedCustomerName && customerId) {
        const { data: currentCust } = await supabase
            .from('customers')
            .select('full_name')
            .eq('id', customerId)
            .maybeSingle()

        if (currentCust?.full_name === 'Yeni Gelen Arama Adayı') {
            await supabase
                .from('customers')
                .update({ full_name: extractedCustomerName.trim() })
                .eq('id', customerId)
            console.log(`[Vapi Webhook] Dynamically updated unknown caller name to: ${extractedCustomerName}`)
        }
    }

    if (interested === true || leadScore === 'hot' || leadScore === 'warm') {
        outcome = 'Success'
        logStatus = 'answered'
    }
    // ─── 0. Update inbound_calls record (if inbound) ─────────
    if (isInbound && callData.callId) {
        const outcomeMap: Record<string, string> = {
            'Success': 'answered', 'Failed': 'no_answer', 'Busy': 'busy', 'No Answer': 'no_answer'
        }
        const updateData: Record<string, any> = {
                status: 'ended',
                ended_at: new Date().toISOString(),
                duration: callData.duration || 0,
                outcome: outcome === 'Success' ? 'answered' : outcome === 'Busy' ? 'busy' : 'no_answer',
                ended_reason: callData.endedReason || null,
                lead_score: leadScore || null,
                interested: interested || false,
                transcript: callData.transcript || null,
                summary: callData.summary || notes || null,
                recording_url: callData.recordingUrl || null,
                cost: callData.cost || null,
                analysis: callData.analysis || null,
            }
            if (extractedCustomerName) {
                updateData.caller_name = extractedCustomerName
            }
            const { error: icError } = await supabase
            .from('inbound_calls')
            .update(updateData)
            .eq('vapi_call_id', callData.callId)
        
        if (icError) {
            console.warn(`[Vapi Webhook] Failed to update inbound_calls: ${icError.message}`)
        } else {
            console.log(`[Vapi Webhook] ✅ inbound_calls updated for ${callData.callId}`)
        }
    }

    // ─── 1. Log to Customer Timeline (Activities) — only if customer exists ─────────
    if (!customerId) {
        console.log(`[Vapi Webhook] No customer_id — skipping activity/lead updates for unknown caller ${callerPhone}`)
        return // Unknown caller — inbound_calls already updated above
    }

    const activityTopic = 'Sales'
    const durationText = callData.duration ? `${Math.floor(callData.duration / 60)}dk ${callData.duration % 60}sn` : ''
    const transcriptBlock = callData.transcript
        ? `\n\n📝 Transkript:\n${callData.transcript}`
        : ''
    const recordingBlock = callData.recordingUrl
        ? `\n\n[RECORDING]: ${callData.recordingUrl}`
        : ''
    const summaryBlock = callData.summary || notes || 'Görüşme tamamlandı.'

    const callIdTag = callData.callId ? `\n\n[Call ID: ${callData.callId}]` : ''

    const activityPayload = {
        summary: `${isInbound ? '📞 Gelen Arama' : '🤖 AI Arama'}: ${leadScore ? 'Skor ' + leadScore.toUpperCase() : 'Görüşme Tamamlandı'} (${durationText})`,
        description: `${summaryBlock}${transcriptBlock}${recordingBlock}${callIdTag}`,
        notes: callData.transcript || '',
        status: 'Completed' as const,
        completed_at: new Date().toISOString(),
        outcome: outcome,
        priority: leadScore === 'hot' ? 'High' : 'Medium'
    }

    // Try to UPDATE the existing "AI Arama başlatıldı" placeholder activity first
    let actError: any = null
    if (callData.callId) {
        const { data: existingAct } = await supabase
            .from('activities')
            .select('id')
            .eq('customer_id', customerId)
            .ilike('description', `%[Call ID: ${callData.callId}]%`)
            .limit(1)
            .single()

        if (existingAct) {
            console.log(`[Vapi Webhook] Updating existing activity ${existingAct.id} for callId ${callData.callId}`)
            const { error } = await supabase
                .from('activities')
                .update(activityPayload)
                .eq('id', existingAct.id)
            actError = error
        } else {
            // No existing placeholder found → insert new
            const { error } = await supabase.from('activities').insert({
                tenant_id: tenantId,
                customer_id: customerId,
                type: 'Transcript',
                topic: activityTopic,
                due_date: new Date().toISOString(),
                ...activityPayload
            })
            actError = error
        }
    } else {
        // No callId → insert new
        const { error } = await supabase.from('activities').insert({
            tenant_id: tenantId,
            customer_id: customerId,
            type: 'Transcript',
            topic: activityTopic,
            due_date: new Date().toISOString(),
            ...activityPayload
        })
        actError = error
    }

    if (actError) {
        console.error('[Vapi Webhook] Error saving manual call activity:', actError)
    }

    // ─── 2. Update Lead (Sale) Status if interested ─────────
    if (saleId) {
        const updates: any = {}

        // If customer is highly interested, promote to Prospect (Fırsat)
        if (interested === true || leadScore === 'hot') {
            updates.status = 'Prospect'
        }

        if (Object.keys(updates).length > 0) {
            await supabase.from('sales').update(updates).eq('id', saleId)
        }
    }

    // ─── 3. AI Lead Scoring → lead_qualifications güncelleme ─────
    if (leadScore) {
        const scoreMap: Record<string, string> = {
            hot: 'qualified',
            warm: 'follow_up',
            follow_up: 'follow_up',
            disqualified: 'disqualified',
        }
        const newLqStatus = scoreMap[leadScore] || 'follow_up'

        // Check if lead_qualifications record exists
        const { data: lqRecord } = await supabase
            .from('lead_qualifications')
            .select('id')
            .eq('customer_id', customerId)
            .limit(1)
            .maybeSingle()

        const lqData = {
            tenant_id: tenantId,
            customer_id: customerId,
            status: newLqStatus,
            interest_level: leadScore,
            call_notes: `🤖 AI Arama Skoru: ${leadScore.toUpperCase()}` + (notes ? ` - ${notes}` : ''),
            last_call_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        if (lqRecord) {
            const { data: currentLq } = await supabase.from('lead_qualifications').select('call_count').eq('id', lqRecord.id).single()
            const currentCount = currentLq?.call_count || 0

            await supabase
                .from('lead_qualifications')
                .update({
                    status: newLqStatus,
                    interest_level: leadScore,
                    call_notes: lqData.call_notes,
                    last_call_at: lqData.last_call_at,
                    call_count: currentCount + 1,
                    updated_at: lqData.updated_at
                })
                .eq('id', lqRecord.id)
        } else {
            await supabase
                .from('lead_qualifications')
                .insert({
                    ...lqData,
                    call_count: 1
                })
        }
        console.log(`[Vapi Webhook] 📊 Manual lead scored: ${customerId} → ${leadScore} (${newLqStatus})`)

        // ─── AUTO COMMUNICATION OFF: do_not_contact → iletişim kapat ───
        const doNotContact = structuredData?.do_not_contact === true
        if (doNotContact) {
            await supabase
                .from('customers')
                .update({ communication_enabled: false })
                .eq('id', customerId)
            console.log(`[Vapi Webhook] 🔇 Communication disabled for customer ${customerId} — reason: ${doNotContact ? 'do_not_contact' : 'disqualified'}`)
            
            // Opt-out kaydı da ekle
            if (callerPhone) {
                const { normalizePhone } = await import('@/lib/outreach/engine')
                await supabase.from('outreach_optouts').upsert({
                    phone: normalizePhone(callerPhone),
                    channel: 'all',
                    reason: doNotContact ? 'Müşteri aranmak istemediğini belirtti (AI tespit)' : 'AI arama — disqualified',
                }, { onConflict: 'phone,channel' }).select()
            }
        }

        // Check if there is an assigned rep on customer/sale
        const { data: customer } = await supabase
            .from('customers')
            .select('full_name, phone, assigned_to')
            .eq('id', customerId)
            .single()

        const assignedTo = customer?.assigned_to || null

        // ─── HOT/WARM Lead → WhatsApp bildirim (hot lead manager'lara) ───
        if (leadScore === 'hot' || leadScore === 'warm') {
            try {
                // Tüm hot lead manager'ları bul
                const { data: hotLeadManagers } = await supabase
                    .from('profiles')
                    .select('id, full_name, phone')
                    .eq('tenant_id', tenantId)
                    .eq('is_hot_lead_manager', true)
                    .eq('is_active', true)

                if (hotLeadManagers && hotLeadManagers.length > 0) {
                    // Tenant WhatsApp bilgilerini al
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('wa_phone_number_id, wa_access_token')
                        .eq('id', tenantId)
                        .single()

                    if (tenant?.wa_phone_number_id && tenant?.wa_access_token) {
                        const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                        const leadLabel = leadScore === 'warm' ? '[ILIK LEAD - CRM Arama] ' : '[SICAK LEAD - CRM Arama] '
                        const params = [
                            customer?.phone || callerPhone || '-',
                            customer?.full_name || 'Müşteri',
                            new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                            leadLabel + (callData.summary || notes || 'AI arama sonucu ilgili olarak değerlendirildi')
                        ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 500) : p)

                        for (const manager of hotLeadManagers) {
                            if (manager.phone) {
                                try {
                                    await sendWhatsAppTemplate(
                                        manager.phone,
                                        'crm_operasyonel_durum_bildirimi',
                                        params,
                                        'tr',
                                        tenant.wa_phone_number_id,
                                        tenant.wa_access_token
                                    )
                                    console.log(`[Vapi Webhook] 🔥 Hot Lead Manager bildirimi gönderildi: ${manager.full_name} (${manager.phone})`)
                                } catch (sendErr: any) {
                                    console.error(`[Vapi Webhook] Hot Lead Manager bildirim hatası (${manager.full_name}):`, sendErr.message)
                                }
                            }
                        }
                    }
                }
            } catch (hotLeadNotifyError: any) {
                console.error('[Vapi Webhook] Hot Lead Manager bildirim hatası:', hotLeadNotifyError.message)
            }
        }

        // UNASSIGNED WARM/HOT Lead → Create follow-up task and notify admins
        if ((leadScore === 'hot' || leadScore === 'warm') && !assignedTo) {
            try {
                // Find primary owner/admin to assign the task
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('tenant_id', tenantId)
                    .in('role', ['admin', 'owner', 'crm_manager'])
                    .limit(1)

                const adminId = admins?.[0]?.id || null

                // Create follow-up activity (pending task)
                await supabase.from('activities').insert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    owner_id: adminId,
                    type: 'Call',
                    topic: 'Sales',
                    summary: `🚨 Atama Bekleyen İlgili Müşteri (Manuel Arama - ${leadScore.toUpperCase()})`,
                    description: `Müşteri yapay zeka aramasında sıcak ilgi gösterdi ancak şu an atanmış bir danışmanı bulunmamaktadır. Lütfen atama yapıp iletişime geçiniz.\nNotlar: ${notes || '-'}`,
                    due_date: new Date().toISOString(),
                    status: 'Pending',
                    priority: 'High',
                })

                // Create system notification
                const { createNotification } = await import('@/lib/notifications/create')
                await createNotification({
                    tenant_id: tenantId,
                    user_id: adminId || undefined,
                    type: 'Alert',
                    category: 'CRM',
                    title: `🔥 Atanmamış Sıcak Fırsat (Manuel Arama)`,
                    message: `${customer?.full_name || 'Müşteri'} yapay zeka aramasında sıcak ilgi gösterdi ancak ataması yok.`,
                    link: `/crm?customerId=${customerId}`,
                })

                console.log(`[Vapi Webhook] 🔔 Unassigned lead action created for customer ${customerId}`)
            } catch (err: any) {
                console.error('[Vapi Webhook] Error creating unassigned manual lead action:', err.message)
            }
        }

        // ─── FOLLOW-UP: Takip edilmeli → MAYA'ya görev ata ─────
        if (leadScore === 'follow_up' || structuredData?.callback_requested === true) {
            try {
                const MAYA_USER_ID = '8e800daf-42bf-411e-b3b0-a69563e3e126'
                const { parseCallbackDate } = await import('@/lib/utils/parse-callback-date')
                const callbackDatetime = callData.analysis?.structuredData?.callback_datetime
                const callbackDueDate = parseCallbackDate(callbackDatetime)

                const customerName = customer?.full_name || 'Müşteri'

                await supabase.from('activities').insert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    owner_id: MAYA_USER_ID,
                    type: 'Call',
                    topic: 'Sales',
                    summary: `📞 MAYA Takip Görevi — ${customerName}`,
                    description: [
                        `Müşteri daha sonra aranmak istedi.`,
                        callbackDatetime ? `📅 İstenen Zaman: ${callbackDatetime}` : null,
                        notes ? `📝 Notlar: ${notes}` : null,
                        `🤖 AI Lead Skoru: ${leadScore?.toUpperCase() || 'FOLLOW_UP'}`,
                    ].filter(Boolean).join('\n'),
                    due_date: callbackDueDate,
                    status: 'Pending',
                    priority: 'High',
                })

                console.log(`[Vapi Webhook] 📞 MAYA follow-up task created for ${customerName} (${customerId}) → due: ${callbackDueDate}`)
            } catch (followUpErr: any) {
                console.error('[Vapi Webhook] Error creating MAYA follow-up task:', followUpErr.message)
            }
        }

        // ─── KATALOG/DOKÜMAN: WhatsApp ile gönder veya Aybike'ye görev ata ─────
        if (structuredData?.wants_catalog === true) {
            try {
                const AYBIKE_USER_ID = '2ab043ff-da77-46d0-9977-8d6fdf1973fc'
                const customerName = customer?.full_name || 'Müşteri'
                const projectName = structuredData?.project_interested || ''
                const customerPhone = customer?.phone

                // Try to find project website_url from DB
                let projectUrl: string | null = null
                if (projectName) {
                    const { data: projects } = await supabase
                        .from('projects')
                        .select('name, website_url')
                        .eq('tenant_id', tenantId)

                    if (projects) {
                        const normalizedSearch = projectName.toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, '')
                        const match = projects.find((p: any) => {
                            const normalizedName = p.name.toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, '')
                            return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)
                        })
                        projectUrl = match?.website_url || null
                    }
                }

                // Get tenant WA credentials
                const { data: tenantWa } = await supabase
                    .from('tenants')
                    .select('wa_phone_number_id, wa_access_token')
                    .eq('id', tenantId)
                    .single()

                const hasWa = tenantWa?.wa_phone_number_id && tenantWa?.wa_access_token && customerPhone

                if (hasWa && projectUrl) {
                    const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
                    const message = `Merhaba ${customerName} 👋\n\n` +
                        `${projectName ? `*${projectName}* projemize` : 'Projelerimize'} gösterdiğiniz ilgi için teşekkür ederiz.\n\n` +
                        `📋 Detaylı bilgi ve katalog için: ${projectUrl}\n\n` +
                        `Sorularınız için bize ulaşabilirsiniz.`

                    await sendWhatsAppMessage(customerPhone, message, tenantWa.wa_phone_number_id, tenantWa.wa_access_token)
                    console.log(`[Vapi Webhook] 📄 WhatsApp catalog link sent to ${customerName} → ${projectUrl}`)
                } else {
                    // Fallback: assign to Aybike
                    await supabase.from('activities').insert({
                        tenant_id: tenantId,
                        customer_id: customerId,
                        owner_id: AYBIKE_USER_ID,
                        type: 'Call',
                        topic: 'Sales',
                        summary: `📋 Doküman Talebi — ${customerName}`,
                        description: [
                            `Müşteri katalog/broşür/fiyat listesi talep etti.`,
                            projectName ? `🏗️ İlgilendiği Proje: ${projectName}` : null,
                            projectUrl ? `🔗 Proje Linki: ${projectUrl}` : '⚠️ Proje web sitesi bulunamadı — lütfen manuel gönderin.',
                            !customerPhone ? '⚠️ Müşteri telefon numarası eksik!' : null,
                            notes ? `📝 Notlar: ${notes}` : null,
                        ].filter(Boolean).join('\n'),
                        due_date: new Date().toISOString(),
                        status: 'Pending',
                        priority: 'High',
                    })

                    // WhatsApp notification to Aybike
                    if (tenantWa?.wa_phone_number_id && tenantWa?.wa_access_token) {
                        const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                        const { data: aybike } = await supabase.from('profiles').select('phone').eq('id', AYBIKE_USER_ID).single()
                        if (aybike?.phone) {
                            await sendWhatsAppTemplate(
                                aybike.phone,
                                'crm_operasyonel_durum_bildirimi',
                                [customerPhone || '-', customerName, new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }), `📋 Doküman Talebi — ${projectName || 'Genel'}`],
                                'tr',
                                tenantWa.wa_phone_number_id,
                                tenantWa.wa_access_token
                            )
                        }
                    }
                    console.log(`[Vapi Webhook] 📋 Catalog request task assigned to Aybike for ${customerName}`)
                }
            } catch (catalogErr: any) {
                console.error('[Vapi Webhook] Error handling catalog request:', catalogErr.message)
            }
        }
    }
}

/**
 * Predicts the gender title (Bey/Hanım) for a Turkish full name
 */
export function getTurkishNameTitle(fullName: string | undefined | null): string {
    if (!fullName) return '';
    // Clean suffixes after apostrophe (e.g. Bekir'e -> Bekir)
    const nameWithoutSuffix = fullName.split("'")[0].trim();
    const cleanName = nameWithoutSuffix;
    if (cleanName.length === 0) return '';

    // Get the first word as the first name
    const firstName = cleanName.split(/\s+/)[0].toLowerCase()
        .replace(/i̇/g, 'i') // normalize dotted uppercase I to lowercase i
        .replace(/ı/g, 'i');

    const femaleNames = new Set([
        'ayse', 'ayşe', 'fatma', 'emine', 'hatice', 'zeynep', 'elif', 'meryem', 'serife', 'şerife', 'zehra',
        'sultan', 'hanife', 'merve', 'selma', 'esra', 'asiye', 'hayriye', 'cemile', 'kadriye', 'songul', 'songül',
        'gulay', 'gülay', 'melike', 'yasemin', 'sennur', 'şennur', 'nurten', 'nurcan', 'ayten', 'figen', 'ceyda',
        'aytul', 'aytül', 'tugba', 'tuğba', 'kubra', 'kübra', 'busra', 'büşra', 'gamze', 'gizem', 'derya', 'seda',
        'nihal', 'didem', 'sinem', 'banu', 'canan', 'hande', 'ozge', 'özge', 'ozlem', 'özlem', 'burcu', 'pinar', 'pınar', 'demet',
        'ece', 'ebru', 'asli', 'aslı', 'pelin', 'melis', 'irem', 'i̇rem', 'ceren', 'dilara', 'bengu', 'bengü',
        'begum', 'begüm', 'damla', 'sule', 'şule', 'hale', 'jale', 'lale', 'sibel', 'arzum', 'arzu', 'asuman',
        'berna', 'betul', 'betül', 'burcin', 'burçin', 'cansu', 'deniz', 'duygu', 'ebru', 'eda', 'elvan', 'esma',
        'eylul', 'eylül', 'filiz', 'gonca', 'gul', 'gül', 'guzin', 'güzin', 'handan', 'hilal', 'hulya', 'hülya',
        'ipek', 'i̇pek', 'ilknur', 'leyla', 'mine', 'mualla', 'naciye', 'nermin', 'nesrin', 'nilgun', 'nilgün',
        'nur', 'nuran', 'sabiha', 'sanem', 'secil', 'seçil', 'selin', 'sevgi', 'sevim', 'seval', 'sezen', 'simge',
        'songul', 'songül', 'sukran', 'şükran', 'tulin', 'tülin', 'umran', 'ümran', 'vildan', 'yonca', 'zuhal'
    ]);

    const maleNames = new Set([
        'mehmet', 'mustafa', 'ahmet', 'ali', 'huseyin', 'hüseyin', 'hasan', 'ibrahim', 'i̇brahim', 'halil',
        'osman', 'yusuf', 'omer', 'ömer', 'ramazan', 'salih', 'hakan', 'murat', 'murad', 'gokhan', 'gökhan',
        'fatih', 'suat', 'bekir', 'emre', 'arda', 'efe', 'burak', 'baris', 'barış', 'cem', 'erkan', 'serkan',
        'volkan', 'onur', 'alper', 'mert', 'tolga', 'kaan', 'kerem', 'can', 'engin', 'sinan', 'tarkan', 'bulent',
        'bülent', 'levent', 'yavuz', 'selim', 'tarik', 'tarık', 'zafer', 'orhan', 'kemal', 'kenan', 'ayhan',
        'erhan', 'metin', 'cetin', 'çetin', 'cengiz', 'abdullah', 'adem', 'adnan', 'ahmet', 'akif', 'akin', 'akın',
        'altan', 'anil', 'anıl', 'aslan', 'asim', 'asım', 'atilla', 'avni', 'aydın', 'aykut', 'bahadir', 'bahadır',
        'baha', 'baki', 'barbaros', 'batuhan', 'bedri', 'behçet', 'behcet', 'berat', 'berk', 'berkan', 'birol',
        'bora', 'bulut', 'bunyamin', 'bünyamin', 'bulent', 'bülent', 'cahit', 'caner', 'celal', 'cemal', 'cemil',
        'cenk', 'cihad', 'cihat', 'cihan', 'coskun', 'coşkun', 'cuneyt', 'cüneyt', 'davut', 'dursun', 'ekrem',
        'elvan', 'emin', 'ender', 'enes', 'enver', 'ercan', 'erdal', 'erdem', 'erdogan', 'erdoğan', 'eren', 'ergin',
        'ergun', 'ergün', 'erhan', 'erkan', 'erol', 'ersin', 'ertan', 'ertugrul', 'ertuğrul', 'esref', 'eşref',
        'eyup', 'eyüp', 'fahri', 'faruk', 'ferhat', 'feridun', 'ferit', 'fevzi', 'furkan', 'galip', 'gencer',
        'gokay', 'gökay', 'goksel', 'göksel', 'gurkan', 'gürkan', 'guven', 'güven', 'haluk', 'hamdi', 'hamit',
        'harun', 'haydar', 'hayri', 'hikmet', 'hilmi', 'huseyin', 'hüseyin', 'hüsrev', 'husrev', 'ihsan', 'i̇hsan',
        'ilker', 'ilhan', 'isa', 'i̇sa', 'ismail', 'i̇smail', 'ismet', 'i̇smet', 'izzet', 'kadir', 'kadri', 'kahraman',
        'kartal', 'kasim', 'kasım', 'kaya', 'kazim', 'kazım', 'koray', 'kamil', 'kursat', 'kürşat', 'latif',
        'lutfi', 'lütfi', 'mahmut', 'mazhar', 'melih', 'memduh', 'menderes', 'mengu', 'mengü', 'mercan', 'meriç',
        'meric', 'mert', 'mesut', 'mete', 'mithat', 'muammer', 'muammer', 'muhammed', 'muhammet', 'muharrem',
        'muhsin', 'muhtar', 'mukrimin', 'müjdat', 'mujdat', 'mumin', 'mümin', 'munir', 'münir', 'musa', 'muzaffer',
        'naci', 'nadir', 'nail', 'namik', 'namık', 'nasuh', 'nazif', 'nazmi', 'necati', 'necip', 'necmettin',
        'nedim', 'necat', 'nehir', 'nihat', 'niyazi', 'nuri', 'nurettin', 'oguz', 'oğuz', 'oguzhan', 'oğuzhan',
        'okay', 'oktay', 'olcay', 'omer', 'ömer', 'onder', 'önder', 'onur', 'orhan', 'osman', 'ozan', 'ozgur',
        'özgür', 'ozkan', 'özkan', 'recai', 'recep', 'refik', 'resat', 'reşat', 'resul', 'riza', 'rıza', 'ruhi',
        'rusen', 'ruşen', 'rustu', 'rüştü', 'sabri', 'sadik', 'sadık', 'sadri', 'sahan', 'şahan', 'sahin', 'şahin',
        'sait', 'samet', 'sami', 'savas', 'savaş', 'secgin', 'seçgin', 'sedat', 'sefa', 'selahattin', 'selami',
        'selcuk', 'selçuk', 'selim', 'semih', 'senol', 'şenol', 'serdar', 'serhat', 'serkan', 'servet', 'seyfi',
        'seyhan', 'seyit', 'sezer', 'sinan', 'soner', 'suat', 'suleyman', 'süleyman', 'taha', 'tahir', 'talat',
        'talha', 'taner', 'tarik', 'tarık', 'tayfun', 'taylan', 'tekin', 'temel', 'teoman', 'tufan', 'tugrul',
        'tuğrul', 'tunc', 'tunç', 'tuncay', 'turan', 'turgay', 'turgut', 'turhan', 'ufuk', 'ugur', 'uğur', 'ulas',
        'ulaş', 'umit', 'ümit', 'umut', 'unal', 'ünal', 'utku', 'uygar', 'uzay', 'vahap', 'vahit', 'veli', 'volkan',
        'yasin', 'yasar', 'yaşar', 'yakup', 'yavuz', 'yekta', 'yiğit', 'yigit', 'yunus', 'yusuf', 'zafer', 'zekeriya',
        'zeki', 'ziya'
    ]);

    // Split name words to find first word
    const words = cleanName.split(/\s+/);
    const originalFirstName = words[0];

    if (femaleNames.has(firstName)) {
        return `${originalFirstName} Hanım`;
    } else if (maleNames.has(firstName)) {
        return `${originalFirstName} Bey`;
    }

    // Heuristic suffix matching for female names ending with a/e/i/o/ö/u/ü/ı + certain clusters
    const femaleSuffixes = ['gul', 'gül', 'nur', 'naz', 'su', 'sen', 'şen', 'ten', 'bel'];
    for (const suffix of femaleSuffixes) {
        if (firstName.endsWith(suffix)) {
            return `${originalFirstName} Hanım`;
        }
    }

    return originalFirstName; // Fallback to just first name without title if unknown
}
