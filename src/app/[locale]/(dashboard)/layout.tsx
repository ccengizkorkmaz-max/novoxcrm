import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { getTranslations, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { resolveBrand, brandToCssVars } from '@/lib/brand-config'
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper'

export default async function DashboardLayout(props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const { children } = props

    // Run all independent async operations in parallel for faster page loads
    const supabase = await createClient()

    const [
        { data: { user } },
        t,
        messages,
        sidebarT
    ] = await Promise.all([
        supabase.auth.getUser(),
        getTranslations('Dashboard'),
        getMessages(),
        getTranslations('Sidebar')
    ])

    if (!user) {
        redirect('/login')
    }

    // Fetch profile (needed before tenant)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenant_id, role')
        .eq('id', user.id)
        .single()

    // Fetch tenant info only if tenant_id exists (include brand_config for white-label)
    let tenant: any = null
    if (profile?.tenant_id) {
        // Try with brand_config first, fallback without it if column doesn't exist yet
        const result = await supabase
            .from('tenants')
            .select('name, tenant_type, has_broker_module, has_outreach_module, brand_config, crm_mode')
            .eq('id', profile.tenant_id)
            .single()
        
        if (result.error && result.error.message?.includes('brand_config')) {
            // Column doesn't exist yet, query without it
            const fallback = await supabase
                .from('tenants')
                .select('name, tenant_type, has_broker_module, has_outreach_module, crm_mode')
                .eq('id', profile.tenant_id)
                .single()
            tenant = fallback.data
        } else {
            tenant = result.data
        }
    }

    const tenantType = tenant?.tenant_type || 'developer'
    const hasBrokerModule = tenant?.has_broker_module || false
    const hasOutreachModule = tenant?.has_outreach_module || false
    const crmMode = (tenant?.crm_mode as 'basic' | 'advance') || 'basic'

    // Resolve white-label branding
    const brand = resolveBrand(tenant?.brand_config)
    if (tenant?.logo_url) {
        brand.logoUrl = tenant.logo_url
    }
    const cssVars = brandToCssVars(brand)

    const isAuthorizedForSettings = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'crm_manager'
    const sidebarLabels = {
        overview: sidebarT('overview'),
        inbox: sidebarT('inbox'),
        conversations: sidebarT('conversations'),
        quickCRM: sidebarT('quickCRM'),
        projects: sidebarT('projects'),
        inventory: sidebarT('inventory'),
        customers: sidebarT('customers'),
        salesTeams: sidebarT('salesTeams'),
        salesManagement: sidebarT('salesManagement'),
        options: sidebarT('options'),
        offers: sidebarT('offers'),
        contracts: sidebarT('contracts'),
        deposits: sidebarT('deposits'),
        commissions: sidebarT('commissions'),
        activities: sidebarT('activities'),
        finance: sidebarT('finance'),
        hr: sidebarT('hr'),
        serviceRequests: sidebarT('serviceRequests'),
        afterSales: sidebarT('afterSales'),
        snagList: sidebarT('snagList'),
        deliveries: sidebarT('deliveries'),
        subcontractors: sidebarT('subcontractors'),
        broker: {
            title: sidebarT('broker.title'),
            management: sidebarT('broker.management'),
            leads: sidebarT('broker.leads'),
            campaigns: sidebarT('broker.campaigns'),
            commission: sidebarT('broker.commission'),
            finance: sidebarT('broker.finance'),
            levels: sidebarT('broker.levels'),
            earnings: sidebarT('broker.earnings')
        },
        reports: {
            title: sidebarT('reports.title'),
            sales: sidebarT('reports.sales'),
            inventory: sidebarT('reports.inventory'),
            finance: sidebarT('reports.finance'),
            publicLinks: sidebarT('reports.publicLinks'),
            marketing: sidebarT('reports.marketing'),
            hotLeads: sidebarT('reports.hotLeads'),
            outreachCeo: sidebarT('reports.outreachCeo'),
            outreachCost: sidebarT('reports.outreachCost')
        }
    }

    const logoutForm = (
        <form action={async () => {
            'use server'
            const supabase = await createClient()
            await supabase.auth.signOut()
            redirect('/login')
        }}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/20">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{t('logout')}</span>
            </Button>
        </form>
    )

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <DashboardLayoutWrapper
                brand={brand}
                cssVars={cssVars}
                tenantType={tenantType}
                tenantName={tenant?.name || t('tenantLoading')}
                profile={profile}
                userEmail={user.email || ''}
                sidebarLabels={sidebarLabels}
                hasBrokerModule={hasBrokerModule}
                hasOutreachModule={hasOutreachModule}
                isAuthorizedForSettings={isAuthorizedForSettings}
                logoutForm={logoutForm}
                crmMode={crmMode}
            >
                {children}
            </DashboardLayoutWrapper>
        </NextIntlClientProvider>
    )
}
