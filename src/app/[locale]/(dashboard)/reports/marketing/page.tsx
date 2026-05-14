import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, BarChart2, PieChart } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getMarketingAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function MarketingReportsPage() {
    const data = await getMarketingAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { totalMarketingLeads, formData } = data

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pazarlama Performans Analizi</h1>
                        <p className="text-sm text-muted-foreground">Form kaynaklı gelen lead'lerin pipeline içerisindeki ilerlemesi ve güncel durumları.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <AnalyticsMetricCard
                    title="Toplam Dijital Lead"
                    value={totalMarketingLeads.toString()}
                    description="Web Form ve Facebook Ads kaynaklı toplam aday"
                    icon={Target}
                    color="text-blue-600"
                />
                <AnalyticsMetricCard
                    title="Aktif Dijital Kampanyalar / Formlar"
                    value={formData.length.toString()}
                    description="Sistemdeki toplam eşsiz form kaynağı sayısı"
                    icon={BarChart2}
                    color="text-emerald-600"
                />
            </div>

            <div className="rounded-xl border bg-card overflow-hidden mt-2">
                <div className="p-6 border-b bg-muted/30 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="font-semibold text-lg">Lead Form Analizi</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Hangi formdan gelen adaylar hangi aşamada (Pipeline huni kırılımı).
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[20%]">Form / Kampanya Adı</TableHead>
                                <TableHead className="w-[10%] text-center">Kanal</TableHead>
                                <TableHead className="w-[8%] text-center">Bugün</TableHead>
                                <TableHead className="w-[8%] text-center">Bu Hafta</TableHead>
                                <TableHead className="w-[8%] text-center">Bu Ay</TableHead>
                                <TableHead className="w-[10%] text-center">Toplam Gelen</TableHead>
                                <TableHead>Lead Kırılımı (Durum Analizi)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData && formData.length > 0 ? (
                                formData.map((form: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-semibold">
                                            {form.formName}
                                        </TableCell>
                                        <TableCell className="text-center text-xs font-medium text-slate-500">
                                            <Badge variant="outline" className="bg-slate-50">{form.channel}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-slate-600">
                                            {form.today > 0 ? <span className="text-blue-600">+{form.today}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-slate-600">
                                            {form.thisWeek > 0 ? <span className="text-blue-600">+{form.thisWeek}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-slate-600">
                                            {form.thisMonth > 0 ? <span className="text-blue-600">+{form.thisMonth}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-lg text-slate-800">
                                            {form.total}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2 py-2">
                                                {Object.entries(form.statuses).map(([status, count]: [string, any], statusIdx: number) => {
                                                    // Determine logical colors based on step success/fail
                                                    let colorClass = "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    if (status === 'Satıldı' || status === 'Kazanıldı') colorClass = "bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold"
                                                    if (status === 'Aday') colorClass = "bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
                                                    if (status === 'Teklif Verildi') colorClass = "bg-purple-100 text-purple-700 hover:bg-purple-200 border-none"
                                                    if (status === 'Kaybedildi' || status === 'İptal Edildi') colorClass = "bg-red-50 text-red-600 hover:bg-red-100 border-none opacity-80"
                                                    if (status === 'Sözleşme' || status === 'Opsiyonlu') colorClass = "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"

                                                    return (
                                                        <Badge key={statusIdx} variant="secondary" className={`${colorClass} px-3 py-1 text-xs rounded-lg whitespace-nowrap`}>
                                                            {status}: {count}
                                                        </Badge>
                                                    )
                                                })}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Henüz dijital form (Facebook Ads, Web form vb.) üzerinden gelen bir kayıt bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
