import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAgentTransactions, getBrokerCommissionSettings } from './actions'
import { AgentTransactionsView } from './components/AgentTransactionsView'

export default async function AgentTransactionsPage() {
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

    if ((tenant as any)?.tenant_type !== 'broker') redirect('/')

    // Fetch agents for dropdowns
    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile?.tenant_id)
        .order('full_name')

    // Fetch customers for dropdowns
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name')
        .order('full_name')
        .limit(500)

    // Fetch portfolios for dropdown
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, title, city, district')
        .eq('status', 'active')
        .order('title')

    const [transactions, commissionSettings] = await Promise.all([
        getAgentTransactions(),
        getBrokerCommissionSettings(),
    ])

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Hak Edişler</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Satış işlemlerini kaydedin, komisyon bölüşümlerini yönetin ve danışman hak edişlerini takip edin.
                </p>
            </div>
            <AgentTransactionsView
                transactions={transactions}
                commissionSettings={commissionSettings}
                agents={agents || []}
                customers={customers || []}
                portfolios={portfolios || []}
                userRole={profile?.role || 'sales'}
            />
        </div>
    )
}
