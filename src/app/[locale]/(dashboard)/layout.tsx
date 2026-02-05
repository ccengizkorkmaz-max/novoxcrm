import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Building2, LogOut, Menu, Settings } from 'lucide-react'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ToastProvider } from '@/components/providers/ToastProvider'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = await getTranslations('Dashboard')
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile and tenant info
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenant_id, role')
        .eq('id', user.id)
        .single()

    const { data: tenant } = profile?.tenant_id ? await supabase
        .from('tenants')
        .select('name')
        .eq('id', profile.tenant_id)
        .single() : { data: null }

    const isAuthorizedForSettings = profile?.role === 'admin' || profile?.role === 'owner'

    return (
        <div className="flex h-screen w-full bg-muted/40 font-sans">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 md:flex print:hidden">
                <div className="flex flex-col border-b border-slate-800 px-4 py-3 lg:px-6">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 font-bold text-white">
                            <Building2 className="h-6 w-6 text-blue-500" />
                            <span className="text-lg tracking-tight">NovoxCrm</span>
                        </Link>
                        <LanguageSwitcher variant="light" />
                    </div>
                    <div className="mt-1 flex flex-col">
                        <span className="text-xs font-bold text-slate-200 truncate">{tenant?.name || t('tenantLoading')}</span>
                        <span className="text-[10px] text-slate-400 truncate">{profile?.full_name || user.email}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <SidebarNav />
                </div>
                <div className="mt-auto p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-hidden">
                        {isAuthorizedForSettings && (
                            <Link href="/settings">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">{t('settings')}</span>
                                </Button>
                            </Link>
                        )}
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
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 md:static md:h-auto md:border-0 md:bg-transparent md:px-6 md:hidden print:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="md:hidden" suppressHydrationWarning>
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">{t('toggleMenu')}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0 bg-slate-950 border-r-slate-800">
                            <div className="flex flex-col border-b border-slate-800 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <Link href="/" className="flex items-center gap-2 font-bold text-white">
                                        <Building2 className="h-6 w-6 text-blue-500" />
                                        <span className="text-lg tracking-tight">NovoxCrm</span>
                                    </Link>
                                    <LanguageSwitcher variant="light" />
                                </div>
                                <div className="mt-1 flex flex-col">
                                    <span className="text-xs font-bold text-slate-200">{tenant?.name}</span>
                                    <span className="text-[10px] text-slate-400">{profile?.full_name}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto py-2">
                                <SidebarNav />
                            </div>
                            <div className="p-4 border-t border-slate-800 mt-auto flex items-center justify-between">
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
                    <div className="flex flex-col ml-2">
                        <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-bold text-sm leading-none">NovoxCrm</span>
                            {/* Mobile Header Language Switcher Optional - kept in sidebar to save space */}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-medium">{tenant?.name}</span>
                            <span className="text-[10px] text-muted-foreground/60">•</span>
                            <span className="text-[10px] text-muted-foreground/60">{profile?.full_name || user.email}</span>
                        </div>
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
                    {children}
                </main>
            </div>
            <ToastProvider />
        </div>
    )
}
