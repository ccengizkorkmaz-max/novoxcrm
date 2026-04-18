import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUnassignedLeads, getAvailableAgents, getLeadRoutingRules } from './actions'
import { LeadPoolView } from './components/LeadPoolView'

export default async function LeadPoolPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    const { data: tenant } = profile?.tenant_id ? await supabase
        .from('tenants')
        .select('tenant_type')
        .eq('id', profile.tenant_id)
        .single() : { data: null }

    if ((tenant as any)?.tenant_type !== 'broker') {
        redirect('/')
    }

    const isManager = ['manager', 'admin', 'owner'].includes(profile?.role || '')
    if (!isManager) redirect('/')

    const [leads, agents, rules] = await Promise.all([
        getUnassignedLeads(),
        getAvailableAgents(),
        getLeadRoutingRules(),
    ])

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Talep Havuzu</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Atanmamış müşteri taleplerini görüntüleyin ve danışmanlara yönlendirin.
                </p>
            </div>
            <LeadPoolView
                leads={leads}
                agents={agents}
                currentRule={rules?.[0] || null}
                userRole={profile?.role || 'sales'}
            />
        </div>
    )
}
