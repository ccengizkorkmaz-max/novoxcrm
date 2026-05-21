import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Building2, LogOut, Menu, Settings } from 'lucide-react'
import { NovoxSidebar } from '@/components/dashboard/NovoxSidebar'
import { getTranslations, getMessages } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ToastProvider } from '@/components/providers/ToastProvider'
import NotificationBell from '@/components/notifications/NotificationBell'
import { NextIntlClientProvider } from 'next-intl'
import { resolveBrand, brandToCssVars, type BrandConfig } from '@/lib/brand-config'

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
            .select('name, tenant_type, has_broker_module, has_outreach_module, brand_config')
            .eq('id', profile.tenant_id)
            .single()
        
        if (result.error && result.error.message?.includes('brand_config')) {
            // Column doesn't exist yet, query without it
            const fallback = await supabase
                .from('tenants')
                .select('name, tenant_type, has_broker_module, has_outreach_module')
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

    // Resolve white-label branding
    const brand = resolveBrand(tenant?.brand_config)
    const cssVars = brandToCssVars(brand)

    const isAuthorizedForSettings = profile?.role === 'admin' || profile?.role === 'owner'
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
            hotLeads: sidebarT('reports.hotLeads')
        }
    }

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <div className="flex h-screen w-full bg-muted/40 font-sans" style={cssVars as React.CSSProperties} data-ui-style={brand.uiStyle || 'default'}>
                {/* Sidebar */}
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r md:flex print:hidden" style={{ backgroundColor: brand.sidebarBg, borderColor: brand.sidebarBorder }}>
                    <div className="flex flex-col px-4 py-3 lg:px-6" style={{ borderBottomWidth: '1px', borderColor: brand.sidebarBorder }}>
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center gap-2 font-bold text-white">
                                {brand.logoUrl ? (
                                    <img src={brand.logoUrl} alt={brand.appName} className="h-6 w-6 object-contain" />
                                ) : (
                                    <Building2 className="h-6 w-6" style={{ color: brand.primaryColor }} />
                                )}
                                <span className="text-lg tracking-tight">{brand.appName}</span>
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                    {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                </span>
                            </Link>
                        </div>
                        <div className="mt-1 flex flex-col">
                            <span className="text-xs font-bold text-slate-200 truncate">{tenant?.name || t('tenantLoading')}</span>
                            <span className="text-[10px] text-slate-400 truncate">{profile?.full_name || user.email}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <NovoxSidebar role={profile?.role || 'sales'} labels={sidebarLabels} tenantType={tenantType} hasBrokerModule={hasBrokerModule} hasOutreachModule={hasOutreachModule} />
                    </div>
                    <div className="p-4 flex items-center justify-between gap-2" style={{ borderTopWidth: '1px', borderColor: brand.sidebarBorder }}>
                        <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</span>
                        </div>
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
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 min-w-0 flex flex-col md:gap-4 md:py-4 md:pl-64 print:pl-0">
                    <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center gap-4 border-b bg-background px-4 md:static md:h-auto md:border-0 md:bg-transparent md:px-6 md:hidden print:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button size="icon" variant="outline" className="md:hidden" suppressHydrationWarning>
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">{t('toggleMenu')}</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0 border-r-0" style={{ backgroundColor: brand.sidebarBg }}>
                                <div className="flex flex-col px-4 py-3" style={{ borderBottomWidth: '1px', borderColor: brand.sidebarBorder }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <Link href="/" className="flex items-center gap-2 font-bold text-white">
                                            {brand.logoUrl ? (
                                                <img src={brand.logoUrl} alt={brand.appName} className="h-6 w-6 object-contain" />
                                            ) : (
                                                <Building2 className="h-6 w-6" style={{ color: brand.primaryColor }} />
                                            )}
                                            <span className="text-lg tracking-tight">{brand.appName}</span>
                                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                                {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                            </span>
                                        </Link>
                                    </div>
                                    <div className="mt-1 flex flex-col">
                                        <span className="text-xs font-bold text-slate-200">{tenant?.name}</span>
                                        <span className="text-[10px] text-slate-400">{profile?.full_name}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto py-2">
                                    <NovoxSidebar role={profile?.role || 'sales'} labels={sidebarLabels} tenantType={tenantType} hasBrokerModule={hasBrokerModule} hasOutreachModule={hasOutreachModule} />
                                </div>
                                <div className="px-4 py-2">
                                    <LanguageSwitcher variant="light" />
                                </div>
                                <div className="p-4 flex items-center justify-between" style={{ borderTopWidth: '1px', borderColor: brand.sidebarBorder }}>
                                    {isAuthorizedForSettings && (
                                        <Link href="/settings" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                                            <Settings className="h-4 w-4" />
                                            {t('settings')}
                                        </Link>
                                    )}
                                    <form action={async () => {
                                        'use server'
                                        const supabase = await createClient()
                                        await supabase.auth.signOut()
                                        redirect('/login')
                                    }}>
                                        <Button variant="ghost" size="sm" className="gap-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20">
                                            <LogOut className="h-4 w-4" />
                                            {t('logout')}
                                        </Button>
                                    </form>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="flex flex-col ml-2 flex-1">
                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-sm leading-none">{brand.appName}</span>
                                <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded" style={{ backgroundColor: brand.badgeBg, color: brand.badgeText }}>
                                    {tenantType === 'broker' ? '.bro' : brand.badgeLabel}
                                </span>
                                <div className="flex items-center gap-2">
                                    <NotificationBell />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium">{tenant?.name}</span>
                                <span className="text-[10px] text-muted-foreground/60">•</span>
                                <span className="text-[10px] text-muted-foreground/60">{profile?.full_name || user.email}</span>
                            </div>
                        </div>
                    </header>
                    <div className="hidden md:flex items-center justify-end gap-2 px-6 py-2 sticky top-0 z-20 bg-muted/40 print:hidden">
                        <LanguageSwitcher />
                        {isAuthorizedForSettings && (
                            <Link href="/settings">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <NotificationBell />
                    </div>
                    <main className="grid flex-1 items-start gap-4 p-3 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
                        {children}
                    </main>
                </div>
                <ToastProvider />
            </div>
        </NextIntlClientProvider>
    )
}
