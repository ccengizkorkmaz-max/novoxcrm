import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    Menu,
    PlusCircle,
    TrendingUp,
    Library,
    Bell,
    Building2,
    BadgeTurkishLira
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import LanguageSwitcher from '@/components/LanguageSwitcher'

const NAV_ITEMS = [
    { href: '/broker', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/broker/projects', label: 'Projeler & Envanter', icon: Building2 },
    { href: '/broker/leads', label: 'Müşterilerim', icon: Users },
    { href: '/broker/leads/new', label: 'Yeni Lead Ekle', icon: PlusCircle },
    { href: '/broker/commissions', label: 'Kazançlarım & Finans', icon: BadgeTurkishLira },
    { href: '/broker/commission-plans', label: 'Komisyon Planları', icon: TrendingUp },
    { href: '/broker/documents', label: 'Satış Materyalleri', icon: Library },
]

function NavLink({ item, pathname }: { item: typeof NAV_ITEMS[0]; pathname: string }) {
    const isActive = item.exact
        ? pathname === item.href || pathname === `/${item.href}`
        : pathname.startsWith(item.href)

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
            }`}
        >
            <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : ''}`} />
            {item.label}
        </Link>
    )
}

function MobileNavLink({ item, pathname }: { item: typeof NAV_ITEMS[0]; pathname: string }) {
    const isActive = item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href)

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-50'
            }`}
        >
            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
            {item.label}
        </Link>
    )
}

export default async function BrokerLayout(props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const { children } = props
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            full_name, 
            tenant_id, 
            role,
            broker_levels (
                name,
                color,
                icon
            )
        `)
        .eq('id', user.id)
        .single()

    const activeLevel = Array.isArray(profile?.broker_levels) ? profile.broker_levels[0] : profile?.broker_levels

    // Get current path for active highlighting
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const pathname = headersList.get('x-invoke-path') || headersList.get('x-matched-path') || '/broker'

    const logoutAction = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="flex h-screen w-full bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
                <div className="flex flex-col border-b px-6 py-4">
                    <Link href="/broker" className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">Novo Broker</span>
                    </Link>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-slate-500 truncate max-w-[120px] font-medium">
                            {profile?.full_name || user.email}
                        </div>
                        {activeLevel && (
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border"
                                style={{
                                    backgroundColor: (activeLevel.color || '#3b82f6') + '15',
                                    color: activeLevel.color || '#3b82f6',
                                    borderColor: (activeLevel.color || '#3b82f6') + '30'
                                }}
                            >
                                {activeLevel.name}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto py-3">
                    <nav className="grid gap-0.5 px-3">
                        {NAV_ITEMS.map((item) => (
                            <NavLink key={item.href} item={item} pathname={pathname} />
                        ))}
                    </nav>
                </div>
                <div className="p-3 border-t">
                    <LanguageSwitcher />
                </div>
                <div className="p-3 border-t">
                    <form action={logoutAction}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-red-600 hover:bg-red-50 h-10">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col sm:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center gap-4 border-b bg-white px-4 sm:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-5 border-b">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-slate-900">Novo Broker</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-slate-500">{profile?.full_name}</span>
                                        {activeLevel && (
                                            <span
                                                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border"
                                                style={{
                                                    backgroundColor: (activeLevel.color || '#3b82f6') + '15',
                                                    color: activeLevel.color || '#3b82f6',
                                                    borderColor: (activeLevel.color || '#3b82f6') + '30'
                                                }}
                                            >
                                                {activeLevel.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <nav className="flex-1 p-3 grid gap-0.5">
                                    {NAV_ITEMS.map((item) => (
                                        <MobileNavLink key={item.href} item={item} pathname={pathname} />
                                    ))}
                                </nav>
                                <div className="p-3 border-t">
                                    <LanguageSwitcher />
                                </div>
                                <div className="p-3 border-t">
                                    <form action={logoutAction}>
                                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:bg-red-50">
                                            <LogOut className="h-5 w-5" />
                                            Çıkış Yap
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Building2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold text-sm">Novo Broker</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Desktop Top Bar */}
                <header className="hidden sm:flex h-14 items-center justify-between border-b bg-white px-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-slate-700">Hoş Geldiniz, {profile?.full_name?.split(' ')[0]}</h2>
                        {activeLevel && (
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                style={{
                                    backgroundColor: (activeLevel.color || '#3b82f6') + '10',
                                    color: activeLevel.color || '#3b82f6',
                                    borderColor: (activeLevel.color || '#3b82f6') + '25'
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeLevel.color || '#3b82f6' }}></span>
                                {activeLevel.name}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <div
                            className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border"
                            style={activeLevel ? {
                                backgroundColor: (activeLevel.color || '#3b82f6') + '15',
                                color: activeLevel.color || '#3b82f6',
                                borderColor: (activeLevel.color || '#3b82f6') + '30'
                            } : { backgroundColor: '#eff6ff', color: '#2563eb' }}
                        >
                            {profile?.full_name?.charAt(0) || '?'}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
