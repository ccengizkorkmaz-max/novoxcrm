import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PortfolioEditForm } from './components/PortfolioEditForm'

export default async function PortfolioEditPage(props: {
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

    // Fetch agents for reassignment dropdown
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile?.tenant_id)
        .in('role', ['sales', 'manager', 'admin', 'owner'])
        .order('full_name')

    return (
        <div className="max-w-4xl mx-auto w-full">
            <PortfolioEditForm
                portfolio={portfolio}
                agents={agents || []}
                userRole={profile?.role || 'sales'}
            />
        </div>
    )
}
