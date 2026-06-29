import { Target, TrendingUp, BarChart3, AlertCircle } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getAdSourceAnalytics } from "../actions"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function AdSourceAnalyticsPage() {
    const data = await getAdSourceAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { rows } = data as { rows: any[] }

    // Formatters
    const fmtCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    const fmtInt = (val: number) => {
        return new Intl.NumberFormat('tr-TR').format(val)
    }

    const fmtPercent = (val: number) => {
        return '%' + new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    // Compute totals of all daily rows
    const totals = rows.reduce(
        (acc, row) => ({
            spend: acc.spend + row.spend,
            impressions: acc.impressions + row.impressions,
            clicks: acc.clicks + row.clicks,
            leads: acc.leads + row.leads,
        }),
        { spend: 0, impressions: 0, clicks: 0, leads: 0 }
    )

    const totalCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    const totalCpl = totals.leads > 0 ? totals.spend / totals.leads : 0

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Günlük Kampanya Performansı</h1>
                        <p className="text-sm text-muted-foreground">Her kampanyanın günlük harcama, gösterim, tıklama ve aday performansı.</p>
                    </div>
                </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/30">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest">Toplam Aday (Leads)</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{fmtInt(totals.leads)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 dark:from-emerald-950/20 dark:to-green-950/20 dark:border-emerald-900/30">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-widest">Toplam Harcama</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{fmtCurrency(totals.spend)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-purple-950/20 dark:to-violet-950/20 dark:border-purple-900/30">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-widest">Ortalama CPL</p>
                        <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{fmtCurrency(totalCpl)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-900/30">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-orange-400 dark:text-orange-500 uppercase tracking-widest">Genel Tıklama</p>
                        <p className="text-2xl font-black text-orange-700 dark:text-orange-300">{fmtInt(totals.clicks)}</p>
                    </div>
                </div>
            </div>

            {/* Daily Campaign Performance Table */}
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Günlük Rapor Kırılımı
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Her gün için kampanyaların harcama, tıklama, erişim ve CPL dağılımları.</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                                    <th className="text-left p-3.5 pl-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">TARİH</th>
                                    <th className="text-left p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">KAMPANYA</th>
                                    <th className="text-left p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">DURUM</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">HARCAMA</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">GÖSTERİM</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">TIKLAMA</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">CTR</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">LEADS</th>
                                    <th className="text-right p-3.5 pr-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">CPL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {rows.length > 0 ? (
                                    rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group">
                                            <td className="p-3.5 pl-5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                {formatDate(row.date)}
                                            </td>
                                            <td className="p-3.5">
                                                <div className="flex flex-col gap-0.5 max-w-[280px]">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer truncate" title={row.campaign_name}>
                                                        {row.campaign_name}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        OUTCOME LEADS
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                {row.status === 'ACTIVE' || row.status === 'Aktif' ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                                        AKTİF
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                                        DURAKLATILDI
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                                                {fmtCurrency(row.spend)}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {fmtInt(row.impressions)}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {fmtInt(row.clicks)}
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <span className={cn(
                                                    "font-bold",
                                                    row.ctr >= 1.5 ? 'text-emerald-600' : row.ctr >= 0.8 ? 'text-amber-600' : 'text-rose-500'
                                                )}>
                                                    {fmtPercent(row.ctr)}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right">
                                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                                    {row.leads}
                                                </span>
                                            </td>
                                            <td className="p-3.5 pr-5 text-right font-semibold">
                                                <span className={cn(
                                                    "font-bold",
                                                    row.cpl > 0 && row.cpl <= 50 ? 'text-emerald-600' :
                                                    row.cpl > 0 && row.cpl <= 150 ? 'text-amber-600' :
                                                    row.cpl > 0 ? 'text-rose-500' : 'text-slate-400'
                                                )}>
                                                    {row.cpl > 0 ? fmtCurrency(row.cpl) : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="h-32 text-center text-muted-foreground">
                                            Seçili dönemde günlük kampanya verisi bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {/* Overall summary foot */}
                            <tfoot>
                                <tr className="bg-slate-900 dark:bg-slate-950 text-white border-t-2 border-slate-200 dark:border-slate-700">
                                    <td className="p-3.5 pl-5 font-black text-xs uppercase tracking-wider" colSpan={3}>
                                        GENEL TOPLAM
                                    </td>
                                    <td className="p-3.5 text-right font-black text-sm">{fmtCurrency(totals.spend)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtInt(totals.impressions)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtInt(totals.clicks)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtPercent(totalCtr)}</td>
                                    <td className="p-3.5 text-right font-black text-emerald-400">{fmtInt(totals.leads)}</td>
                                    <td className="p-3.5 pr-5 text-right font-black text-amber-400 text-sm">{fmtCurrency(totalCpl)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
