import { NextRequest, NextResponse } from 'next/server'
import { parseVapiWebhook, handleManualVapiCallResult } from '@/lib/vapi'

export const dynamic = 'force-dynamic'
import { handleVapiCallResult } from '@/lib/outreach/engine'

/**
 * VAPI.AI WEBHOOK ENDPOINT
 * 
 * Receives call status updates from Vapi when AI calls end.
 * Configure this URL in your Vapi dashboard: 
 *   https://your-domain.com/api/webhooks/vapi
 */
export async function POST(req: NextRequest) {
    try {
        // Optional: Verify webhook secret
        const secret = req.headers.get('x-vapi-secret')
        const expectedSecret = process.env.VAPI_WEBHOOK_SECRET
        if (expectedSecret && secret !== expectedSecret) {
            console.error('[Vapi Webhook] Invalid secret')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('[Vapi Webhook] Received:', JSON.stringify(body).substring(0, 500))

        const parsed = parseVapiWebhook(body)

        // Handle different event types
        switch (parsed.type) {
            case 'end-of-call-report':
            case 'call.ended':
                console.log(`[Vapi Webhook] Call ended: ${parsed.callId}, reason: ${parsed.endedReason}`)
                
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
                // AI agent wants to execute a function (e.g., schedule appointment)
                console.log(`[Vapi Webhook] Function call from AI agent`)
                // TODO: Handle function calls (appointment booking, CRM updates)
                break

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
