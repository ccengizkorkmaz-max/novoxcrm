import { Target, ArrowLeft, TrendingUp, BarChart3 } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { getAdSourceAnalytics } from "../actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function AdSourceAnalyticsPage() {
    const data = await getAdSourceAnalytics()

    if ('error' in data) {
        return <div className="p-8 text-center text-red-500">Hata: {data.error}</div>
    }

    const { rows, grandTotal } = data

    const getSourceColor = (source: string) => {
        if (source.includes('Meta') || source.includes('Facebook')) return 'bg-blue-600 text-white'
        if (source.includes('Instagram')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        if (source.includes('Google')) return 'bg-red-500 text-white'
        if (source.includes('WhatsApp')) return 'bg-green-600 text-white'
        if (source.includes('Web')) return 'bg-emerald-600 text-white'
        if (source.includes('Referans')) return 'bg-amber-600 text-white'
        if (source.includes('Telefon')) return 'bg-cyan-600 text-white'
        if (source.includes('Manuel')) return 'bg-slate-600 text-white'
        if (source.includes('Broker')) return 'bg-indigo-600 text-white'
        if (source.includes('E-Posta')) return 'bg-orange-600 text-white'
        return 'bg-slate-500 text-white'
    }

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

    return (
        <div className="flex flex-col gap-6 p-1 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reklam Kaynağı Analizi</h1>
                        <p className="text-sm text-muted-foreground">Hangi kaynaktan kaç müşteri adayı (lead) geldiğinin dönemsel karşılaştırması.</p>
                    </div>
                </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Toplam Lead</p>
                        <p className="text-2xl font-black text-blue-700">{grandTotal}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Bugün</p>
                        <p className="text-2xl font-black text-emerald-700">{totals.today}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Bu Hafta</p>
                        <p className="text-2xl font-black text-purple-700">{totals.thisWeek}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100">
                    <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Bu Ay</p>
                        <p className="text-2xl font-black text-orange-700">{totals.thisMonth}</p>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-6 border-b bg-muted/30 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-lg">Kaynak Bazlı Lead Dağılımı</h3>
                        <p className="text-sm text-muted-foreground mt-1">Hangi reklam/kaynak kanalından kaç lead geldi — dönemsel karşılaştırma.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[22%] font-bold">Kaynak</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Bugün</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Dün</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Bu Hafta</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Geçen Hafta</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Bu Ay</TableHead>
                                <TableHead className="w-[11%] text-center font-bold">Geçen Ay</TableHead>
                                <TableHead className="w-[12%] text-center font-bold">Toplam</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length > 0 ? (
                                <>
                                    {rows.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <Badge className={`${getSourceColor(row.source)} px-3 py-1 text-xs font-bold`}>
                                                    {row.source}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.today > 0 ? <span className="text-emerald-600">+{row.today}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.yesterday > 0 ? <span className="text-blue-600">+{row.yesterday}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.thisWeek > 0 ? <span className="text-purple-600">+{row.thisWeek}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.lastWeek > 0 ? <span className="text-indigo-600">{row.lastWeek}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.thisMonth > 0 ? <span className="text-orange-600">+{row.thisMonth}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-semibold">
                                                {row.lastMonth > 0 ? <span className="text-amber-600">{row.lastMonth}</span> : <span className="text-slate-300">0</span>}
                                            </TableCell>
                                            <TableCell className="text-center font-black text-lg text-slate-800">
                                                {row.total}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals Row */}
                                    <TableRow className="bg-slate-100/80 border-t-2 border-slate-300">
                                        <TableCell className="font-black text-slate-700">TOPLAM</TableCell>
                                        <TableCell className="text-center font-black text-emerald-700">{totals.today}</TableCell>
                                        <TableCell className="text-center font-black text-blue-700">{totals.yesterday}</TableCell>
                                        <TableCell className="text-center font-black text-purple-700">{totals.thisWeek}</TableCell>
                                        <TableCell className="text-center font-black text-indigo-700">{totals.lastWeek}</TableCell>
                                        <TableCell className="text-center font-black text-orange-700">{totals.thisMonth}</TableCell>
                                        <TableCell className="text-center font-black text-amber-700">{totals.lastMonth}</TableCell>
                                        <TableCell className="text-center font-black text-xl text-slate-900">{totals.total}</TableCell>
                                    </TableRow>
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                        Henüz kayıtlı bir müşteri adayı (lead) bulunamadı.
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
