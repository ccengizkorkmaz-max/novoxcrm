import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Resend webhook event types
interface ResendWebhookEvent {
    type: string
    data: {
        email_id: string
        from: string
        to: string[]
        subject: string
        created_at: string
        click?: { link: string }
    }
}

export async function POST(req: NextRequest) {
    try {
        const event: ResendWebhookEvent = await req.json()
        const supabase = createAdminClient()
        const resendId = event.data?.email_id

        if (!resendId) {
            return NextResponse.json({ received: true })
        }

        console.log(`[Resend Webhook] ${event.type} — ${resendId}`)

        switch (event.type) {
            case 'email.delivered': {
                await supabase
                    .from('email_sends')
                    .update({ status: 'delivered' })
                    .eq('resend_id', resendId)
                    .eq('status', 'sent')
                break
            }
            case 'email.opened': {
                const { data: send } = await supabase
                    .from('email_sends')
                    .select('id, campaign_id, opened_at')
                    .eq('resend_id', resendId)
                    .single()
                
                if (send && !send.opened_at) {
                    await supabase
                        .from('email_sends')
                        .update({ status: 'opened', opened_at: new Date().toISOString() })
                        .eq('id', send.id)
                    
                    // Kampanya istatistiğini artır
                    await supabase.rpc('increment_campaign_stat', {
                        p_campaign_id: send.campaign_id,
                        p_field: 'total_opened',
                    })
                }
                break
            }
            case 'email.clicked': {
                const { data: send } = await supabase
                    .from('email_sends')
                    .select('id, campaign_id, clicked_at')
                    .eq('resend_id', resendId)
                    .single()
                
                if (send && !send.clicked_at) {
                    await supabase
                        .from('email_sends')
                        .update({ status: 'clicked', clicked_at: new Date().toISOString() })
                        .eq('id', send.id)
                    
                    await supabase.rpc('increment_campaign_stat', {
                        p_campaign_id: send.campaign_id,
                        p_field: 'total_clicked',
                    })
                }
                break
            }
            case 'email.bounced': {
                const { data: send } = await supabase
                    .from('email_sends')
                    .select('id, campaign_id')
                    .eq('resend_id', resendId)
                    .single()
                
                if (send) {
                    await supabase
                        .from('email_sends')
                        .update({ status: 'bounced' })
                        .eq('id', send.id)
                    
                    await supabase.rpc('increment_campaign_stat', {
                        p_campaign_id: send.campaign_id,
                        p_field: 'total_bounced',
                    })
                }
                break
            }
            case 'email.complained': {
                const { data: send } = await supabase
                    .from('email_sends')
                    .select('id, campaign_id, customer_id, email, tenant_id')
                    .eq('resend_id', resendId)
                    .single()
                
                if (send) {
                    await supabase
                        .from('email_sends')
                        .update({ status: 'complained' })
                        .eq('id', send.id)
                    
                    await supabase.rpc('increment_campaign_stat', {
                        p_campaign_id: send.campaign_id,
                        p_field: 'total_complained',
                    })
                    
                    // Otomatik opt-out
                    if (send.customer_id) {
                        await supabase
                            .from('customers')
                            .update({ communication_enabled: false })
                            .eq('id', send.customer_id)
                        
                        await supabase.from('outreach_optout_logs').insert({
                            tenant_id: send.tenant_id,
                            customer_id: send.customer_id,
                            phone: null,
                            channel: 'email',
                            action: 'opted_out',
                            reason: 'Email şikayeti (spam raporu)',
                            performed_by_name: 'Sistem',
                            source: 'system',
                        })
                    }
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('[Resend Webhook] Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
