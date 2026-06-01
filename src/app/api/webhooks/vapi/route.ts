import { NextRequest, NextResponse } from 'next/server'
import { parseVapiWebhook, handleManualVapiCallResult, getTurkishNameTitle, TURKISH_VOICE_RULES } from '@/lib/vapi'

export const dynamic = 'force-dynamic'
import { handleVapiCallResult } from '@/lib/outreach/engine'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * VAPI.AI WEBHOOK ENDPOINT
 * 
 * Receives call status updates from Vapi when AI calls end.
 * Configure this URL in your Vapi dashboard: 
 *   https://your-domain.com/api/webhooks/vapi
 */
export async function POST(req: NextRequest) {
    try {
        // Webhook secret doğrulama
        const secret = req.headers.get('x-vapi-secret')
        const expectedSecret = process.env.VAPI_WEBHOOK_SECRET
        if (expectedSecret) {
            if (secret !== expectedSecret) {
                console.error('[Vapi Webhook] Invalid secret')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        } else {
            console.warn('[Vapi Webhook] ⚠️ VAPI_WEBHOOK_SECRET tanımlı değil — webhook doğrulaması yapılamıyor!')
        }

        const body = await req.json()
        console.log('[Vapi Webhook] Received:', JSON.stringify(body).substring(0, 500))

        const parsed = parseVapiWebhook(body)

        // Handle different event types
        switch (parsed.type) {
            case 'assistant-request': {
                console.log('[Vapi Webhook] Assistant request triggered')
                
                // Get customer phone number
                const customerPhone = body.message?.call?.customer?.number || body.message?.customer?.number || body.message?.call?.customer?.phone
                if (!customerPhone) {
                    console.error('[Vapi Webhook] No customer phone number in assistant-request')
                    return NextResponse.json({ error: 'Customer phone number is required' }, { status: 400 })
                }

                // Resolve tenant_id from host header
                let tenant_id = '89b2829e-fc21-477e-8fd8-9f9f0c587e81' // Default: Novo Şirketler Grubu
                const host = req.headers.get('host') || ''
                const adminSupabase = createAdminClient()
                
                if (host.includes('oikoscrm')) {
                    tenant_id = '3de3c038-8ce7-44b1-b5ba-8b99d63301f4' // Oikos İnşaat A.Ş.
                } else if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('novoxcrm.com') && !host.includes('vercel.app')) {
                    // Check custom domain
                    const cleanHost = host.split(':')[0].replace(/^www\./, '')
                    const { data: matchedTenant } = await adminSupabase
                        .from('tenants')
                        .select('id')
                        .eq('custom_domain', cleanHost)
                        .maybeSingle()
                    if (matchedTenant) {
                        tenant_id = matchedTenant.id
                    }
                }

                // Clean/normalize phone number for search (e.g. remove country code and plus sign)
                let cleanPhone = customerPhone.replace('+', '')
                if (cleanPhone.startsWith('90')) {
                    cleanPhone = cleanPhone.substring(2)
                }

                // Query customer in database
                const { data: customers } = await adminSupabase
                    .from('customers')
                    .select('id, full_name')
                    .eq('tenant_id', tenant_id)
                    .ilike('phone', `%${cleanPhone}%`)
                    .limit(1)

                let customer = customers?.[0]
                let isNewCustomer = false

                if (!customer) {
                    // Create new customer dynamically
                    const { data: newCustomer, error: createError } = await adminSupabase
                        .from('customers')
                        .insert({
                            tenant_id: tenant_id,
                            full_name: 'Yeni Gelen Arama Adayı',
                            phone: customerPhone,
                            source: 'Gelen Arama'
                        })
                        .select('id, full_name')
                        .single()

                    if (createError || !newCustomer) {
                        console.error('[Vapi Webhook] Failed to create customer dynamically for inbound call:', createError)
                        return NextResponse.json({ error: 'Failed to register inbound call customer' }, { status: 500 })
                    }
                    customer = newCustomer
                    isNewCustomer = true
                    console.log(`[Vapi Webhook] Registered new customer for inbound call: ${customer.id}`)
                } else {
                    console.log(`[Vapi Webhook] Matched existing customer: ${customer.full_name} (${customer.id})`)
                }

                // Fetch tenant instructions and knowledge base
                const { data: tenantData } = await adminSupabase
                    .from('tenants')
                    .select('ai_assistant_instructions, ai_knowledge_base, ai_assistant_name, ai_assistant_gender')
                    .eq('id', tenant_id)
                    .single()

                const assistantName = tenantData?.ai_assistant_name || 'Çiçek'
                const assistantGender = tenantData?.ai_assistant_gender || 'female'
                const voiceId = assistantGender === 'male' 
                    ? 'nPczCjzI2devNBz1zQrb' // Mert (Brian)
                    : 'uvU9jrgGLWNPeNA4NgNT' // Çiçek (İrem)

                // Build System Prompt
                let systemPrompt = tenantData?.ai_assistant_instructions || `Sen Novo Gayrimenkul için çalışan profesyonel sesli yapay zeka asistanısın. Adın ${assistantName}. Amacın, gelen aramaları nazik, profesyonel ve etkileşimli bir şekilde karşılamak, sorularını bilgi bankasına göre yanıtlamak ve randevu almak. Müşterinin sözünü kesmesine izin ver, her cümleden sonra cevabını bekle.`
                
                if (tenantData?.ai_knowledge_base) {
                    systemPrompt += `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${tenantData.ai_knowledge_base}\n\nÖNEMLİ KURAL: Projeler hakkında SADECE yukarıdaki BİLGİ BANKASI'nda yazan bilgileri kullan. Bilmediğin veya bilgi bankasında yazmayan bir detay (fiyat, metrekare, teslim tarihi vb.) sorulursa ASLA uydurma, 'Bu detay şu an sistemimde mevcut değil, dilerseniz ilgili satış uzmanımızın size net bilgi vermesini sağlayabilirim' şeklinde yanıt ver.\n`
                }

                // Dynamic First Greeting Message
                let firstMessage = `Merhaba, Novo Gayrimenkul'e hoş geldiniz. Ben ${assistantName}, size nasıl yardımcı olabilirim?`
                if (!isNewCustomer && customer.full_name && customer.full_name !== 'Yeni Gelen Arama Adayı') {
                    const nameWithTitle = getTurkishNameTitle(customer.full_name)
                    firstMessage = `Merhaba ${nameWithTitle}, Novo Gayrimenkul'e hoş geldiniz. Ben ${assistantName}, size nasıl yardımcı olabilirim?`
                }

                // Define Webhook server URL for function calling/status tracking
                const siteUrl = host.includes('localhost') || host.includes('127.0.0.1')
                    ? 'https://www.novoxcrm.com'
                    : `https://${host}`
                const serverUrl = `${siteUrl}/api/webhooks/vapi`

                // Respond to Vapi with assistant configuration
                const assistantResponse = {
                    assistant: {
                        name: assistantName,
                        firstMessage: firstMessage,
                        firstMessageMode: 'assistant-speaks-first',
                        serverUrl: serverUrl,
                        serverMessages: ['end-of-call-report', 'status-update', 'function-call'],
                        maxDurationSeconds: 300,
                        silenceTimeoutSeconds: 45,
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
                        transcriber: {
                            provider: 'deepgram',
                            model: 'nova-3',
                            language: 'tr',
                        },
                        voice: {
                            provider: '11labs',
                            voiceId: voiceId,
                            model: 'eleven_multilingual_v2',
                            stability: 0.40,
                            similarityBoost: 0.85,
                            style: 0.35,
                        },
                        model: {
                            provider: 'openai',
                            model: 'gpt-4o',
                            messages: [{ role: 'system', content: TURKISH_VOICE_RULES + '\n\n' + systemPrompt }],
                            tools: [
                                {
                                    type: 'endCall',
                                    messages: [
                                        {
                                            type: 'request-start',
                                            content: 'Görüşmek üzere, iyi günler dilerim.'
                                        }
                                    ]
                                },
                                {
                                    type: 'function',
                                    function: {
                                        name: 'scheduleAppointment',
                                        description: 'Schedules a physical or phone appointment/meeting with a sales representative.',
                                        parameters: {
                                            type: 'object',
                                            properties: {
                                                date: { type: 'string', description: 'Tarih ve zaman bilgisi (örn: yarın saat 14:00)' },
                                                time: { type: 'string', description: 'Saat bilgisi' },
                                                notes: { type: 'string', description: 'Randevu konusu ve müşteri notları' }
                                            },
                                            required: ['date']
                                        }
                                    }
                                }
                            ]
                        },
                        analysisPlan: {
                            structuredDataPrompt: 'Görüşme transkriptini analiz et ve aşağıdaki JSON yapısını doldur.',
                            structuredDataSchema: {
                                type: 'object',
                                properties: {
                                    lead_score: { type: 'string', enum: ['hot', 'warm', 'follow_up', 'disqualified'], description: 'Müşterinin sıcaklık skoru' },
                                    interested: { type: 'boolean', description: 'Müşteri ilgileniyor mu?' },
                                    notes: { type: 'string', description: 'Görüşme hakkında kısa not (Türkçe)' },
                                    customer_name: { type: 'string', description: 'Konuşma sırasında müşterinin belirttiği ad soyad (eğer ilk başta bilinmiyorsa)' }
                                },
                                required: ['lead_score', 'interested', 'notes'],
                            },
                            summaryPrompt: 'Bu telefon görüşmesini Türkçe olarak 2-3 cümleyle özetle.',
                            successEvaluationPrompt: 'Müşteri randevu aldı veya detaylı bilgi talep etti ise başarılı say.',
                            successEvaluationRubric: 'PassFail',
                        },
                        metadata: {
                            tenant_id: tenant_id,
                            customer_id: customer.id,
                            type: 'manual_call'
                        }
                    }
                }

                console.log(`[Vapi Webhook] Dinamik asistan yapılandırması başarıyla oluşturuldu: ${customer.id}`)
                return NextResponse.json(assistantResponse, { status: 200 })
            }

            case 'end-of-call-report':
            case 'call.ended':
                console.log(`[Vapi Webhook] Call ended: ${parsed.callId}, reason: ${parsed.endedReason}`)
                
                // Idempotency: aynı callId için tekrar işlem yapma.
                // Not: Placeholder aktivitede Call ID zaten var. Bu yüzden Transkript'in eklenip eklenmediğine bakıyoruz.
                if (parsed.callId) {
                    const adminSupabase = createAdminClient()
                    const { count } = await adminSupabase
                        .from('activities')
                        .select('*', { count: 'exact', head: true })
                        .eq('type', 'Call')
                        .ilike('description', `%[Call ID: ${parsed.callId}]%`)
                        .ilike('description', `%📝 Transkript:%`)
                    if (count && count > 0) {
                        console.log(`[Vapi Webhook] Duplicate webhook for callId ${parsed.callId} — atlanıyor`)
                        return NextResponse.json({ status: 'duplicate_skipped' }, { status: 200 })
                    }
                }

                if (parsed.metadata?.type === 'manual_call') {
                    await handleManualVapiCallResult({
                        callId: parsed.callId,
                        status: parsed.status || 'ended',
                        endedReason: parsed.endedReason,
                        transcript: parsed.transcript,
                        summary: parsed.summary,
                        recordingUrl: parsed.recordingUrl,
                        duration: parsed.duration,
                        cost: parsed.cost,
                        analysis: parsed.analysis,
                        metadata: parsed.metadata,
                    })
                } else {
                    await handleVapiCallResult({
                        callId: parsed.callId,
                        status: parsed.status || 'ended',
                        endedReason: parsed.endedReason,
                        transcript: parsed.transcript,
                        summary: parsed.summary,
                        recordingUrl: parsed.recordingUrl,
                        duration: parsed.duration,
                        cost: parsed.cost,
                        analysis: parsed.analysis,
                        metadata: parsed.metadata,
                    })
                }
                break

            case 'status-update':
            case 'call.status':
                // Call in progress — just log
                console.log(`[Vapi Webhook] Status update: ${parsed.callId} → ${parsed.status}`)
                break

            case 'function-call':
                // AI agent wants to execute a function
                console.log(`[Vapi Webhook] Function call payload:`, JSON.stringify(body.message?.toolCalls || body.toolCalls || {}).substring(0, 300))
                
                const toolCalls = body.message?.toolCalls || body.toolCalls || []
                
                // Fallback for older Vapi webhook formats that might send single functionCall
                const singleFunctionCall = body.message?.functionCall || body.functionCall
                if (toolCalls.length === 0 && singleFunctionCall) {
                    toolCalls.push({
                        id: body.message?.toolCallId || 'unknown_id',
                        function: singleFunctionCall
                    })
                }

                if (toolCalls.length > 0) {
                    const results = []
                    
                    for (const tc of toolCalls) {
                        const functionName = tc.function?.name || ''
                        let functionParams: any = {}
                        try {
                            functionParams = typeof tc.function?.arguments === 'string' 
                                ? JSON.parse(tc.function.arguments) 
                                : (tc.function?.arguments || tc.function?.parameters || {})
                        } catch(e) {}
                        
                        let resultMessage = "İşlem başarıyla tamamlandı."

                        if (functionName === 'endCall') {
                            console.log(`[Vapi Webhook] endCall triggered for ${parsed.callId}`)
                            resultMessage = "Görüşme sonlandırılıyor."
                        } else if (functionName === 'scheduleAppointment' || functionName === 'bookAppointment') {
                            try {
                                const adminSupabase = createAdminClient()
                                const metadata = parsed.metadata || {}
                                
                                await adminSupabase.from('activities').insert({
                                    tenant_id: metadata.tenant_id,
                                    customer_id: metadata.customer_id,
                                    type: 'Meeting',
                                    topic: 'Sales',
                                    summary: `📅 AI aramasında randevu talebi — ${functionParams.date || 'Tarih belirtilmedi'}`,
                                    description: `AI arama sırasında müşteri randevu istedi. Tercih: ${functionParams.date || '-'} ${functionParams.time || '-'}. Not: ${functionParams.notes || '-'}. Vapi Call ID: ${parsed.callId}`,
                                    status: 'Pending',
                                    project_id: metadata.project_id,
                                })
                                console.log(`[Vapi Webhook] Randevu kaydı oluşturuldu: ${metadata.customer_id}`)
                                resultMessage = "Randevu başarıyla kaydedildi. Müşteriye randevusunun alındığını söyle ve görüşmeyi sonlandır."
                            } catch (fnErr: any) {
                                console.error(`[Vapi Webhook] Randevu kayıt hatası:`, fnErr.message)
                                resultMessage = "Randevu kaydedilirken bir hata oluştu."
                            }
                        } else {
                            console.log(`[Vapi Webhook] Unknown function: ${functionName}`)
                        }
                        
                        results.push({
                            toolCallId: tc.id,
                            result: resultMessage
                        })
                    }
                    
                    return NextResponse.json({ results }, { status: 200 })
                }
                
                return NextResponse.json({ results: [] }, { status: 200 })

            case 'hang':
                // Hang notification
                console.log(`[Vapi Webhook] Hang notification for ${parsed.callId}`)
                break

            default:
                console.log(`[Vapi Webhook] Unknown event type: ${parsed.type}`)
        }

        return NextResponse.json({ status: 'ok' }, { status: 200 })
    } catch (error: any) {
        console.error('[Vapi Webhook] Error:', error.message)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// Vapi may send GET for health checks
export async function GET() {
    return NextResponse.json({ status: 'active', service: 'vapi-webhook' })
}
