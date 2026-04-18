import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from './components/AnalyticsDashboard'

export default async function AnalyticsPage() {
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
    
    const isManager = ['manager', 'admin', 'owner'].includes(profile?.role || '')
    if (!isManager) redirect('/dashboard')

    // === DATA FETCHING ===

    // 1. All sales with status + dates + source + agent
    const { data: sales } = await supabase
        .from('sales')
        .select('id, status, created_at, updated_at, assigned_to, lead_origin, source, description, customer_id, customers(full_name, source, created_at)')
        .order('created_at', { ascending: false })

    // 2. All transactions
    const { data: transactions } = await supabase
        .from('agent_transactions')
        .select('id, gross_commission, sale_price, office_share, listing_agent_id, listing_agent_share, buyer_agent_id, buyer_agent_share, status, transaction_date, created_at')

    // 3. All portfolios
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, status, property_type, listing_type, city, district, price, currency, area_net, created_at, updated_at, agent_id')

    // 4. Agents
    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile?.tenant_id || '')
        .in('role', ['sales', 'manager', 'admin', 'owner'])
        .order('full_name')

    // 5. Activities (for time analysis)
    const { data: activities } = await supabase
        .from('activities')
        .select('id, type, customer_id, user_id, created_at, status')
        .order('created_at', { ascending: false })
        .limit(1000)

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Raporlar ve Analitik</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Satış performansı, kaynak analizi, dönüşüm hunisi ve gelir trendlerini takip edin.
                </p>
            </div>
            <AnalyticsDashboard
                sales={sales || []}
                transactions={transactions || []}
                portfolios={portfolios || []}
                agents={agents || []}
                activities={activities || []}
            />
        </div>
    )
}
