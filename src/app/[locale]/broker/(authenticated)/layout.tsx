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
    Building2,
    BadgeTurkishLira,
    ChevronRight,
    UserCircle,
    MessageSquare,
    Share2
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import LanguageSwitcher from '@/components/LanguageSwitcher'

const NAV_ITEMS = [
    { href: '/broker', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/broker/projects', label: 'Projeler & Envanter', icon: Building2 },
    { href: '/broker/leads', label: 'Müşterilerim', icon: Users },
    { href: '/broker/leads/new', label: 'Yeni Lead Ekle', icon: PlusCircle },
    { href: '/broker/commissions', label: 'Kazançlarım', icon: BadgeTurkishLira },
    { href: '/broker/commission-plans', label: 'Komisyon Planları', icon: TrendingUp },
    { href: '/broker/documents', label: 'Satış Materyalleri', icon: Library },
    { href: '/broker/messages', label: 'Mesajlarım', icon: MessageSquare },
    { href: '/broker/profile', label: 'Profilim', icon: UserCircle },
    { href: '/broker/tools', label: 'Paylaşım Araçları', icon: Share2 },
]

export default async function BrokerLayout(props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const { children } = props
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/broker/login')

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

    const logoutAction = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/broker/login')
    }

    const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

    return (
        <div className="flex h-screen w-full bg-[#f0f2f5]">
            {/* Desktop Sidebar — Dark Premium */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-[260px] flex-col sm:flex" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                {/* Brand */}
                <div className="px-5 py-5 border-b border-white/5">
                    <Link href="/broker" className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Building2 className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-white tracking-tight block leading-none">Novo Broker</span>
                            <span className="text-[10px] text-slate-400 font-medium">Partner Portal</span>
                        </div>
                    </Link>
                </div>

                {/* User Info */}
                <div className="px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg"
                            style={activeLevel ? {
                                background: `linear-gradient(135deg, ${activeLevel.color || '#3b82f6'}40, ${activeLevel.color || '#3b82f6'}20)`,
                                color: activeLevel.color || '#3b82f6',
                                border: `1px solid ${activeLevel.color || '#3b82f6'}30`
                            } : { background: 'linear-gradient(135deg, #3b82f620, #3b82f610)', color: '#60a5fa' }}
                        >
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{profile?.full_name || 'Broker'}</p>
                            {activeLevel && (
                                <span
                                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider mt-0.5"
                                    style={{ color: activeLevel.color || '#60a5fa' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeLevel.color || '#60a5fa' }} />
                                    {activeLevel.name} Partner
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-auto py-3 px-3">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] px-3 mb-2">Menü</p>
                    <nav className="grid gap-0.5">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white group"
                            >
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <span className="flex-1">{item.label}</span>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-white/5">
                    <LanguageSwitcher variant="light" />
                </div>
                <div className="px-3 py-3 border-t border-white/5">
                    <form action={logoutAction}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-10 rounded-xl text-xs">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col sm:pl-[260px]">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center gap-4 border-b bg-white/80 backdrop-blur-xl px-4 sm:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="ghost" className="rounded-xl">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0 border-0" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
                            <div className="flex flex-col h-full">
                                <div className="p-5 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                                            <Building2 className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-base font-bold text-white">Novo Broker</span>
                                            <p className="text-[10px] text-slate-400">{profile?.full_name}</p>
                                        </div>
                                    </div>
                                </div>
                                <nav className="flex-1 p-3 grid gap-0.5">
                                    {NAV_ITEMS.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                                <div className="p-3 border-t border-white/5">
                                    <form action={logoutAction}>
                                        <Button variant="ghost" className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 rounded-xl">
                                            <LogOut className="h-5 w-5" />
                                            Çıkış Yap
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            <Building2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold text-sm">Novo Broker</span>
                    </div>
                    <div className="ml-auto">
                        <LanguageSwitcher />
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
