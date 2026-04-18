import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCampaigns, getEmailTemplates } from './actions'
import { MarketingDashboard } from './components/MarketingDashboard'

export default async function MarketingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    const isManager = ['manager', 'admin', 'owner'].includes(profile?.role || '')
    if (!isManager) redirect('/dashboard')

    const campaigns = await getCampaigns()
    const templates = await getEmailTemplates()

    // Get customers for recipient selection
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, source, city')
        .order('full_name')

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pazarlama & Kampanyalar</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    E-posta ve SMS kampanyaları oluşturun, şablonlar yönetin, otomatik diziler kurun.
                </p>
            </div>
            <MarketingDashboard
                campaigns={campaigns}
                templates={templates}
                customers={customers || []}
            />
        </div>
    )
}
