import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Banknote, FileText, Landmark, AlertCircle, CalendarCheck, BarChart3, TrendingDown } from 'lucide-react'
import { getFinancialAccounts, getValuablePapers, getFinanceDashboardStats, getAgingReport } from './actions'
import AccountsTable from './components/AccountsTable'
import ValuablePapersTable from './components/ValuablePapersTable'
import FinanceCharts from './components/FinanceCharts'
import AgingReportTable from './components/AgingReportTable'
import { formatCurrency } from '@/lib/utils'

export default async function FinancePage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const accounts = await getFinancialAccounts()
    const papers = await getValuablePapers()
    const stats = await getFinanceDashboardStats()
    const agingData = await getAgingReport()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Finans Yönetimi</h1>
                <p className="text-muted-foreground">Proje bazlı cari hesaplar, borç/alacak takibi ve kıymetli evrak yönetimi.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-emerald-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Alacak 👋</CardTitle>
                        <Landmark className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">
                            {formatCurrency(stats?.totalAlacak || 0, 'TRY')}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Cari hesaplardan beklenen</p>
                    </CardContent>
                </Card>
                <Card className="border-red-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Borç 🔥</CardTitle>
                        <Banknote className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-600">
                            {formatCurrency(stats?.totalBorc || 0, 'TRY')}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Ödenecek komisyon ve giderler</p>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 bg-orange-50/30 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vadesi Geçmiş Alacak ⚠️</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-orange-600">
                            {formatCurrency(stats?.overdueItems || 0, 'TRY')}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Acil tahsilat bekleyen</p>
                    </CardContent>
                </Card>
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Ay Tahsilat ✅</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-600">
                            {formatCurrency(stats?.collectionsThisMonth || 0, 'TRY')}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Gerçekleşen nakit girişi</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Summary Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FinanceCharts projectData={stats?.projectData || []} />

                <Card className="shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Kıymetli Evrak Özeti</CardTitle>
                        <CardDescription>Portföydeki çek ve senetlerin durumu.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Portföy Toplamı</span>
                            </div>
                            <span className="font-bold">{formatCurrency(stats?.portfolioTotal || 0, 'TRY')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 rounded-lg border border-slate-100 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Evrak Sayısı</p>
                                <p className="text-xl font-black">{stats?.paperCount || 0}</p>
                            </div>
                            <div className="p-3 rounded-lg border border-slate-100 text-center bg-blue-50/50">
                                <p className="text-[10px] text-blue-600 uppercase font-bold">Aktif Vade</p>
                                <p className="text-xl font-black text-blue-700">60 GÜN</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic text-center">
                            En yakın vade: {papers.filter(p => p.status === 'Portföyde')[0]?.due_date ? new Date(papers.filter(p => p.status === 'Portföyde')[0].due_date).toLocaleDateString('tr-TR') : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="accounts" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 mb-4 border border-slate-200/50">
                    <TabsTrigger value="accounts" className="data-[state=active]:bg-white shadow-sm gap-2">
                        <Landmark className="h-4 w-4" /> Cari Hesaplar
                    </TabsTrigger>
                    <TabsTrigger value="papers" className="data-[state=active]:bg-white shadow-sm gap-2">
                        <FileText className="h-4 w-4" /> Kıymetli Evrak
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="data-[state=active]:bg-white shadow-sm gap-2">
                        <BarChart3 className="h-4 w-4" /> Yaşlandırma Raporu
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="accounts">
                    <AccountsTable accounts={accounts} />
                </TabsContent>

                <TabsContent value="papers">
                    <ValuablePapersTable papers={papers} />
                </TabsContent>

                <TabsContent value="reports">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                                Alacak Yaşlandırma Raporu
                            </CardTitle>
                            <CardDescription>Vadesi geçmiş ödemelerin ve evrakların detaylı analizi.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgingReportTable data={agingData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
