import { Target, ArrowLeft, TrendingUp, BarChart3, ShieldCheck } from "lucide-react"
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

    const { rows, grandTotal } = data

    // Compute totals row
    const totals = rows.reduce(
        (acc, row) => ({
            today: acc.today + row.today,
            yesterday: acc.yesterday + row.yesterday,
            thisWeek: acc.thisWeek + row.thisWeek,
            lastWeek: acc.lastWeek + row.lastWeek,
            thisMonth: acc.thisMonth + row.thisMonth,
            lastMonth: acc.lastMonth + row.lastMonth,
            total: acc.total + row.total,
        }),
        { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0, total: 0 }
    )

    const getSourceSubtext = (source: string) => {
        const s = source.toLowerCase()
        if (s.includes('meta') || s.includes('facebook') || s.includes('instagram') || s.includes('google')) {
            return 'DİJİTAL REKLAM'
        }
        if (s.includes('whatsapp') || s.includes('web') || s.includes('e-posta')) {
            return 'DİJİTAL KANAL'
        }
        return 'CRM GİRİŞİ'
    }

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reklam Kaynağı Analizi</h1>
                        <p className="text-sm text-muted-foreground">Kanallardan gelen müşteri adayı (lead) sayılarının dönemsel karşılaştırma raporu.</p>
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
                        <p className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest">Toplam Lead</p>
                        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{grandTotal}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 dark:from-emerald-950/20 dark:to-green-950/20 dark:border-emerald-900/30">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase tracking-widest">Bugün</p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{totals.today}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 dark:from-purple-950/20 dark:to-violet-950/20 dark:border-purple-900/30">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase tracking-widest">Bu Hafta</p>
                        <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{totals.thisWeek}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-900/30">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-orange-400 dark:text-orange-500 uppercase tracking-widest">Bu Ay</p>
                        <p className="text-2xl font-black text-orange-700 dark:text-orange-300">{totals.thisMonth}</p>
                    </div>
                </div>
            </div>

            {/* Redesigned Kampanya Skor Kartları Style Table */}
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Reklam & Kaynak Skor Kartları
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Aktif kaynakların dönemsel lead performansı ve toplam hacmi.</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                                    <th className="text-left p-3.5 pl-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">KAMPANYA / KAYNAK</th>
                                    <th className="text-left p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">DURUM</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">BUGÜN</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">DÜN</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">BU HAFTA</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">GEÇEN HAFTA</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">BU AY</th>
                                    <th className="text-right p-3.5 font-black text-slate-400 uppercase tracking-widest text-[10px]">GEÇEN AY</th>
                                    <th className="text-right p-3.5 pr-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">LEADS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {rows.length > 0 ? (
                                    rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group">
                                            <td className="p-3.5 pl-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">
                                                        {row.source}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {getSourceSubtext(row.source)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3.5">
                                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                                                    AKTİF
                                                </Badge>
                                            </td>
                                            <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                                                {row.today > 0 ? <span className="text-emerald-600">+{row.today}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {row.yesterday > 0 ? <span className="text-blue-600">+{row.yesterday}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {row.thisWeek > 0 ? <span className="text-purple-600">+{row.thisWeek}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {row.lastWeek > 0 ? <span className="text-indigo-600">{row.lastWeek}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {row.thisMonth > 0 ? <span className="text-orange-600">+{row.thisMonth}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                                                {row.lastMonth > 0 ? <span className="text-amber-600">{row.lastMonth}</span> : <span className="text-slate-300 dark:text-slate-700">0</span>}
                                            </td>
                                            <td className="p-3.5 pr-5 text-right">
                                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                                    {row.total}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="h-32 text-center text-muted-foreground">
                                            Henüz kayıtlı bir müşteri adayı (lead) bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {/* Total row styled exactly like the screenshot */}
                            <tfoot>
                                <tr className="bg-slate-900 dark:bg-slate-950 text-white border-t-2 border-slate-200 dark:border-slate-700">
                                    <td className="p-3.5 pl-5 font-black text-xs uppercase tracking-wider" colSpan={2}>
                                        GENEL TOPLAM
                                    </td>
                                    <td className="p-3.5 text-right font-black text-emerald-400">+{totals.today}</td>
                                    <td className="p-3.5 text-right font-black">+{totals.yesterday}</td>
                                    <td className="p-3.5 text-right font-black">+{totals.thisWeek}</td>
                                    <td className="p-3.5 text-right font-black">{totals.lastWeek}</td>
                                    <td className="p-3.5 text-right font-black">{totals.thisMonth}</td>
                                    <td className="p-3.5 text-right font-black">{totals.lastMonth}</td>
                                    <td className="p-3.5 pr-5 text-right font-black text-emerald-400 text-sm">{totals.total}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
