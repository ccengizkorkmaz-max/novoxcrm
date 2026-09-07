'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    HelpCircle
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

interface CeoFunnelDashboardProps {
    initialData: any
}

export default function CeoFunnelDashboard({ initialData }: CeoFunnelDashboardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<any>(initialData)
    const [period, setPeriod] = useState<PeriodType>(initialData?.period || 'this_month')
    const [projectId, setProjectId] = useState<string>(initialData?.selectedProjectId || 'all')
    const [activeTab, setActiveTab] = useState<string>('forecast')
    const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('tr-TR'))
    const [isRealtimePulse, setIsRealtimePulse] = useState(false)

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

    const reloadData = (newPeriod: PeriodType = period, newProject: string = projectId, isSilent = false) => {
        startTransition(async () => {
            try {
                const res = await getCeoFunnelData({ period: newPeriod, projectId: newProject })
                if ('error' in res) {
                    if (!isSilent) toast.error(res.error || 'Veri yüklenemedi')
                } else {
                    setData(res)
                    setLastSyncTime(new Date().toLocaleTimeString('tr-TR'))
                    if (isSilent) {
                        setIsRealtimePulse(true)
                        setTimeout(() => setIsRealtimePulse(false), 3000)
                        toast.info('Boru hattı anlık olarak güncellendi', { duration: 2500 })
                    } else {
                        toast.success('Huni verileri güncellendi')
                    }
                }
            } catch (err) {
                if (!isSilent) toast.error('Beklenmedik bir hata oluştu')
            }
        })
    }

    // Supabase Realtime Subscription on 'sales'
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('ceo-funnel-sales-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sales'
                },
                (payload) => {
                    console.log('⚡ CEO Funnel Realtime Event received on sales:', payload)
                    // Trigger silent refresh
                    reloadData(period, projectId, true)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [period, projectId])

    const handlePeriodChange = (p: PeriodType) => {
        setPeriod(p)
        reloadData(p, projectId)
    }

    const handleProjectChange = (pId: string) => {
        setProjectId(pId)
        reloadData(period, pId)
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                <p className="text-sm font-medium text-slate-500">CEO Satış Hunisi hesaplanıyor...</p>
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
        projects
    } = data

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
                        <span className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
                            isRealtimePulse ? 'bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-400' : 'bg-white/10 text-indigo-200'
                        }`}>
                            <span className={`h-2 w-2 rounded-full ${isRealtimePulse ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                            {isRealtimePulse ? 'Anlık Senkronize Edildi' : 'Canlı Realtime Boru Hattı'}
                        </span>
                        <span className="text-[11px] text-indigo-300/60 hidden sm:inline">
                            Son Güncelleme: {lastSyncTime}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white">
                        CEO Satış Hunisi & Gelir Projeksiyonu Kokpiti
                    </h1>
                    <p className="text-indigo-200/80 text-sm max-w-2xl font-normal">
                        Boru hattındaki anlık değişiklikler anında yansır. Potansiyel teklifler, toplanan kaporalar, kesinleşen ciro ve 3 senaryolu gelir projeksiyonu.
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
                        onClick={() => reloadData()}
                        disabled={isPending}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl"
                        title="Verileri Yenile"
                    >
                        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin text-amber-400' : ''}`} />
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
                </div>
            </div>

            {/* Revenue Projection & Financial Command Bar (Executive Forecast Banner) */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-black text-[10px] tracking-wider uppercase">
                                PROJEKSİYON & KASA GÜVENCESİ
                            </Badge>
                            <span className="text-xs text-indigo-300/80 font-medium">
                                Aşama ağırlıklarına göre tahmini gelir simülasyonu
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                            Finansal Gelir Projeksiyonu & Kapora Yönetimi
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

                {/* 2. Aktif Pipeline Değeri */}
                <Card className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-indigo-700">
                            <span className="text-xs font-bold uppercase tracking-wider">Aktif Boru Hattı</span>
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
                                Aşamalar Bazında Potansiyel, Kapora ve Kesinleşen Ciro
                            </CardTitle>
                            <CardDescription className="text-sm text-slate-500 mt-0.5">
                                Her aşamada bekleyen potansiyel ünite değeri, toplanan kapora ve aşama kazanma olasılığına göre ağırlıklı gelir.
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
                            Gelir Projeksiyonu & Kapora
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
                                    Kapora Güvencesi & Kasa Durumu
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-400">
                                    Boru hattında toplanan ve kasaya intikal eden kapora analizi
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
                                        <span className="text-slate-500">Maksimum Boru Hattı Tavanı:</span>
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
                                        Boru hattındaki en yüksek tutarlı, şirket cirosunu doğrudan belirleyen ilk {topWhaleDeals?.length || 0} kritik teklif ve opsiyon
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
                                Danışman bazında atanan lead sayısı, toplanan kapora ve kapanan satış ciroları
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
                                        Tebrikler! Boru hattında 14 günden uzun süredir bekleyen tıkanmış teklif bulunmuyor.
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
                                Hangi lead kaynağı en yüksek kaliteli adayı, kapora miktarını ve satış cirosunu sağladı?
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
