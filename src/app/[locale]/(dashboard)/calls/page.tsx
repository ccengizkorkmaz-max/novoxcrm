import { createClient } from '@/lib/supabase/server'
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
    const page = parseInt(params.page || '1')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="p-8 text-center text-slate-500">Oturum bulunamadı</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div className="p-8 text-center text-slate-500">Tenant bulunamadı</div>

    // Query activities with type 'Transcript' and join customer info
    // These are inbound/manual AI call records
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: activities, count: totalCount } = await supabase
        .from('activities')
        .select(`
            id,
            customer_id,
            summary,
            description,
            notes,
            outcome,
            priority,
            due_date,
            completed_at,
            created_at,
            customers(id, full_name, phone)
        `, { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)
        .eq('type', 'Transcript')
        .eq('topic', 'Inbound Call')
        .order('created_at', { ascending: false })
        .range(from, to)

    // Parse activity data into call records
    const calls = (activities || []).map((act: any) => {
        const desc = act.description || ''
        const customer = act.customers as any

        // Extract recording URL from description [RECORDING]: url
        const recordingMatch = desc.match(/\[RECORDING\]:\s*(https?:\/\/\S+)/)
        const recordingUrl = recordingMatch ? recordingMatch[1] : null

        // Extract transcript from description (after 📝 Transkript:)
        const transcriptMatch = desc.match(/📝 Transkript:\n([\s\S]*?)(?=\n\n\[|$)/)
        const transcript = transcriptMatch ? transcriptMatch[1].trim() : (act.notes || '')

        // Extract lead score from summary (Skor HOT, WARM, etc.)
        const scoreMatch = (act.summary || '').match(/Skor\s+(HOT|WARM|FOLLOW_UP|COLD|DISQUALIFIED)/i)
        const leadScore = scoreMatch ? scoreMatch[1].toLowerCase() : null

        // Extract duration from summary (e.g., "2dk 15sn")
        const durationMatch = (act.summary || '').match(/(\d+)dk\s*(\d+)?sn/)
        let duration = 0
        if (durationMatch) {
            duration = parseInt(durationMatch[1]) * 60 + (parseInt(durationMatch[2]) || 0)
        }

        // Summary is the first line of description (before transcript)
        const summaryText = desc.split('\n\n📝')[0]?.trim() || act.summary || ''

        return {
            id: act.id,
            customer_id: customer?.id || act.customer_id,
            customer_name: customer?.full_name || 'Bilinmeyen',
            customer_phone: customer?.phone || '-',
            date: act.completed_at || act.created_at,
            duration,
            outcome: act.outcome || 'No Answer',
            lead_score: leadScore,
            summary: summaryText,
            transcript,
            recording_url: recordingUrl,
            cost: null,
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
                calls={calls}
                totalCount={totalCount || 0}
                page={page}
                pageSize={PAGE_SIZE}
            />
        </div>
    )
}
