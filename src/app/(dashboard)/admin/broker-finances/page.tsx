
import { getAdminBrokerFinanceSummary } from '@/app/broker/finance-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    BadgeTurkishLira,
    Download,
    Upload,
    ChevronRight,
    Users,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    Search
} from "lucide-react"
import Link from 'next/link'
import FinanceExcelActions from './components/FinanceExcelActions'

export default async function BrokerFinanceDashboardPage() {
    const { data: summary, error } = await getAdminBrokerFinanceSummary()

    if (error) {
        return <div className="p-8 text-center text-red-500">Hata: {error}</div>
    }

    const totalBalance = summary?.reduce((sum, b) => sum + b.balance, 0) || 0
    const totalPaid = summary?.reduce((sum, b) => sum + b.totalPaid, 0) || 0
    const totalEarned = summary?.reduce((sum, b) => sum + b.totalEarned, 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Finansal Yönetim</h1>
                    <p className="text-muted-foreground">Broker komisyonları, teşvik kazançları ve ödeme süreçlerini yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <FinanceExcelActions summaryData={summary || []} />
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Toplam Bakiye (Ödenecek)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-blue-400" />
                            <div className="text-2xl font-bold">{totalBalance.toLocaleString('tr-TR')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-green-600">Ödenen Toplam</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-green-700">
                            <BadgeTurkishLira className="h-5 w-5" />
                            <div className="text-2xl font-bold">{totalPaid.toLocaleString('tr-TR')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600">Hak Edilen Toplam</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-blue-700">
                            <TrendingUp className="h-5 w-5" />
                            <div className="text-2xl font-bold">{totalEarned.toLocaleString('tr-TR')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aktif Broker Sayısı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-400" />
                            <div className="text-2xl font-bold">{summary?.length || 0}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Broker List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Broker Bazlı Bakiyeler</CardTitle>
                        <CardDescription>Ödeme bekleyen ve tamamlanan tüm finansal kayıtların özeti.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Broker Bilgileri</TableHead>
                                <TableHead>Partner Seviyesi</TableHead>
                                <TableHead className="text-right">Toplam Hak Ediş</TableHead>
                                <TableHead className="text-right">Toplam Ödenen</TableHead>
                                <TableHead className="text-right">Güncel Bakiye</TableHead>
                                <TableHead className="text-right px-6">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary && summary.length > 0 ? (
                                summary.map((broker) => (
                                    <TableRow key={broker.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{broker.name}</span>
                                                <span className="text-xs text-muted-foreground">{broker.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                {broker.level || 'Standart'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {broker.totalEarned.toLocaleString('tr-TR')} ₺
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {broker.totalPaid.toLocaleString('tr-TR')} ₺
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${broker.balance > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {broker.balance.toLocaleString('tr-TR')} ₺
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Link href={`/admin/broker-finances/${broker.id}`}>
                                                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 font-bold">
                                                    Detaylar <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                        Henüz finansal kayıt bulunmamaktadır.
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
