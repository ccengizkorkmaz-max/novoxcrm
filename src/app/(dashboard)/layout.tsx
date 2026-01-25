import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Building2, Home, Users, FileText, LogOut, Menu, Settings, Package, Activity, CalendarCheck, Banknote } from 'lucide-react'



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

    return (
        <div className="flex h-screen w-full bg-muted/40">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex print:hidden">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Building2 className="h-6 w-6" />
                        <span className="">NovoCRM</span>
                    </Link>
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
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 print:pl-0">
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
                                    NovoCRM
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
                                    href="/settings"
                                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                    <Settings className="h-5 w-5" />
                                    Ayarlar
                                </Link>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <span className="font-semibold">NovoCRM</span>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
