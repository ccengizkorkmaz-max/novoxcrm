import { NextRequest, NextResponse } from 'next/server'
import { parseVapiWebhook, handleManualVapiCallResult } from '@/lib/vapi'

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
            case 'end-of-call-report':
            case 'call.ended':
                console.log(`[Vapi Webhook] Call ended: ${parsed.callId}, reason: ${parsed.endedReason}`)
                
                // Idempotency: aynı callId için tekrar işlem yapma
                if (parsed.callId) {
                    const adminSupabase = createAdminClient()
                    const { count } = await adminSupabase
                        .from('activities')
                        .select('*', { count: 'exact', head: true })
                        .eq('type', 'Call')
                        .ilike('description', `%[Call ID: ${parsed.callId}]%`)
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
