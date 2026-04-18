import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeaderboardView } from './components/LeaderboardView'

export default async function LeaderboardPage() {
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

    // Get all agents for this tenant
    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile?.tenant_id)
        .in('role', ['sales', 'manager', 'admin', 'owner'])
        .order('full_name')

    // Get all transactions for the tenant
    const { data: transactions } = await supabase
        .from('agent_transactions')
        .select('listing_agent_id, buyer_agent_id, gross_commission, listing_agent_share, buyer_agent_share, sale_price, status, transaction_date')
        .in('status', ['approved', 'paid'])

    // Get portfolio counts per agent
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('agent_id, status')

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Sıralama</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Danışman performans tablosu — en çok kazandıran ve en aktif danışmanlarınızı takip edin.
                </p>
            </div>
            <LeaderboardView
                agents={agents || []}
                transactions={transactions || []}
                portfolios={portfolios || []}
            />
        </div>
    )
}
