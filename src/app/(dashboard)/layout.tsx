import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Building2, Home, Users, FileText, LogOut, Menu, Settings, Package, Activity, CalendarCheck, Banknote, MessageSquare } from 'lucide-react'



export default async function DashboardLayout({
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

    // Fetch profile and tenant info
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenant_id')
        .eq('id', user.id)
        .single()

    const { data: tenant } = profile?.tenant_id ? await supabase
        .from('tenants')
        .select('name')
        .eq('id', profile.tenant_id)
        .single() : { data: null }

    return (
        <div className="flex h-screen w-full bg-muted/40">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex print:hidden">
                <div className="flex flex-col border-b px-4 py-3 lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
                        <Building2 className="h-6 w-6" />
                        <span className="text-lg tracking-tight">NovoxCrm</span>
                    </Link>
                    <div className="mt-1 flex flex-col">
                        <span className="text-xs font-bold text-foreground truncate">{tenant?.name || 'Yükleniyor...'}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{profile?.full_name || user.email}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Genel Bakış
                        </Link>
                        <Link
                            href="/projects"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Building2 className="h-4 w-4" />
                            Projeler
                        </Link>
                        <Link
                            href="/inventory"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Home className="h-4 w-4" />
                            Stok Yönetimi
                        </Link>
                        <Link
                            href="/customers"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Users className="h-4 w-4" />
                            Müşteriler
                        </Link>
                        <Link
                            href="/teams"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Users className="h-4 w-4" />
                            Satış Ekipleri
                        </Link>
                        <Link
                            href="/crm"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Activity className="h-4 w-4" />
                            Satış Yönetimi
                        </Link>
                        <Link
                            href="/options"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Package className="h-4 w-4" />
                            Opsiyonlar
                        </Link>
                        <Link
                            href="/offers"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <FileText className="h-4 w-4" />
                            Teklifler
                        </Link>
                        <Link
                            href="/contracts"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <FileText className="h-4 w-4" />
                            Sözleşmeler
                        </Link>
                        <Link
                            href="/finance/deposits"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Banknote className="h-4 w-4" />
                            Kapora Yönetimi
                        </Link>
                        <Link
                            href="/activities"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Aktiviteler
                        </Link>
                        <Link
                            href="/customer-support"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Servis Talepleri
                        </Link>

                        <div className="mt-4 mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            Raporlar
                        </div>
                        <Link
                            href="/reports/sales"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Activity className="h-4 w-4" />
                            Satış Performansı
                        </Link>
                        <Link
                            href="/reports/inventory"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Building2 className="h-4 w-4" />
                            Stok & Proje Analizi
                        </Link>
                        <Link
                            href="/reports/finance"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Banknote className="h-4 w-4" />
                            Finansal Analiz
                        </Link>
                        <Link
                            href="/reports/activities"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Saha & Ekip Verimliliği
                        </Link>

                        <Link
                            href="/settings"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                        >
                            <Settings className="h-4 w-4" />
                            Ayarlar
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                        <form action={async () => {
                            'use server'
                            const supabase = await createClient()
                            await supabase.auth.signOut()
                            redirect('/login')
                        }}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <LogOut className="h-4 w-4" />
                                <span className="sr-only">Çıkış</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col sm:gap-4 sm:py-4 sm:pl-64 print:pl-0">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:hidden print:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="/"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Home className="h-5 w-5" />
                                    NovoxCrm
                                </Link>
                                <Link
                                    href="/"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    Genel Bakış
                                </Link>
                                <Link
                                    href="/projects"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Building2 className="h-5 w-5" />
                                    Projeler
                                </Link>
                                <Link
                                    href="/inventory"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Home className="h-5 w-5" />
                                    Stok Yönetimi
                                </Link>
                                <Link
                                    href="/customers"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Users className="h-5 w-5" />
                                    Müşteriler
                                </Link>
                                <Link
                                    href="/teams"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Users className="h-5 w-5" />
                                    Satış Ekipleri
                                </Link>
                                <Link
                                    href="/crm"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Activity className="h-5 w-5" />
                                    Satış Yönetimi
                                </Link>
                                <Link
                                    href="/options"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Package className="h-5 w-5" />
                                    Opsiyonlar
                                </Link>
                                <Link
                                    href="/offers"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <FileText className="h-5 w-5" />
                                    Teklifler
                                </Link>
                                <Link
                                    href="/contracts"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <FileText className="h-5 w-5" />
                                    Sözleşmeler
                                </Link>
                                <Link
                                    href="/finance/deposits"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Banknote className="h-5 w-5" />
                                    Kapora Yönetimi
                                </Link>
                                <Link
                                    href="/activities"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <CalendarCheck className="h-5 w-5" />
                                    Aktiviteler
                                </Link>
                                <Link
                                    href="/customer-support"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <MessageSquare className="h-5 w-5" />
                                    Servis Talepleri
                                </Link>

                                <div className="px-2.5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                                    Raporlar
                                </div>
                                <Link
                                    href="/reports/sales"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground pl-6"
                                >
                                    <Activity className="h-5 w-5" />
                                    Satış Performansı
                                </Link>
                                <Link
                                    href="/reports/inventory"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground pl-6"
                                >
                                    <Building2 className="h-5 w-5" />
                                    Stok & Proje Analizi
                                </Link>
                                <Link
                                    href="/reports/finance"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground pl-6"
                                >
                                    <Banknote className="h-5 w-5" />
                                    Finansal Analiz
                                </Link>
                                <Link
                                    href="/reports/activities"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground pl-6"
                                >
                                    <CalendarCheck className="h-5 w-5" />
                                    Saha & Ekip Verimliliği
                                </Link>

                                <Link
                                    href="/settings"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Settings className="h-5 w-5" />
                                    Ayarlar
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="flex flex-col ml-2">
                        <span className="font-bold text-sm leading-none">NovoxCrm</span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground font-medium">{tenant?.name}</span>
                            <span className="text-[10px] text-muted-foreground/60">•</span>
                            <span className="text-[10px] text-muted-foreground/60">{profile?.full_name || user.email}</span>
                        </div>
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
