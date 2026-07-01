import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import InboundCallsClient from './InboundCallsClient'

export const metadata = {
    title: 'Gelen Aramalar | NovoCRM',
    description: 'AI asistan tarafından karşılanan gelen aramaların listesi',
}

const PAGE_SIZE = 25

export default async function CallsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const page = parseInt(params.page || '1')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="p-8 text-center text-slate-500">Oturum bulunamadı</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div className="p-8 text-center text-slate-500">Tenant bulunamadı</div>

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Query from dedicated inbound_calls table (admin client bypasses RLS)
    const { data: calls, count: totalCount } = await adminSupabase
        .from('inbound_calls')
        .select(`
            id,
            tenant_id,
            customer_id,
            caller_phone,
            caller_name,
            vapi_call_id,
            started_at,
            ended_at,
            duration,
            status,
            outcome,
            ended_reason,
            lead_score,
            interested,
            transcript,
            summary,
            recording_url,
            cost,
            analysis
        `, { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)
        .order('started_at', { ascending: false })
        .range(from, to)

    // Map to client-friendly format
    const mappedCalls = (calls || []).map((call: any) => {
        // Determine outcome based on stored outcome and status
        let mappedOutcome: string
        if (call.outcome === 'answered') {
            mappedOutcome = 'Success'
        } else if (call.outcome === 'busy') {
            mappedOutcome = 'Busy'
        } else if (call.outcome === 'no_answer') {
            mappedOutcome = 'No Answer'
        } else if (call.status === 'ringing' || call.status === 'in-progress') {
            // Check if the call is stale (started more than 30 minutes ago)
            const startedAt = call.started_at ? new Date(call.started_at).getTime() : 0
            const thirtyMinAgo = Date.now() - 30 * 60 * 1000
            if (startedAt && startedAt < thirtyMinAgo) {
                // Stale call — webhook for end-of-call probably never arrived
                mappedOutcome = 'No Answer'
            } else {
                mappedOutcome = 'Devam Ediyor'
            }
        } else {
            mappedOutcome = 'No Answer'
        }

        return {
            id: call.id,
            customer_id: call.customer_id || '',
            customer_name: call.caller_name || 'Bilinmeyen Arayan',
            customer_phone: call.caller_phone || '-',
            date: call.started_at || call.created_at,
            duration: call.duration || 0,
            outcome: mappedOutcome,
            lead_score: call.lead_score,
            summary: call.summary || '',
            transcript: call.transcript || '',
            recording_url: call.recording_url,
            vapi_call_id: call.vapi_call_id,
            cost: call.cost ? parseFloat(call.cost) : null,
            is_known_customer: !!call.customer_id,
        }
    })

    return (
        <div className="flex-1 space-y-4 p-4 md:p-6 pt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">📞 Gelen Aramalar</h1>
                    <p className="text-sm text-slate-500 mt-0.5">AI asistanın karşıladığı tüm gelen arama kayıtları</p>
                </div>
            </div>
            <InboundCallsClient
                calls={mappedCalls}
                totalCount={totalCount || 0}
                page={page}
                pageSize={PAGE_SIZE}
            />
        </div>
    )
}
