'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Crown,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    ArrowRight,
    DollarSign,
    Users,
    Activity,
    BarChart3,
    Clock,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Printer,
    Building2,
    Target,
    ShieldAlert,
    Phone,
    Flame,
    Zap,
    Briefcase,
    Calendar,
    ChevronDown,
    Layers,
    PieChart as PieChartIcon,
    Sparkles,
    Radio,
    Coins,
    Sliders,
    HelpCircle,
    CreditCard,
    PhoneCall,
    CalendarClock,
    AlertTriangle,
    FileText,
    FileSpreadsheet,
    Download,
    Check,
    ShieldCheck
} from 'lucide-react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell
} from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getCeoFunnelData, PeriodType } from './actions'

// -------------------------------------------------------------
// SWR Instant Client-Side Caching (LocalStorage)
// -------------------------------------------------------------
const CACHE_PREFIX = 'novocrm_ceo_funnel_cache_v2_'

function getCachedData(projId: string, p: PeriodType): { data: any; timestamp: number } | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${projId}_${p}`)
        if (!raw) return null
        return JSON.parse(raw)
    } catch (e) {
        console.warn('Failed to read CEO funnel cache:', e)
        return null
    }
}

function setCachedData(projId: string, p: PeriodType, data: any) {
    if (typeof window === 'undefined' || !data || data.error) return
    try {
        localStorage.setItem(
            `${CACHE_PREFIX}${projId}_${p}`,
            JSON.stringify({
                timestamp: Date.now(),
                data
            })
        )
    } catch (e) {
        console.warn('Failed to write CEO funnel cache:', e)
    }
}

function CeoFunnelSkeleton() {
    return (
        <div className="flex flex-col gap-8 pb-16 animate-pulse">
            {/* Top Executive Header Skeleton */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl border border-indigo-500/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-amber-500/30" />
                        <div className="h-6 w-40 rounded-full bg-amber-500/20" />
                        <div className="h-6 w-48 rounded-full bg-indigo-500/30" />
                    </div>
                    <div className="h-9 w-72 md:w-96 rounded-2xl bg-white/20" />
                    <div className="h-4 w-60 md:w-80 rounded-lg bg-white/10" />
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="h-10 w-40 rounded-xl bg-white/10" />
                    <div className="h-10 w-64 rounded-xl bg-white/10" />
                    <div className="h-10 w-10 rounded-xl bg-white/10" />
                </div>
            </div>

            {/* 4 KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-32 rounded bg-slate-200" />
                            <div className="h-10 w-10 rounded-2xl bg-slate-100" />
                        </div>
                        <div className="h-8 w-36 rounded-lg bg-slate-200" />
                        <div className="h-4 w-44 rounded bg-slate-100" />
                    </div>
                ))}
            </div>

            {/* 2 Main Chart Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
                    <div className="h-6 w-48 rounded bg-slate-200" />
                    <div className="h-4 w-64 rounded bg-slate-100" />
                    <div className="h-72 rounded-2xl bg-slate-50 flex items-end p-6 gap-4">
                        {[45, 60, 85, 50, 95].map((h, idx) => (
                            <div key={idx} className="flex-1 bg-slate-200 rounded-t-xl" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
                    <div className="h-6 w-48 rounded bg-slate-200" />
                    <div className="h-4 w-64 rounded bg-slate-100" />
                    <div className="h-72 rounded-2xl bg-slate-50 flex flex-col justify-center gap-4 p-6">
                        <div className="h-12 w-full rounded-2xl bg-slate-200" />
                        <div className="h-12 w-full rounded-2xl bg-slate-200" />
                        <div className="h-12 w-full rounded-2xl bg-slate-200" />
                    </div>
                </div>
            </div>

            {/* Cashflow & Activities Tabs Skeleton */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
                <div className="flex gap-3">
                    <div className="h-10 w-48 rounded-xl bg-slate-200" />
                    <div className="h-10 w-48 rounded-xl bg-slate-100" />
                </div>
                <div className="space-y-3 pt-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-14 w-full rounded-2xl bg-slate-100" />
                    ))}
                </div>
            </div>
        </div>
    )
}

interface CeoFunnelDashboardProps {
    initialData?: any
}

export default function CeoFunnelDashboard({ initialData }: CeoFunnelDashboardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<any>(initialData || null)
    const [period, setPeriod] = useState<PeriodType>(initialData?.period || 'this_month')
    const [projectId, setProjectId] = useState<string>(initialData?.selectedProjectId || 'all')
    const [activeTab, setActiveTab] = useState<string>('forecast')
    const [isGuideOpen, setIsGuideOpen] = useState(false)
    const [lastSyncTime, setLastSyncTime] = useState<string>('')
    const [isRealtimePulse, setIsRealtimePulse] = useState(false)
    const [isFromCache, setIsFromCache] = useState(false)
    const [isRevalidating, setIsRevalidating] = useState(false)

    // Currency Formatter Helper
    const formatCurrency = (val: number) => {
        if (!val || isNaN(val)) return '₺0'
        if (val >= 1_000_000) {
            return `₺${(val / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}M`
        }
        if (val >= 1_000) {
            return `₺${(val / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}K`
        }
        return `₺${val.toLocaleString('tr-TR')}`
    }

    const reloadData = (
        newPeriod: PeriodType = period,
        newProject: string = projectId,
        options: { silent?: boolean; forceRefresh?: boolean } = {}
    ) => {
        const { silent = false, forceRefresh = false } = options
        setIsRevalidating(true)
        startTransition(async () => {
            try {
                const res = await getCeoFunnelData({
                    period: newPeriod,
                    projectId: newProject,
                    forceRefresh
                })
                if ('error' in res) {
                    if (!silent) toast.error(res.error || 'Veri yüklenemedi')
                    setData((prev: any) => (prev && !prev.error) ? prev : { error: res.error || 'Veri yüklenemedi' })
                } else {
                    setData(res)
                    setCachedData(newProject, newPeriod, res)
                    setIsFromCache(false)
                    setLastSyncTime(new Date().toLocaleTimeString('tr-TR'))
                    if (silent) {
                        setIsRealtimePulse(true)
                        setTimeout(() => setIsRealtimePulse(false), 3000)
                    } else {
                        toast.success('Satış hunisi verileri güncellendi')
                    }
                }
            } catch (err: any) {
                if (!silent) toast.error('Beklenmedik bir hata oluştu')
                setData((prev: any) => (prev && !prev.error) ? prev : { error: 'Veriler yüklenirken beklenmedik bir hata oluştu.' })
            } finally {
                setIsRevalidating(false)
            }
        })
    }

    // Instant SWR Cache Initialization on mount
    useEffect(() => {
        const cached = getCachedData(projectId, period)
        if (cached?.data && !cached.data.error) {
            setData(cached.data)
            setIsFromCache(true)
            setLastSyncTime(new Date(cached.timestamp).toLocaleTimeString('tr-TR'))
            // Silently fetch freshest data in background
            reloadData(period, projectId, { silent: true, forceRefresh: false })
        } else if (initialData && !initialData.error) {
            setCachedData(projectId, period, initialData)
            setLastSyncTime(new Date().toLocaleTimeString('tr-TR'))
        } else {
            // First time load on this browser: fetch fresh
            reloadData(period, projectId, { silent: false, forceRefresh: false })
        }
    }, [])

    // Supabase Realtime Subscription on sales, contracts, payment_plans & activities
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('ceo-funnel-hub-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => reloadData(period, projectId, { silent: true, forceRefresh: true }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => reloadData(period, projectId, { silent: true, forceRefresh: true }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_plans' }, () => reloadData(period, projectId, { silent: true, forceRefresh: true }))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => reloadData(period, projectId, { silent: true, forceRefresh: true }))
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [period, projectId])

    const handlePeriodChange = (p: PeriodType) => {
        setPeriod(p)
        const cached = getCachedData(projectId, p)
        if (cached?.data && !cached.data.error) {
            setData(cached.data)
            setIsFromCache(true)
            setLastSyncTime(new Date(cached.timestamp).toLocaleTimeString('tr-TR'))
            reloadData(p, projectId, { silent: true })
        } else {
            reloadData(p, projectId, { silent: false })
        }
    }

    const handleProjectChange = (pId: string) => {
        setProjectId(pId)
        const cached = getCachedData(pId, period)
        if (cached?.data && !cached.data.error) {
            setData(cached.data)
            setIsFromCache(true)
            setLastSyncTime(new Date(cached.timestamp).toLocaleTimeString('tr-TR'))
            reloadData(period, pId, { silent: true })
        } else {
            reloadData(period, pId, { silent: false })
        }
    }

    if (!data) {
        return <CeoFunnelSkeleton />
    }

    if (data.error || !data.kpi) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                <AlertCircle className="h-12 w-12 text-rose-500" />
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800">Veriler Yüklenirken Bir Sorun Oluştu</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        {data?.error || 'Satış hunisi verileri şu anda alınamadı. Lütfen oturumunuzu kontrol edip tekrar deneyin.'}
                    </p>
                </div>
                <Button onClick={() => reloadData(period, projectId, { silent: false, forceRefresh: true })} className="rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                    <RefreshCw className="h-4 w-4 mr-2" /> Tekrar Dene
                </Button>
            </div>
        )
    }

    const {
        kpi,
        revenueForecast,
        periodComparison,
        funnelStages,
        sixMonthTrend,
        projectBreakdown,
        repPerformance,
        lossBreakdown,
        sourceBreakdown,
        topWhaleDeals,
        stagnantDeals,
        projects,
        contractCashflow,
        salesActivities
    } = data

    const cashflow = contractCashflow || {
        totalContractsCount: 0,
        totalContractedValue: 0,
        totalCollectedCash: 0,
        totalRemainingReceivables: 0,
        collectionProgress: 0,
        thisMonthDue: 0,
        thisMonthCollected: 0,
        thisMonthPending: 0,
        thisMonthCollectionRate: 0,
        overdueReceivables: 0,
        overdueCount: 0,
        forwardCashflow: [],
        upcomingInstallments: [],
        topOverdueInstallments: []
    }

    const activities = salesActivities || {
        todayTotal: 0,
        todayCompleted: 0,
        todayCalls: 0,
        todayMeetings: 0,
        todayVisits: 0,
        periodTotal: 0,
        periodCompleted: 0,
        periodCalls: 0,
        periodMeetings: 0,
        periodVisits: 0,
        completionRate: 0,
        conversionLeadToMeeting: 0,
        conversionMeetingToWon: 0,
        repEfforts: [],
        neglectedHotDeals: []
    }

    const periodLabels: Record<PeriodType, string> = {
        this_month: 'Bu Ay',
        last_month: 'Geçen Ay',
        last_30_days: 'Son 30 Gün',
        last_90_days: 'Son 90 Gün',
        this_year: 'Bu Yıl',
        all: 'Tüm Zamanlar'
    }

    return (
        <div className="flex flex-col gap-8 pb-16 print:p-0">
            {/* Top Executive Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-indigo-500/20 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Crown className="h-6 w-6 text-slate-950 fill-slate-950" />
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-black px-3 py-1 uppercase tracking-wider">
                            Executive Command Center
                        </Badge>
                        {/* Realtime / SWR Cache Status Badge */}
                        {isRevalidating && isFromCache ? (
                            <span className="text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
                                <Zap className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                                <span>⚡ Önbellekten Açıldı • Güncelleniyor...</span>
                            </span>
                        ) : isFromCache ? (
                            <span className="text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                <Zap className="h-3 w-3 text-amber-400" />
                                <span>Önbellek</span>
                            </span>
                        ) : (
                            <span className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                                isRealtimePulse ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400' : 'bg-white/10 text-indigo-200'
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${isRealtimePulse ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400'}`} />
                                {isRealtimePulse ? 'Yeni Verilerle Güncellendi' : 'Canlı Realtime Satış Hunisi'}
                            </span>
                        )}
                        <span className="text-[11px] text-indigo-300/70 hidden sm:inline">
                            Son Senkron: {lastSyncTime || 'Senkronize ediliyor...'}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                        CEO Satış Hunisi & Gelir Projeksiyonu Kokpiti
                    </h1>
                    <p className="text-indigo-200/80 text-sm max-w-2xl font-normal">
                        Satış hunisindeki anlık değişiklikler anında yansır. Potansiyel teklifler, gerçekleşen tahsilatlar, kesinleşen ciro ve 3 senaryolu gelir projeksiyonu.
                    </p>
                </div>

                {/* Filter Controls */}
                <div className="relative z-10 flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                    <Select value={projectId} onValueChange={handleProjectChange}>
                        <SelectTrigger className="w-[180px] bg-white/10 hover:bg-white/15 text-white border-white/20 rounded-xl backdrop-blur-md text-xs font-bold">
                            <Building2 className="h-3.5 w-3.5 mr-2 text-amber-400 shrink-0" />
                            <SelectValue placeholder="Tüm Projeler" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-700 bg-slate-900 text-white">
                            <SelectItem value="all">Tüm Projeler</SelectItem>
                            {projects?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Period Switcher */}
                    <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/15">
                        {(['this_month', 'last_month', 'last_30_days', 'last_90_days', 'this_year'] as PeriodType[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    period === p
                                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {periodLabels[p]}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => reloadData(period, projectId, { silent: false, forceRefresh: true })}
                        disabled={isPending || isRevalidating}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
                        title="Zorla Yenile (En Son Verileri Çek)"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending || isRevalidating ? 'animate-spin text-amber-400' : ''}`} />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.print()}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl print:hidden"
                        title="Raporu Yazdır / PDF İndir"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>

                    {/* Help / Executive Guide Button (?) */}
                    <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black border-none rounded-xl gap-1.5 shadow-md shadow-amber-400/20 px-3"
                                title="CEO Kokpit Rehberi & Dokümantasyon"
                            >
                                <HelpCircle className="h-4 w-4" />
                                <span>Rehber (?)</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 md:p-8 space-y-4">
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                        CEO Kokpit Kılavuzu
                                    </Badge>
                                </div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-between">
                                    <span>CEO Satış Hunisi & Gelir Projeksiyonu Rehberi</span>
                                </DialogTitle>
                            </DialogHeader>

                            {/* Summary Quick Cards */}
                            <div className="space-y-4 text-slate-700 text-xs leading-relaxed">
                                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                                    <h4 className="font-black text-indigo-950 text-sm flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4 text-indigo-600" />
                                        Bu Ekran Şirket Yönetimi İçin Neyi Çözer?
                                    </h4>
                                    <p>
                                        Bu kokpit, şirketin <strong>tüm potansiyel fırsatlarını</strong>, <strong>sözleşmeli alacaklarını</strong>, 
                                        <strong>gelecek 12 aylık vadeli nakit projeksiyonunu</strong> ve <strong>satış ekibinin operasyonel eforunu</strong> tek ekranda toplar.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                                        <div className="font-black text-slate-900 text-xs">1. Muhafazakar Senaryo</div>
                                        <p className="text-[11px] text-slate-500">Piyasa dursa dahi kasaya asgari ne kadar ciro gireceğini gösterir. Nakit bütçenizi bu tabana göre yapın.</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-1">
                                        <div className="font-black text-indigo-950 text-xs">2. Beklenen Ciro (Hedef)</div>
                                        <p className="text-[11px] text-indigo-700">Aşama olasılıklarıyla (Opsiyon %85, Teklif %60 vb.) hesaplanmış en gerçekçi ay sonu ciro beklentisidir.</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                                        <div className="font-black text-slate-900 text-xs">3. İyimser Senaryo</div>
                                        <p className="text-[11px] text-slate-500">Tüm teklifler başarıyla kapatılırsa ulaşılabilecek tavan ciroyu gösterir.</p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <h4 className="font-black text-slate-900 text-sm">Hangi Durumda Hangi Sekmeye Bakmalısınız?</h4>
                                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                                        <li><strong>Sözleşmeli Nakit Akışı & Taksitler:</strong> Gelecek 12 ay boyunca vadesi gelecek taksitleri ve gecikmiş alacakları incelemek için.</li>
                                        <li><strong>Satış Aktiviteleri & Ekip Nabzı:</strong> Danışmanların günlük/haftalık arama, randevu ve ziyaret performansını görmek için.</li>
                                        <li><strong>Kritik Büyük Fırsatlar (Whale Deals):</strong> Şirket cirosunu sırtlayan en büyük 10 teklifi bizzat CEO olarak takip etmek için.</li>
                                        <li><strong>Darboğaz & Kayıp Analizi:</strong> Satışların neden ve nerede kaçtığını tespit edip müdahale etmek için.</li>
                                    </ul>
                                </div>

                                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                                    <span className="text-[11px] text-slate-400">Detaylı yönetim stratejileri ve 5 dakikalık haftalık rutin kontrol listesi için:</span>
                                    <Link href="/reports/ceo-funnel/guide" target="_blank">
                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1 text-xs">
                                            Detaylı Rehber Sayfasını Aç
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Revenue Projection & Financial Command Bar (Executive Forecast Banner) */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-[10px] tracking-wider uppercase">
                                3 SENARYOLU FİNANSAL PROJEKSİYON
                            </Badge>
                            <span className="text-xs text-indigo-300/80 font-medium">
                                Aşama ağırlıklarına göre tahmini gelir simülasyonu
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                            Finansal Gelir Projeksiyonu
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Toplanan Kaporalar</div>
                            <div className="text-xl font-black text-amber-400">{formatCurrency(revenueForecast.securedDeposits)}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Ağırlıklı Beklenen Ciro</div>
                            <div className="text-xl font-black text-emerald-400">{formatCurrency(revenueForecast.baseScenario)}</div>
                        </div>
                    </div>
                </div>

                {/* 3 Scenario Forecast Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Scenario 1: Conservative */}
                    <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60 hover:border-slate-500 transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">1. Muhafazakar Senaryo</span>
                            <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-600 bg-slate-800">
                                Düşük Risk
                            </Badge>
                        </div>
                        <div className="text-2xl font-black text-white">
                            {formatCurrency(revenueForecast.conservativeScenario)}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Gerçekleşen ciro + Opsiyonların %70&apos;i + Tekliflerin %30&apos;u baz alınır.
                        </p>
                    </div>

                    {/* Scenario 2: Base / Expected (Highlighted) */}
                    <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-2xl p-5 border border-indigo-400/40 shadow-lg space-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-bl-lg uppercase">
                            Hedef / Baz
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">2. Beklenen Ciro (Ağırlıklı)</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-300">
                            {formatCurrency(revenueForecast.baseScenario)}
                        </div>
                        <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                            Tüm aşama olasılıkları (Opsiyon %85, Teklif %60, Sunum %35, Aday %5) ile ağırlıklandırılmış gerçekçi projeksiyon.
                        </p>
                    </div>

                    {/* Scenario 3: Optimistic */}
                    <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60 hover:border-slate-500 transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-teal-400 uppercase tracking-wider">3. İyimser / Agresif Senaryo</span>
                            <Badge variant="outline" className="text-[10px] text-teal-300 border-teal-600/50 bg-teal-950/40">
                                Yüksek Başarı
                            </Badge>
                        </div>
                        <div className="text-2xl font-black text-white">
                            {formatCurrency(revenueForecast.optimisticScenario)}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Opsiyonların %95&apos;i, tekliflerin %80&apos;i ve sunumların %50&apos;sinin satışa dönmesi durumundaki ciro potansiyeli.
                        </p>
                    </div>
                </div>

                {/* Executive Cashflow & Operations Pulse Sub-Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-indigo-500/20 text-xs">
                    <div 
                        onClick={() => setActiveTab('cashflow')}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                        <div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase">Sözleşmeli Portföy</div>
                            <div className="text-base font-black text-white">{formatCurrency(cashflow.totalContractedValue)}</div>
                            <div className="text-[10px] text-emerald-400 font-bold">✓ %{cashflow.collectionProgress} tahsil edildi</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div 
                        onClick={() => setActiveTab('cashflow')}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                        <div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase">Bu Ay Tahsilat Hedefi</div>
                            <div className="text-base font-black text-amber-300">{formatCurrency(cashflow.thisMonthDue)}</div>
                            <div className="text-[10px] text-indigo-200">{formatCurrency(cashflow.thisMonthCollected)} kasada</div>
                        </div>
                        <CalendarClock className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>

                    <div 
                        onClick={() => setActiveTab('cashflow')}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors group ${
                            cashflow.overdueReceivables > 0 ? 'bg-rose-500/20 border-rose-500/40 hover:bg-rose-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <div>
                            <div className="text-[10px] font-bold text-rose-300 uppercase">Gecikmiş Alacak Riski</div>
                            <div className="text-base font-black text-rose-200">{formatCurrency(cashflow.overdueReceivables)}</div>
                            <div className="text-[10px] text-rose-300 font-bold">
                                {cashflow.overdueCount > 0 ? `${cashflow.overdueCount} gecikmiş taksit` : 'Risk yok'}
                            </div>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
                    </div>

                    <div 
                        onClick={() => setActiveTab('activities')}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer transition-colors group"
                    >
                        <div>
                            <div className="text-[10px] font-bold text-indigo-300 uppercase">Bugünkü Ekip Eforu</div>
                            <div className="text-base font-black text-emerald-300">{activities.todayTotal} Temas</div>
                            <div className="text-[10px] text-indigo-200">{activities.todayMeetings} randevu • {activities.todayCalls} arama</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Executive KPI Stat Cards (6 Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* 1. Toplam Lead */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Toplam Lead</span>
                            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpi.totalPipelineCount.toLocaleString('tr-TR')}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                            {periodComparison.totalLeads.change >= 0 ? (
                                <span className="text-emerald-600 flex items-center">
                                    <ArrowUpRight className="h-3.5 w-3.5" /> +%{periodComparison.totalLeads.change}
                                </span>
                            ) : (
                                <span className="text-rose-600 flex items-center">
                                    <ArrowDownRight className="h-3.5 w-3.5" /> %{periodComparison.totalLeads.change}
                                </span>
                            )}
                            <span className="text-slate-400 font-normal">önceki döneme göre</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Aktif Satış Hunisi Değeri */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-indigo-700">
                            <span className="text-xs font-bold uppercase tracking-wider">Aktif Satış Hunisi</span>
                            <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <Layers className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-indigo-950 tracking-tight">
                            {formatCurrency(kpi.activePipelineValue)}
                        </div>
                        <div className="text-[11px] text-indigo-600/80 font-medium">
                            Teklif & opsiyon toplamı
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Gerçekleşen Ciro */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-emerald-700">
                            <span className="text-xs font-bold uppercase tracking-wider">Gerçekleşen Ciro</span>
                            <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-950 tracking-tight">
                            {formatCurrency(kpi.wonRevenue)}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                            {periodComparison.wonRevenue.change >= 0 ? (
                                <span className="text-emerald-700 flex items-center">
                                    <ArrowUpRight className="h-3.5 w-3.5" /> +%{periodComparison.wonRevenue.change}
                                </span>
                            ) : (
                                <span className="text-rose-600 flex items-center">
                                    <ArrowDownRight className="h-3.5 w-3.5" /> %{periodComparison.wonRevenue.change}
                                </span>
                            )}
                            <span className="text-emerald-600/70 font-normal">ciro büyümesi</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Toplanan Kapora */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50/50 to-orange-50/30">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-amber-800">
                            <span className="text-xs font-bold uppercase tracking-wider">Toplanan Kapora</span>
                            <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                                <Coins className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-950 tracking-tight">
                            {formatCurrency(kpi.totalDepositsCollected)}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                            {periodComparison.deposits.change >= 0 ? (
                                <span className="text-emerald-700 flex items-center">
                                    <ArrowUpRight className="h-3.5 w-3.5" /> +%{periodComparison.deposits.change}
                                </span>
                            ) : (
                                <span className="text-rose-600 flex items-center">
                                    <ArrowDownRight className="h-3.5 w-3.5" /> %{periodComparison.deposits.change}
                                </span>
                            )}
                            <span className="text-amber-700/70 font-normal">kapora hacmi</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Uçtan Uca Dönüşüm Oranı */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Kazanma Oranı</span>
                            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Target className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            %{kpi.winRate}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {kpi.wonCount} adet satış kapandı
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Satış Hızı (Velocity) */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-bold uppercase tracking-wider">Kapanış Hızı</span>
                            <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                            {kpi.avgDaysToClose} <span className="text-sm font-semibold text-slate-400">gün</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            İlk temas - sözleşme ort.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Funnel Section with Financial Values at Every Stage */}
            <Card className="rounded-3xl border-slate-200/80 shadow-lg overflow-hidden">
                <CardHeader className="p-6 md:p-8 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 font-black text-[10px] tracking-wide">
                                    ANLIK BORU HATTI DEĞERLEMESİ
                                </Badge>
                                <span className="text-xs text-slate-400">
                                    Seçili Periyot: <strong className="text-slate-700">{periodLabels[period]}</strong>
                                </span>
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
                                Aşamalar Bazında Potansiyel ve Kesinleşen Gelir Dağılımı
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-500 mt-0.5">
                                Her aşamada bekleyen potansiyel ünite değeri ve aşama kazanma olasılığına göre ağırlıklı gelir projeksiyonu.
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span>Kesin Satış: {formatCurrency(kpi.wonRevenue)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-amber-500" />
                                <span>Kapora: {formatCurrency(kpi.totalDepositsCollected)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-rose-500" />
                                <span>Kayıp: {kpi.lostCount} adet</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
                        {funnelStages.map((stage: any, index: number) => {
                            const maxCount = Math.max(...funnelStages.map((s: any) => s.count), 1)
                            const widthPercent = Math.max(Math.round((stage.count / maxCount) * 100), 12)

                            return (
                                <div key={stage.stageKey} className="group relative">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Stage Name & Description */}
                                        <div className="w-full lg:w-72 shrink-0 space-y-1">
                                            <div className="flex items-center justify-between lg:justify-start gap-2">
                                                <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                    {stage.title}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-black"
                                                >
                                                    %{stage.probability} Olasılık
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-slate-400 line-clamp-1">{stage.description}</p>
                                        </div>

                                        {/* Funnel Segment Bar */}
                                        <div className="flex-1 relative">
                                            <div className="w-full bg-slate-100 rounded-2xl h-16 p-1.5 flex items-center relative overflow-hidden">
                                                <div
                                                    className={`h-full rounded-xl bg-gradient-to-r ${stage.gradient} transition-all duration-700 shadow-md flex items-center justify-between px-4 relative overflow-hidden`}
                                                    style={{ width: `${widthPercent}%` }}
                                                >
                                                    {/* Shimmer Effect */}
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    <div className="flex items-center gap-2 z-10">
                                                        <span className="text-white font-black text-base tracking-tight">
                                                            {stage.count.toLocaleString('tr-TR')}
                                                        </span>
                                                        <span className="text-white/80 text-xs font-medium hidden sm:inline">
                                                            kayıt
                                                        </span>
                                                    </div>

                                                    {stage.potentialValue > 0 && (
                                                        <div className="z-10 bg-black/20 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[11px] font-black text-white/95">
                                                            {stage.stageKey === 'won' ? 'Satış: ' : 'Potansiyel: '}
                                                            {formatCurrency(stage.stageKey === 'won' ? stage.wonRevenue : stage.potentialValue)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details on the right of bar if short */}
                                                {widthPercent < 50 && stage.potentialValue > 0 && (
                                                    <span className="ml-3 text-xs font-bold text-slate-600 hidden sm:inline">
                                                        {formatCurrency(stage.stageKey === 'won' ? stage.wonRevenue : stage.potentialValue)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial Breakdown & Drop-off Indicator */}
                                        <div className="w-full lg:w-72 shrink-0 flex items-center justify-between lg:justify-end gap-4 text-xs">
                                            {/* Kapora Pill if exists */}
                                            {stage.depositAmount > 0 && (
                                                <div className="text-right bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl">
                                                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                                        Kapora
                                                    </div>
                                                    <div className="font-black text-amber-900">
                                                        {formatCurrency(stage.depositAmount)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Weighted Forecast Contribution */}
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Ağırlıklı Gelir
                                                </div>
                                                <div className="font-black text-emerald-600">
                                                    {formatCurrency(stage.weightedForecast)}
                                                </div>
                                            </div>

                                            {/* Conversion from prev */}
                                            {index > 0 && (
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        Geçiş
                                                    </div>
                                                    <div className={`font-black ${
                                                        stage.conversionFromPrev >= 50
                                                            ? 'text-emerald-600'
                                                            : stage.conversionFromPrev >= 20
                                                            ? 'text-amber-600'
                                                            : 'text-rose-600'
                                                    }`}>
                                                        %{stage.conversionFromPrev}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transition Arrow between stages */}
                                    {index < funnelStages.length - 1 && (
                                        <div className="hidden lg:flex items-center ml-80 my-1 text-slate-300">
                                            <div className="h-3 w-0.5 bg-slate-200" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Strategic Intelligence Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <TabsList className="bg-slate-100 p-1 rounded-2xl flex-wrap">
                        <TabsTrigger value="forecast" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <Coins className="h-4 w-4" />
                            Finansal Gelir Projeksiyonu
                        </TabsTrigger>
                        <TabsTrigger value="cashflow" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
                            <CreditCard className="h-4 w-4 text-emerald-600" />
                            Sözleşmeli Nakit Akışı & Taksitler
                            {cashflow.overdueCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700">
                                    {cashflow.overdueCount} Risk
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="activities" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                            <PhoneCall className="h-4 w-4 text-blue-600" />
                            Satış Aktiviteleri & Ekip Nabzı ({activities.periodTotal})
                        </TabsTrigger>
                        <TabsTrigger value="whales" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <Flame className="h-4 w-4 text-amber-500" />
                            Büyük Fırsatlar Radarı ({topWhaleDeals?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="trends" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <TrendingUp className="h-4 w-4" />
                            Dönemsel Trend & Geçmiş
                        </TabsTrigger>
                        <TabsTrigger value="projects" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <Building2 className="h-4 w-4" />
                            Proje Dağılımı ({projectBreakdown?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="advisors" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <Briefcase className="h-4 w-4" />
                            Danışman Karnesi
                        </TabsTrigger>
                        <TabsTrigger value="risk" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <ShieldAlert className="h-4 w-4" />
                            Darboğaz & Kayıp
                        </TabsTrigger>
                        <TabsTrigger value="sources" className="rounded-xl text-xs font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                            <Target className="h-4 w-4" />
                            Pazarlama / Kaynak ROI
                        </TabsTrigger>
                    </TabsList>

                    <div className="text-xs text-slate-400 font-medium">
                        * Tüm analizler seçili periyot ({periodLabels[period]}) baz alınarak dinamik üretilir.
                    </div>
                </div>

                {/* TAB 1: GELİR PROJEKSİYONU & KAPORALAR */}
                <TabsContent value="forecast" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Summary Forecast Box */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-500" />
                                    Kasa Güvencesi & Gelir Durumu
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Satış hunisinde kesinleşen ciro ve güvence altına alınan tahsilat analizi
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                                    <div className="text-xs font-bold text-amber-800">Toplam Toplanan Kapora</div>
                                    <div className="text-3xl font-black text-amber-950">
                                        {formatCurrency(kpi.totalDepositsCollected)}
                                    </div>
                                    <div className="text-xs font-semibold text-amber-700">
                                        {kpi.activeReservationDeposits > 0 ? `${formatCurrency(kpi.activeReservationDeposits)} aktif opsiyonlarda bekliyor` : 'Tüm kapora işlemleri güncel'}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 text-xs">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Kesinleşen Satış Cirosu:</span>
                                        <span className="font-black text-emerald-600">{formatCurrency(kpi.wonRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Açık Opsiyonlardaki Hacim:</span>
                                        <span className="font-bold text-slate-800">
                                            {formatCurrency(funnelStages.find((s: any) => s.stageKey === 'reservation')?.potentialValue || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span className="text-slate-500">Teklif Aşamasındaki Hacim:</span>
                                        <span className="font-bold text-slate-800">
                                            {formatCurrency(funnelStages.find((s: any) => s.stageKey === 'proposal')?.potentialValue || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-slate-500">Maksimum Satış Hunisi Potansiyeli:</span>
                                        <span className="font-black text-indigo-700">{formatCurrency(revenueForecast.maxPotentialRevenue)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Probability Weights Table */}
                        <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Sliders className="h-5 w-5 text-indigo-600" />
                                    Aşama Olasılıkları ve Ağırlıklı Gelir Matrisi
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Her aşamadaki portföy büyüklüğü, gerçekleşme olasılığı ve beklenen nakit akışına katkısı
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="pb-3">Satış Aşaması</th>
                                                <th className="pb-3 text-right">Adet</th>
                                                <th className="pb-3 text-right">Potansiyel Hacim</th>
                                                <th className="pb-3 text-right">Toplanan Kapora</th>
                                                <th className="pb-3 text-right">Kazanma Olasılığı</th>
                                                <th className="pb-3 text-right">Ağırlıklı Projeksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-xs">
                                            {funnelStages.map((s: any) => (
                                                <tr key={s.stageKey} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                        {s.title}
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-slate-700">
                                                        {s.count}
                                                    </td>
                                                    <td className="py-3 text-right font-semibold text-slate-700">
                                                        {formatCurrency(s.stageKey === 'won' ? s.wonRevenue : s.potentialValue)}
                                                    </td>
                                                    <td className="py-3 text-right font-bold text-amber-700">
                                                        {s.depositAmount > 0 ? formatCurrency(s.depositAmount) : '-'}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-black text-[10px]">
                                                            %{s.probability}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 text-right font-black text-emerald-600">
                                                        {formatCurrency(s.weightedForecast)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-slate-200 font-black text-xs">
                                                <td className="py-3 text-slate-900">GENEL TOPLAM</td>
                                                <td className="py-3 text-right text-slate-900">{kpi.totalPipelineCount}</td>
                                                <td className="py-3 text-right text-slate-900">{formatCurrency(revenueForecast.maxPotentialRevenue)}</td>
                                                <td className="py-3 text-right text-amber-700">{formatCurrency(kpi.totalDepositsCollected)}</td>
                                                <td className="py-3 text-right text-indigo-700">-</td>
                                                <td className="py-3 text-right text-emerald-600 text-sm">
                                                    {formatCurrency(revenueForecast.baseScenario)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: SÖZLEŞMELİ NAKİT AKIŞI & VADELİ TAHSİLAT PROJEKSİYONU */}
                <TabsContent value="cashflow" className="space-y-6 mt-0">
                    {/* Past Sales Excel Import Callout */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                        <div className="space-y-0.5">
                            <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                CRM Dışında Kapanmış Geçmiş Satışlarınız mı Var?
                            </div>
                            <p className="text-[11px] text-indigo-700/80">
                                Daha önce Excel&apos;de tutulan peşin veya vadeli satışları, müşterileri ve taksit takvimlerini topluca içeri aktarabilirsiniz.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href="/templates/NovoCRM_Gecmis_Satislar_Yukleme_Sablonu.xlsx" download="NovoCRM_Gecmis_Satislar_Yukleme_Sablonu.xlsx">
                                <Button size="sm" variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs gap-1.5 shadow-2xs">
                                    <Download className="h-3.5 w-3.5" />
                                    Şablonu İndir (.xlsx)
                                </Button>
                            </a>
                            <Link href="/contracts">
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-sm">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    İçe Aktarma Ekranına Git
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Top 4 Cashflow Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Toplam Sözleşmeli Satış Hacmi */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-2">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-bold uppercase tracking-wider">Sözleşmeli Portföy</span>
                                    <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(cashflow.totalContractedValue)}
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
                                    <span>{cashflow.totalContractsCount} adet sözleşme</span>
                                    <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                                        İmzalanan
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Gerçekleşen Tahsilat (Kasaya Giren) */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-2">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-bold uppercase tracking-wider">Tahsil Edilen (Kasa)</span>
                                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-emerald-600 tracking-tight">
                                    {formatCurrency(cashflow.totalCollectedCash)}
                                </div>
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                        <span>Tahsilat İlerlemesi</span>
                                        <span>%{cashflow.collectionProgress}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, cashflow.collectionProgress)}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Bu Ay Vadesi Gelen Taksitler */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-2">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-bold uppercase tracking-wider">Bu Ayki Taksit Hedefi</span>
                                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <CalendarClock className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(cashflow.thisMonthDue)}
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-emerald-600 font-bold">
                                        ✓ {formatCurrency(cashflow.thisMonthCollected)} alındı
                                    </span>
                                    <span className="text-slate-400 font-medium">
                                        %{cashflow.thisMonthCollectionRate}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Gecikmiş / Riskli Alacaklar */}
                        <Card className={`rounded-3xl shadow-sm transition-shadow ${
                            cashflow.overdueReceivables > 0 ? 'bg-rose-50/50 border-rose-200' : 'border-slate-200/80'
                        }`}>
                            <CardContent className="p-5 space-y-2">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Gecikmiş Alacaklar</span>
                                    <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-rose-600 tracking-tight">
                                    {formatCurrency(cashflow.overdueReceivables)}
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="text-rose-700 font-bold">
                                        {cashflow.overdueCount > 0 ? `${cashflow.overdueCount} gecikmiş taksit` : 'Gecikme yok'}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] font-bold text-rose-700 border-rose-300 bg-rose-100">
                                        Finansal Risk
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 12-Month Forward Cashflow Projection Chart */}
                    <Card className="rounded-3xl border-slate-200/80 shadow-md overflow-hidden">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-black uppercase">
                                            12 Aylık Garanti Nakit Akışı
                                        </Badge>
                                        <span className="text-xs text-slate-400">
                                            İmzalı sözleşmelerin takvim bazlı nakit giriş simülasyonu
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg font-black text-slate-800 mt-1">
                                        Aylık Vadeli Tahsilat & Kasa Giriş Takvimi
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-sm bg-indigo-600" />
                                        <span className="text-slate-600">Vadesi Gelen (Hedef)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                                        <span className="text-slate-600">Tahsil Edilen</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashflow.forwardCashflow} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="shortLabel" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            formatter={(value: any, name: any) => [
                                                formatCurrency(Number(value || 0)),
                                                name === 'dueAmount' ? 'Vadesi Gelen Taksit' : 'Tahsil Edilen Tutar'
                                            ]}
                                            labelFormatter={(l, items) => items?.[0]?.payload?.monthLabel || l}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderRadius: '1rem',
                                                border: 'none',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="dueAmount" name="dueAmount" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="paidAmount" name="paidAmount" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Monthly Projection Table Breakdown */}
                            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4">Ay</th>
                                            <th className="py-3 px-4">Taksit Adedi</th>
                                            <th className="py-3 px-4 text-right">Vadesi Gelen</th>
                                            <th className="py-3 px-4 text-right">Tahsil Edilen</th>
                                            <th className="py-3 px-4 text-right">Bekleyen Tahsilat</th>
                                            <th className="py-3 px-4 text-center">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {cashflow.forwardCashflow.map((m: any) => (
                                            <tr key={m.monthKey} className={`hover:bg-slate-50/80 transition-colors ${m.isCurrentMonth ? 'bg-indigo-50/50 font-bold' : ''}`}>
                                                <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                                                    {m.monthLabel}
                                                    {m.isCurrentMonth && (
                                                        <Badge className="bg-indigo-600 text-white text-[9px] px-1.5 py-0">
                                                            Bu Ay
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">{m.count} adet</td>
                                                <td className="py-3 px-4 text-right font-black text-slate-800">{formatCurrency(m.dueAmount)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(m.paidAmount)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(m.pendingAmount)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {m.dueAmount === 0 ? (
                                                        <span className="text-slate-400 font-medium">-</span>
                                                    ) : m.pendingAmount === 0 ? (
                                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                                                            Tamamlandı
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-600 font-semibold">
                                                            %{m.dueAmount > 0 ? Math.round((m.paidAmount / m.dueAmount) * 100) : 0}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Two Detail Tables: Overdue and Upcoming */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Overdue Installments */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-black text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Gecikmiş Taksitler & Tahsilat Riski ({cashflow.topOverdueInstallments?.length || 0})
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Vadesi geçmiş ve henüz kapatılmamış taksitler
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {cashflow.topOverdueInstallments?.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                        Harika! Gecikmiş tahsilat kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {cashflow.topOverdueInstallments.map((inst: any) => (
                                            <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-xs">{inst.customerName}</div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {inst.projectName} • {inst.contractNumber}
                                                    </div>
                                                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                                        Vade: {inst.dueDate} ({inst.daysOverdue} gün gecikme)
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-rose-600 text-sm">{formatCurrency(inst.amount)}</div>
                                                    <Badge variant="outline" className="text-[9px] font-bold text-rose-700 border-rose-300 bg-rose-50">
                                                        {inst.paymentType}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Installments */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-indigo-600" />
                                    Yaklaşan Kritik Taksitler ({cashflow.upcomingInstallments?.length || 0})
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Önümüzdeki günlerde vadesi gelecek sözleşmeli tahsilatlar
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {cashflow.upcomingInstallments?.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                        Yakın tarihte vadesi gelecek taksit bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {cashflow.upcomingInstallments.map((inst: any) => (
                                            <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-xs">{inst.customerName}</div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {inst.projectName} • {inst.contractNumber}
                                                    </div>
                                                    <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                                        Vade: {inst.dueDate}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-slate-900 text-sm">{formatCurrency(inst.amount)}</div>
                                                    <Badge variant="outline" className="text-[9px] font-bold text-indigo-700 border-indigo-200 bg-indigo-50">
                                                        {inst.paymentType}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB: SATIŞ AKTİVİTELERİ & OPERASYONEL NABIZ */}
                <TabsContent value="activities" className="space-y-6 mt-0">
                    {/* Live Activity Pulse Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm p-4 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bugünkü Efor</span>
                            <div className="text-2xl font-black text-slate-900">{activities.todayTotal} Temas</div>
                            <div className="text-xs text-emerald-600 font-bold">✓ {activities.todayCompleted} tamamlandı</div>
                        </Card>
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm p-4 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Telefon Aramaları</span>
                            <div className="text-2xl font-black text-blue-600">{activities.periodCalls} Arama</div>
                            <div className="text-xs text-slate-400">Bugün: {activities.todayCalls}</div>
                        </Card>
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm p-4 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ofis & Randevular</span>
                            <div className="text-2xl font-black text-purple-600">{activities.periodMeetings} Randevu</div>
                            <div className="text-xs text-slate-400">Bugün: {activities.todayMeetings}</div>
                        </Card>
                        <Card className="rounded-3xl border-slate-200/80 shadow-sm p-4 space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Saha Ziyaretleri</span>
                            <div className="text-2xl font-black text-amber-600">{activities.periodVisits} Saha Turu</div>
                            <div className="text-xs text-slate-400">Bugün: {activities.todayVisits}</div>
                        </Card>
                    </div>

                    {/* Funnel Velocity Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-2xl border-slate-200/80 p-5 bg-gradient-to-br from-indigo-50/50 to-white space-y-2">
                            <div className="text-xs font-bold text-indigo-700 uppercase">Lead → Randevu Oranı</div>
                            <div className="text-3xl font-black text-indigo-900">%{activities.conversionLeadToMeeting}</div>
                            <p className="text-[11px] text-slate-500">
                                Reklam ve gelen müşteri adaylarının satış ofisine getirilme başarısı.
                            </p>
                        </Card>
                        <Card className="rounded-2xl border-slate-200/80 p-5 bg-gradient-to-br from-purple-50/50 to-white space-y-2">
                            <div className="text-xs font-bold text-purple-700 uppercase">Randevu → Kapanış Oranı</div>
                            <div className="text-3xl font-black text-purple-900">%{activities.conversionMeetingToWon}</div>
                            <p className="text-[11px] text-slate-500">
                                Satış ofisi ve online sunum yapılan müşterilerin satış sözleşmesine dönme gücü.
                            </p>
                        </Card>
                        <Card className="rounded-2xl border-slate-200/80 p-5 bg-gradient-to-br from-emerald-50/50 to-white space-y-2">
                            <div className="text-xs font-bold text-emerald-700 uppercase">Ekip Görev Disiplini</div>
                            <div className="text-3xl font-black text-emerald-900">%{activities.completionRate}</div>
                            <p className="text-[11px] text-slate-500">
                                Planlanan aktivitelerin zamanında tamamlanma ve sonuç girilme oranı.
                            </p>
                        </Card>
                    </div>

                    {/* Neglected Hot Deals & Rep Leaderboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Neglected Deals */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-black text-rose-700 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Takipsiz Kalan Sıcak Fırsatlar ({activities.neglectedHotDeals?.length || 0})
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Teklif veya opsiyon aşamasında olup son 5+ gündür dokunulmayan yüksek değerli müşteriler
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {activities.neglectedHotDeals?.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                        Tebrikler! Tüm sıcak müşteriler düzenli takip ediliyor.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {activities.neglectedHotDeals.map((d: any) => (
                                            <div key={d.id} className="p-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-800 text-xs">{d.customerName}</div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Danışman: {d.advisorName} • Aşama: {d.stage}
                                                    </div>
                                                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                                        {d.daysSinceLastActivity} gündür hiçbir arama/mesaj yapılmadı!
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-slate-900 text-sm">{formatCurrency(d.dealValue)}</div>
                                                    <Badge variant="outline" className="text-[9px] font-bold text-rose-700 border-rose-300 bg-rose-50">
                                                        Acil Takip
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Rep Effort vs Won Revenue Matrix */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    Danışman Efor vs. Kapanış Matrisi
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Arama ve randevu eforunun satış cirosuna yansıması
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="py-3 px-4">Danışman</th>
                                                <th className="py-3 px-3 text-center">Arama</th>
                                                <th className="py-3 px-3 text-center">Randevu</th>
                                                <th className="py-3 px-3 text-center">Satış</th>
                                                <th className="py-3 px-4 text-right">Kazanılan Ciro</th>
                                                <th className="py-3 px-3 text-center">Kapanış</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activities.repEfforts?.map((rep: any) => (
                                                <tr key={rep.repId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-slate-800">{rep.repName}</td>
                                                    <td className="py-3 px-3 text-center text-slate-600 font-semibold">{rep.callsCount}</td>
                                                    <td className="py-3 px-3 text-center text-indigo-600 font-bold">{rep.meetingsCount}</td>
                                                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">{rep.wonCount}</td>
                                                    <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(rep.wonRevenue)}</td>
                                                    <td className="py-3 px-3 text-center font-bold text-slate-700">%{rep.closingRatio}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: BÜYÜK FIRSATLAR RADARI (TOP WHALE DEALS) */}
                <TabsContent value="whales" className="space-y-6 mt-0">
                    <Card className="rounded-3xl border-slate-200/80 shadow-md">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                        <Flame className="h-5 w-5 text-amber-500" />
                                        Kritik Büyük Fırsatlar Radarı (Top Whale Deals)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-400">
                                        Satış hunisindeki en yüksek tutarlı, şirket cirosunu doğrudan belirleyen ilk {topWhaleDeals?.length || 0} kritik teklif ve opsiyon
                                    </CardDescription>
                                </div>
                                <Badge className="bg-amber-100 text-amber-900 border-amber-200 font-bold text-xs">
                                    CEO Öncelikli Takip
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {topWhaleDeals?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Açık büyük fırsat kaydı bulunamadı.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="pb-3">Müşteri</th>
                                                <th className="pb-3">Proje & Ünite</th>
                                                <th className="pb-3">Danışman</th>
                                                <th className="pb-3">Aşama</th>
                                                <th className="pb-3 text-right">Alınan Kapora</th>
                                                <th className="pb-3 text-right">Potansiyel Tutar</th>
                                                <th className="pb-3 text-right">Aktif Gün</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-xs">
                                            {topWhaleDeals.map((deal: any, idx: number) => (
                                                <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-black text-[10px] flex items-center justify-center">
                                                                #{idx + 1}
                                                            </span>
                                                            {deal.customerName}
                                                        </div>
                                                        {deal.customerPhone && (
                                                            <div className="text-[10px] text-slate-400 ml-7">{deal.customerPhone}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5">
                                                        <div className="font-bold text-slate-800">{deal.projectName}</div>
                                                        {deal.unitNumber && (
                                                            <div className="text-[10px] text-indigo-600 font-semibold">Ünite: {deal.unitNumber}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 text-slate-700">
                                                        {deal.advisorName}
                                                    </td>
                                                    <td className="py-3.5">
                                                        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                                                            {deal.stage}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-amber-700">
                                                        {deal.depositAmount > 0 ? formatCurrency(deal.depositAmount) : '-'}
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-slate-900 text-sm">
                                                        {formatCurrency(deal.dealValue)}
                                                    </td>
                                                    <td className="py-3.5 text-right text-slate-500 font-bold">
                                                        {deal.daysActive} gün
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: ZAMAN TRENDİ & GEÇMİŞ ANALİZİ */}
                <TabsContent value="trends" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 6-Month Funnel Volume Trend */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                                    6 Aylık Lead Girişi, Teklif & Kapanan Satışlar
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Aylık hacim artışları ve tekliften sözleşmeye dönüşüm seyri
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={sixMonthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderRadius: '12px',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Bar dataKey="totalLeads" name="Yeni Lead" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="proposalsCount" name="Teklif & Opsiyon" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="wonCount" name="Kazanılan Satış" fill="#10b981" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 6-Month Won Revenue Trend */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                    6 Aylık Ciro Gelişimi (Milyon ₺)
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Aylara göre kesinleşen ve kasaya giren sözleşmeli satış cirosu
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ResponsiveContainer width="100%" height={320}>
                                    <AreaChart data={sixMonthTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="M" />
                                        <Tooltip
                                            formatter={(value: any) => [`₺${value} Milyon`, 'Kapanan Ciro']}
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderRadius: '12px',
                                                border: 'none',
                                                color: '#fff',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="wonRevenueM"
                                            name="Ciro (Milyon ₺)"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#revenueGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Period Comparison Card */}
                    <Card className="rounded-3xl border-slate-200/80 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-800">
                                Dönemsel Değişim Matrisi ({periodLabels[period]} vs Önceki Dönem)
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Stratejik KPI&apos;ların önceki eşdeğer döneme göre büyüme/küçülme oranları
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-xs font-bold text-slate-500">Lead Hacmi Değişimi</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {periodComparison.totalLeads.current}
                                        <span className="text-xs text-slate-400 font-normal ml-2">
                                            (Önceki: {periodComparison.totalLeads.prev})
                                        </span>
                                    </div>
                                    <div className="text-xs font-bold">
                                        <span className={periodComparison.totalLeads.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {periodComparison.totalLeads.change >= 0 ? '↑ +' : '↓ '}%{periodComparison.totalLeads.change}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-xs font-bold text-slate-500">Kazanılan Ciro Değişimi</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {formatCurrency(periodComparison.wonRevenue.current)}
                                    </div>
                                    <div className="text-xs font-bold">
                                        <span className={periodComparison.wonRevenue.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {periodComparison.wonRevenue.change >= 0 ? '↑ +' : '↓ '}%{periodComparison.wonRevenue.change}
                                        </span>
                                        <span className="text-slate-400 font-normal ml-1">ciro farkı</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-xs font-bold text-slate-500">Toplanan Kapora Değişimi</div>
                                    <div className="text-2xl font-black text-amber-900">
                                        {formatCurrency(periodComparison.deposits.current)}
                                    </div>
                                    <div className="text-xs font-bold">
                                        <span className={periodComparison.deposits.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {periodComparison.deposits.change >= 0 ? '↑ +' : '↓ '}%{periodComparison.deposits.change}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                    <div className="text-xs font-bold text-slate-500">Dönüşüm Oranı Farkı</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        %{periodComparison.winRate.current}
                                    </div>
                                    <div className="text-xs font-bold">
                                        <span className={periodComparison.winRate.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {periodComparison.winRate.change >= 0 ? '↑ +' : '↓ '}%{periodComparison.winRate.change} puan
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: PROJE BAZLI DAĞILIM */}
                <TabsContent value="projects" className="space-y-6 mt-0">
                    <Card className="rounded-3xl border-slate-200/80 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                                Projeler Arası Satış Hunisi, Kapora & Ciro Dağılımı
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Proje bazında lead adedi, aktif teklifler, toplanan kapora ve kesinleşen satış cirosu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {projectBreakdown?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Seçili periyotta proje bazlı kayıt bulunamadı.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="pb-3">Proje Adı</th>
                                                <th className="pb-3 text-right">Toplam Lead</th>
                                                <th className="pb-3 text-right">Teklif & Opsiyon</th>
                                                <th className="pb-3 text-right">Alınan Kapora</th>
                                                <th className="pb-3 text-right">Kazanılan Satış</th>
                                                <th className="pb-3 text-right">Aktif Pipeline</th>
                                                <th className="pb-3 text-right">Kazanılan Ciro</th>
                                                <th className="pb-3 text-right">Kazanma Oranı</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-xs">
                                            {projectBreakdown?.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5">
                                                        <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                                                    </td>
                                                    <td className="py-3.5 text-right font-bold text-slate-700">
                                                        {p.totalLeads}
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold">
                                                            {p.proposals + p.reservations}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 text-right font-bold text-amber-700">
                                                        {p.depositsCollected > 0 ? formatCurrency(p.depositsCollected) : '-'}
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                            {p.wonCount} adet
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 text-right text-indigo-700 font-bold">
                                                        {formatCurrency(p.pipelineValue)}
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-emerald-600 text-sm">
                                                        {formatCurrency(p.wonRevenue)}
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <span className={`font-black text-xs ${
                                                            p.winRate >= 5 ? 'text-emerald-600' : p.winRate >= 2 ? 'text-amber-600' : 'text-slate-500'
                                                        }`}>
                                                            %{p.winRate}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: DANIŞMAN / TEMSİLCİ PERFORMANS KARNESİ */}
                <TabsContent value="advisors" className="space-y-6 mt-0">
                    <Card className="rounded-3xl border-slate-200/80 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                                Satış Temsilcisi & Danışman Performans Sıralaması
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Danışman bazında atanan lead sayısı, aktif fırsatlar ve kapanan satış ciroları
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {repPerformance?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Danışman verisi bulunamadı.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {repPerformance?.map((rep: any, idx: number) => {
                                        const medals = ['🥇', '🥈', '🥉']
                                        return (
                                            <Card key={rep.id} className="rounded-2xl border-slate-200/80 hover:border-indigo-200 transition-colors">
                                                <CardContent className="p-5 space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">
                                                                {rep.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                                                    {rep.name}
                                                                    {idx < 3 && <span className="text-base">{medals[idx]}</span>}
                                                                </div>
                                                                <div className="text-[11px] text-slate-400">{rep.email || 'Danışman'}</div>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="font-bold text-xs">
                                                            #{idx + 1}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                                                        <div>
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase">Atanan Lead</div>
                                                            <div className="font-black text-slate-800 text-base">{rep.assignedLeads}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase">Kapanan Satış</div>
                                                            <div className="font-black text-emerald-600 text-base">{rep.wonCount} adet</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase">Alınan Kapora</div>
                                                            <div className="font-bold text-amber-700">{formatCurrency(rep.depositsCollected)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-400 text-[10px] font-bold uppercase">Kapanan Ciro</div>
                                                            <div className="font-black text-emerald-600">{formatCurrency(rep.wonRevenue)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">Lead Dönüşüm Yüzdesi:</span>
                                                        <span className="font-black text-indigo-600 text-sm">%{rep.conversionRate}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 6: DARBOĞAZ & KAYIP ANALİZİ */}
                <TabsContent value="risk" className="space-y-6 mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Loss Reasons */}
                        <Card className="rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                                    Kayıp Nedenleri Analizi
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Müşterilerin elden kaçma ve iptal gerekçeleri
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lossBreakdown?.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs">Kayıp kaydı bulunamadı.</div>
                                ) : (
                                    lossBreakdown.map((lb: any, i: number) => {
                                        const maxLost = Math.max(...lossBreakdown.map((x: any) => x.count), 1)
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-slate-700">{lb.reason}</span>
                                                    <span className="text-rose-600">{lb.count} adet</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-rose-500 h-full rounded-full"
                                                        style={{ width: `${Math.round((lb.count / maxLost) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Stalled Deals / Bottleneck Alerts */}
                        <Card className="lg:col-span-2 rounded-3xl border-slate-200/80 shadow-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5 text-amber-500" />
                                            Darboğaz Uyarısı: 14+ Gündür Hareketsiz Teklifler
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-400">
                                            Teklif veya opsiyonda bekleyip son 2 haftadır işlem yapılmayan yüksek riskli fırsatlar
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-bold">
                                        Müdahale Gerekli
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {stagnantDeals?.length === 0 ? (
                                    <div className="flex items-center justify-center p-8 text-slate-400 text-xs font-medium">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
                                        Tebrikler! Satış hunisinde 14 günden uzun süredir bekleyen tıkanmış teklif bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                    <th className="pb-3">Müşteri</th>
                                                    <th className="pb-3">Proje</th>
                                                    <th className="pb-3">Danışman</th>
                                                    <th className="pb-3">Aşama</th>
                                                    <th className="pb-3 text-right">Alınan Kapora</th>
                                                    <th className="pb-3 text-right">Bekleme</th>
                                                    <th className="pb-3 text-right">Potansiyel Değer</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {stagnantDeals.map((d: any) => (
                                                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                                                        <td className="py-3">
                                                            <div className="font-bold text-slate-900">{d.customerName}</div>
                                                            <div className="text-[10px] text-slate-400">{d.customerPhone}</div>
                                                        </td>
                                                        <td className="py-3 text-slate-600 font-medium">{d.projectName}</td>
                                                        <td className="py-3 text-slate-600">{d.advisorName}</td>
                                                        <td className="py-3">
                                                            <Badge variant="outline" className="text-[10px] font-bold border-amber-200 bg-amber-50 text-amber-800">
                                                                {d.stage}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 text-right font-bold text-amber-700">
                                                            {d.depositAmount > 0 ? formatCurrency(d.depositAmount) : '-'}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className="font-black text-rose-600">
                                                                {d.daysInactive} gün
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right font-black text-slate-800">
                                                            {formatCurrency(d.value)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 7: PAZARLAMA & KAYNAK ROI */}
                <TabsContent value="sources" className="space-y-6 mt-0">
                    <Card className="rounded-3xl border-slate-200/80 shadow-md">
                        <CardHeader>
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Target className="h-5 w-5 text-indigo-600" />
                                Reklam & Pazarlama Kanal Dönüşüm Verimliliği
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Hangi lead kaynağı en yüksek kaliteli adayı ve satış cirosunu sağladı?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sourceBreakdown?.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Kayıtlı lead kaynağı verisi bulunamadı.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                <th className="pb-3">Kanal / Kaynak</th>
                                                <th className="pb-3 text-right">Toplam Lead</th>
                                                <th className="pb-3 text-right">Alınan Kapora</th>
                                                <th className="pb-3 text-right">Kazanılan Satış</th>
                                                <th className="pb-3 text-right">Dönüşüm Oranı</th>
                                                <th className="pb-3 text-right">Üretilen Ciro</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-xs">
                                            {sourceBreakdown.map((s: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                                        {s.source}
                                                    </td>
                                                    <td className="py-3.5 text-right font-bold text-slate-700">
                                                        {s.leads}
                                                    </td>
                                                    <td className="py-3.5 text-right font-bold text-amber-700">
                                                        {s.deposits > 0 ? formatCurrency(s.deposits) : '-'}
                                                    </td>
                                                    <td className="py-3.5 text-right">
                                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                            {s.won} adet
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-indigo-600">
                                                        %{s.winRate}
                                                    </td>
                                                    <td className="py-3.5 text-right font-black text-emerald-600 text-sm">
                                                        {formatCurrency(s.revenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
