import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CustomerView } from '@/components/customers/customer-view'
import CustomerForm from '@/app/[locale]/(dashboard)/crm/components/CustomerForm'

interface CustomerPageProps {
    params: Promise<{
        locale: string
        id: string
    }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { locale, id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/${locale}/login`)

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const tenantId = userProfile?.tenant_id

    const { data: tenant } = tenantId
        ? await supabase.from('tenants').select('crm_mode').eq('id', tenantId).single()
        : { data: null }

    const isAdvanceMode = tenant?.crm_mode === 'advance'

    const { data: customer } = await supabase
        .from('customers')
        .select('*, customer_demands(*), company:companies(id, name), addresses:customer_addresses(*)')
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
        .neq('type', 'Transcript')
        .order('due_date', { ascending: false })

    // Fetch AI call logs — no longer needed since Vapi webhook creates proper activity records
    // outreach_step_logs were causing duplicate entries

    // Activities are directly from the database
    const activities = dbActivities || []

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
            project: projects(name),
            profiles(full_name)
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

    if (isAdvanceMode) {
        return (
            <div className="p-4 sm:p-6">
                <CustomerForm
                    customer={customer}
                    activities={activities || []}
                    contracts={contracts || []}
                    sales={sales || []}
                    profiles={profiles}
                    crmMode={tenant?.crm_mode || 'advance'}
                />
            </div>
        )
    }

    return <CustomerView
        customer={customer}
        activities={activities || []}
        contracts={contracts || []}
        profiles={profiles}
        sales={sales || []}
    />
}
