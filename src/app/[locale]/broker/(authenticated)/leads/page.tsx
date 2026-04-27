import { createClient } from '@/lib/supabase/server'
import { BrokerLeadsClient } from './BrokerLeadsClient'

export default async function BrokerLeadsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: leads } = await supabase
        .from('broker_leads')
        .select('id, full_name, phone, status, created_at, budget_min, budget_max, projects(name)')
        .eq('broker_id', user?.id)
        .order('created_at', { ascending: false })

    return <BrokerLeadsClient leads={leads || []} locale={locale} />
}
