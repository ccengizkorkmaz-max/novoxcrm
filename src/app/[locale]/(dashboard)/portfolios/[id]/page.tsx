import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PortfolioDetailView } from './components/PortfolioDetailView'

export default async function PortfolioDetailPage(props: {
    params: Promise<{ id: string; locale: string }>
}) {
    const { id } = await props.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select('*, portfolio_images(id, url, is_cover, caption, order_index)')
        .eq('id', id)
        .single()

    if (error || !portfolio) notFound()

    // Get agent info
    const { data: agent } = portfolio.agent_id ? await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', portfolio.agent_id)
        .single() : { data: null }

    // Get related transactions
    const { data: transactions } = await supabase
        .from('agent_transactions')
        .select('id, sale_price, gross_commission, status, transaction_date')
        .eq('portfolio_id', id)

    // Get showing/inquiry activities if they exist
    const { data: activities } = await supabase
        .from('activities')
        .select('id, type, title, start_date, created_at')
        .or(`notes.ilike.%${id}%`)
        .order('created_at', { ascending: false })
        .limit(10)

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return (
        <PortfolioDetailView
            portfolio={portfolio}
            agent={agent}
            transactions={transactions || []}
            activities={activities || []}
            userRole={profile?.role || 'sales'}
        />
    )
}
