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
    HandCoins
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function BrokerCommissionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Aggregate commissions for the broker
    const { data: commissions } = await supabase
        .from('commissions')
        .select('*, broker_leads!inner(*)')
        .eq('broker_leads.broker_id', user?.id)
        .order('created_at', { ascending: false })

    const totalEarned = commissions?.filter(c => c.status === 'Paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0
    const pendingPayment = commissions?.filter(c => c.status === 'Approved' || c.status === 'Eligible').reduce((sum, c) => sum + Number(c.amount), 0) || 0
    const totalRequests = commissions?.length || 0

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Komisyonlarım</h1>
                <p className="text-slate-500 text-sm">Satış süreçlerinden kazandığınız hak edişleri buradan izleyebilirsiniz.</p>
            </div>

            {/* Commission Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                <HandCoins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ödenen Toplam</p>
                                <p className="text-2xl font-bold text-slate-900">{totalEarned.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bekleyen Hak Ediş</p>
                                <p className="text-2xl font-bold text-slate-900">{pendingPayment.toLocaleString('tr-TR')} ₺</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-blue-600 text-white rounded-2xl overflow-hidden lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider">Toplam Kayıt</p>
                                <p className="text-2xl font-bold">{totalRequests} Adet</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-5 border-b border-slate-50">
                    <CardTitle className="text-lg font-bold">Ödeme Geçmişi ve Talepler</CardTitle>
                    <CardDescription>Sözleşmesi imzalanan müşterileriniz için oluşan komisyonlar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="border-none">
                                <TableHead className="font-bold text-slate-700 px-6 py-4">Müşteri</TableHead>
                                <TableHead className="font-bold text-slate-700">Tarih</TableHead>
                                <TableHead className="font-bold text-slate-700">Tutar</TableHead>
                                <TableHead className="font-bold text-slate-700">Durum</TableHead>
                                <TableHead className="font-bold text-slate-700 text-right px-6">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions && commissions.length > 0 ? (
                                commissions.map((c) => (
                                    <TableRow key={c.id} className="border-slate-50 hover:bg-slate-50 transition-colors">
                                        <TableCell className="px-6 py-5 font-medium">
                                            <p className="font-bold text-slate-900">{c.broker_leads.full_name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{c.currency}</p>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {new Date(c.created_at).toLocaleDateString('tr-TR')}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {Number(c.amount).toLocaleString('tr-TR')} {c.currency}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                c.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {c.status === 'Eligible' ? 'Hak Edildi' :
                                                    c.status === 'Approved' ? 'Onaylandı' :
                                                        c.status === 'Paid' ? 'Ödendi' : 'Beklemede'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            {c.invoice_url ? (
                                                <Button size="sm" variant="ghost" className="text-blue-600 gap-1 font-bold">
                                                    <FileText className="h-4 w-4" />
                                                    Fatura
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg border-slate-200">
                                                    Fatura Yükle
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                                        <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                        Henüz oluşmuş bir komisyon kaydınız bulunmamaktadır.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
