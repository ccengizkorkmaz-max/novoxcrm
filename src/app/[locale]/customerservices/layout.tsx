import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, CreditCard, CalendarCheck, FileText, LogOut, ShieldCheck } from 'lucide-react'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getTranslations } from 'next-intl/server'

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = await getTranslations('CustomerPortal')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Check if we are on the login page - if so, just render children without further checks
    // This handles the case where there is no user yet
    if (!user) return <>{children}</>

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenants(name)')
        .eq('id', user.id)
        .single()

    const isAllowed = profile?.role === 'customer' || profile?.role === 'admin' || profile?.role === 'owner'
    if (!isAllowed) redirect('/')

    const menuItems = [
        { label: t('sidebar.overview'), icon: LayoutDashboard, href: '/customerservices' },
        { label: t('sidebar.financials'), icon: CreditCard, href: '/customerservices/financials' },
        { label: t('sidebar.tracking'), icon: CalendarCheck, href: '/customerservices/tracking' },
        { label: t('sidebar.serviceRequests'), icon: ShieldCheck, href: '/customerservices/tickets' },
        { label: t('sidebar.documents'), icon: FileText, href: '/customerservices/documents' },
    ]

    return (
        <div className="flex h-screen w-full bg-slate-50/50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
                <div className="flex flex-col border-b px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                            <ShieldCheck className="h-6 w-6" />
                            <span className="text-xl tracking-tight">{t('sidebar.title')}</span>
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {profile.tenants?.name}
                        </span>
                        <LanguageSwitcher />
                    </div>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-t p-4">
                    <form action="/auth/signout" method="post">
                        <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700">
                            <LogOut className="h-5 w-5" />
                            {t('sidebar.logout')}
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile Header (visible only on small screens) */}
            <div className="sm:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3">
                <div className="flex items-center gap-2 font-bold text-blue-600">
                    <ShieldCheck className="h-6 w-6" />
                    <span className="text-lg">{t('sidebar.title')}</span>
                </div>
                {/* Mobile Menu Button - simplified */}
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <Button size="sm" variant="outline">Menu</Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 sm:pl-64 flex flex-col min-w-0">
                <main className="flex-1 p-6 md:p-8 pt-20 sm:pt-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

import { Activity } from 'lucide-react'
