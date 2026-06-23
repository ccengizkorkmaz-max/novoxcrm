'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
    Zap, ArrowLeft, TrendingUp, TrendingDown, Eye, EyeOff,
    DollarSign, Users, MousePointerClick, Target, Activity,
    Megaphone, Image, ExternalLink, ChevronDown, Building2,
    Layers, ArrowDownRight, ShieldCheck, RefreshCw, BarChart3,
    CheckCircle2, AlertCircle, Clock, Filter
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Line,
    PieChart, Pie, Legend
} from 'recharts'
import ShareReportButton from './ShareReportButton'

// ────── Types ──────────────────────────────────────────────────────

interface AccountSummary {
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
    cpc: number
    frequency: number
}

interface CampaignInsight {
    campaign_id: string
    campaign_name: string
    status: string
    objective: string
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
    cpc: number
    frequency: number
    daily_budget: number | null
}

interface AdInsight {
    ad_id: string
    ad_name: string
    adset_name: string
    campaign_name: string
    status: string
    spend: number
    impressions: number
    clicks: number
    leads: number
    cpl: number
    ctr: number
    thumbnail_url: string | null
    preview_url: string | null
}

interface DailyBreakdown {
    date: string
    spend: number
    impressions: number
    clicks: number
    reach: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
}

interface LeadForm {
    form_id: string
    form_name: string
    page_id: string
    page_name: string
    status: string
    leads_count: number
}

interface FunnelData {
    impressions: number
    clicks: number
    leads: number
    crmConversions: number
    sales: number
}

interface MakeScenario {
    id: number
    name: string
    active: boolean
    scheduling: string
}

interface MetaAdsData {
    connected: boolean
    makeConnected: boolean
    accountSummary: AccountSummary
    accountSummaryPrev: AccountSummary | null
    campaigns: CampaignInsight[]
    topAds: AdInsight[]
    dailyBreakdown: DailyBreakdown[]
    leadForms: LeadForm[]
    funnel: FunnelData
    webStats: {
        leads: number
        leadsToday: number
        leadsPrev: number
        crmConversions: number
        sales: number
    }
    makeScenarios: MakeScenario[]
    datePreset: string
    formQualityBreakdowns?: Array<{
        name: string
        source: string
        isMeta: boolean
        total: number
        potansiyel: number
        olumlu: number
        cop: number
    }>
    overallQuality?: {
        potansiyel: number
        olumlu: number
        cop: number
        total: number
    }
}

interface Props {
    initialData: MetaAdsData
    locale: string
    onFilterChange?: (start: string, end: string, preset: string) => void
    isSharedView?: boolean
}

// ────── Helper Components ──────────────────────────────────────────

function KPICard({
    title, value, subtitle, icon: Icon, trend, trendValue, className, iconColor
}: {
    title: string
    value: string
    subtitle?: string
    icon: any
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    className?: string
    iconColor?: string
}) {
    return (
        <Card className={cn(
            "rounded-2xl border-0 shadow-lg overflow-hidden relative group hover:shadow-xl transition-all duration-300",
            className
        )}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-80" />
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                            {title}
                        </p>
                        <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {value}
                        </p>
                        {trendValue && (
                            <div className={cn(
                                "flex items-center gap-1 text-[11px] font-bold",
                                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                            )}>
                                {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : trend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : null}
                                {trendValue}
                            </div>
                        )}
                        {subtitle && !trendValue && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                        iconColor || "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    const statusMap: Record<string, { label: string; color: string }> = {
        'ACTIVE': { label: 'Aktif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' },
        'PAUSED': { label: 'Duraklatıldı', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400' },
        'DELETED': { label: 'Silindi', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400' },
        'ARCHIVED': { label: 'Arşivlendi', color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' },
    }
    const s = statusMap[status] || { label: status, color: 'bg-slate-50 text-slate-600 border-slate-200' }
    return <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", s.color)}>{s.label}</Badge>
}

// ────── Custom Tooltip ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900/95 backdrop-blur-sm text-white rounded-xl px-4 py-3 shadow-2xl border border-slate-700/50 text-xs">
            <p className="font-bold text-slate-300 mb-1.5">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-400">{entry.name}:</span>
                    <span className="font-black">{typeof entry.value === 'number' ? entry.value.toLocaleString('tr-TR') : entry.value}</span>
                </div>
            ))}
        </div>
    )
}

// ────── Main Dashboard ─────────────────────────────────────────────

export default function MetaAdsDashboard({ initialData, locale, onFilterChange, isSharedView = false }: Props) {
    const isTr = locale === 'tr'
    const [agencyMode, setAgencyMode] = useState(false)
    const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current query params or defaults
    const [startDate, setStartDate] = useState(isSharedView ? '' : (searchParams.get('startDate') || ''))
    const [endDate, setEndDate] = useState(isSharedView ? '' : (searchParams.get('endDate') || ''))
    const [datePreset, setDatePreset] = useState(isSharedView ? 'last_30d' : (searchParams.get('datePreset') || 'last_30d'))

    const handleApplyFilters = (start: string, end: string, preset: string) => {
        if (isSharedView && onFilterChange) {
            setStartDate(start)
            setEndDate(end)
            setDatePreset(preset)
            onFilterChange(start, end, preset)
            return
        }
        const params = new URLSearchParams(searchParams.toString())
        if (preset === 'custom') {
            if (start) params.set('startDate', start)
            else params.delete('startDate')
            if (end) params.set('endDate', end)
            else params.delete('endDate')
            params.set('datePreset', 'custom')
        } else {
            params.delete('startDate')
            params.delete('endDate')
            params.set('datePreset', preset)
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    const data = initialData
    const summary = data.accountSummary

    const fmt = (val: number, decimals = 0) => {
        try {
            return new Intl.NumberFormat(isTr ? 'tr-TR' : 'en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }).format(val)
        } catch { return String(val) }
    }

    const fmtCurrency = (val: number) => `₺${fmt(val, 2)}`
    const fmtPercent = (val: number) => `%${fmt(val, 2)}`

    // Prepare chart data with shortened dates
    const chartData = useMemo(() =>
        data.dailyBreakdown.map(d => ({
            ...d,
            dateShort: d.date ? d.date.substring(5).replace('-', '/') : '',
        })),
        [data.dailyBreakdown]
    )

    // Funnel steps
    const funnelSteps = useMemo(() => {
        const f = data.funnel
        return [
            { label: 'Gösterim', value: f.impressions, color: '#6366f1', rate: null },
            { label: 'Tıklama', value: f.clicks, color: '#3b82f6', rate: f.impressions > 0 ? (f.clicks / f.impressions * 100) : 0 },
            { label: 'Lead', value: f.leads, color: '#10b981', rate: f.clicks > 0 ? (f.leads / f.clicks * 100) : 0 },
            { label: 'CRM Dönüşüm', value: f.crmConversions, color: '#f59e0b', rate: f.leads > 0 ? (f.crmConversions / f.leads * 100) : 0 },
            { label: 'Satış', value: f.sales, color: '#ef4444', rate: f.crmConversions > 0 ? (f.sales / f.crmConversions * 100) : 0 },
        ]
    }, [data.funnel])

    const maxFunnel = Math.max(...funnelSteps.map(s => s.value), 1)

    return (
        <div className="space-y-6 p-1 sm:p-2">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="space-y-2">
                    {!isSharedView && (
                        <Link href="/reports" className="group flex items-center text-[10px] font-black text-slate-400 hover:text-blue-500 transition-colors gap-1.5 uppercase tracking-[0.2em]">
                            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                            {isTr ? 'Raporlar' : 'Reports'}
                        </Link>
                    )}
                    <h1 className="text-3xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Ads Analytics
                        </span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
                        {isTr
                            ? 'Facebook & Instagram reklam kampanyalarınız ile Web Formlarınızın gerçek zamanlı performans analizi, kreatif sıralaması ve dönüşüm hunisi.'
                            : 'Real-time performance analytics, web forms, creative leaderboard and conversion funnel for your Facebook & Instagram campaigns.'
                        }
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Date Picker Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm mr-2">
                        <div className="flex items-center gap-1 px-1">
                            <Filter className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtre:</span>
                        </div>
                        <select
                            value={datePreset}
                            onChange={(e) => {
                                const val = e.target.value
                                setDatePreset(val)
                                if (val !== 'custom') {
                                    handleApplyFilters('', '', val)
                                } else {
                                    const todayStr = new Date().toISOString().substring(0, 10)
                                    const prevStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
                                    setStartDate(prevStr)
                                    setEndDate(todayStr)
                                    handleApplyFilters(prevStr, todayStr, 'custom')
                                }
                            }}
                            className="bg-white dark:bg-slate-800 text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-200"
                        >
                            <option value="last_7d">Son 7 Gün</option>
                            <option value="last_30d">Son 30 Gün</option>
                            <option value="this_month">Bu Ay</option>
                            <option value="custom">Özel Tarih</option>
                        </select>

                        {datePreset === 'custom' && (
                            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-700">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-white dark:bg-slate-800 text-[11px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-200"
                                />
                                <span className="text-slate-400 text-[10px] font-bold">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-white dark:bg-slate-800 text-[11px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-200"
                                />
                                <Button
                                    size="sm"
                                    onClick={() => handleApplyFilters(startDate, endDate, 'custom')}
                                    className="h-6 px-2 bg-blue-600 hover:bg-blue-700 text-[9px] font-black uppercase tracking-wider rounded text-white"
                                >
                                    Uygula
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Connection badges */}
                    <Badge className={cn(
                        "py-1.5 px-3 rounded-xl border font-bold text-[10px] shadow-sm flex items-center gap-2",
                        data.connected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/50"
                    )}>
                        <div className={cn("h-2 w-2 rounded-full animate-pulse", data.connected ? "bg-emerald-500" : "bg-red-500")} />
                        {data.connected ? 'Meta API: Canlı' : 'Meta API: Çevrimdışı'}
                    </Badge>

                    {data.makeConnected && (
                        <Badge className="py-1.5 px-3 rounded-xl border font-bold text-[10px] shadow-sm flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50">
                            <div className="h-2 w-2 rounded-full animate-pulse bg-emerald-500" />
                            Make.com: Bağlı
                        </Badge>
                    )}

                    {/* Agency mode toggle */}
                    <Button
                        size="sm"
                        variant={agencyMode ? 'default' : 'outline'}
                        onClick={() => setAgencyMode(!agencyMode)}
                        className={cn(
                            "h-8 text-[10px] font-black uppercase tracking-wider rounded-lg gap-1.5",
                            agencyMode && "bg-indigo-600 hover:bg-indigo-700"
                        )}
                    >
                        {agencyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {isTr ? 'Ajans Modu' : 'Agency Mode'}
                    </Button>

                    {/* Share button */}
                    {!isSharedView && <ShareReportButton />}
                </div>
            </div>

            {/* ─── KPI CARDS ─── */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KPICard
                    title={isTr ? "Toplam Harcama" : "Total Spend"}
                    value={fmtCurrency(summary.spend)}
                    icon={DollarSign}
                    iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                    subtitle={isTr ? "Son 30 Gün" : "Last 30 Days"}
                />
                <KPICard
                    title={isTr ? "Toplam Lead" : "Total Leads"}
                    value={fmt(summary.leads)}
                    icon={Users}
                    iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                    subtitle={summary.leads > 0 ? `CPL: ${fmtCurrency(summary.cpl)}` : '—'}
                />
                <KPICard
                    title="CPL"
                    value={summary.cpl > 0 ? fmtCurrency(summary.cpl) : '—'}
                    icon={Target}
                    iconColor="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    subtitle={isTr ? "Lead Başına Maliyet" : "Cost Per Lead"}
                />
                <KPICard
                    title="CTR"
                    value={fmtPercent(summary.ctr)}
                    icon={MousePointerClick}
                    iconColor="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                    subtitle={isTr ? "Tıklama Oranı" : "Click-Through Rate"}
                />
                <KPICard
                    title="CPM"
                    value={fmtCurrency(summary.cpm)}
                    icon={Megaphone}
                    iconColor="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                    subtitle={isTr ? "1000 Gösterim Maliyeti" : "Cost per 1K Imp"}
                />
                <KPICard
                    title={isTr ? "Erişim" : "Reach"}
                    value={fmt(summary.reach)}
                    icon={Activity}
                    iconColor="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    subtitle={`Frekans: ${fmt(summary.frequency, 1)}`}
                />
            </div>

            {/* ─── SPEND & LEAD TREND CHART ─── */}
            {chartData.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    {isTr ? 'Günlük Harcama & Lead Trendi' : 'Daily Spend & Lead Trend'}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                    {isTr ? 'Son 30 gün boyunca günlük reklam harcaması ve kazanılan lead sayısı' : 'Daily ad spend and leads acquired over the last 30 days'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                                    <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="spend" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} />
                                    <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area yAxisId="spend" type="monotone" dataKey="spend" name={isTr ? "Harcama (₺)" : "Spend (₺)"} stroke="#6366f1" fill="url(#spendGradient)" strokeWidth={2.5} dot={false} />
                                    <Line yAxisId="leads" type="monotone" dataKey="leads" name="Leads" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── CAMPAIGN SCORECARD ─── */}
            {data.campaigns.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            {isTr ? 'Kampanya Skor Kartları' : 'Campaign Scorecards'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isTr ? `${data.campaigns.length} aktif kampanya · Son 30 gün performansı` : `${data.campaigns.length} campaigns · Last 30 days performance`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                                        <th className="text-left p-3 pl-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Kampanya' : 'Campaign'}</th>
                                        <th className="text-left p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Durum' : 'Status'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Harcama' : 'Spend'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Gösterim' : 'Imp.'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Tıklama' : 'Clicks'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">CTR</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">Leads</th>
                                        <th className="text-right p-3 pr-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">CPL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {data.campaigns.map((campaign) => (
                                        <tr
                                            key={campaign.campaign_id}
                                            className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors group cursor-pointer"
                                            onClick={() => setExpandedCampaign(expandedCampaign === campaign.campaign_id ? null : campaign.campaign_id)}
                                        >
                                            <td className="p-3 pl-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                                                        {agencyMode ? `Kampanya #${campaign.campaign_id.slice(-4)}` : campaign.campaign_name}
                                                    </span>
                                                    {campaign.objective && (
                                                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                                            {campaign.objective.replace(/_/g, ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge status={campaign.status} />
                                            </td>
                                            <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                                                {fmtCurrency(campaign.spend)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                                                {fmt(campaign.impressions)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                                                {fmt(campaign.clicks)}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={cn(
                                                    "font-black",
                                                    campaign.ctr >= 1.5 ? 'text-emerald-600' : campaign.ctr >= 0.8 ? 'text-amber-600' : 'text-rose-500'
                                                )}>
                                                    {fmtPercent(campaign.ctr)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-black text-blue-600 dark:text-blue-400">
                                                    {fmt(campaign.leads)}
                                                </span>
                                            </td>
                                            <td className="p-3 pr-5 text-right">
                                                <span className={cn(
                                                    "font-black",
                                                    campaign.cpl > 0 && campaign.cpl <= 50 ? 'text-emerald-600' :
                                                    campaign.cpl > 0 && campaign.cpl <= 150 ? 'text-amber-600' :
                                                    campaign.cpl > 0 ? 'text-rose-500' : 'text-slate-400'
                                                )}>
                                                    {campaign.cpl > 0 ? fmtCurrency(campaign.cpl) : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Total row */}
                                <tfoot>
                                    <tr className="bg-slate-900 dark:bg-slate-950 text-white border-t-2 border-slate-200 dark:border-slate-700">
                                        <td className="p-3 pl-5 font-black text-xs uppercase tracking-wider" colSpan={2}>
                                            {isTr ? 'TOPLAM' : 'TOTAL'}
                                        </td>
                                        <td className="p-3 text-right font-black text-sm">{fmtCurrency(summary.spend)}</td>
                                        <td className="p-3 text-right font-black">{fmt(summary.impressions)}</td>
                                        <td className="p-3 text-right font-black">{fmt(summary.clicks)}</td>
                                        <td className="p-3 text-right font-black">{fmtPercent(summary.ctr)}</td>
                                        <td className="p-3 text-right font-black text-emerald-400">{fmt(summary.leads)}</td>
                                        <td className="p-3 pr-5 text-right font-black text-amber-400">{summary.cpl > 0 ? fmtCurrency(summary.cpl) : '—'}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── CREATIVE LEADERBOARD + FUNNEL ─── */}
            <div className="grid gap-4 lg:grid-cols-5">
                {/* Creative Leaderboard */}
                {data.topAds.length > 0 && (
                    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden lg:col-span-3">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Image className="h-5 w-5 text-purple-500" />
                                {isTr ? 'Kreatif Sıralaması' : 'Creative Leaderboard'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {isTr ? 'En yüksek harcamalı reklamlar ve performansları' : 'Top spending ads and their performance'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {data.topAds.slice(0, 10).map((ad, idx) => (
                                    <div key={ad.ad_id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        {/* Rank */}
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
                                            idx < 3
                                                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
                                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        )}>
                                            {idx + 1}
                                        </div>

                                        {/* Thumbnail */}
                                        {ad.thumbnail_url ? (
                                            <img src={ad.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover shadow-sm shrink-0" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center shrink-0">
                                                <Image className="h-4 w-4 text-blue-400" />
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {agencyMode ? `Reklam #${ad.ad_id.slice(-4)}` : ad.ad_name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {agencyMode ? '—' : ad.campaign_name}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <StatusBadge status={ad.status} />

                                        {/* Metrics */}
                                        <div className="flex items-center gap-4 text-right shrink-0">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Spend</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">{fmtCurrency(ad.spend)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Leads</p>
                                                <p className="text-xs font-black text-blue-600 dark:text-blue-400">{fmt(ad.leads)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">CPL</p>
                                                <p className={cn("text-xs font-black",
                                                    ad.cpl > 0 && ad.cpl <= 50 ? 'text-emerald-600' :
                                                    ad.cpl > 0 && ad.cpl <= 150 ? 'text-amber-600' :
                                                    ad.cpl > 0 ? 'text-rose-500' : 'text-slate-400'
                                                )}>
                                                    {ad.cpl > 0 ? fmtCurrency(ad.cpl) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Funnel Visualization */}
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden lg:col-span-2">
                    <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <ArrowDownRight className="h-5 w-5 text-emerald-500" />
                            {isTr ? 'Dönüşüm Hunisi' : 'Conversion Funnel'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                        {funnelSteps.map((step, idx) => (
                            <div key={step.label} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{step.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-900 dark:text-white">{fmt(step.value)}</span>
                                        {step.rate !== null && step.rate > 0 && (
                                            <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none text-[9px] font-bold px-1.5 py-0">
                                                {fmtPercent(step.rate)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                                    <div
                                        className="h-full rounded-lg transition-all duration-700 ease-out relative overflow-hidden"
                                        style={{
                                            width: `${Math.max((step.value / maxFunnel) * 100, 2)}%`,
                                            backgroundColor: step.color,
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                                    </div>
                                </div>
                                {idx < funnelSteps.length - 1 && step.rate !== null && step.rate > 0 && (
                                    <div className="flex justify-center">
                                        <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 flex items-center gap-0.5">
                                            ↓ {fmtPercent(step.rate)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Overall conversion */}
                        {data.funnel.impressions > 0 && data.funnel.leads > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        {isTr ? 'Genel Dönüşüm' : 'Overall Conv.'}
                                    </span>
                                    <span className="text-lg font-black text-emerald-600">
                                        {fmtPercent(data.funnel.leads / data.funnel.impressions * 100)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── LEAD QUALITY & SOURCE BREAKDOWN TABLE ─── */}
            {data.formQualityBreakdowns && data.formQualityBreakdowns.length > 0 && (
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            {isTr ? 'Aday Kalitesi ve Kaynak Kırılımı' : 'Lead Quality & Source Breakdown'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isTr
                                ? 'Reklam ve web formlarından gelen adayların CRM durumlarına göre kalite dağılım oranları.'
                                : 'CRM quality distribution ratios for leads coming from ads and web forms by status.'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
                                        <th className="text-left p-3 pl-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Kaynak / Form Adı' : 'Source / Form Name'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Toplam Aday' : 'Total Leads'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Potansiyel' : 'Prospects'}</th>
                                        <th className="text-right p-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Olumlu' : 'Qualified'}</th>
                                        <th className="text-right p-3 pr-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">{isTr ? 'Çöp' : 'Trash'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {data.formQualityBreakdowns.map((row) => {
                                        const pctPotansiyel = row.total > 0 ? (row.potansiyel / row.total * 100) : 0
                                        const pctOlumlu = row.total > 0 ? (row.olumlu / row.total * 100) : 0
                                        const pctCop = row.total > 0 ? (row.cop / row.total * 100) : 0

                                        const cleanFormName = row.name
                                            .toLowerCase()
                                            .replace(/[^a-z0-9]/g, '')
                                            .replace(/form/g, '')
                                            .replace(/copy/g, '')
                                            .replace(/guncel/g, '')
                                            .replace(/ocak2026/g, '')
                                            .trim()

                                        const matchedScenario = data.makeScenarios.find((s) => {
                                            const cleanScenarioName = s.name
                                                .toLowerCase()
                                                .replace(/[^a-z0-9]/g, '')
                                                .replace(/form/g, '')
                                                .replace(/copy/g, '')
                                                .replace(/guncel/g, '')
                                                .replace(/leadads/g, '')
                                                .replace(/http/g, '')
                                                .replace(/webhook/g, '')
                                                .trim()
                                            return cleanScenarioName.includes(cleanFormName) || cleanFormName.includes(cleanScenarioName)
                                        })

                                        return (
                                            <tr key={row.name} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                                <td className="p-3 pl-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                {agencyMode ? `Kaynak #${row.name.substring(0, 4)}` : row.name}
                                                            </span>
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                                                                row.isMeta 
                                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30"
                                                                    : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30"
                                                            )}>
                                                                {row.isMeta ? 'Meta Ads' : 'Web Form'}
                                                            </Badge>

                                                            {row.isMeta && (
                                                                matchedScenario ? (
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border",
                                                                        matchedScenario.active
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400"
                                                                    )}>
                                                                        {isTr 
                                                                            ? `Otomasyon: ${matchedScenario.active ? 'Aktif' : 'Pasif'}`
                                                                            : `Automation: ${matchedScenario.active ? 'Active' : 'Inactive'}`
                                                                        }
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                                        {isTr ? 'Otomasyon: Bağlantı Yok' : 'Automation: Not Connected'}
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            Kanal: {row.source}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                                                    {fmt(row.total)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(row.potansiyel)}</span>
                                                        <span className="text-[9px] text-slate-400">%{pctPotansiyel.toFixed(1)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(row.olumlu)}</span>
                                                        <span className="text-[9px] text-slate-400">%{pctOlumlu.toFixed(1)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 pr-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold text-rose-500 dark:text-rose-400">{fmt(row.cop)}</span>
                                                        <span className="text-[9px] text-slate-400">%{pctCop.toFixed(1)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Overall Quality Indicators stack */}
                        {data.overallQuality && data.overallQuality.total > 0 && (
                            (() => {
                                const overall = data.overallQuality
                                const oTotal = overall.total || 1
                                const oPctPotansiyel = (overall.potansiyel / oTotal) * 100
                                const oPctOlumlu = (overall.olumlu / oTotal) * 100
                                const oPctCop = (overall.cop / oTotal) * 100

                                return (
                                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {isTr ? `Genel Kalite Dağılımı (${fmt(overall.total)} Aday)` : `Overall Quality Distribution (${fmt(overall.total)} Leads)`}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {isTr ? 'CRM Durum Dağılımı' : 'CRM Status Allocation'}
                                            </span>
                                        </div>
                                        
                                        <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                                            {overall.olumlu > 0 && (
                                                <div 
                                                    className="h-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black transition-all duration-500 relative group"
                                                    style={{ width: `${oPctOlumlu}%` }}
                                                >
                                                    <span>%{oPctOlumlu.toFixed(1)}</span>
                                                </div>
                                            )}
                                            {overall.potansiyel > 0 && (
                                                <div 
                                                    className="h-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-black transition-all duration-500 relative group"
                                                    style={{ width: `${oPctPotansiyel}%` }}
                                                >
                                                    <span>%{oPctPotansiyel.toFixed(1)}</span>
                                                </div>
                                            )}
                                            {overall.cop > 0 && (
                                                <div 
                                                    className="h-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-black transition-all duration-500 relative group"
                                                    style={{ width: `${oPctCop}%` }}
                                                >
                                                    <span>%{oPctCop.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-6 justify-center pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {isTr ? 'Olumlu' : 'Qualified'}: <span className="font-black text-slate-900 dark:text-white">{fmt(overall.olumlu)}</span> (%{oPctOlumlu.toFixed(1)})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-blue-500" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {isTr ? 'Potansiyel' : 'Prospects'}: <span className="font-black text-slate-900 dark:text-white">{fmt(overall.potansiyel)}</span> (%{oPctPotansiyel.toFixed(1)})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-rose-500" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {isTr ? 'Çöp' : 'Trash'}: <span className="font-black text-slate-900 dark:text-white">{fmt(overall.cop)}</span> (%{oPctCop.toFixed(1)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── WEB FORMS ANALYTICS ─── */}
            <div className="space-y-3 mt-8">
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">
                        {isTr ? 'Web Form Analitiği' : 'Web Forms Analytics'}
                    </h2>
                </div>
                
                <div className="grid gap-4 lg:grid-cols-5">
                    {/* Web Form KPI Cards */}
                    <div className="grid gap-3 grid-cols-2 lg:col-span-3">
                        <KPICard
                            title={isTr ? "Toplam Web Adayı" : "Total Web Leads"}
                            value={fmt(data.webStats.leads)}
                            icon={Users}
                            iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                            trend={data.webStats.leadsPrev > 0 ? (data.webStats.leads >= data.webStats.leadsPrev ? 'up' : 'down') : 'neutral'}
                            trendValue={data.webStats.leadsPrev > 0 
                                ? `${fmtPercent(Math.abs((data.webStats.leads - data.webStats.leadsPrev) / data.webStats.leadsPrev * 100))} ${data.webStats.leads >= data.webStats.leadsPrev ? (isTr ? 'artış' : 'up') : (isTr ? 'düşüş' : 'down')}` 
                                : undefined}
                            subtitle={isTr ? "Son 30 Gün" : "Last 30 Days"}
                        />
                        <KPICard
                            title={isTr ? "Bugün Gelen" : "Leads Today"}
                            value={fmt(data.webStats.leadsToday)}
                            icon={Clock}
                            iconColor="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            subtitle={isTr ? "Web Formları" : "Web Forms"}
                        />
                        <KPICard
                            title={isTr ? "CRM Müşterisi" : "CRM Customers"}
                            value={fmt(data.webStats.crmConversions)}
                            icon={ShieldCheck}
                            iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            subtitle={isTr ? "Web Kaynaklı" : "From Web Forms"}
                        />
                        <KPICard
                            title={isTr ? "Kazanılan Satış" : "Won Sales"}
                            value={fmt(data.webStats.sales)}
                            icon={CheckCircle2}
                            iconColor="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                            subtitle={isTr ? "Web Kaynaklı" : "From Web Forms"}
                        />
                    </div>

                    {/* Web Conversion Funnel */}
                    <Card className="rounded-2xl border-0 shadow-lg overflow-hidden lg:col-span-2">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <ArrowDownRight className="h-5 w-5 text-indigo-500" />
                                {isTr ? 'Web Dönüşüm Hunisi' : 'Web Conversion Funnel'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            {[
                                { label: isTr ? 'Web Form Başvuruları' : 'Web Form Leads', value: data.webStats.leads, color: '#6366f1' },
                                { label: isTr ? 'Müşteri Dönüşümü' : 'CRM Customers', value: data.webStats.crmConversions, color: '#10b981', rate: data.webStats.leads > 0 ? (data.webStats.crmConversions / data.webStats.leads * 100) : 0 },
                                { label: isTr ? 'Kazanılan Satış' : 'Closed Sales', value: data.webStats.sales, color: '#3b82f6', rate: data.webStats.crmConversions > 0 ? (data.webStats.sales / data.webStats.crmConversions * 100) : 0 }
                            ].map((step, idx, arr) => {
                                const maxWebFunnel = Math.max(...arr.map(s => s.value), 1)
                                return (
                                    <div key={step.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{step.label}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{fmt(step.value)}</span>
                                                {step.rate !== undefined && step.rate > 0 && (
                                                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none text-[9px] font-bold px-1.5 py-0">
                                                        {fmtPercent(step.rate)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                                            <div
                                                className="h-full rounded-lg transition-all duration-700 ease-out relative overflow-hidden"
                                                style={{
                                                    width: `${Math.max((step.value / maxWebFunnel) * 100, 2)}%`,
                                                    backgroundColor: step.color,
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Overall web conversion */}
                            {data.webStats.leads > 0 && data.webStats.sales > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            {isTr ? 'Form -> Satış Oranı' : 'Form -> Sale Rate'}
                                        </span>
                                        <span className="text-lg font-black text-indigo-600">
                                            {fmtPercent(data.webStats.sales / data.webStats.leads * 100)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>


            {/* ─── NO DATA STATE ─── */}
            {!data.connected && data.campaigns.length === 0 && (
                <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {isTr ? 'Meta API Bağlantısı Kurulamadı' : 'Meta API Connection Failed'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                                {isTr
                                    ? 'META_ADS_ACCESS_TOKEN env değişkenini kontrol edin. Token süresi dolmuş olabilir veya gerekli izinler (ads_read, leads_retrieval) eksik olabilir.'
                                    : 'Check your META_ADS_ACCESS_TOKEN env variable. The token may have expired or required permissions (ads_read, leads_retrieval) may be missing.'
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
