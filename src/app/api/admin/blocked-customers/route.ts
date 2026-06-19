import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json([], { status: 200 })
        }

        const adminSupabase = createAdminClient()
        
        // Get tenant_id from profile
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json([], { status: 200 })
        }

        const { data: customers } = await adminSupabase
            .from('customers')
            .select('id, full_name, phone, communication_enabled')
            .eq('tenant_id', profile.tenant_id)
            .eq('communication_enabled', false)
            .order('full_name')

        if (!customers || customers.length === 0) {
            return NextResponse.json([])
        }

        // Get the latest optout log for each blocked customer to find reason, who blocked, and channel
        const customerIds = customers.map(c => c.id)
        const { data: logs } = await adminSupabase
            .from('outreach_optout_logs')
            .select('customer_id, reason, performed_by_name, source, channel, created_at')
            .in('customer_id', customerIds)
            .eq('action', 'opted_out')
            .order('created_at', { ascending: false })

        // Also check optouts table for phone-based records
        const phones = customers.map(c => c.phone).filter(Boolean)
        const { data: optoutRecords } = await adminSupabase
            .from('outreach_optouts')
            .select('phone, reason, channel, opted_out_at')
            .in('phone', phones)

        // Build lookup: customer_id → latest log
        const logMap = new Map<string, any>()
        logs?.forEach(l => {
            if (l.customer_id && !logMap.has(l.customer_id)) {
                logMap.set(l.customer_id, l)
            }
        })

        // Build phone → optout record lookup
        const optoutMap = new Map<string, any>()
        optoutRecords?.forEach(o => {
            if (o.phone && !optoutMap.has(o.phone)) {
                optoutMap.set(o.phone, o)
            }
        })

        // Enrich customers with closing info
        const enriched = customers.map(c => {
            const log = logMap.get(c.id)
            const optout = c.phone ? optoutMap.get(c.phone) : null

            return {
                ...c,
                close_reason: log?.reason || optout?.reason || null,
                closed_by: log?.performed_by_name || null,
                close_channel: log?.source || log?.channel || optout?.channel || null,
                closed_at: log?.created_at || optout?.opted_out_at || null,
            }
        })

        return NextResponse.json(enriched)
    } catch (e: any) {
        console.error('[blocked-customers]', e.message)
        return NextResponse.json([], { status: 200 })
    }
}
