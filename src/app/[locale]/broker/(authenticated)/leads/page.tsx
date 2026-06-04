import { createClient } from '@/lib/supabase/server'
import { BrokerLeadsClient } from './BrokerLeadsClient'

export default async function BrokerLeadsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    const { data: tenantData } = profile?.tenant_id
        ? await supabase.from('tenants').select('lead_ownership_days').eq('id', profile.tenant_id).single()
        : { data: null }

    const leadOwnershipDays = (tenantData as any)?.lead_ownership_days ?? 90

    const { data: leads } = await supabase
        .from('broker_leads')
        .select('id, full_name, phone, status, created_at, budget_min, budget_max, ownership_expires_at, projects(name)')
        .eq('broker_id', user?.id)
        .order('created_at', { ascending: false })

    return <BrokerLeadsClient leads={leads || []} locale={locale} leadOwnershipDays={leadOwnershipDays} />
}
