import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Building2, LogOut, Menu, Settings } from 'lucide-react'
import { SidebarNav } from '@/components/dashboard/SidebarNav'

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
                    <SidebarNav />
                </div>
                <div className="mt-auto p-4 border-t flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-hidden">
                        {isAuthorizedForSettings && (
                            <Link href="/settings">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">Ayarlar</span>
                                </Button>
                            </Link>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                    </div>
                    <form action={async () => {
                        'use server'
                        const supabase = await createClient()
                        await supabase.auth.signOut()
                        redirect('/login')
                    }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Çıkış</span>
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col sm:gap-4 sm:py-4 sm:pl-64 print:pl-0">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:hidden print:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden" suppressHydrationWarning>
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0">
                            <div className="flex flex-col border-b px-4 py-3">
                                <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
                                    <Building2 className="h-6 w-6" />
                                    <span className="text-lg tracking-tight">NovoxCrm</span>
                                </Link>
                                <div className="mt-1 flex flex-col">
                                    <span className="text-xs font-bold text-foreground">{tenant?.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{profile?.full_name}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto py-2">
                                <SidebarNav />
                            </div>
                            <div className="p-4 border-t mt-auto flex items-center justify-between">
                                {isAuthorizedForSettings && (
                                    <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Settings className="h-4 w-4" />
                                        Ayarlar
                                    </Link>
                                )}
                                <form action={async () => {
                                    'use server'
                                    const supabase = await createClient()
                                    await supabase.auth.signOut()
                                    redirect('/login')
                                }}>
                                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                        <LogOut className="h-4 w-4" />
                                        Çıkış
                                    </Button>
                                </form>
                            </div>
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
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
