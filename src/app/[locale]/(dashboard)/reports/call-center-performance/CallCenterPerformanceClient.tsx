'use client'

import { useState, useTransition, useMemo } from 'react'
import {
    Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, Users,
    CheckCircle2, XCircle, TrendingUp, Calendar, ArrowUpRight,
    Trophy, Play, Headphones, Download, RefreshCw, Search,
    Filter, ChevronRight, User, Sparkles, BarChart2, Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { getCallCenterPerformanceData, RepPerformanceItem, CallLogItem } from './actions'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CallCenterClientProps {
    initialData: any
    profiles: any[]
}

export default function CallCenterPerformanceClient({ initialData, profiles }: CallCenterClientProps) {
    const router = useRouter()
    const [data, setData] = useState(initialData)
    const [isPending, startTransition] = useTransition()

    // Filters
    const [period, setPeriod] = useState<string>(initialData.period || 'month')
    const [selectedRep, setSelectedRep] = useState<string>('__all__')
    const [customStart, setCustomStart] = useState<string>(initialData.startDate || '')
    const [customEnd, setCustomEnd] = useState<string>(initialData.endDate || '')
    const [searchLog, setSearchLog] = useState<string>('')
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)

    const handleFilterChange = (newPeriod: string, newRep?: string, sDate?: string, eDate?: string) => {
        const p = newPeriod || period
        const r = newRep !== undefined ? newRep : selectedRep
        const s = sDate !== undefined ? sDate : customStart
        const e = eDate !== undefined ? eDate : customEnd

        setPeriod(p)
        if (newRep !== undefined) setSelectedRep(r)

        startTransition(async () => {
            const res = await getCallCenterPerformanceData({
                period: p as any,
                repId: r === '__all__' ? undefined : r,
                startDate: p === 'custom' ? s : undefined,
                endDate: p === 'custom' ? e : undefined
            })
            if (!('error' in res)) {
                setData(res)
            }
        })
    }

    const summary = data.summary || {}
    const reps: RepPerformanceItem[] = data.reps || []
    const hourly = data.hourlyDistribution || []
    const daily = data.dailyTrend || []
    const recentCalls: CallLogItem[] = data.recentCalls || []

    const formatSeconds = (sec: number) => {
        if (!sec) return '0 sn'
        const mins = Math.floor(sec / 60)
        const remSec = sec % 60
        if (mins === 0) return `${remSec} sn`
        if (mins < 60) return `${mins} dk ${remSec > 0 ? remSec + ' sn' : ''}`
        const hrs = Math.floor(mins / 60)
        const remMins = mins % 60
        return `${hrs} sa ${remMins} dk`
    }

    // Filter recent calls
    const filteredLogs = useMemo(() => {
        if (!searchLog.trim()) return recentCalls
        const q = searchLog.toLowerCase()
        return recentCalls.filter(c =>
            c.customerName.toLowerCase().includes(q) ||
            c.customerPhone.includes(q) ||
            c.repName.toLowerCase().includes(q) ||
            (c.notes && c.notes.toLowerCase().includes(q))
        )
    }, [recentCalls, searchLog])

    // Find max calls for hourly distribution bar scaling
    const maxHourlyCalls = useMemo(() => {
        const counts = hourly.map((h: any) => h.callCount)
        return Math.max(...counts, 1)
    }, [hourly])

    // Export CSV
    const exportCSV = () => {
        const headers = ['Tarih', 'Tür', 'Temsilci', 'Müşteri', 'Telefon', 'Süre (sn)', 'Sonuç', 'Notlar']
        const rows = recentCalls.map(c => [
            c.date ? format(parseISO(c.date), 'dd.MM.yyyy HH:mm') : '-',
            c.type === 'inbound' ? 'Gelen' : 'Giden',
            `"${c.repName}"`,
            `"${c.customerName}"`,
            `"${c.customerPhone}"`,
            c.durationSeconds,
            `"${c.outcome}"`,
            `"${(c.notes || '').replace(/"/g, '""')}"`
        ])
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Cagri_Merkezi_Raporu_${format(new Date(), 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Controls: Periods & Rep Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                {/* Period Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                        { id: 'today', label: 'Bugün' },
                        { id: 'yesterday', label: 'Dün' },
                        { id: 'week', label: 'Bu Hafta' },
                        { id: 'month', label: 'Bu Ay' },
                        { id: 'last30', label: 'Son 30 Gün' },
                        { id: 'last90', label: 'Son 90 Gün' },
                        { id: 'custom', label: 'Özel Tarih' }
                    ].map(p => (
                        <Button
                            key={p.id}
                            variant={period === p.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange(p.id)}
                            className={`rounded-xl text-xs font-semibold h-9 transition-all ${
                                period === p.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {period === 'custom' && (
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={customStart}
                                onChange={e => {
                                    setCustomStart(e.target.value)
                                    handleFilterChange('custom', selectedRep, e.target.value, customEnd)
                                }}
                                className="h-9 text-xs rounded-xl w-36"
                            />
                            <span className="text-xs text-slate-400">-</span>
                            <Input
                                type="date"
                                value={customEnd}
                                onChange={e => {
                                    setCustomEnd(e.target.value)
                                    handleFilterChange('custom', selectedRep, customStart, e.target.value)
                                }}
                                className="h-9 text-xs rounded-xl w-36"
                            />
                        </div>
                    )}

                    <div className="w-48">
                        <Select
                            value={selectedRep}
                            onValueChange={val => handleFilterChange(period, val)}
                        >
                            <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200">
                                <SelectValue placeholder="Temsilci Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">👥 Tüm Temsilciler</SelectItem>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.full_name || 'İsimsiz'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCSV}
                        className="h-9 text-xs gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                        title="CSV / Excel İndir"
                    >
                        <Download className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Dışa Aktar</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFilterChange(period)}
                        disabled={isPending}
                        className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-900"
                        title="Yenile"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* 1. Total Calls */}
                <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Arama</span>
                        <div className="p-2 rounded-xl bg-blue-100/80 text-blue-600">
                            <PhoneCall className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {summary.totalCalls || 0}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-medium">
                            <span className="text-blue-600 font-bold">↗ {summary.totalOutbound || 0} Giden</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold">↙ {summary.totalInbound || 0} Gelen</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Total Duration */}
                <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-violet-50/30">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Görüşme Süresi</span>
                        <div className="p-2 rounded-xl bg-violet-100/80 text-violet-600">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {summary.totalDurationHours > 0 ? `${summary.totalDurationHours} sa` : `${summary.totalDurationMinutes || 0} dk`}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1.5">
                            Ortalama: <strong className="text-violet-700 font-bold">{formatSeconds(summary.avgDurationSeconds || 0)}</strong>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Answer / Reach Rate */}
                <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ulaşılma Oranı</span>
                        <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
                            <span>%{summary.answerRatePercentage || 0}</span>
                            <span className="text-xs font-normal text-slate-500">
                                ({summary.answeredCallsCount || 0} arama)
                            </span>
                        </div>
                        <Progress value={summary.answerRatePercentage || 0} className="h-1.5 mt-2 bg-emerald-100" />
                    </CardContent>
                </Card>

                {/* 4. Appointments */}
                <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alınan Randevu</span>
                        <div className="p-2 rounded-xl bg-amber-100/80 text-amber-600">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            {summary.appointmentCount || 0}
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium mt-1.5">
                            Dönüşüm: <strong className="font-bold">%{summary.appointmentRatePercentage || 0}</strong>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Top Representative */}
                <Card className="border-slate-200/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white col-span-2 sm:col-span-1">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Zirvedeki Danışman</span>
                        <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300">
                            <Trophy className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        {summary.topRep ? (
                            <>
                                <div className="text-base sm:text-lg font-black text-white truncate">
                                    {summary.topRep.name}
                                </div>
                                <div className="text-[11px] text-slate-300 font-medium mt-1">
                                    <span className="text-amber-300 font-bold">{summary.topRep.totalCalls} arama</span> • {summary.topRep.totalMinutes} dk
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-slate-400">Kayıt yok</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Representative Leaderboard & Comparison Table */}
            <Card className="border-slate-200/80 shadow-sm overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            <span>Temsilci Çağrı & Konuşma Performansı Sıralaması</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                            Danışman bazında toplam arama, net konuşma süresi ve randevu dönüşüm tablosu.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold bg-white text-slate-700 w-fit">
                        {reps.filter(r => r.totalCalls > 0).length} Aktif Temsilci
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                                    <th className="py-3 px-4 w-12 text-center">#</th>
                                    <th className="py-3 px-4">Satış Danışmanı</th>
                                    <th className="py-3 px-4 text-center">Toplam Arama</th>
                                    <th className="py-3 px-4 text-center">Ulaşılan / Yanıtsız</th>
                                    <th className="py-3 px-4 text-center">Başarı Oranı</th>
                                    <th className="py-3 px-4 text-center">Toplam Süre</th>
                                    <th className="py-3 px-4 text-center">Ort. Çağrı</th>
                                    <th className="py-3 px-4 text-center">Randevu</th>
                                    <th className="py-3 px-4 text-right">Son Arama</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reps.length === 0 || reps.every(r => r.totalCalls === 0) ? (
                                    <tr>
                                        <td colSpan={9} className="py-10 text-center text-slate-400">
                                            Seçilen dönemde arama kaydı bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    reps.filter(r => r.totalCalls > 0).map((rep, idx) => {
                                        const rankBadge = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`

                                        return (
                                            <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                                                    {rankBadge}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 font-bold text-xs text-indigo-700">
                                                            {rep.avatar ? (
                                                                <img src={rep.avatar} alt={rep.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                rep.name.substring(0, 2).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                                                {rep.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {rep.outboundCalls} giden • {rep.inboundCalls} gelen
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                                                    {rep.totalCalls}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="text-emerald-700 font-bold">{rep.answeredCalls}</span>
                                                    <span className="text-slate-300 mx-1">/</span>
                                                    <span className="text-red-500 font-medium">{rep.unansweredCalls}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className={`text-xs font-extrabold ${rep.successRate >= 60 ? 'text-emerald-600' : rep.successRate >= 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                            %{rep.successRate}
                                                        </span>
                                                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${rep.successRate >= 60 ? 'bg-emerald-500' : rep.successRate >= 30 ? 'bg-amber-500' : 'bg-slate-400'}`}
                                                                style={{ width: `${Math.min(rep.successRate, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-violet-700">
                                                    {formatSeconds(rep.totalDurationSeconds)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                                                    {formatSeconds(rep.avgDurationSeconds)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                                                    {rep.appointmentCount > 0 ? (
                                                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold hover:bg-amber-100">
                                                            {rep.appointmentCount} Randevu
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right text-[11px] text-slate-500">
                                                    {rep.lastCallDate ? format(parseISO(rep.lastCallDate), 'd MMM HH:mm', { locale: tr }) : '-'}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Visual Analytics: Hourly Distribution & Daily Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Call Distribution (Heatmap / Bar chart) */}
                <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>Saatlik Arama Yoğunluk Analizi (08:00 - 20:00)</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Günün hangi saatlerinde daha çok görüşme yapıldığını ve ulaşıldığını inceleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-13 gap-1.5 items-end h-40 pt-4">
                            {hourly.map((h: any) => {
                                const heightPercent = maxHourlyCalls > 0 ? (h.callCount / maxHourlyCalls) * 100 : 0
                                return (
                                    <div key={h.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                                        <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {h.callCount}
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-28">
                                            <div
                                                className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all"
                                                style={{ height: `${Math.max(heightPercent, h.callCount > 0 ? 8 : 0)}%` }}
                                                title={`${h.hour}: ${h.callCount} arama (${h.answeredCount} cevaplanan)`}
                                            />
                                        </div>
                                        <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">
                                            {h.hour.substring(0, 2)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Trend */}
                <Card className="border-slate-200/80 shadow-sm">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <span>Günlük Arama Trendi</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Seçilen periyottaki günlük arama ve toplam konuşma dakikası değişimi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                        {daily.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">Veri bulunamadı</div>
                        ) : (
                            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                                {daily.slice(-10).map((d: any) => (
                                    <div key={d.date} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                                        <div className="flex items-center gap-2 font-bold text-slate-700 w-24">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{d.formattedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-white text-blue-700 border-blue-200 font-bold">
                                                {d.callCount} arama
                                            </Badge>
                                            <span className="text-violet-700 font-semibold text-[11px] w-16 text-right">
                                                {d.totalDurationMinutes} dk
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Calls Log Table & Audio Player */}
            <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <Headphones className="h-4 w-4 text-purple-600" />
                            <span>Son Çağrı Kayıtları & Ses Dinleme Dökümü</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                            Yapılan son telefon görüşmeleri, arama notları ve ses kayıtları.
                        </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Müşteri, telefon veya not ara..."
                            value={searchLog}
                            onChange={e => setSearchLog(e.target.value)}
                            className="h-9 pl-8 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                                    <th className="py-3 px-4">Tarih</th>
                                    <th className="py-3 px-4">Tür</th>
                                    <th className="py-3 px-4">Temsilci</th>
                                    <th className="py-3 px-4">Müşteri</th>
                                    <th className="py-3 px-4 text-center">Süre</th>
                                    <th className="py-3 px-4 text-center">Sonuç</th>
                                    <th className="py-3 px-4">Arama Notu / Özet</th>
                                    <th className="py-3 px-4 text-right">Ses Kaydı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-slate-400">
                                            Arama kaydı bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.slice(0, 50).map(call => (
                                        <tr key={call.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">
                                                {call.date ? format(parseISO(call.date), 'dd.MM.yy HH:mm') : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold ${
                                                        call.type === 'inbound'
                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}
                                                >
                                                    {call.type === 'inbound' ? '↙ Gelen' : '↗ Giden'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                                                {call.repName}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900">{call.customerName}</div>
                                                <div className="text-[11px] text-slate-400">{call.customerPhone}</div>
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                                                {formatSeconds(call.durationSeconds)}
                                            </td>
                                            <td className="py-3 px-4 text-center whitespace-nowrap">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] font-bold ${
                                                        call.durationSeconds > 10 || call.outcome.toLowerCase().includes('ulaşıldı')
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {call.outcome}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={call.notes}>
                                                {call.notes || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                {call.recordingUrl ? (
                                                    <a
                                                        href={call.recordingUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 px-2 py-1 rounded-lg"
                                                    >
                                                        <Play className="h-3 w-3 fill-indigo-600" />
                                                        <span>Dinle</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">Kayıt yok</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
