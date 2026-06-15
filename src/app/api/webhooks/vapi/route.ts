import { NextRequest, NextResponse, after } from 'next/server'
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
    // DEBUG: Log every incoming request to verify Vapi is reaching this endpoint
    const reqUrl = req.url
    const reqMethod = req.method
    const reqHeaders = Object.fromEntries([...req.headers.entries()].filter(([k]) => k.startsWith('x-vapi') || k === 'content-type' || k === 'user-agent'))
    console.log(`[Vapi Webhook] 🔔 INCOMING REQUEST: ${reqMethod} ${reqUrl} headers=${JSON.stringify(reqHeaders)}`)
    try {
        // Webhook secret doğrulama (header veya query parameter)
        let secret = req.headers.get('x-vapi-secret')
        if (!secret) {
            secret = req.nextUrl.searchParams.get('secret')
        }
        const expectedSecret = process.env.VAPI_WEBHOOK_SECRET
        if (expectedSecret && secret) {
            if (secret !== expectedSecret) {
                console.error('[Vapi Webhook] Invalid secret provided')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        } else if (expectedSecret && !secret) {
            // Secret expected but not provided — allow through but warn
            // This handles cases where Vapi doesn't forward headers properly
            console.warn('[Vapi Webhook] ⚠️ No secret provided by caller — allowing through for reliability')
        }

        const body = await req.json()
        console.log('[Vapi Webhook] Received:', JSON.stringify(body).substring(0, 500))

        const parsed = parseVapiWebhook(body)

        // Handle different event types
        switch (parsed.type) {
            case 'assistant-request': {
                // ─── FAST PATH: Outbound calls already have assistant config ───
                // When we start an outbound call via makeOutboundCall(), the assistant
                // configuration is sent inline in the API body. If Vapi still sends
                // assistant-request, we MUST respond within 3 seconds or Vapi drops
                // the call. Return empty {} immediately — no DB queries needed.
                const callType = body.message?.call?.type || body.call?.type || ''
                const hasExecutionId = parsed.metadata?.execution_id
                
                if (callType === 'outboundPhoneCall' || hasExecutionId) {
                    console.log(`[Vapi Webhook] ⚡ Outbound assistant-request — instant empty response (type=${callType}, execId=${hasExecutionId || 'none'})`)
                    return NextResponse.json({}, { status: 200 })
                }

                console.log('[Vapi Webhook] Assistant request triggered (inbound call)')
                
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

                // Clean/normalize phone number for search to match last 10 digits (Turkish mobile: 5XXXXXXXXX)
                let cleanPhone = customerPhone.replace(/\D/g, '')
                if (cleanPhone.length > 10) {
                    cleanPhone = cleanPhone.substring(cleanPhone.length - 10)
                }

                // Query customer globally across all tenants first to resolve tenant routing
                const { data: customers } = await adminSupabase
                    .from('customers')
                    .select('id, full_name, tenant_id')
                    .ilike('phone', `%${cleanPhone}%`)
                    .limit(1)

                const customer = customers?.[0] || null
                const isExistingCustomer = !!customer

                if (customer) {
                    console.log(`[Vapi Webhook] Matched existing customer globally: ${customer.full_name} (${customer.id}) under tenant ${customer.tenant_id}`)
                    tenant_id = customer.tenant_id // Override resolved tenant_id to customer's actual tenant
                } else {
                    console.log(`[Vapi Webhook] Unknown caller: ${customerPhone} — no customer record will be created, using resolved tenant_id: ${tenant_id}`)
                }

                // Create inbound_calls record immediately (before call starts)
                const vapiCallId = body.message?.call?.id || body.call?.id || null
                try {
                    await adminSupabase.from('inbound_calls').insert({
                        tenant_id: tenant_id,
                        customer_id: customer?.id || null,
                        caller_phone: customerPhone,
                        caller_name: customer?.full_name || null,
                        vapi_call_id: vapiCallId,
                        status: 'ringing',
                    })
                    console.log(`[Vapi Webhook] Inbound call record created: ${vapiCallId}`)
                } catch (e: any) {
                    console.warn(`[Vapi Webhook] Failed to create inbound_calls record: ${e.message}`)
                }

                // Fetch tenant instructions and knowledge base
                const { data: tenantData } = await adminSupabase
                    .from('tenants')
                    .select('ai_assistant_instructions, ai_knowledge_base, ai_assistant_name, ai_assistant_gender')
                    .eq('id', tenant_id)
                    .single()

                const assistantName = tenantData?.ai_assistant_name || 'Maya'
                const assistantGender = tenantData?.ai_assistant_gender || 'female'
                const voiceId = assistantGender === 'male' 
                    ? 'nPczCjzI2devNBz1zQrb' // Mert (Brian)
                    : 'uvU9jrgGLWNPeNA4NgNT' // Maya (İrem)

                // Build System Prompt — strict, knowledge-base-only behavior
                const defaultInboundPrompt = `Sen ${assistantName}, Novo Gayrimenkul'ün sesli asistanısın.

## GÖREV
Gelen aramaları karşıla, bilgi bankasındaki proje bilgilerini paylaş, randevu al.

## DAVRANIŞKURALLARI
1. SADECE bilgi bankasında yazan bilgileri paylaş. Bilgi bankasında olmayan hiçbir detayı (fiyat, metrekare, ödeme planı, teslim tarihi vb.) KENDİN UYDURMA.
2. Bilmediğin bir soru sorulursa şöyle söyle: "Bu konuda size en doğru bilgiyi satış danışmanımız verebilir, sizi aratmamı ister misiniz?"
3. Kısa ve öz konuş. Her cevabın 2-3 cümleyi geçmesin.
4. Müşterinin sözünü kesme, cevabını bekle.
5. Konu dışı sorulara (siyaset, hava durumu, şirket dışı konular) "Ben sadece projelerimiz hakkında bilgi verebiliyorum" de.
6. Randevu almaya çalış: "Size uygun bir zamanda satış uzmanımızla görüşme ayarlayabilir miyim?"
7. Fiyat sorulursa: Bilgi bankasında varsa söyle, yoksa "Güncel fiyat bilgisi için sizi aratmamı ister misiniz?" de.
8. Profesyonel, sıcak ve samimi ol ama laubali olma.
9. ⚠️ KRİTİK: Müşteri "satış danışmanı ile görüşmek istiyorum", "bir yetkili ile konuşayım", "biri beni arasın", "satış uzmanıyla görüşeyim", "gidip görüşmek istiyorum" gibi doğrudan bir kişiyle konuşma veya yüz yüze görüşme talebi iletirse, ASLA sadece vedalaşıp kapatma! HARFİ HARFİNE şu cümleyi söyle (kısaltma, değiştirme yapma): "Elbette, en kısa sürede bir satış danışmanımız sizi arayacaktır. İyi günler dilerim." Bu cümleyi BİREBİR söyledikten sonra "endCall" aracıyla görüşmeyi sonlandır.`

                let systemPrompt = tenantData?.ai_assistant_instructions || defaultInboundPrompt
                
                if (tenantData?.ai_knowledge_base) {
                    systemPrompt += `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${tenantData.ai_knowledge_base}\n\n⛔ KRİTİK KURAL: Yukarıdaki bilgi bankasında YAZMAYAN hiçbir bilgiyi paylaşma. Uydurma, tahmin etme, yaklaşık rakam verme. Bilmediğin her konuda "Bu detayı satış uzmanımız size iletecektir, sizi aratmamı ister misiniz?" de.\n`
                } else {
                    systemPrompt += `\n\n⚠️ BİLGİ BANKASI TANIMLANMAMIŞ. Tüm proje detayları için müşteriyi satış ekibine yönlendir: "Detaylı bilgi için sizi aratmamı ister misiniz?"\n`
                }

                // Fetch customer details and activities for dynamic context (Yapay Zeka Geçmiş Hafızası)
                let customerContext = ''
                if (customer) {
                    const { data: crmCustomer } = await adminSupabase
                        .from('customers')
                        .select('notes, budget_min, budget_max, desired_rooms, desired_districts')
                        .eq('id', customer.id)
                        .maybeSingle()

                    if (crmCustomer) {
                        customerContext += `\n\n--- MÜŞTERİ BİLGİSİ (KENDİ BİLGİN İÇİN KULLAN - MÜŞTERİYE KAYITLISINIZ VB. SÖYLEME) ---`
                        customerContext += `\nMüşteri Adı: ${customer.full_name}`
                        if (crmCustomer.notes) customerContext += `\nMüşteri CRM Notları: ${crmCustomer.notes}`
                        if (crmCustomer.budget_min || crmCustomer.budget_max) customerContext += `\nBütçe: ${crmCustomer.budget_min || '?'} - ${crmCustomer.budget_max || '?'} TL`
                        if (crmCustomer.desired_rooms) customerContext += `\nAranan Daire Tipi: ${crmCustomer.desired_rooms}`
                        if (crmCustomer.desired_districts) customerContext += `\nAranan Bölge/İlçe: ${crmCustomer.desired_districts}`
                    }

                    const { data: activities } = await adminSupabase
                        .from('activities')
                        .select('type, summary, description, created_at')
                        .eq('customer_id', customer.id)
                        .order('created_at', { ascending: false })
                        .limit(5)

                    if (activities && activities.length > 0) {
                        customerContext += `\n\n📋 MÜŞTERİ ETKİLEŞİM GEÇMİŞİ (Son ${activities.length} aktivite):`
                        for (const act of activities) {
                            customerContext += `\n- [${act.type}] ${act.summary}`
                            if (act.description && act.description !== act.summary) {
                                customerContext += ` | ${act.description.substring(0, 150)}`
                            }
                        }
                        customerContext += `\n\n⚠️ DAVRANIŞ KURALI: Yukarıdaki geçmişi kullanarak müşterinin daha önce ilgilendiği projelere veya önceki konuşmalarına referans ver. Örneğin "Daha önce bizimle görüşüp ... projesi hakkında bilgi almıştınız" veya "Önceki konuşmamızda belirttiğiniz gibi" diyerek doğal ve samimi bir konuşma yürüt. Müşterinin aklındaki soruları daha hızlı cevaplamaya çalış. Ancak müşteriye "sistemimizde kayıtlısınız", "numaranız bizde var" gibi CRM/teknik sistem kelimeleri ASLA söyleme. Doğal bir satış temsilcisi gibi konuş.`
                    }
                }

                if (customerContext) {
                    systemPrompt += customerContext
                }

                // Dynamic First Greeting Message
                let firstMessage = `Merhaba, Novo Gayrimenkul'e hoş geldiniz. Ben ${assistantName}, Novo'nun AI asistanıyım. Size nasıl yardımcı olabilirim?`
                if (isExistingCustomer && customer.full_name && customer.full_name !== 'Yeni Gelen Arama Adayı') {
                    const nameWithTitle = getTurkishNameTitle(customer.full_name)
                    firstMessage = `Merhaba ${nameWithTitle}, Novo Gayrimenkul'e hoş geldiniz. Ben ${assistantName}, Novo'nun AI asistanıyım. Size nasıl yardımcı olabilirim?`
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
                            keywords: [
                                'Novapark:3', 'Vista:3', 'Viva:3', 'NovoCity:3', 'Novo:2',
                                'Nova:2', 'Montenegro:2',
                                'Turkcell:2', 'Vodafone:2', 'Telekom:2',
                                'metrekare:2', 'dubleks:2', 'daire:2',
                                'Kocaeli:2', 'Körfez:2', 'Torbalı:2', 'İzmir:2',
                                'telesekreter:3', 'ulaşılamıyor:3',
                            ],
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
                            structuredDataPrompt: 'Görüşme transkriptini analiz et ve aşağıdaki JSON yapısını doldur. Eğer müşteri ilgili ama şu an müsait değilse veya daha sonra aranmak istiyorsa lead_score "follow_up" olmalıdır. callback_datetime alanına müşterinin belirttiği zaman bilgisini aynen yaz (örn: "yarın saat 5", "akşam 6 buçuk").',
                            structuredDataSchema: {
                                type: 'object',
                                properties: {
                                    lead_score: { type: 'string', enum: ['hot', 'warm', 'follow_up', 'disqualified'], description: 'Müşterinin sıcaklık skoru. Müsait değilse veya daha sonra aranmak istiyorsa "follow_up" kullan.' },
                                    interested: { type: 'boolean', description: 'Müşteri projeye/ürüne ilgi gösteriyor mu?' },
                                    available: { type: 'boolean', description: 'Müşteri şu an konuşmaya müsait miydi? (false = müsait değildi, meşguldü, daha sonra aranmak istedi vb.)' },
                                    callback_requested: { type: 'boolean', description: 'Müşteri daha sonra tekrar aranmak istedi mi?' },
                                    callback_datetime: { type: 'string', description: 'Müşteri tekrar aranmak istiyorsa, belirttiği tarih/saat ifadesi. Örnekler: "yarın saat 5", "yarın öğlen", "akşam 6 buçuk". Müşterinin söylediği ifadeyi aynen yaz.' },
                                    wants_catalog: { type: 'boolean', description: 'Müşteri katalog, broşür, fiyat listesi veya doküman istedi mi?' },
                                    project_interested: { type: 'string', description: 'Müşterinin ilgilendiği proje adı (Novapark Vista, NovoCity İzmir, Novapark Viva Körfez, Novapark Montenegro vb.)' },
                                    notes: { type: 'string', description: 'Görüşme hakkında kısa not (Türkçe)' },
                                    customer_name: { type: 'string', description: 'Konuşma sırasında müşterinin belirttiği ad soyad (eğer ilk başta bilinmiyorsa)' }
                                },
                                required: ['lead_score', 'interested', 'available', 'notes'],
                            },
                            summaryPrompt: 'Bu telefon görüşmesini Türkçe olarak 2-3 cümleyle özetle.',
                            successEvaluationPrompt: 'Müşteri randevu aldı veya detaylı bilgi talep etti ise başarılı say.',
                            successEvaluationRubric: 'PassFail',
                        },
                    },
                    metadata: {
                        tenant_id: tenant_id,
                        customer_id: customer?.id || null,
                        caller_phone: customerPhone,
                        type: 'manual_call',
                        call_direction: 'inbound'
                    }
                }

                console.log(`[Vapi Webhook] Dinamik asistan yapılandırması oluşturuldu — müşteri: ${customer?.id || 'bilinmiyor'}, telefon: ${customerPhone}`)
                return NextResponse.json(assistantResponse, { status: 200 })
            }

            case 'end-of-call-report':
            case 'call.ended': {
                console.log(`[Vapi Webhook] Call ended: ${parsed.callId}, reason: ${parsed.endedReason}, duration: ${parsed.duration}s, hasTranscript: ${!!parsed.transcript}, hasRecording: ${!!parsed.recordingUrl}, hasSummary: ${!!parsed.summary}, hasAnalysis: ${!!parsed.analysis}, callDirection: ${parsed.metadata?.call_direction || 'unknown'}, type: ${parsed.metadata?.type || 'unknown'}, hasArtifact: ${!!body.message?.artifact}`)
                
                // ─── NON-BLOCKING: Return 200 immediately, process in background ───
                // Vapi expects a response within 3-5 seconds. DB operations (timeline,
                // lead scoring, WhatsApp notifications) can take 5-15 seconds.
                // Using Next.js after() API to defer heavy work after response.
                const callEndData = {
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
                }

                after(async () => {
                    try {
                        // Idempotency: aynı callId için tekrar işlem yapma
                        if (callEndData.callId) {
                            const adminSupabase = createAdminClient()
                            const { count } = await adminSupabase
                                .from('activities')
                                .select('*', { count: 'exact', head: true })
                                .eq('type', 'Transcript')
                                .ilike('description', `%[Call ID: ${callEndData.callId}]%`)
                                .ilike('description', `%📝 Transkript:%`)
                            if (count && count > 0) {
                                console.log(`[Vapi Webhook] Duplicate webhook for callId ${callEndData.callId} — skipping in after()`)
                                return
                            }
                        }

                        const isCampaign = !!(callEndData.metadata?.execution_id || callEndData.metadata?.campaign_id)
                        if (isCampaign) {
                            await handleVapiCallResult(callEndData)
                        } else {
                            await handleManualVapiCallResult(callEndData)
                        }
                        console.log(`[Vapi Webhook] ✅ Background processing completed for ${callEndData.callId}`)
                    } catch (afterErr: any) {
                        console.error(`[Vapi Webhook] ❌ Background processing error for ${callEndData.callId}:`, afterErr.message)
                    }
                })

                // Return 200 immediately — Vapi won't retry
                return NextResponse.json({ status: 'ok', callId: parsed.callId }, { status: 200 })
            }

            case 'status-update':
            case 'call.status': {
                console.log(`[Vapi Webhook] Status update: ${parsed.callId} → ${parsed.status}`)
                
                // Update inbound_calls table to reflect the current call state
                if (parsed.callId && parsed.status) {
                    const statusMap: Record<string, string> = {
                        'ringing': 'ringing',
                        'in-progress': 'in-progress',
                        'forwarding': 'in-progress',
                        'ended': 'ended',
                    }
                    const newStatus = statusMap[parsed.status] || parsed.status
                    
                    try {
                        const adminSupabase = createAdminClient()
                        const updateData: Record<string, any> = { status: newStatus }
                        
                        // If the status is 'ended', set ended_at and compute duration
                        if (newStatus === 'ended') {
                            updateData.ended_at = new Date().toISOString()
                            // Try to compute duration from started_at
                            const { data: callRecord } = await adminSupabase
                                .from('inbound_calls')
                                .select('started_at, status')
                                .eq('vapi_call_id', parsed.callId)
                                .maybeSingle()
                            
                            if (callRecord?.started_at) {
                                const durationSec = Math.round((Date.now() - new Date(callRecord.started_at).getTime()) / 1000)
                                if (durationSec > 0) updateData.duration = durationSec
                            }
                            // If was in-progress, call was answered; otherwise no_answer
                            updateData.outcome = callRecord?.status === 'in-progress' ? 'answered' : 'no_answer'
                        }
                        
                        // Allow transition from ringing→in-progress→ended (not just ringing)
                        const { error: statusErr } = await adminSupabase
                            .from('inbound_calls')
                            .update(updateData)
                            .eq('vapi_call_id', parsed.callId)
                            .in('status', ['ringing', 'in-progress']) // Allow both transitions
                        
                        if (statusErr) {
                            console.warn(`[Vapi Webhook] Failed to update inbound_calls status: ${statusErr.message}`)
                        } else {
                            console.log(`[Vapi Webhook] Updated inbound_calls status: ${parsed.callId} → ${newStatus}`)
                        }
                    } catch (e: any) {
                        console.warn(`[Vapi Webhook] Failed to update inbound_calls status: ${e.message}`)
                    }
                }
                break
            }

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
                                
                                let ownerId = null;
                                if (metadata.customer_id) {
                                    const { data: customerData } = await adminSupabase
                                        .from('customers')
                                        .select('assigned_to')
                                        .eq('id', metadata.customer_id)
                                        .single();
                                    if (customerData?.assigned_to) {
                                        ownerId = customerData.assigned_to;
                                    }
                                }
                                
                                await adminSupabase.from('activities').insert({
                                    tenant_id: metadata.tenant_id,
                                    customer_id: metadata.customer_id,
                                    owner_id: ownerId,
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
