import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Banknote, FileText, Landmark, PieChart } from 'lucide-react'
import { getFinancialAccounts, getValuablePapers } from './actions'
import AccountsTable from './components/AccountsTable'
import ValuablePapersTable from './components/ValuablePapersTable'

export default async function FinancePage() {
    const accounts = await getFinancialAccounts()
    const papers = await getValuablePapers()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Finans Yönetimi</h1>
                <p className="text-muted-foreground">Cari hesaplar, borç/alacak takibi ve kıymetli evrak yönetimi.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
                        <Landmark className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                                accounts.reduce((acc, curr) => curr.balance > 0 ? acc + curr.balance : acc, 0)
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Müşterilerden beklenen tahsilatlar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
                        <Banknote className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                                Math.abs(accounts.reduce((acc, curr) => curr.balance < 0 ? acc + curr.balance : acc, 0))
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Ödenecek komisyon ve giderler</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Portföydeki Çek/Senet</CardTitle>
                        <FileText className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                                papers.filter(p => p.status === 'Portfolio').reduce((acc, curr) => acc + curr.amount, 0)
                            ) || '₺0,00'}
                        </div>
                        <p className="text-xs text-muted-foreground">{papers.filter(p => p.status === 'Portfolio').length} adet evrak</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nakit Akışı (30 Gün)</CardTitle>
                        <PieChart className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₺0,00</div>
                        <p className="text-xs text-muted-foreground">Tahmini vadesi gelen ödemeler</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="accounts" className="w-full">
                <TabsList className="bg-slate-100/50 p-1 mb-4">
                    <TabsTrigger value="accounts" className="data-[state=active]:bg-white shadow-sm">
                        Cari Hesaplar
                    </TabsTrigger>
                    <TabsTrigger value="papers" className="data-[state=active]:bg-white shadow-sm">
                        Kıymetli Evrak
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="data-[state=active]:bg-white shadow-sm">
                        Raporlar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="accounts">
                    <AccountsTable accounts={accounts} />
                </TabsContent>

                <TabsContent value="papers">
                    <ValuablePapersTable papers={papers} />
                </TabsContent>

                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Finansal Raporlar</CardTitle>
                            <CardDescription>Gelecek versiyonlarda aktif edilecektir.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground italic">Raporlar hazırlanıyor...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
