import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CustomerForm from '../components/CustomerForm'

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

    const { data: customer, error } = await supabase
        .from('customers')
        .select('*, customer_demands(*)')
        .eq('id', id)
        .single()

    if (error || !customer) {
        notFound()
    }

    return (
        <div className="p-4 sm:p-6">
            <CustomerForm customer={customer} crmMode={tenant?.crm_mode || 'basic'} />
        </div>
    )
}
