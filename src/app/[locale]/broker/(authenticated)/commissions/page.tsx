import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    TrendingUp,
    HandCoins,
    Wallet,
    CheckCircle2,
    Calendar
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTranslations } from 'next-intl/server'

export default async function BrokerCommissionsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const [t, { data: { user } }] = await Promise.all([
        getTranslations('Broker.dashboard'),
        supabase.auth.getUser(),
    ])

    if (!user) return null

    // Parallel fetch with error tolerance
    const [commissionsResult, incentivesResult, paymentsResult] = await Promise.all([
        supabase
            .from('commissions')
            .select('id, amount, currency, status, description, created_at, broker_leads(full_name, created_at)')
            .eq('broker_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
        supabase
            .from('incentive_earnings')
            .select('id, amount, currency, status, description, created_at, incentive_campaigns(name)')
            .eq('broker_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50),
        supabase
            .from('broker_payments')
            .select('*')
            .eq('broker_id', user.id)
            .order('payment_date', { ascending: false })
            .limit(50),
    ])

    const commissions = commissionsResult.data || []
    const incentives = incentivesResult.data || []
    const payments = paymentsResult.data || []

    // Aggregate Stats
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
    const totalIncentives = incentives.reduce((sum, i) => sum + Number(i.amount || 0), 0)
    const totalEarned = totalCommissions + totalIncentives
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const balance = totalEarned - totalPaid

    // Merge all earnings into a single sorted list
    const allEarnings = [
        ...commissions.map(c => ({
            id: c.id,
            type: 'Komisyon' as const,
            label: (c as any).broker_leads?.full_name || 'Satış Komisyonu',
            amount: Number(c.amount || 0),
            currency: c.currency || 'TRY',
            status: c.status,
            description: c.description,
            created_at: c.created_at,
        })),
        ...incentives.map(i => ({
            id: i.id,
            type: 'Teşvik' as const,
            label: (i as any).incentive_campaigns?.name || 'Kampanya Kazancı',
            amount: Number(i.amount || 0),
            currency: i.currency || 'TRY',
            status: i.status,
            description: i.description,
            created_at: i.created_at,
        })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="space-y-6 pb-12 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kazançlarım ve Finansal Durum</h1>
                <p className="text-slate-500 text-sm mt-1">Satış komisyonları, teşvik puanları ve aldığınız ödemelerin özeti.</p>
            </div>

            {/* Financial Summary */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white rounded-xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Hak Ediş</p>
                                <p className="text-lg font-bold text-slate-900">{totalEarned.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <HandCoins className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alınan Ödeme</p>
                                <p className="text-lg font-bold text-slate-900">{totalPaid.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Güncel Bakiye</p>
                                <p className="text-lg font-bold">{balance.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-xl">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ödeme Sayısı</p>
                                <p className="text-lg font-bold text-slate-900">{payments.length} Adet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="earnings" className="w-full">
                <TabsList className="bg-slate-100/60 p-1 rounded-xl mb-4">
                    <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 text-sm">Kazanç Detayları</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 text-sm">Ödeme Geçmişi</TabsTrigger>
                </TabsList>

                <TabsContent value="earnings">
                    <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-slate-50">
                            <CardTitle className="text-base font-bold">Tüm Hak Edişler</CardTitle>
                            <CardDescription className="text-xs">Satış komisyonları ve kampanya teşvik kazançlarınızın listesi.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/60">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-slate-600 px-6 py-3 text-[11px] uppercase tracking-wider">Detay / Kaynak</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Tür</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right">Tutar</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right">Durum</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right px-6">Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allEarnings.length > 0 ? allEarnings.map((item) => (
                                        <TableRow key={`${item.type}-${item.id}`} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm">{item.label}</span>
                                                    {item.description && <span className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">{item.description}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                    item.type === 'Komisyon' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                {item.amount.toLocaleString('tr-TR')} {item.currency === 'TRY' ? '₺' : item.currency}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${
                                                    item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {item.status === 'Paid' ? 'Ödendi' : 'Hakedildi'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right px-6 text-xs text-slate-500 font-medium">
                                                {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-16 text-center">
                                                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                                <p className="text-sm text-slate-400">Henüz bir kazanç kaydınız bulunmamaktadır.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-slate-50">
                            <CardTitle className="text-base font-bold">Ödeme Geçmişi</CardTitle>
                            <CardDescription className="text-xs">Banka hesabınıza aktarılan gerçek ödemelerin dökümü.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/60">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-slate-600 px-6 py-3 text-[11px] uppercase tracking-wider text-center w-12">#</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Tutar</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Yöntem / Referans</TableHead>
                                        <TableHead className="font-bold text-slate-600 text-[11px] uppercase tracking-wider text-right px-6">Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length > 0 ? payments.map((p, idx) => (
                                        <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="w-12 text-center text-[10px] font-bold text-slate-300 px-6">
                                                {(payments.length - idx).toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell className="py-4 font-bold text-emerald-600 text-base">
                                                +{Number(p.amount).toLocaleString('tr-TR')} {p.currency || '₺'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-700">{p.payment_method || 'Banka Transferi'}</span>
                                                    {p.reference_no && <span className="text-[10px] text-slate-400">Ref: {p.reference_no}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-semibold text-slate-900">{new Date(p.payment_date).toLocaleDateString('tr-TR')}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Tahsil Edildi
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-16 text-center">
                                                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-10" />
                                                <p className="text-sm text-slate-400">Henüz bir ödeme almadınız. Bakiyenizi takip edebilirsiniz.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
