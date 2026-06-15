import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPortalConfigs } from './actions'
import { PortalIntegrationsView } from './components/PortalIntegrationsView'

export default async function PortalIntegrationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isManager = ['admin', 'owner', 'crm_manager'].includes(profile?.role || '')
    if (!isManager) redirect('/dashboard')

    const portals = await getPortalConfigs()

    // Get active portfolio count for feed
    const { count: activeCount } = await supabase
        .from('portfolios')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">İlan Portalı Entegrasyonları</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Portföylerinizi Sahibinden, Hepsiemlak ve diğer platformlara aktarın.
                </p>
            </div>
            <PortalIntegrationsView portals={portals} activePortfolioCount={activeCount || 0} />
        </div>
    )
}
