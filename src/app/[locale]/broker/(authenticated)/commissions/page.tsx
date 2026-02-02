import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    BadgeTurkishLira,
    Clock,
    CheckCircle2,
    FileText,
    ArrowUpRight,
    HandCoins,
    Zap,
    Wallet,
    Calendar
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function BrokerCommissionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch Commissions
    const { data: commissions } = await supabase
        .from('commissions')
        .select('*, broker_leads!inner(full_name, created_at)')
        .eq('broker_leads.broker_id', user?.id)
        .order('created_at', { ascending: false })

    // 2. Fetch Incentives
    const { data: incentives } = await supabase
        .from('incentive_earnings')
        .select('*, campaign_id(name)')
        .eq('broker_id', user?.id)
        .order('created_at', { ascending: false })

    // 3. Fetch Payment History
    const { data: payments } = await supabase
        .from('broker_payments')
        .select('*')
        .eq('broker_id', user?.id)
        .order('payment_date', { ascending: false })

    // Aggregate Stats
    const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0
    const totalIncentives = incentives?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const totalEarned = totalCommissions + totalIncentives

    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const balance = totalEarned - totalPaid

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kazançlarım ve Finansal Durum</h1>
                <p className="text-slate-500 text-sm">Satış komisyonları, teşvik puanları ve aldığınız ödemelerin özeti.</p>
            </div>

            {/* Financial Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Hak Ediş</p>
                                <p className="text-xl font-bold text-slate-900">{totalEarned.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                <HandCoins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alınan Ödeme</p>
                                <p className="text-xl font-bold text-slate-900">{totalPaid.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-lg bg-blue-600 text-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                <Wallet className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Güncel Bakiye</p>
                                <p className="text-xl font-bold">{balance.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ödeme Sayısı</p>
                                <p className="text-xl font-bold text-slate-900">{payments?.length || 0} Adet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="earnings" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl mb-4">
                    <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Kazanç Detayları</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Ödeme Geçmişi</TabsTrigger>
                </TabsList>

                <TabsContent value="earnings">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="px-6 py-5 border-b border-slate-50">
                            <CardTitle className="text-lg font-bold">Tüm Hak Edişler</CardTitle>
                            <CardDescription>Satış komisyonları ve kampanya teşvik kazançlarınızın listesi.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-slate-700 px-6 py-4 text-[11px] uppercase tracking-wider">Detay / Kaynak</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Tür</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right">Tutar</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right">Durum</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right px-6">Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...(commissions?.map(c => ({ ...c, type: 'Komisyon', label: c.broker_leads.full_name })) || []),
                                    ...(incentives?.map(i => ({ ...i, type: 'Teşvik', label: i.campaign_id?.name || 'Kampanya Kazancı' })) || [])]
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .map((item) => (
                                            <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50 transition-colors">
                                                <TableCell className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 text-sm">{item.label}</span>
                                                        {item.description && <span className="text-[10px] text-slate-400 italic line-clamp-1">{item.description}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.type === 'Komisyon' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">
                                                    {Number(item.amount).toLocaleString('tr-TR')} {item.currency}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {item.status === 'Paid' ? 'Ödendi' : 'Hakedildi'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right px-6 text-xs text-slate-500 font-medium">
                                                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {(!commissions?.length && !incentives?.length) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">
                                                Henüz bir kazanç kaydınız bulunmamaktadır.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="px-6 py-5 border-b border-slate-50">
                            <CardTitle className="text-lg font-bold">Ödeme Geçmişi</CardTitle>
                            <CardDescription>Banka hesabınıza aktarılan gerçek ödemelerin dökümü.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-slate-700 px-6 py-4 text-[11px] uppercase tracking-wider text-center w-12">#</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Tutar</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Yöntem / Referans</TableHead>
                                        <TableHead className="font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right px-6">Tarih</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments && payments.length > 0 ? (
                                        payments.map((p, idx) => (
                                            <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50 transition-colors">
                                                <TableCell className="w-12 text-center text-[10px] font-black text-slate-300 px-6">
                                                    {(payments.length - idx).toString().padStart(2, '0')}
                                                </TableCell>
                                                <TableCell className="py-5 font-black text-green-600 text-lg">
                                                    +{Number(p.amount).toLocaleString('tr-TR')} {p.currency}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{p.payment_method}</span>
                                                        {p.reference_no && <span className="text-[10px] text-slate-400">Ref: {p.reference_no}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-slate-900">{new Date(p.payment_date).toLocaleDateString('tr-TR')}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Tahsil Edildi
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center text-slate-400 italic">
                                                Henüz bir ödeme almadınız. Bakiyenizi takip edebilirsiniz.
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
