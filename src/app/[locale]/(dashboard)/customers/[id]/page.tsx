import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CustomerView } from '@/components/customers/customer-view'

interface CustomerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: customer } = await supabase
        .from('customers')
        .select('*, customer_demands(*), company:companies(id, name)')
        .eq('id', id)
        .single()

    if (!customer) {
        notFound()
    }

    // Fetch activities for this customer
    const { data: dbActivities } = await supabase
        .from('activities')
        .select('*')
        .eq('customer_id', id)
        .order('due_date', { ascending: false })

    // Fetch AI call logs
    const { data: callLogs } = await supabase
        .from('outreach_step_logs')
        .select(`
            id,
            executed_at,
            call_summary,
            call_recording_url,
            call_duration_seconds,
            outreach_executions!inner (
                customer_id,
                workflows:outreach_workflows ( name )
            )
        `)
        .eq('outreach_executions.customer_id', id)
        .not('call_summary', 'is', null) // only fetch completed calls

    // Map AI call logs to Activity format
    const aiActivities = (callLogs || []).map((log: any) => ({
        id: `ai-${log.id}`,
        customer_id: id,
        type: 'Call',
        topic: 'Outreach',
        summary: 'AI Araması: ' + (log.outreach_executions?.workflows?.name || 'Genel'),
        description: log.call_summary || 'Arama özeti bulunmuyor.',
        due_date: log.executed_at,
        created_at: log.executed_at,
        status: 'Completed',
        call_recording_url: log.call_recording_url,
    }))

    // Combine both
    const activities = [...(dbActivities || []), ...aiActivities]

    // Fetch contracts for this customer
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            unit: units(unit_number, block),
            project: projects(name),
            contract_customers!inner(customer_id)
        `)
        .eq('contract_customers.customer_id', id)
        .order('created_at', { ascending: false })

    // Fetch active sales/leads for this customer
    const { data: sales } = await supabase
        .from('sales')
        .select(`
            *,
            unit: units(unit_number, block),
            project: projects(name)
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

    // Fetch Profiles (Users) for assignment - Same logic as activities page
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner'

    let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name')

    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    let { data: profiles } = await profilesQuery

    // Fallback: If profiles list is empty or null, add the current user manually
    if (!profiles || profiles.length === 0) {
        profiles = [{
            id: user.id,
            full_name: currentUserProfile?.full_name || user.email?.split('@')[0] || 'Mevcut Kullanıcı'
        }]
    }

    // Ensure full_name is not null
    profiles = (profiles || []).map(p => ({
        ...p,
        full_name: p.full_name || 'İsimsiz Kullanıcı'
    }))

    return <CustomerView
        customer={customer}
        activities={activities || []}
        contracts={contracts || []}
        profiles={profiles}
        sales={sales || []}
    />
}
