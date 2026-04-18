import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPortfolios } from './actions'
import { PortfolioList } from './components/PortfolioList'

export default async function PortfoliosPage() {
    const supabase = await createClient()

    // Guard: Only broker tenants should see this page
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

    const portfolios = await getPortfolios()

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Portföyler</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gayrimenkul portföylerinizi yönetin, yeni ilanlar ekleyin ve mevcut portföylerinizi takip edin.
                    </p>
                </div>
            </div>
            <PortfolioList portfolios={portfolios} userRole={profile?.role || 'sales'} />
        </div>
    )
}
