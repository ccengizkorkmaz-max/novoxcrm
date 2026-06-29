import { Target, TrendingUp, BarChart3, ArrowUpRight, Percent, Coins, MousePointer, Calendar } from "lucide-react"
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

    // --- Date Calculations for Periods ---
    const now = new Date()
    
    // Today
    const todayStr = now.toISOString().split('T')[0]
    
    // Yesterday
    const yesterday = new Date()
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // This Week (Monday start)
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - mondayOffset)
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0]
    
    // Last Week
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
    const lastWeekEndStr = thisWeekStartStr

    // This Month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthStartStr = thisMonthStart.toISOString().split('T')[0]
    
    // Last Month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0]
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0]

    // Aggregation Helper
    const aggregate = (filteredRows: any[]) => {
        const spend = filteredRows.reduce((sum, r) => sum + r.spend, 0)
        const impressions = filteredRows.reduce((sum, r) => sum + r.impressions, 0)
        const clicks = filteredRows.reduce((sum, r) => sum + r.clicks, 0)
        const leads = filteredRows.reduce((sum, r) => sum + r.leads, 0)
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
        const cpl = leads > 0 ? spend / leads : 0
        
        return { spend, impressions, clicks, leads, ctr, cpl }
    }

    // Calculate period aggregates
    const todayStats = aggregate(rows.filter(r => r.date === todayStr))
    const yesterdayStats = aggregate(rows.filter(r => r.date === yesterdayStr))
    const thisWeekStats = aggregate(rows.filter(r => r.date >= thisWeekStartStr))
    const lastWeekStats = aggregate(rows.filter(r => r.date >= lastWeekStartStr && r.date < lastWeekEndStr))
    const thisMonthStats = aggregate(rows.filter(r => r.date >= thisMonthStartStr))
    const lastMonthStats = aggregate(rows.filter(r => r.date >= lastMonthStartStr && r.date < lastMonthEndStr))
    const totalStats = aggregate(rows)

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Günlük Kampanya Raporu</h1>
                        <p className="text-sm text-muted-foreground">Facebook ve Instagram reklam kampanyalarının günlük ve dönemsel performans kırılımları.</p>
                    </div>
                </div>
            </div>

            {/* Aggregated Period Matrix Dashboard */}
            <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <CardTitle className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                        Dönemsel Performans Özet Tablosu
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Farklı tarih aralıklarına ait toplam harcama, gösterim, tıklama ve aday verilerinin karşılaştırması.</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
                                    <th className="text-left p-4 font-black text-slate-400 uppercase tracking-widest text-[9px] w-[180px] border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">METRİK</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">BUGÜN</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">DÜN</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">BU HAFTA</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">GEÇEN HAFTA</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px]">BU AY</th>
                                    <th className="text-right p-4 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] border-r border-slate-100 dark:border-slate-800">GEÇEN AY</th>
                                    <th className="text-right p-4 font-black text-white bg-slate-900 dark:bg-slate-950 uppercase tracking-widest text-[9px] pr-6 w-[120px]">TOPLAM</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {/* Harcama Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <Coins className="h-4 w-4 text-emerald-500" />
                                        Harcama
                                    </td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/2">{fmtCurrency(todayStats.spend)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/5 dark:bg-emerald-950/1">{fmtCurrency(yesterdayStats.spend)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/2">{fmtCurrency(thisWeekStats.spend)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/5 dark:bg-emerald-950/1">{fmtCurrency(lastWeekStats.spend)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/10 dark:bg-emerald-950/2">{fmtCurrency(thisMonthStats.spend)}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/5 dark:bg-emerald-950/1 border-r border-slate-100 dark:border-slate-800">{fmtCurrency(lastMonthStats.spend)}</td>
                                    <td className="p-4 text-right font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/30 dark:bg-emerald-900/10 pr-6 text-sm">{fmtCurrency(totalStats.spend)}</td>
                                </tr>
                                {/* Gösterim Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <TrendingUp className="h-4 w-4 text-blue-500" />
                                        Gösterim
                                    </td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(todayStats.impressions)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(yesterdayStats.impressions)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(thisWeekStats.impressions)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(lastWeekStats.impressions)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(thisMonthStats.impressions)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">{fmtInt(lastMonthStats.impressions)}</td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white bg-slate-100/20 dark:bg-slate-900/10 pr-6">{fmtInt(totalStats.impressions)}</td>
                                </tr>
                                {/* Tıklama Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <MousePointer className="h-4 w-4 text-orange-500" />
                                        Tıklama
                                    </td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(todayStats.clicks)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(yesterdayStats.clicks)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(thisWeekStats.clicks)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(lastWeekStats.clicks)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300">{fmtInt(thisMonthStats.clicks)}</td>
                                    <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">{fmtInt(lastMonthStats.clicks)}</td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white bg-slate-100/20 dark:bg-slate-900/10 pr-6">{fmtInt(totalStats.clicks)}</td>
                                </tr>
                                {/* CTR Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <Percent className="h-4 w-4 text-teal-500" />
                                        CTR (Tıklama Oranı)
                                    </td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/10 dark:bg-teal-950/2">{fmtPercent(todayStats.ctr)}</td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/5 dark:bg-teal-950/1">{fmtPercent(yesterdayStats.ctr)}</td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/10 dark:bg-teal-950/2">{fmtPercent(thisWeekStats.ctr)}</td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/5 dark:bg-teal-950/1">{fmtPercent(lastWeekStats.ctr)}</td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/10 dark:bg-teal-950/2">{fmtPercent(thisMonthStats.ctr)}</td>
                                    <td className="p-4 text-right font-bold text-teal-600 dark:text-teal-400 bg-teal-50/5 dark:bg-teal-950/1 border-r border-slate-100 dark:border-slate-800">{fmtPercent(lastMonthStats.ctr)}</td>
                                    <td className="p-4 text-right font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100/30 dark:bg-teal-900/10 pr-6">{fmtPercent(totalStats.ctr)}</td>
                                </tr>
                                {/* Leads Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Aday (Leads)
                                    </td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/2 text-sm">{fmtInt(todayStats.leads)}</td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/1 text-sm">{fmtInt(yesterdayStats.leads)}</td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/2 text-sm">{fmtInt(thisWeekStats.leads)}</td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/1 text-sm">{fmtInt(lastWeekStats.leads)}</td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-950/2 text-sm">{fmtInt(thisMonthStats.leads)}</td>
                                    <td className="p-4 text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/5 dark:bg-blue-950/1 border-r border-slate-100 dark:border-slate-800 text-sm">{fmtInt(lastMonthStats.leads)}</td>
                                    <td className="p-4 text-right font-black text-blue-700 dark:text-blue-300 bg-blue-100/30 dark:bg-blue-900/10 pr-6 text-sm">{fmtInt(totalStats.leads)}</td>
                                </tr>
                                {/* CPL Row */}
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/5">
                                        <BarChart3 className="h-4 w-4 text-purple-500" />
                                        CPL (Aday Başı Maliyet)
                                    </td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/10 dark:bg-purple-950/2">{todayStats.cpl > 0 ? fmtCurrency(todayStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/5 dark:bg-purple-950/1">{yesterdayStats.cpl > 0 ? fmtCurrency(yesterdayStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/10 dark:bg-purple-950/2">{thisWeekStats.cpl > 0 ? fmtCurrency(thisWeekStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/5 dark:bg-purple-950/1">{lastWeekStats.cpl > 0 ? fmtCurrency(lastWeekStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/10 dark:bg-purple-950/2">{thisMonthStats.cpl > 0 ? fmtCurrency(thisMonthStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-bold text-purple-600 dark:text-purple-400 bg-purple-50/5 dark:bg-purple-950/1 border-r border-slate-100 dark:border-slate-800">{lastMonthStats.cpl > 0 ? fmtCurrency(lastMonthStats.cpl) : '—'}</td>
                                    <td className="p-4 text-right font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100/30 dark:bg-purple-900/10 pr-6">{totalStats.cpl > 0 ? fmtCurrency(totalStats.cpl) : '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Campaign Performance Table */}
            <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-white dark:bg-slate-900">
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
                                    <td className="p-3.5 text-right font-black text-sm">{fmtCurrency(totalStats.spend)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtInt(totalStats.impressions)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtInt(totalStats.clicks)}</td>
                                    <td className="p-3.5 text-right font-black">{fmtPercent(totalStats.ctr)}</td>
                                    <td className="p-3.5 text-right font-black text-emerald-400">{fmtInt(totalStats.leads)}</td>
                                    <td className="p-3.5 pr-5 text-right font-black text-amber-400 text-sm">{fmtCurrency(totalStats.cpl)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
