import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, CreditCard, CalendarCheck, FileText, LogOut, ShieldCheck } from 'lucide-react'

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
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

    return (
        <div className="flex h-screen w-full bg-slate-50/50">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
                <div className="flex flex-col border-b px-6 py-5">
                    <div className="flex items-center gap-2 font-bold text-blue-600">
                        <ShieldCheck className="h-6 w-6" />
                        <span className="text-xl tracking-tight">Müşteri Portalı</span>
                    </div>
                    <div className="mt-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {profile.tenants?.name}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 gap-1 text-sm font-medium">
                        <Link
                            href="/customerservices"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-blue-600 bg-blue-50 transition-all"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Genel Bakış
                        </Link>
                        <Link
                            href="/customerservices/financials"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <CreditCard className="h-4 w-4" />
                            Ödemelerim
                        </Link>
                        <Link
                            href="/customerservices/tracking"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Tapu & Teslimat
                        </Link>
                        <Link
                            href="/customerservices/service-requests"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <Activity className="h-4 w-4" />
                            Servis Talepleri
                        </Link>
                        <Link
                            href="/customerservices/documents"
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-all"
                        >
                            <FileText className="h-4 w-4" />
                            Belgelerim
                        </Link>
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {profile.full_name?.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold truncate">{profile.full_name}</span>
                            <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                        </div>
                    </div>
                    <form action={async () => {
                        'use server'
                        const supabase = await createClient()
                        await supabase.auth.signOut()
                        redirect('/login')
                    }}>
                        <Button variant="outline" className="w-full gap-2 text-slate-600 border-slate-200">
                            <LogOut className="h-4 w-4" />
                            Güvenli Çıkış
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 sm:pl-64 flex flex-col min-w-0">
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

import { Activity } from 'lucide-react'
