import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCommissionPlans } from './actions'
import { CommissionPlansView } from './components/CommissionPlansView'

export default async function CommissionPlansPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    const isManager = ['admin', 'owner'].includes(profile?.role || '')
    if (!isManager) redirect('/dashboard')

    const { data: tenant } = profile?.tenant_id ? await supabase
        .from('tenants').select('tenant_type').eq('id', profile.tenant_id).single() : { data: null }
    if ((tenant as any)?.tenant_type !== 'broker') redirect('/')

    const plans = await getCommissionPlans()

    // Get agents with their plan assignments
    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role, commission_plan_id')
        .eq('tenant_id', profile?.tenant_id || '')
        .in('role', ['sales', 'manager', 'admin', 'owner'])
        .order('full_name')

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Komisyon Planları</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Danışman komisyon oranlarını, franchise paylarını ve tavan limitlerini yönetin.
                </p>
            </div>
            <CommissionPlansView plans={plans} agents={agents || []} />
        </div>
    )
}
