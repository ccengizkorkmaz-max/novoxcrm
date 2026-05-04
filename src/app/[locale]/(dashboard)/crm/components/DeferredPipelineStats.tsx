import { createClient } from '@/lib/supabase/server'
import { PipelineStats } from './PipelineStats'

/**
 * Async server component that fetches pipeline stats and streams them via Suspense.
 * This allows the main sales list to render immediately while stats load in background.
 */
export default async function DeferredPipelineStats({
    isManager,
    userId,
    filterReps,
    filterProject,
    filterCustomer,
    filterDateFrom,
    filterDateTo,
    filterSearch,
    tenantType
}: {
    isManager: boolean
    userId?: string
    filterReps: string[]
    filterProject?: string
    filterCustomer?: string
    filterDateFrom?: string
    filterDateTo?: string
    filterSearch?: string
    tenantType: string
}) {
    const supabase = await createClient()

    const getStatusCount = (status: string | string[]) => {
        let q = supabase.from('sales').select('*', { count: 'exact', head: true }).neq('status', 'Inbox')

        if (!isManager && userId) {
            q = q.eq('assigned_to', userId)
        } else if (filterReps.length > 0) {
            if (filterReps.includes('unassigned')) {
                q = q.is('assigned_to', null)
            } else {
                q = q.in('assigned_to', filterReps)
            }
        }

        if (filterProject) q = q.eq('project_id', filterProject)
        if (filterCustomer) q = q.eq('customer_id', filterCustomer)
        if (filterDateFrom) q = q.gte('created_at', filterDateFrom)
        if (filterDateTo) q = q.lte('created_at', filterDateTo + 'T23:59:59')
        if (filterSearch) q = q.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`, { foreignTable: 'customers' })

        if (Array.isArray(status)) {
            return q.in('status', status)
        }
        return q.eq('status', status)
    }

    const [
        countLead,
        countProspect,
        countReservation,
        countProposal,
        countNegotiation,
        countSold,
        countCompleted,
        countLost
    ] = await Promise.all([
        getStatusCount('Lead'),
        getStatusCount('Prospect'),
        getStatusCount(['Reservation', 'Reserved', 'Opsiyon - Kapora Bekleniyor']),
        getStatusCount(['Proposal', 'Teklif - Kapora Bekleniyor']),
        getStatusCount('Negotiation'),
        getStatusCount('Sold'),
        getStatusCount('Completed'),
        getStatusCount('Lost')
    ])

    const statsData = {
        Lead: countLead.count || 0,
        Prospect: countProspect.count || 0,
        Reservation: countReservation.count || 0,
        Proposal: countProposal.count || 0,
        Negotiation: countNegotiation.count || 0,
        Sold: countSold.count || 0,
        Completed: countCompleted.count || 0,
        Lost: countLost.count || 0
    }

    return <PipelineStats stats={statsData} tenantType={tenantType} />
}
