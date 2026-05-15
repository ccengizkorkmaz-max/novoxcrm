import { Target, BarChart2, PieChart, Megaphone, Building2, Layers } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getMarketingAnalytics } from "../actions"
import AnalyticsMetricCard from "../components/AnalyticsMetricCard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function MarketingReportsPage() {
    const data = await getMarketingAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { totalMarketingLeads, formData, channelData, projectData } = data

    const getStatusBadgeColor = (status: string) => {
        if (status === 'Satıldı' || status === 'Kazanıldı') return "bg-green-100 text-green-700 hover:bg-green-200 border-none font-bold"
        if (status === 'Aday') return "bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
        if (status === 'Fırsat') return "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-none"
        if (status === 'Teklif Verildi') return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-none"
        if (status === 'Kaybedildi' || status === 'İptal Edildi') return "bg-red-50 text-red-600 hover:bg-red-100 border-none opacity-80"
        if (status === 'Sözleşme' || status === 'Opsiyonlu') return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"
        if (status === 'Pazarlık') return "bg-pink-50 text-pink-600 hover:bg-pink-100 border-none"
        return "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }

    const getChannelColor = (ch: string) => {
        if (ch.includes('Facebook')) return 'bg-blue-600 text-white'
        if (ch.includes('Instagram')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        if (ch.includes('Web')) return 'bg-emerald-600 text-white'
        if (ch.includes('E-Posta')) return 'bg-amber-600 text-white'
        if (ch.includes('WhatsApp')) return 'bg-green-600 text-white'
        return 'bg-slate-600 text-white'
    }

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pazarlama Performans Analizi</h1>
                        <p className="text-sm text-muted-foreground">Dijital kanallardan gelen lead'lerin kanal, proje ve kampanya bazlı performans analizi.</p>
                    </div>
                </div>
            </div>

            {/* ── Top Metrics ── */}
            <div className="grid gap-4 md:grid-cols-3">
                <AnalyticsMetricCard
                    title="Toplam Dijital Lead"
                    value={totalMarketingLeads.toString()}
                    description="Tüm dijital kanallardan gelen toplam aday"
                    icon={Target}
                    color="text-blue-600"
                />
                <AnalyticsMetricCard
                    title="Aktif Kanal Sayısı"
                    value={channelData.length.toString()}
                    description="Lead getiren benzersiz kanal sayısı"
                    icon={Megaphone}
                    color="text-purple-600"
                />
                <AnalyticsMetricCard
                    title="Aktif Kampanya Sayısı"
                    value={formData.length.toString()}
                    description="Eşsiz proje + kampanya kombinasyonu"
                    icon={Layers}
                    color="text-emerald-600"
                />
            </div>

            {/* ── Section 1: Kanal Özeti ── */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 border-b bg-muted/30 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-lg">Kanal Bazlı Performans</h3>
                        <p className="text-sm text-muted-foreground mt-1">Hangi dijital kanaldan kaç lead geldi?</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[25%]">Kanal</TableHead>
                                <TableHead className="w-[15%] text-center">Bugün</TableHead>
                                <TableHead className="w-[15%] text-center">Bu Hafta</TableHead>
                                <TableHead className="w-[15%] text-center">Bu Ay</TableHead>
                                <TableHead className="w-[15%] text-center">Toplam</TableHead>
                                <TableHead className="w-[15%] text-center">Oran (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {channelData.map((ch: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <Badge className={`${getChannelColor(ch.name)} px-3 py-1 text-xs font-bold`}>{ch.name}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">{ch.today > 0 ? <span className="text-blue-600">+{ch.today}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-semibold">{ch.thisWeek > 0 ? <span className="text-blue-600">+{ch.thisWeek}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-semibold">{ch.thisMonth > 0 ? <span className="text-blue-600">+{ch.thisMonth}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-bold text-lg">{ch.total}</TableCell>
                                    <TableCell className="text-center text-muted-foreground font-medium">
                                        {totalMarketingLeads > 0 ? ((ch.total / totalMarketingLeads) * 100).toFixed(1) : '0'}%
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ── Section 2: Proje Bazlı Özet ── */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 border-b bg-muted/30 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <div>
                        <h3 className="font-semibold text-lg">Proje Bazlı Lead Dağılımı</h3>
                        <p className="text-sm text-muted-foreground mt-1">Hangi projeye kaç dijital lead geldi?</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[30%]">Proje</TableHead>
                                <TableHead className="w-[14%] text-center">Bugün</TableHead>
                                <TableHead className="w-[14%] text-center">Bu Hafta</TableHead>
                                <TableHead className="w-[14%] text-center">Bu Ay</TableHead>
                                <TableHead className="w-[14%] text-center">Toplam</TableHead>
                                <TableHead className="w-[14%] text-center">Oran (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projectData.map((proj: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell className="font-semibold">{proj.name}</TableCell>
                                    <TableCell className="text-center font-semibold">{proj.today > 0 ? <span className="text-emerald-600">+{proj.today}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-semibold">{proj.thisWeek > 0 ? <span className="text-emerald-600">+{proj.thisWeek}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-semibold">{proj.thisMonth > 0 ? <span className="text-emerald-600">+{proj.thisMonth}</span> : '0'}</TableCell>
                                    <TableCell className="text-center font-bold text-lg">{proj.total}</TableCell>
                                    <TableCell className="text-center text-muted-foreground font-medium">
                                        {totalMarketingLeads > 0 ? ((proj.total / totalMarketingLeads) * 100).toFixed(1) : '0'}%
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ── Section 3: Kampanya Detay Tablosu ── */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 border-b bg-muted/30 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="font-semibold text-lg">Kampanya Detay Analizi</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Her kampanyanın kanal, proje ve pipeline kırılımı.
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[12%]">Kanal</TableHead>
                                <TableHead className="w-[14%]">Proje</TableHead>
                                <TableHead className="w-[20%]">Kampanya</TableHead>
                                <TableHead className="w-[6%] text-center">Bugün</TableHead>
                                <TableHead className="w-[6%] text-center">Hafta</TableHead>
                                <TableHead className="w-[6%] text-center">Ay</TableHead>
                                <TableHead className="w-[6%] text-center">Toplam</TableHead>
                                <TableHead>Pipeline Kırılımı</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData && formData.length > 0 ? (
                                formData.map((form: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <Badge className={`${getChannelColor(form.channel)} px-2 py-0.5 text-[10px] font-bold`}>{form.channel}</Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm">
                                            {form.project || <span className="text-muted-foreground italic">—</span>}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {form.campaign || <span className="italic">—</span>}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-sm">
                                            {form.today > 0 ? <span className="text-blue-600">+{form.today}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-sm">
                                            {form.thisWeek > 0 ? <span className="text-blue-600">+{form.thisWeek}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-sm">
                                            {form.thisMonth > 0 ? <span className="text-blue-600">+{form.thisMonth}</span> : '0'}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-lg text-slate-800">
                                            {form.total}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5 py-1">
                                                {Object.entries(form.statuses).map(([status, count]: [string, any], statusIdx: number) => (
                                                    <Badge key={statusIdx} variant="secondary" className={`${getStatusBadgeColor(status)} px-2 py-0.5 text-[10px] rounded-md whitespace-nowrap`}>
                                                        {status}: {count}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
