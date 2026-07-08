'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getPerformanceAnalytics, getCallCDR, getWhatsAppCDR, getCallSummaryBreakdown, getCallCDRExport, type PeriodKey, type PeriodStats, type PerformanceData, type CallCDRRecord, type WhatsAppCDRRecord, type CallSummaryBreakdown } from './actions'
import {
    MessageSquare, Phone, PhoneIncoming, PhoneOutgoing, Snowflake, Sun, Flame,
    TrendingUp, TrendingDown, Minus, ArrowLeft, RefreshCw,
    BarChart3, Activity, Clock, ChevronLeft, ChevronRight, Search, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type TabKey = 'dashboard' | 'telefon' | 'whatsapp'

const PERIODS: { key: PeriodKey; label: string; shortLabel: string }[] = [
    { key: 'today', label: 'Bugün', shortLabel: 'Bugün' },
    { key: 'yesterday', label: 'Dün', shortLabel: 'Dün' },
    { key: 'this_week', label: 'Bu Hafta', shortLabel: 'Hafta' },
    { key: 'this_month', label: 'Bu Ay', shortLabel: 'Ay' },
    { key: 'last_month', label: 'Geçen Ay', shortLabel: 'G.Ay' },
    { key: 'all_time', label: 'Tüm Zamanlar', shortLabel: 'Tümü' }
]

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
        if (value === 0) { setDisplay(0); return }
        const duration = 800
        const steps = 30
        const increment = value / steps
        let current = 0
        let step = 0
        const timer = setInterval(() => {
            step++
            current = Math.min(Math.round(increment * step), value)
            setDisplay(current)
            if (step >= steps) clearInterval(timer)
        }, duration / steps)
        return () => clearInterval(timer)
    }, [value])
    return <span className={className}>{display.toLocaleString('tr-TR')}</span>
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
    if (previous === 0 && current === 0) return <span className="text-[10px] text-slate-400">—</span>
    if (previous === 0) return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            <TrendingUp className="h-3 w-3" /> Yeni
        </span>
    )
    const pct = Math.round(((current - previous) / previous) * 100)
    if (pct === 0) return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            <Minus className="h-3 w-3" /> %0
        </span>
    )
    return (
        <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md",
            pct > 0 ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
        )}>
            {pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pct > 0 ? '+' : ''}{pct}%
        </span>
    )
}

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
    const max = maxVal || 1
    return (
        <div className="flex items-end gap-[2px] h-8">
            {data.map((val, i) => (
                <div
                    key={i}
                    className={cn("rounded-sm transition-all duration-300 min-h-[2px]", color)}
                    style={{ height: `${Math.max((val / max) * 100, 4)}%`, width: '4px' }}
                    title={`${val}`}
                />
            ))}
        </div>
    )
}

export default function PerformanceDashboard() {
    const router = useRouter()
    const [data, setData] = useState<PerformanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activePeriod, setActivePeriod] = useState<PeriodKey>('today')
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

    // CDR state
    const [callCDR, setCallCDR] = useState<{ records: CallCDRRecord[]; total: number }>({ records: [], total: 0 })
    const [waCDR, setWaCDR] = useState<{ records: WhatsAppCDRRecord[]; total: number }>({ records: [], total: 0 })
    const [cdrPage, setCdrPage] = useState(1)
    const [cdrLoading, setCdrLoading] = useState(false)
    const [summaryBreakdown, setSummaryBreakdown] = useState<CallSummaryBreakdown | null>(null)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const CDR_PAGE_SIZE = 50

    // Excel/CSV export function
    const exportCDR = async () => {
        setExporting(true)
        try {
            const allRecords = await getCallCDRExport(activePeriod)
            if (allRecords.length === 0) return

            const typeLabels: Record<string, string> = { manuel: 'Manuel', ai_outbound: 'AI Giden', ai_inbound: 'AI Gelen' }
            const periodLabel = PERIODS.find(p => p.key === activePeriod)?.label || activePeriod

            // BOM for Excel UTF-8 support
            const BOM = '\uFEFF'
            const headers = ['Tarih', 'Saat', 'Tür', 'Müşteri', 'Telefon', 'Arayan', 'Durum', 'Süre (sn)', 'İlgi Seviyesi', 'Özet']
            const rows = allRecords.map(r => [
                new Date(r.date).toLocaleDateString('tr-TR'),
                new Date(r.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                typeLabels[r.type] || r.type,
                r.customer_name || '',
                r.phone || '',
                r.created_by || '',
                r.status || '',
                r.duration_seconds != null ? String(r.duration_seconds) : '',
                r.interest_level || '',
                (r.summary || '').replace(/[\n\r]/g, ' '),
            ])

            const escapeCSV = (val: string) => {
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    return `"${val.replace(/"/g, '""')}"`
                }
                return val
            }

            const csvContent = BOM + [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Telefon_CDR_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error('Export error:', e)
        } finally {
            setExporting(false)
        }
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getPerformanceAnalytics()
            setData(result)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // Fetch CDR when tab or period changes
    useEffect(() => {
        if (activeTab === 'telefon') {
            setCdrLoading(true)
            setCdrPage(1)
            getCallCDR(activePeriod, 1, CDR_PAGE_SIZE).then(setCallCDR).finally(() => setCdrLoading(false))
            // Also fetch summary breakdown
            setSummaryLoading(true)
            getCallSummaryBreakdown(activePeriod).then(setSummaryBreakdown).finally(() => setSummaryLoading(false))
        } else if (activeTab === 'whatsapp') {
            setCdrLoading(true)
            setCdrPage(1)
            getWhatsAppCDR(activePeriod, 1, CDR_PAGE_SIZE).then(setWaCDR).finally(() => setCdrLoading(false))
        }
    }, [activeTab, activePeriod])

    const loadCDRPage = async (page: number) => {
        setCdrLoading(true)
        setCdrPage(page)
        if (activeTab === 'telefon') {
            const result = await getCallCDR(activePeriod, page, CDR_PAGE_SIZE)
            setCallCDR(result)
        } else {
            const result = await getWhatsAppCDR(activePeriod, page, CDR_PAGE_SIZE)
            setWaCDR(result)
        }
        setCdrLoading(false)
    }

    const currentStats = data?.periods.find(p => p.period === activePeriod)

    // Previous period for trend comparison
    const getPreviousPeriodStats = (): PeriodStats | undefined => {
        const periodOrder: PeriodKey[] = ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'all_time']
        const idx = periodOrder.indexOf(activePeriod)
        if (idx <= 0) return undefined
        return data?.periods.find(p => p.period === periodOrder[idx - 1])
    }
    const prevStats = getPreviousPeriodStats()

    const totalLeads = (currentStats?.cold_count || 0) + (currentStats?.warm_count || 0) + (currentStats?.hot_count || 0)
    const hotPct = totalLeads > 0 ? Math.round((currentStats?.hot_count || 0) / totalLeads * 100) : 0
    const totalCalls = (currentStats?.outbound_call_count || 0) + (currentStats?.inbound_call_count || 0)

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            {/* ═══════ HEADER ═══════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            Performans & Lead Analitik
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5 ml-14">WhatsApp, Giden/Gelen Arama ve Lead sıcaklık raporları</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {data?.last_updated && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Clock className="h-3 w-3" />
                            Son güncelleme: {new Date(data.last_updated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2 rounded-xl h-10 px-5 font-bold">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Yenile
                    </Button>
                </div>
            </div>

            {/* ═══════ TOP TABS ═══════ */}
            <div className="flex gap-1 bg-slate-100/80 rounded-2xl p-1 w-fit">
                {[
                    { key: 'dashboard' as TabKey, label: '📊 Dashboard', icon: BarChart3 },
                    { key: 'telefon' as TabKey, label: '📞 Telefon CDR', icon: Phone },
                    { key: 'whatsapp' as TabKey, label: '💬 WhatsApp CDR', icon: MessageSquare },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 flex items-center gap-2",
                            activeTab === tab.key
                                ? "bg-white text-slate-800 shadow-md"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ PERIOD SELECTOR ═══════ */}
            <div className="flex gap-1.5 bg-slate-100/80 rounded-2xl p-1.5 w-fit">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setActivePeriod(p.key)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200",
                            activePeriod === p.key
                                ? "bg-white text-violet-700 shadow-md shadow-violet-100/50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        <span className="hidden sm:inline">{p.label}</span>
                        <span className="sm:hidden">{p.shortLabel}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                            <div className="h-4 w-20 bg-slate-200 rounded mb-4" />
                            <div className="h-10 w-24 bg-slate-200 rounded mb-2" />
                            <div className="h-3 w-16 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : activeTab === 'dashboard' ? (
                <>
                    {/* ═══════ KPI CARDS — 6 columns ═══════ */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* WhatsApp */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5 hover:shadow-lg hover:shadow-green-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200/50 group-hover:scale-110 transition-transform">
                                    <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                                {data?.daily_trend && (
                                    <MiniBarChart
                                        data={data.daily_trend.map(d => d.whatsapp)}
                                        maxVal={Math.max(...data.daily_trend.map(d => d.whatsapp), 1)}
                                        color="bg-green-400"
                                    />
                                )}
                            </div>
                            <p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest mb-1">WhatsApp</p>
                            <AnimatedNumber value={currentStats?.whatsapp_count || 0} className="text-2xl font-black text-green-800 block" />
                            <div className="mt-1.5">
                                {prevStats && <TrendBadge current={currentStats?.whatsapp_count || 0} previous={prevStats.whatsapp_count} />}
                            </div>
                        </div>

                        {/* Giden Aramalar */}
                        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-100 p-5 hover:shadow-lg hover:shadow-blue-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform">
                                    <PhoneOutgoing className="h-5 w-5 text-white" />
                                </div>
                                {data?.daily_trend && (
                                    <MiniBarChart
                                        data={data.daily_trend.map(d => d.outbound)}
                                        maxVal={Math.max(...data.daily_trend.map(d => d.outbound), 1)}
                                        color="bg-blue-400"
                                    />
                                )}
                            </div>
                            <p className="text-[10px] font-black text-blue-700/60 uppercase tracking-widest mb-1">📤 Giden Arama</p>
                            <AnimatedNumber value={currentStats?.outbound_call_count || 0} className="text-2xl font-black text-blue-800 block" />
                            <p className="text-[9px] text-blue-500 mt-0.5 font-bold">Manuel + AI Outbound</p>
                        </div>

                        {/* Gelen Aramalar */}
                        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5 hover:shadow-lg hover:shadow-indigo-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200/50 group-hover:scale-110 transition-transform">
                                    <PhoneIncoming className="h-5 w-5 text-white" />
                                </div>
                                {data?.daily_trend && (
                                    <MiniBarChart
                                        data={data.daily_trend.map(d => d.inbound)}
                                        maxVal={Math.max(...data.daily_trend.map(d => d.inbound), 1)}
                                        color="bg-indigo-400"
                                    />
                                )}
                            </div>
                            <p className="text-[10px] font-black text-indigo-700/60 uppercase tracking-widest mb-1">📥 Gelen Arama</p>
                            <AnimatedNumber value={currentStats?.inbound_call_count || 0} className="text-2xl font-black text-indigo-800 block" />
                            <p className="text-[9px] text-indigo-500 mt-0.5 font-bold">AI Asistan Karşıladı</p>
                        </div>

                        {/* Cold Lead */}
                        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl border border-sky-100 p-5 hover:shadow-lg hover:shadow-sky-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-200/50 group-hover:scale-110 transition-transform">
                                    <Snowflake className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-sky-700/60 uppercase tracking-widest mb-1">❄️ Cold Lead</p>
                            <AnimatedNumber value={currentStats?.cold_count || 0} className="text-2xl font-black text-sky-800 block" />
                            <p className="text-[9px] text-sky-600 mt-0.5 font-bold">Sıcak temas bekleyenler</p>
                        </div>

                        {/* Ilık Lead */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5 hover:shadow-lg hover:shadow-amber-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
                                    <Sun className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest mb-1">☀️ Ilık Lead</p>
                            <AnimatedNumber value={currentStats?.warm_count || 0} className="text-2xl font-black text-amber-800 block" />
                            <p className="text-[9px] text-amber-600 mt-0.5 font-bold">Takip edilmesi gerekenler</p>
                        </div>

                        {/* Hot Lead */}
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100 p-5 hover:shadow-lg hover:shadow-red-100/40 transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-200/50 group-hover:scale-110 transition-transform animate-pulse">
                                    <Flame className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-red-700/60 uppercase tracking-widest mb-1">🔥 Hot Lead</p>
                            <AnimatedNumber value={currentStats?.hot_count || 0} className="text-2xl font-black text-red-800 block" />
                            <div className="mt-0.5">
                                <span className="text-[9px] text-red-600 font-black">⚡ Dönüşüm: %{hotPct}</span>
                            </div>
                        </div>
                    </div>

                    {/* ═══════ COMPARISON TABLE ═══════ */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Zaman Bazlı Karşılaştırma</h2>
                                    <p className="text-[11px] text-slate-400">Tüm dönemlerin özet tablosu</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80">
                                        <th className="text-left px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Dönem</th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-green-600 uppercase tracking-widest">
                                            <span className="inline-flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" /> WA
                                            </span>
                                        </th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-blue-600 uppercase tracking-widest">
                                            <span className="inline-flex items-center gap-1">
                                                <PhoneOutgoing className="h-3 w-3" /> Giden
                                            </span>
                                        </th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                                            <span className="inline-flex items-center gap-1">
                                                <PhoneIncoming className="h-3 w-3" /> Gelen
                                            </span>
                                        </th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-sky-600 uppercase tracking-widest">❄️ Cold</th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-amber-600 uppercase tracking-widest">☀️ Ilık</th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-red-600 uppercase tracking-widest">🔥 Hot</th>
                                        <th className="text-center px-3 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.periods.map((p) => {
                                        const isActive = p.period === activePeriod
                                        const total = p.cold_count + p.warm_count + p.hot_count
                                        return (
                                            <tr
                                                key={p.period}
                                                onClick={() => setActivePeriod(p.period)}
                                                className={cn(
                                                    "border-t border-slate-50 cursor-pointer transition-all",
                                                    isActive
                                                        ? "bg-violet-50/60 hover:bg-violet-50"
                                                        : "hover:bg-slate-50/80"
                                                )}
                                            >
                                                <td className="px-6 py-3.5">
                                                    <span className={cn(
                                                        "text-sm font-black",
                                                        isActive ? "text-violet-700" : "text-slate-700"
                                                    )}>
                                                        {isActive && <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mr-2 animate-pulse" />}
                                                        {p.label}
                                                    </span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-base font-black text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg">
                                                        {p.whatsapp_count.toLocaleString('tr-TR')}
                                                    </span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-base font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                                                        {p.outbound_call_count.toLocaleString('tr-TR')}
                                                    </span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-base font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                                                        {p.inbound_call_count.toLocaleString('tr-TR')}
                                                    </span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-sm font-black text-sky-700">{p.cold_count.toLocaleString('tr-TR')}</span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-sm font-black text-amber-700">{p.warm_count.toLocaleString('tr-TR')}</span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-sm font-black text-red-700">{p.hot_count.toLocaleString('tr-TR')}</span>
                                                </td>
                                                <td className="text-center px-3 py-3.5">
                                                    <span className="text-sm font-bold text-slate-600">{total.toLocaleString('tr-TR')}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ═══════ TREND CHART (3 bars per day) ═══════ */}
                    {data?.daily_trend && data.daily_trend.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Son 14 Gün Trend</h2>
                                    <p className="text-[11px] text-slate-400">Günlük WhatsApp, Giden ve Gelen Arama dağılımı</p>
                                </div>
                                <div className="ml-auto flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                                        <span className="h-3 w-3 rounded-sm bg-green-400" /> WhatsApp
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
                                        <span className="h-3 w-3 rounded-sm bg-blue-400" /> Giden
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
                                        <span className="h-3 w-3 rounded-sm bg-indigo-400" /> Gelen
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-end gap-1 h-44">
                                {data.daily_trend.map((day) => {
                                    const maxVal = Math.max(
                                        ...data.daily_trend.map(d => Math.max(d.whatsapp, d.outbound, d.inbound)),
                                        1
                                    )
                                    const waHeight = (day.whatsapp / maxVal) * 100
                                    const outHeight = (day.outbound / maxVal) * 100
                                    const inHeight = (day.inbound / maxVal) * 100
                                    const dayLabel = new Date(day.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
                                    const isToday = day.date === new Date().toISOString().split('T')[0]
                                    return (
                                        <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${dayLabel}\nWA: ${day.whatsapp} | Giden: ${day.outbound} | Gelen: ${day.inbound}`}>
                                            <div className="flex items-end gap-[1px] w-full justify-center" style={{ height: '130px' }}>
                                                <div
                                                    className="bg-green-400 rounded-t-sm transition-all duration-500 group-hover:bg-green-500 min-h-[2px]"
                                                    style={{ height: `${Math.max(waHeight, 2)}%`, width: '30%' }}
                                                />
                                                <div
                                                    className="bg-blue-400 rounded-t-sm transition-all duration-500 group-hover:bg-blue-500 min-h-[2px]"
                                                    style={{ height: `${Math.max(outHeight, 2)}%`, width: '30%' }}
                                                />
                                                <div
                                                    className="bg-indigo-400 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-500 min-h-[2px]"
                                                    style={{ height: `${Math.max(inHeight, 2)}%`, width: '30%' }}
                                                />
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-bold whitespace-nowrap",
                                                isToday ? "text-violet-600" : "text-slate-400"
                                            )}>
                                                {dayLabel}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═══════ WHATSAPP ŞABLON KIRILIMI ═══════ */}
                    {data?.wa_breakdown && (() => {
                        const breakdown = (data.wa_breakdown as any)[activePeriod] as Record<string, number> | undefined
                        if (!breakdown || Object.keys(breakdown).length === 0) return null
                        const sorted = Object.entries(breakdown).sort(([,a], [,b]) => b - a)
                        const maxCount = sorted[0]?.[1] || 1
                        const totalWa = sorted.reduce((sum, [, cnt]) => sum + cnt, 0)

                        // Template display names and colors
                        const templateMeta: Record<string, { label: string; color: string; emoji: string }> = {
                            'Serbest Metin': { label: 'AI Chatbot Yanıtları', color: 'bg-green-400', emoji: '🤖' },
                            'new_lead_bilgilendirme': { label: 'Yeni Lead Bilgilendirme', color: 'bg-blue-400', emoji: '📋' },
                            'novo_takip_cicek_butonlu': { label: 'Takip (Çiçek Butonlu)', color: 'bg-pink-400', emoji: '🌸' },
                            'novo_talep_alindi': { label: 'Talep Alındı', color: 'bg-amber-400', emoji: '✅' },
                            'new_lead_bilgilendirme [Resent]': { label: 'Lead Bilgilendirme (Tekrar)', color: 'bg-indigo-400', emoji: '🔄' },
                        }

                        return (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                                <MessageSquare className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">WhatsApp Şablon Kırılımı</h2>
                                                <p className="text-[11px] text-slate-400">
                                                    {PERIODS.find(p => p.key === activePeriod)?.label} — Toplam {totalWa.toLocaleString('tr-TR')} mesaj
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-green-700">{totalWa.toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {sorted.map(([template, count], idx) => {
                                        const meta = templateMeta[template] || { label: template, color: 'bg-slate-400', emoji: '💬' }
                                        const pct = totalWa > 0 ? Math.round((count / totalWa) * 100) : 0
                                        const barWidth = Math.max((count / maxCount) * 100, 2)
                                        return (
                                            <div key={template} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors group">
                                                <span className="text-lg w-8 text-center flex-shrink-0">{meta.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-bold text-slate-700 truncate">{meta.label}</span>
                                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">%{pct}</span>
                                                            <span className="text-base font-black text-green-700 min-w-[60px] text-right">{count.toLocaleString('tr-TR')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-700 group-hover:opacity-80", meta.color)}
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}

                    {/* ═══════ ARAMA KIRILIMI ═══════ */}
                    {data?.calls_breakdown && (() => {
                        const cb = (data.calls_breakdown as any)[activePeriod] as Record<string, number> | undefined
                        if (!cb) return null
                        const totalCb = (cb.manuel_giden || 0) + (cb.ai_giden || 0) + (cb.gelen || 0)
                        if (totalCb === 0) return null
                        const maxCb = Math.max(cb.manuel_giden || 0, cb.ai_giden || 0, cb.gelen || 0, 1)

                        const items = [
                            { key: 'manuel_giden', label: 'Manuel Giden Arama', emoji: '📞', color: 'bg-blue-400', sublabel: 'Satış ekibi aramaları', value: cb.manuel_giden || 0 },
                            { key: 'ai_giden', label: 'AI Giden Arama', emoji: '🤖', color: 'bg-sky-400', sublabel: 'Maya AI outbound', value: cb.ai_giden || 0 },
                            { key: 'gelen', label: 'Gelen Arama', emoji: '📥', color: 'bg-indigo-400', sublabel: 'AI Asistan karşıladı', value: cb.gelen || 0 },
                        ]

                        return (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Arama Kırılımı</h2>
                                                <p className="text-[11px] text-slate-400">
                                                    {PERIODS.find(p => p.key === activePeriod)?.label} — Toplam {totalCb.toLocaleString('tr-TR')} arama
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-2xl font-black text-blue-700">{totalCb.toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {items.map(item => {
                                        const pct = totalCb > 0 ? Math.round((item.value / totalCb) * 100) : 0
                                        const barWidth = Math.max((item.value / maxCb) * 100, 2)
                                        return (
                                            <div key={item.key} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors group">
                                                <span className="text-lg w-8 text-center flex-shrink-0">{item.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                                            <span className="text-[10px] text-slate-400 ml-2">{item.sublabel}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">%{pct}</span>
                                                            <span className="text-base font-black text-blue-700 min-w-[60px] text-right">{item.value.toLocaleString('tr-TR')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-700 group-hover:opacity-80", item.color)}
                                                            style={{ width: `${barWidth}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })()}

                    {/* ═══════ LEAD DONUT + QUICK STATS ═══════ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Lead Dağılımı</h3>
                            {totalLeads > 0 ? (
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#38bdf8" strokeWidth="3"
                                            strokeDasharray={`${(currentStats?.cold_count || 0) / totalLeads * 100} ${100 - (currentStats?.cold_count || 0) / totalLeads * 100}`}
                                            strokeDashoffset="0" className="transition-all duration-700"
                                        />
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f59e0b" strokeWidth="3"
                                            strokeDasharray={`${(currentStats?.warm_count || 0) / totalLeads * 100} ${100 - (currentStats?.warm_count || 0) / totalLeads * 100}`}
                                            strokeDashoffset={`${-((currentStats?.cold_count || 0) / totalLeads * 100)}`} className="transition-all duration-700"
                                        />
                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#ef4444" strokeWidth="3"
                                            strokeDasharray={`${(currentStats?.hot_count || 0) / totalLeads * 100} ${100 - (currentStats?.hot_count || 0) / totalLeads * 100}`}
                                            strokeDashoffset={`${-(((currentStats?.cold_count || 0) + (currentStats?.warm_count || 0)) / totalLeads * 100)}`} className="transition-all duration-700"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-slate-800">{totalLeads}</span>
                                        <span className="text-[10px] font-bold text-slate-400">Toplam</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center">
                                    <span className="text-sm text-slate-400 font-bold">Veri yok</span>
                                </div>
                            )}
                            <div className="flex items-center gap-4 mt-4">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Cold</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Ilık</span>
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Hot</span>
                            </div>
                        </div>

                        {/* Quick Stats Cards */}
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-5">
                                <p className="text-[11px] font-black text-violet-600/70 uppercase tracking-widest">Toplam Aktivite</p>
                                <p className="text-3xl font-black text-violet-800 mt-2">
                                    {((currentStats?.whatsapp_count || 0) + totalCalls).toLocaleString('tr-TR')}
                                </p>
                                <p className="text-[11px] text-violet-500 mt-1">WA + Giden + Gelen Aramalar</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
                                <p className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest">Hot Lead Oranı</p>
                                <p className="text-3xl font-black text-emerald-800 mt-2">%{hotPct}</p>
                                <p className="text-[11px] text-emerald-500 mt-1">Dönüşüm potansiyeli</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-100 p-5">
                                <p className="text-[11px] font-black text-blue-600/70 uppercase tracking-widest">Giden / Gelen Oranı</p>
                                <p className="text-3xl font-black text-blue-800 mt-2">
                                    {(currentStats?.inbound_call_count || 0) > 0
                                        ? ((currentStats?.outbound_call_count || 0) / (currentStats?.inbound_call_count || 1)).toFixed(1)
                                        : '—'
                                    }x
                                </p>
                                <p className="text-[11px] text-blue-500 mt-1">Her gelen başına giden arama</p>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5">
                                <p className="text-[11px] font-black text-rose-600/70 uppercase tracking-widest">Isınma Oranı</p>
                                <p className="text-3xl font-black text-rose-800 mt-2">
                                    %{totalLeads > 0 ? Math.round(((currentStats?.warm_count || 0) + (currentStats?.hot_count || 0)) / totalLeads * 100) : 0}
                                </p>
                                <p className="text-[11px] text-rose-500 mt-1">Ilık + Hot / Toplam</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'telefon' ? (
                /* ═══════ TELEFON CDR TAB ═══════ */
                <>
                {/* ═══════ ÖZET KIRILIMI DASHBOARD ═══════ */}
                {summaryLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                        {[1,2,3,4,5,6,7].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
                                <div className="h-3 w-14 bg-slate-200 rounded mb-3" />
                                <div className="h-8 w-12 bg-slate-200 rounded mb-2" />
                                <div className="h-2 w-full bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>
                ) : summaryBreakdown && summaryBreakdown.categories.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Arama Sonuç Kırılımı</h2>
                                    <p className="text-[11px] text-slate-400">
                                        {PERIODS.find(p => p.key === activePeriod)?.label} — {summaryBreakdown.total.toLocaleString('tr-TR')} arama
                                    </p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-violet-700">{summaryBreakdown.total.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {summaryBreakdown.categories.map((cat, idx) => {
                                    const pct = summaryBreakdown.total > 0 ? Math.round((cat.count / summaryBreakdown.total) * 100) : 0
                                    const maxCount = summaryBreakdown.categories[0]?.count || 1
                                    const barWidth = Math.max((cat.count / maxCount) * 100, 4)
                                    return (
                                        <div
                                            key={cat.key}
                                            className="group relative bg-slate-50/60 hover:bg-white rounded-xl border border-slate-100 hover:border-slate-200 p-3.5 transition-all hover:shadow-md cursor-default"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-lg">{cat.emoji}</span>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">%{pct}</span>
                                            </div>
                                            <p className="text-xl font-black text-slate-800 mb-1">{cat.count.toLocaleString('tr-TR')}</p>
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight mb-2.5 min-h-[28px]">{cat.label}</p>
                                            <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-700 group-hover:opacity-80", cat.color)}
                                                    style={{ width: `${barWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Telefon Arama Kayıtları (CDR)</h2>
                                <p className="text-[11px] text-slate-400">{PERIODS.find(p => p.key === activePeriod)?.label} — {callCDR.total.toLocaleString('tr-TR')} kayıt</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportCDR}
                            disabled={exporting || callCDR.records.length === 0}
                            className="gap-2 rounded-xl h-9 px-4 font-bold text-xs"
                        >
                            <Download className={cn("h-3.5 w-3.5", exporting && "animate-bounce")} />
                            {exporting ? 'İndiriliyor...' : 'Excel Export'}
                        </Button>
                    </div>
                    {cdrLoading ? (
                        <div className="p-12 text-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto" /></div>
                    ) : callCDR.records.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold">Bu dönemde arama kaydı yok</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Tarih / Saat</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Tür</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Müşteri</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Telefon</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Arayan</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Durum</th>
                                            <th className="text-right px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Süre</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Özet</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {callCDR.records.map(r => (
                                            <tr key={`${r.type}-${r.id}`} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                                                    {new Date(r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}{' '}
                                                    <span className="text-slate-400">{new Date(r.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-1 rounded-md",
                                                        r.type === 'manuel' ? "bg-blue-50 text-blue-700" :
                                                        r.type === 'ai_outbound' ? "bg-sky-50 text-sky-700" :
                                                        "bg-indigo-50 text-indigo-700"
                                                    )}>
                                                        {r.type === 'manuel' ? '📞 Manuel' : r.type === 'ai_outbound' ? '🤖 AI Giden' : '📥 Gelen'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-700">{r.customer_name || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.phone || '—'}</td>
                                                <td className="px-4 py-3 text-slate-600">{r.created_by || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-0.5 rounded-md",
                                                        r.interest_level === 'hot' ? "bg-red-50 text-red-700" :
                                                        r.interest_level === 'warm' ? "bg-amber-50 text-amber-700" :
                                                        "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {r.status || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                                                    {r.duration_seconds != null ? `${Math.floor(r.duration_seconds / 60)}:${String(r.duration_seconds % 60).padStart(2, '0')}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[250px] truncate">{r.summary || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {callCDR.total > CDR_PAGE_SIZE && (
                                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        Sayfa {cdrPage} / {Math.ceil(callCDR.total / CDR_PAGE_SIZE)} ({callCDR.total} kayıt)
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={cdrPage <= 1} onClick={() => loadCDRPage(cdrPage - 1)} className="h-8 gap-1">
                                            <ChevronLeft className="h-3 w-3" /> Önceki
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={cdrPage >= Math.ceil(callCDR.total / CDR_PAGE_SIZE)} onClick={() => loadCDRPage(cdrPage + 1)} className="h-8 gap-1">
                                            Sonraki <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                </>
            ) : (
                /* ═══════ WHATSAPP CDR TAB ═══════ */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">WhatsApp Mesaj Kayıtları</h2>
                                <p className="text-[11px] text-slate-400">{PERIODS.find(p => p.key === activePeriod)?.label} — {waCDR.total.toLocaleString('tr-TR')} mesaj</p>
                            </div>
                        </div>
                    </div>
                    {cdrLoading ? (
                        <div className="p-12 text-center"><RefreshCw className="h-6 w-6 animate-spin text-slate-400 mx-auto" /></div>
                    ) : waCDR.records.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-bold">Bu dönemde WhatsApp kaydı yok</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Tarih / Saat</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Müşteri</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Telefon</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Şablon</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">Gönderen</th>
                                            <th className="text-left px-4 py-3 text-[11px] font-black text-slate-500 uppercase">İçerik</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waCDR.records.map(r => (
                                            <tr key={r.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                                                    {new Date(r.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}{' '}
                                                    <span className="text-slate-400">{new Date(r.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-slate-700">{r.customer_name || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.phone || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-2 py-1 rounded-md",
                                                        r.template === 'Serbest Metin' ? "bg-green-50 text-green-700" :
                                                        r.template?.includes('bilgilendirme') ? "bg-blue-50 text-blue-700" :
                                                        r.template?.includes('cicek') ? "bg-pink-50 text-pink-700" :
                                                        r.template?.includes('talep') ? "bg-amber-50 text-amber-700" :
                                                        "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {r.template || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{r.created_by || '—'}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[300px] truncate">{r.description || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            {waCDR.total > CDR_PAGE_SIZE && (
                                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs text-slate-400">
                                        Sayfa {cdrPage} / {Math.ceil(waCDR.total / CDR_PAGE_SIZE)} ({waCDR.total} mesaj)
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" disabled={cdrPage <= 1} onClick={() => loadCDRPage(cdrPage - 1)} className="h-8 gap-1">
                                            <ChevronLeft className="h-3 w-3" /> Önceki
                                        </Button>
                                        <Button variant="outline" size="sm" disabled={cdrPage >= Math.ceil(waCDR.total / CDR_PAGE_SIZE)} onClick={() => loadCDRPage(cdrPage + 1)} className="h-8 gap-1">
                                            Sonraki <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
