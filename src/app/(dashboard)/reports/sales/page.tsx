import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Users, DollarSign, Target } from "lucide-react"
import Link from "next/link"
import { getSalesAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import SalesTrendChart from "../components/SalesTrendChart"
import StatusDistributionChart from "../components/StatusDistributionChart"
import TeamPerformanceChart from "../components/TeamPerformanceChart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function SalesReportsPage() {
    const data = await getSalesAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const {
        totalRevenue, totalSales, activeLeads, conversionRate,
        pieData, monthlyData, teamData, channelData, enrichedSales
    } = data

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Satış Performansı</h1>
                        <p className="text-sm text-muted-foreground">Şirket genelindeki satış verilerinin detaylı analizi.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AnalyticsMetricCard
                    title="Toplam Ciro"
                    value={`${(totalRevenue / 1000000).toFixed(2)}M ₺`}
                    description="Kapatılan satışlar toplamı"
                    icon={DollarSign}
                />
                <AnalyticsMetricCard
                    title="Satış Adedi"
                    value={totalSales.toString()}
                    description="Toplam işlem sayısı"
                    icon={TrendingUp}
                    color="text-green-600"
                />
                <AnalyticsMetricCard
                    title="Aktif Adaylar"
                    value={activeLeads.toString()}
                    description="Pipeline'daki sıcak leadler"
                    icon={Target}
                    color="text-amber-600"
                />
                <AnalyticsMetricCard
                    title="Dönüşüm Oranı"
                    value={`%${conversionRate.toFixed(1)}`}
                    description="Lead'den satışa dönüş"
                    icon={Users}
                    color="text-purple-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <SalesTrendChart data={monthlyData} />
                <StatusDistributionChart data={pieData} />
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <TeamPerformanceChart data={teamData} />
                <StatusDistributionChart data={channelData} />
            </div>

            {/* List View Section */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <h3 className="font-semibold text-lg">Satış Detay Listesi (Eski Tip Görünüm)</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tüm satış ve lead kayıtlarının her birini detaylarıyla inceleyebilirsiniz.
                    </p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Müşteri Kaynağı</TableHead>
                            <TableHead>Satış Temsilcisi</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrichedSales.slice(0, 15).map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="text-sm">
                                    {new Date(sale.created_at).toLocaleDateString('tr-TR')}
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                                        {sale.customer_source}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium">{sale.sales_rep}</TableCell>
                                <TableCell>
                                    <span className="capitalize">{
                                        sale.status === 'Lead' ? 'Aday' :
                                            sale.status === 'Sold' ? 'Satıldı' :
                                                sale.status === 'Contract' ? 'Sözleşme' : sale.status
                                    }</span>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {(Number(sale.final_price) / 1000).toFixed(0)}K ₺
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {enrichedSales.length > 15 && (
                    <div className="p-4 text-center border-t bg-muted/10 text-xs text-muted-foreground">
                        Sadece son 15 kayıt listelenmektedir. Tam döküm için CRM sayfasını kullanabilirsiniz.
                    </div>
                )}
            </div>
        </div>
    )
}
