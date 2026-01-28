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

export default async function BrokerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

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

    // Redirection check for role-based access if necessary
    // if (profile?.role !== 'broker') redirect('/')

    return (
        <div className="flex h-screen w-full bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
                <div className="flex flex-col border-b px-6 py-4">
                    <Link href="/broker" className="flex items-center gap-2 font-bold text-blue-600">
                        <Building2 className="h-6 w-6" />
                        <span className="text-xl tracking-tight">Novox Broker</span>
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {profile?.full_name || user.email}
                        </div>
                        {activeLevel && (
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border"
                                style={{
                                    backgroundColor: (activeLevel.color || '#000') + '20',
                                    color: activeLevel.color || '#000',
                                    borderColor: (activeLevel.color || '#000') + '40'
                                }}
                            >
                                {activeLevel.name}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid gap-1 px-4 text-sm font-medium">
                        <Link
                            href="/broker"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/broker/leads"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <Users className="h-4 w-4" />
                            Müşterilerim (Leads)
                        </Link>
                        <Link
                            href="/broker/leads/new"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Yeni Lead Ekle
                        </Link>
                        <Link
                            href="/broker/commissions"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Komisyonlarım
                        </Link>
                        <Link
                            href="/broker/commission-plans"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <BadgeTurkishLira className="h-4 w-4" />
                            Komisyon Planları
                        </Link>
                        <Link
                            href="/broker/documents"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-blue-600"
                        >
                            <Library className="h-4 w-4" />
                            Satış Materyalleri
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t">
                    <form action={async () => {
                        'use server'
                        const supabase = await createClient()
                        await supabase.auth.signOut()
                        redirect('/login')
                    }}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />
                            Çıkış Yap
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col sm:pl-64">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 sm:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <div className="flex flex-col h-full bg-white">
                                <div className="p-6 border-b">
                                    <div className="text-xl font-bold text-blue-600">Novox Broker</div>
                                    <div className="text-xs text-muted-foreground mt-1">{profile?.full_name}</div>
                                </div>
                                <nav className="flex-1 p-4 grid gap-2">
                                    <Link href="/broker" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <LayoutDashboard className="h-5 w-5 text-blue-600" />
                                        Dashboard
                                    </Link>
                                    <Link href="/broker/leads" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        Müşterilerim
                                    </Link>
                                    <Link href="/broker/leads/new" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <PlusCircle className="h-5 w-5 text-blue-600" />
                                        Yeni Lead Ekle
                                    </Link>
                                    <Link href="/broker/commissions" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                        Komisyonlarım
                                    </Link>
                                    <Link href="/broker/commission-plans" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <BadgeTurkishLira className="h-5 w-5 text-blue-600" />
                                        Komisyon Planları
                                    </Link>
                                    <Link href="/broker/documents" className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100">
                                        <Library className="h-5 w-5 text-blue-600" />
                                        Materyaller
                                    </Link>
                                </nav>
                                <div className="p-4 border-t">
                                    <Button variant="ghost" className="w-full justify-start text-red-600">
                                        <LogOut className="h-5 w-5 mr-3" />
                                        Çıkış Yap
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-lg">Novox Broker</span>
                    <div className="ml-auto">
                        <Button size="icon" variant="ghost" className="relative text-slate-600">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                        </Button>
                    </div>
                </header>

                {/* Desktop Top Bar (Hidden on Mobile) */}
                <header className="hidden sm:flex h-16 items-center justify-between border-b bg-white px-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-800">Hoş Geldiniz, {profile?.full_name?.split(' ')[0]}</h2>
                        {activeLevel && (
                            <div
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
                                style={{
                                    backgroundColor: (activeLevel.color || '#000') + '10',
                                    color: activeLevel.color || '#000',
                                    borderColor: (activeLevel.color || '#000') + '30'
                                }}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeLevel.color || '#000' }}></span>
                                {activeLevel.name}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button size="icon" variant="ghost" className="relative text-slate-600">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs" style={activeLevel ? { backgroundColor: (activeLevel.color || '#000') + '20', color: activeLevel.color || '#000' } : {}}>
                            {profile?.full_name?.charAt(0)}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
