import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Home, CreditCard, Calendar, Clock, ChevronRight, FileText } from "lucide-react"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default async function PortalDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id, full_name')
        .eq('id', user?.id)
        .single()

    // Get contracts for this customer via contract_customers link
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            contract_customers!inner(customer_id),
            unit: units(
                *,
                projects(*)
            )
        `)
        .eq('contract_customers.customer_id', profile?.customer_id)

    // Calculate totals for next payment
    // 1. Get payment plans for these contracts
    const { data: plans } = await supabase
        .from('payment_plans')
        .select('id')
        .in('contract_id', contracts?.map(c => c.id) || [])

    // 2. Get next pending payment item for these plans
    const { data: payments } = await supabase
        .from('payment_items')
        .select('*')
        .in('payment_plan_id', plans?.map(p => p.id) || [])
        .eq('status', 'Pending')
        .order('due_date', { ascending: true })
        .limit(1)

    const nextPayment = payments?.[0]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hoş Geldiniz, {profile?.full_name}</h1>
                <p className="text-slate-500">Mülklerinize ve ödeme süreçlerinize dair genel özet.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100">Gelecek Ödeme</CardDescription>
                        <CardTitle className="text-3xl">
                            {nextPayment ? formatCurrency(nextPayment.amount) : 'Ödemeniz Yok'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-blue-100">
                            <Calendar className="h-4 w-4" />
                            {nextPayment
                                ? new Date(nextPayment.due_date).toLocaleDateString('tr-TR')
                                : '-'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Aktif Mülk Sayısı</CardDescription>
                        <CardTitle className="text-3xl text-slate-900">{contracts?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Building2 className="h-4 w-4" />
                            NovoxCrm Güvencesiyle
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Teslimat Durumu</CardDescription>
                        <CardTitle className="text-3xl text-slate-900">
                            {translateDeliveryStatus(contracts?.[0]?.delivery_status)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Teslimat Süreci</span>
                                <span>{getDeliveryProgress(contracts?.[0]?.delivery_status)}%</span>
                            </div>
                            <Progress value={getDeliveryProgress(contracts?.[0]?.delivery_status)} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm overflow-hidden border-l-4 border-emerald-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-emerald-700 font-medium">Tapu Süreci</CardDescription>
                            <FileText className="h-4 w-4 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl text-slate-900">
                            {translateTitleDeedStatus(contracts?.[0]?.title_deed_status)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Güncel Aşama</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                                    {contracts?.[0]?.title_deed_status === 'Handed Over' ? 'Tamamlandı' : 'İşlemde'}
                                </Badge>
                            </div>
                            <Progress value={getTitleDeedProgress(contracts?.[0]?.title_deed_status)} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>İnşaat İlerlemesi</CardDescription>
                        <CardTitle className="text-2xl text-slate-900">Genel İlerleme</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Proje Tamamlanma Oranı</span>
                                <span>%85</span>
                            </div>
                            <Progress value={85} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Mülklerim</CardTitle>
                            <CardDescription>Sahibi olduğunuz bağımsız bölümler.</CardDescription>
                        </div>
                        <Home className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contracts?.map((contract) => (
                            <div key={contract.id} className="flex items-center justify-between p-4 rounded-xl border group hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{contract.unit?.projects?.name}</p>
                                        <p className="text-xs text-slate-500">No: {contract.unit?.unit_number} | {contract.unit?.type}</p>
                                    </div>
                                </div>
                                <Link href="/customerservices/tracking" className="p-2 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600">
                                    <ChevronRight className="h-5 w-5" />
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Son Aktiviteler</CardTitle>
                            <CardDescription>Süreçlerinizdeki son güncellemeler.</CardDescription>
                        </div>
                        <Clock className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                <div>
                                    <p className="text-sm font-medium">Sözleşme Revize Edildi</p>
                                    <p className="text-xs text-slate-500">2 gün önce</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                                <div>
                                    <p className="text-sm font-medium">Ödeme Onaylandı: 50.000 TL</p>
                                    <p className="text-xs text-slate-500">5 gün önce</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function translateDeliveryStatus(status: string) {
    const map: Record<string, string> = {
        'Pending': 'Beklemede',
        'In Progress': 'Hazırlanıyor',
        'Ready': 'Teslime Hazır',
        'Delivered': 'Teslim Edildi'
    }
    return map[status] || 'Hazırlanıyor'
}

function getDeliveryProgress(status: string) {
    const map: Record<string, number> = {
        'Pending': 25,
        'In Progress': 50,
        'Ready': 90,
        'Delivered': 100
    }
    return map[status] || 0
}

function translateTitleDeedStatus(status: string) {
    const map: Record<string, string> = {
        'Pending': 'Hazırlık Aşamasında',
        'In Progress': 'Başvuru Yapıldı',
        'Ready': 'Tapu Hazır',
        'Handed Over': 'Tapu Teslim Edildi'
    }
    return map[status] || 'Beklemede'
}

function getTitleDeedProgress(status: string) {
    const map: Record<string, number> = {
        'Pending': 20,
        'In Progress': 60,
        'Ready': 90,
        'Handed Over': 100
    }
    return map[status] || 0
}
