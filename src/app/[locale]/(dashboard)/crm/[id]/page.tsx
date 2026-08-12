import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CustomerForm from '../components/CustomerForm'
import { AiLeadScoreWidget } from '@/components/crm/AiLeadScoreWidget'

export const dynamic = 'force-dynamic'

export default async function EditCustomerPage(props: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = await props.params
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

    if (tenant?.crm_mode === 'advance') {
        redirect(`/${locale}/customers/${id}`)
    }

    const [
        customerRes,
        activitiesRes,
        contractsRes,
        salesRes,
        profilesRes
    ] = await Promise.all([
        supabase
            .from('customers')
            .select('*, customer_demands(*), company:companies(id, name), addresses:customer_addresses(*)')
            .eq('id', id)
            .single(),
        supabase
            .from('activities')
            .select('*')
            .eq('customer_id', id)
            .neq('type', 'Transcript')
            .order('due_date', { ascending: false }),
        supabase
            .from('contracts')
            .select(`
                *,
                unit: units(unit_number, block),
                project: projects(name),
                contract_customers!inner(customer_id)
            `)
            .eq('contract_customers.customer_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('sales')
            .select(`
                *,
                unit: units(unit_number, block),
                project: projects(name),
                profiles(full_name)
            `)
            .eq('customer_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('profiles')
            .select('id, full_name')
            .order('full_name')
    ])

    const customer = customerRes.data
    if (customerRes.error || !customer) {
        notFound()
    }

    const activities = activitiesRes.data || []
    const contracts = contractsRes.data || []
    const sales = salesRes.data || []
    const profiles = profilesRes.data || []

    return (
        <div className="p-4 sm:p-6 space-y-4">
            {/* AI Lead Score Widget */}
            <AiLeadScoreWidget
                customerId={customer.id}
                initialScore={customer.ai_purchase_score ?? null}
                initialData={customer.ai_purchase_score_data ?? null}
                lastUpdated={customer.ai_purchase_score_updated_at ?? null}
            />
            <CustomerForm
                customer={customer}
                activities={activities}
                contracts={contracts}
                sales={sales}
                profiles={profiles}
                crmMode={tenant?.crm_mode || 'basic'}
            />
        </div>
    )
}
