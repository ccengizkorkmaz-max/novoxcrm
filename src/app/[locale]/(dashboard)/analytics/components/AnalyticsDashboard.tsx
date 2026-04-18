'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    TrendingUp, TrendingDown, Users, Target, MapPin, Clock,
    BarChart3, PieChart, Activity, ChevronDown, ArrowUpRight,
    ArrowDownRight, Filter, Calendar, DollarSign, Percent,
    Zap, Eye, Award
} from 'lucide-react'

interface AnalyticsDashboardProps {
    sales: any[]
    transactions: any[]
    portfolios: any[]
    agents: any[]
    activities: any[]
}

function formatCurrency(amount: number) {
    if (!amount) return '₺0'
    if (amount >= 1_000_000) return `₺${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `₺${(amount / 1_000).toFixed(0)}K`
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

function formatCurrencyFull(amount: number) {
    if (!amount) return '₺0'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

function formatPct(num: number, den: number) {
    if (!den) return '0%'
    return `${Math.round((num / den) * 100)}%`
}

function daysBetween(d1: string, d2: string) {
    return Math.ceil((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000)
}

const PERIOD_OPTIONS = [
    { value: 'month', label: 'Bu Ay' },
    { value: 'quarter', label: 'Bu Çeyrek' },
    { value: 'year', label: 'Bu Yıl' },
    { value: 'all', label: 'Tüm Zamanlar' },
]

function filterByPeriod(items: any[], dateField: string, period: string) {
    if (period === 'all') return items
    const now = new Date()
    return items.filter(item => {
        if (!item[dateField]) return false
        const d = new Date(item[dateField])
        if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        if (period === 'quarter') {
            const q = Math.floor(now.getMonth() / 3)
            return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear()
        }
        if (period === 'year') return d.getFullYear() === now.getFullYear()
        return true
    })
}

const SOURCE_LABELS: Record<string, string> = {
    'Referans': 'Referans',
    'Web Sitesi': 'Web Sitesi',
    'Sahibinden': 'Sahibinden',
    'Hepsiemlak': 'Hepsiemlak',
    'Sosyal Medya': 'Sosyal Medya',
    'Tabela': 'Tabela',
    'Telefon': 'Telefon',
    'Yürüyüş': 'Walk-in',
    'personal': 'Kişisel',
    'personal_agent': 'Emlakçı',
    'company': 'Şirket',
}

const SOURCE_COLORS: Record<string, string> = {
    'Referans': 'bg-emerald-500',
    'Web Sitesi': 'bg-blue-500',
    'Sahibinden': 'bg-red-500',
    'Hepsiemlak': 'bg-violet-500',
    'Sosyal Medya': 'bg-pink-500',
    'Tabela': 'bg-amber-500',
    'Telefon': 'bg-cyan-500',
    'Yürüyüş': 'bg-orange-500',
}

const BROKER_STATUSES = ['Lead', 'Prospect', 'Showing', 'Proposal', 'Negotiation', 'Sold', 'Completed', 'Contract']
const BROKER_STATUS_LABELS: Record<string, string> = {
    'Lead': 'Yeni Talep',
    'Prospect': 'İletişim',
    'Showing': 'Gösterim',
    'Proposal': 'Teklif',
    'Negotiation': 'Pazarlık',
    'Sold': 'Sözleşme',
    'Completed': 'Kapandı',
    'Contract': 'Sözleşme',
}

export function AnalyticsDashboard({ sales, transactions, portfolios, agents, activities }: AnalyticsDashboardProps) {
    const [period, setPeriod] = useState('month')

    const filteredSales = useMemo(() => filterByPeriod(sales, 'created_at', period), [sales, period])
    const filteredTx = useMemo(() => filterByPeriod(transactions, 'transaction_date', period), [transactions, period])
    const approvedTx = useMemo(() => filteredTx.filter(t => ['approved', 'paid'].includes(t.status)), [filteredTx])

    // ===== KPI CALCULATIONS =====
    const kpis = useMemo(() => {
        const totalLeads = filteredSales.length
        const wonDeals = filteredSales.filter(s => ['Sold', 'Completed', 'Contract'].includes(s.status)).length
        const lostDeals = filteredSales.filter(s => s.status === 'Lost').length
        const activeDeals = filteredSales.filter(s => !['Lost', 'Sold', 'Completed'].includes(s.status)).length
        const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0

        const totalGCI = approvedTx.reduce((s, t) => s + (t.gross_commission || 0), 0)
        const totalVolume = approvedTx.reduce((s, t) => s + (t.sale_price || 0), 0)
        const avgDealSize = approvedTx.length > 0 ? totalVolume / approvedTx.length : 0

        // Average closing time (for won deals)
        const closedSales = filteredSales.filter(s => ['Sold', 'Completed'].includes(s.status) && s.created_at && s.updated_at)
        const avgCloseTime = closedSales.length > 0
            ? Math.round(closedSales.reduce((s, sale) => s + daysBetween(sale.created_at, sale.updated_at), 0) / closedSales.length)
            : 0

        return { totalLeads, wonDeals, lostDeals, activeDeals, conversionRate, totalGCI, totalVolume, avgDealSize, avgCloseTime }
    }, [filteredSales, approvedTx])

    // ===== CONVERSION FUNNEL =====
    const funnel = useMemo(() => {
        const stages = ['Lead', 'Prospect', 'Showing', 'Proposal', 'Negotiation']
        const won = ['Sold', 'Completed', 'Contract']
        const counts: Record<string, number> = {}

        // Count current + passed stages
        const stageOrder = [...stages, ...won, 'Lost']
        filteredSales.forEach(s => {
            const idx = stageOrder.indexOf(s.status)
            stages.forEach((stage, si) => {
                if (idx >= si) counts[stage] = (counts[stage] || 0) + 1
            })
            if (won.includes(s.status)) counts['Won'] = (counts['Won'] || 0) + 1
        })

        const total = filteredSales.length || 1
        return [
            { label: 'Yeni Talep', count: counts['Lead'] || filteredSales.length, pct: 100, color: 'bg-blue-500' },
            { label: 'İletişim', count: counts['Prospect'] || 0, pct: Math.round(((counts['Prospect'] || 0) / total) * 100), color: 'bg-cyan-500' },
            { label: 'Gösterim', count: counts['Showing'] || 0, pct: Math.round(((counts['Showing'] || 0) / total) * 100), color: 'bg-violet-500' },
            { label: 'Teklif', count: counts['Proposal'] || 0, pct: Math.round(((counts['Proposal'] || 0) / total) * 100), color: 'bg-amber-500' },
            { label: 'Pazarlık', count: counts['Negotiation'] || 0, pct: Math.round(((counts['Negotiation'] || 0) / total) * 100), color: 'bg-orange-500' },
            { label: 'Kazanıldı', count: counts['Won'] || 0, pct: Math.round(((counts['Won'] || 0) / total) * 100), color: 'bg-emerald-500' },
        ]
    }, [filteredSales])

    // ===== SOURCE ANALYSIS =====
    const sourceAnalysis = useMemo(() => {
        const sourceMap: Record<string, { total: number; won: number; revenue: number }> = {}

        filteredSales.forEach(s => {
            const src = s.source || s.lead_origin || (s.customers?.source) || 'Diğer'
            if (!sourceMap[src]) sourceMap[src] = { total: 0, won: 0, revenue: 0 }
            sourceMap[src].total++
            if (['Sold', 'Completed', 'Contract'].includes(s.status)) sourceMap[src].won++
        })

        // Match revenue to sources via transactions
        approvedTx.forEach(tx => {
            // Try to find the sale for this transaction
            const relatedSale = filteredSales.find(s =>
                s.customer_id && approvedTx.some(t => t.id === tx.id)
            )
            if (relatedSale) {
                const src = relatedSale.source || relatedSale.lead_origin || 'Diğer'
                if (sourceMap[src]) sourceMap[src].revenue += (tx.sale_price || 0)
            }
        })

        return Object.entries(sourceMap)
            .map(([source, data]) => ({
                source,
                label: SOURCE_LABELS[source] || source,
                color: SOURCE_COLORS[source] || 'bg-slate-500',
                ...data,
                conversionRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
            }))
            .sort((a, b) => b.total - a.total)
    }, [filteredSales, approvedTx])

    // ===== AGENT PERFORMANCE =====
    const agentPerformance = useMemo(() => {
        return agents.map(agent => {
            const mySales = filteredSales.filter(s => s.assigned_to === agent.id)
            const myWon = mySales.filter(s => ['Sold', 'Completed', 'Contract'].includes(s.status)).length
            const myLost = mySales.filter(s => s.status === 'Lost').length
            const myActive = mySales.filter(s => !['Lost', 'Sold', 'Completed'].includes(s.status)).length

            const myTx = filteredTx.filter(t => t.listing_agent_id === agent.id || t.buyer_agent_id === agent.id)
            const myApprovedTx = myTx.filter(t => ['approved', 'paid'].includes(t.status))
            const myGCI = myApprovedTx.reduce((s, t) => {
                let earn = 0
                if (t.listing_agent_id === agent.id) earn += (t.listing_agent_share || 0)
                if (t.buyer_agent_id === agent.id) earn += (t.buyer_agent_share || 0)
                return s + earn
            }, 0)
            const myVolume = myApprovedTx.reduce((s, t) => s + (t.sale_price || 0), 0)

            const myPortfolios = portfolios.filter(p => p.agent_id === agent.id)
            const activePortfolios = myPortfolios.filter(p => p.status === 'active').length

            const myActivities = activities.filter(a => a.user_id === agent.id)

            // Avg close time
            const closedSales = mySales.filter(s => ['Sold', 'Completed'].includes(s.status) && s.created_at && s.updated_at)
            const avgCloseTime = closedSales.length > 0
                ? Math.round(closedSales.reduce((s, sale) => s + daysBetween(sale.created_at, sale.updated_at), 0) / closedSales.length)
                : 0

            return {
                ...agent,
                totalLeads: mySales.length,
                wonDeals: myWon,
                lostDeals: myLost,
                activeDeals: myActive,
                conversionRate: mySales.length > 0 ? Math.round((myWon / mySales.length) * 100) : 0,
                gci: myGCI,
                volume: myVolume,
                dealCount: myApprovedTx.length,
                activePortfolios,
                activityCount: myActivities.length,
                avgCloseTime,
            }
        }).sort((a, b) => b.gci - a.gci)
    }, [agents, filteredSales, filteredTx, portfolios, activities])

    // ===== MONTHLY TREND (last 6 months) =====
    const monthlyTrend = useMemo(() => {
        const months: { label: string; leads: number; won: number; gci: number; volume: number }[] = []
        const now = new Date()

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
            const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })

            const monthSales = sales.filter(s => {
                const sd = new Date(s.created_at)
                return sd >= d && sd <= monthEnd
            })
            const monthTx = transactions.filter(t => {
                if (!['approved', 'paid'].includes(t.status)) return false
                const td = new Date(t.transaction_date)
                return td >= d && td <= monthEnd
            })

            months.push({
                label,
                leads: monthSales.length,
                won: monthSales.filter(s => ['Sold', 'Completed', 'Contract'].includes(s.status)).length,
                gci: monthTx.reduce((s, t) => s + (t.gross_commission || 0), 0),
                volume: monthTx.reduce((s, t) => s + (t.sale_price || 0), 0),
            })
        }
        return months
    }, [sales, transactions])

    // ===== PORTFOLIO ANALYTICS =====
    const portfolioAnalytics = useMemo(() => {
        const byType: Record<string, number> = {}
        const byCity: Record<string, number> = {}
        const byListing: Record<string, number> = {}
        let totalPricePerSqm = 0
        let sqmCount = 0

        portfolios.forEach(p => {
            byType[p.property_type] = (byType[p.property_type] || 0) + 1
            if (p.city) byCity[p.city] = (byCity[p.city] || 0) + 1
            byListing[p.listing_type] = (byListing[p.listing_type] || 0) + 1
            if (p.price && p.area_net) {
                totalPricePerSqm += p.price / p.area_net
                sqmCount++
            }
        })

        const avgPricePerSqm = sqmCount > 0 ? Math.round(totalPricePerSqm / sqmCount) : 0

        return {
            total: portfolios.length,
            active: portfolios.filter(p => p.status === 'active').length,
            sold: portfolios.filter(p => p.status === 'sold').length,
            rented: portfolios.filter(p => p.status === 'rented').length,
            byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
            byCity: Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 5),
            byListing,
            avgPricePerSqm,
        }
    }, [portfolios])

    const maxMonthlyGCI = Math.max(...monthlyTrend.map(m => m.gci), 1)
    const maxMonthlyLeads = Math.max(...monthlyTrend.map(m => m.leads), 1)

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-2 flex-wrap">
                {PERIOD_OPTIONS.map(p => (
                    <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            period === p.value
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-white text-slate-500 border hover:bg-slate-50"
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Toplam Lead', value: kpis.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Dönüşüm Oranı', value: `${kpis.conversionRate.toFixed(1)}%`, icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Toplam GCI', value: formatCurrency(kpis.totalGCI), icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Ort. İşlem', value: formatCurrency(kpis.avgDealSize), icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Ort. Kapanış', value: `${kpis.avgCloseTime} gün`, icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                ].map((kpi, i) => (
                    <Card key={i} className="border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", kpi.bg)}>
                                    <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                                </div>
                            </div>
                            <p className={cn("text-2xl font-black", kpi.color)}>{kpi.value}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{kpi.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Row 2: Funnel + Source Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-500" />
                            Dönüşüm Hunisi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {funnel.map((stage, i) => (
                                <div key={stage.label} className="relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-slate-700">{stage.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900">{stage.count}</span>
                                            <span className="text-[10px] text-muted-foreground">({stage.pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2", stage.color)}
                                            style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 5 : 0)}%` }}
                                        >
                                            {stage.pct > 15 && (
                                                <span className="text-[10px] text-white font-bold">{stage.pct}%</span>
                                            )}
                                        </div>
                                    </div>
                                    {i < funnel.length - 1 && stage.count > 0 && funnel[i + 1].count > 0 && (
                                        <div className="absolute -right-1 top-full text-[9px] text-muted-foreground font-medium mt-0.5">
                                            ↓ {Math.round((funnel[i + 1].count / stage.count) * 100)}%
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs">
                            <span className="text-emerald-600 font-bold">✅ {kpis.wonDeals} kazanıldı</span>
                            <span className="text-slate-500">{kpis.activeDeals} aktif</span>
                            <span className="text-red-500 font-medium">❌ {kpis.lostDeals} kayıp</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Source Analysis */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-violet-500" />
                            Kaynak Analizi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sourceAnalysis.length > 0 ? (
                            <div className="space-y-3">
                                {sourceAnalysis.map(src => {
                                    const maxTotal = sourceAnalysis[0]?.total || 1
                                    return (
                                        <div key={src.source} className="flex items-center gap-3">
                                            <div className={cn("h-3 w-3 rounded-full flex-shrink-0", src.color)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium truncate">{src.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] font-mono">{src.total} lead</Badge>
                                                        <Badge className={cn("text-[9px] border-none",
                                                            src.conversionRate >= 30 ? "bg-emerald-100 text-emerald-700" :
                                                            src.conversionRate >= 10 ? "bg-amber-100 text-amber-700" :
                                                            "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {src.conversionRate}% dönüşüm
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all", src.color)}
                                                        style={{ width: `${Math.round((src.total / maxTotal) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-xs">Veri yok</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Monthly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GCI Trend */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Aylık GCI Trendi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {monthlyTrend.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-bold text-emerald-600">
                                        {m.gci > 0 ? formatCurrency(m.gci) : ''}
                                    </span>
                                    <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${Math.max((m.gci / maxMonthlyGCI) * 100, m.gci > 0 ? 5 : 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-medium">{m.label}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Lead Volume Trend */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            Aylık Lead Hacmi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 h-40">
                            {monthlyTrend.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="flex flex-col items-center text-[9px] font-bold">
                                        <span className="text-blue-600">{m.leads > 0 ? m.leads : ''}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '120px' }}>
                                        <div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${Math.max((m.leads / maxMonthlyLeads) * 100, m.leads > 0 ? 5 : 0)}%` }}
                                        />
                                        {m.won > 0 && (
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 opacity-70"
                                                style={{ height: `${(m.won / maxMonthlyLeads) * 100}%` }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground font-medium">{m.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-2 border-t justify-center">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded bg-blue-500" />
                                <span className="text-[10px] text-muted-foreground">Toplam Lead</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded bg-emerald-500" />
                                <span className="text-[10px] text-muted-foreground">Kazanılan</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Agent Performance Table */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        Danışman Performans Karşılaştırması
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-slate-50/50">
                                <th className="text-left p-2.5 font-bold text-slate-600">Danışman</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Lead</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Kazanılan</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Kayıp</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Dönüşüm</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">GCI</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Hacim</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Portföy</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Ort. Kapanış</th>
                                <th className="text-center p-2.5 font-bold text-slate-600">Aktivite</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agentPerformance.map((agent, i) => (
                                <tr key={agent.id} className={cn("border-b hover:bg-slate-50/50 transition-colors", i === 0 && agent.gci > 0 && "bg-yellow-50/30")}>
                                    <td className="p-2.5">
                                        <div className="flex items-center gap-2">
                                            {i === 0 && agent.gci > 0 && <span>🥇</span>}
                                            {i === 1 && agent.gci > 0 && <span>🥈</span>}
                                            {i === 2 && agent.gci > 0 && <span>🥉</span>}
                                            <span className="font-bold">{agent.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center p-2.5 font-mono">{agent.totalLeads}</td>
                                    <td className="text-center p-2.5 font-mono font-bold text-emerald-600">{agent.wonDeals}</td>
                                    <td className="text-center p-2.5 font-mono text-red-500">{agent.lostDeals}</td>
                                    <td className="text-center p-2.5">
                                        <Badge className={cn("text-[9px] border-none font-bold",
                                            agent.conversionRate >= 30 ? "bg-emerald-100 text-emerald-700" :
                                            agent.conversionRate >= 15 ? "bg-amber-100 text-amber-700" :
                                            "bg-slate-100 text-slate-500"
                                        )}>
                                            {agent.conversionRate}%
                                        </Badge>
                                    </td>
                                    <td className="text-center p-2.5 font-bold text-violet-600">{formatCurrency(agent.gci)}</td>
                                    <td className="text-center p-2.5 text-muted-foreground">{formatCurrency(agent.volume)}</td>
                                    <td className="text-center p-2.5 font-mono">{agent.activePortfolios}</td>
                                    <td className="text-center p-2.5">
                                        {agent.avgCloseTime > 0 ? (
                                            <span className={cn("font-bold",
                                                agent.avgCloseTime <= 30 ? "text-emerald-600" :
                                                agent.avgCloseTime <= 60 ? "text-amber-600" :
                                                "text-red-600"
                                            )}>
                                                {agent.avgCloseTime}g
                                            </span>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </td>
                                    <td className="text-center p-2.5 font-mono text-muted-foreground">{agent.activityCount}</td>
                                </tr>
                            ))}
                            {agentPerformance.length === 0 && (
                                <tr><td colSpan={10} className="text-center p-8 text-muted-foreground">Veri yok</td></tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* Row 5: Portfolio Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* By Property Type */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            Mülk Tipi Dağılımı
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2.5">
                            {portfolioAnalytics.byType.map(([type, count]) => {
                                const TYPE_LABELS: Record<string, string> = { apartment: 'Daire', villa: 'Villa', land: 'Arsa', commercial: 'Ticari', office: 'Ofis' }
                                const maxCount = portfolioAnalytics.byType[0]?.[1] || 1
                                return (
                                    <div key={type} className="flex items-center gap-3">
                                        <span className="text-xs w-16 text-slate-600 font-medium">{TYPE_LABELS[type as string] || type}</span>
                                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(count as number / (maxCount as number)) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-bold w-8 text-right">{count as number}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* By City */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Şehir Bazlı Dağılım
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2.5">
                            {portfolioAnalytics.byCity.map(([city, count]) => {
                                const maxCount = portfolioAnalytics.byCity[0]?.[1] || 1
                                return (
                                    <div key={city} className="flex items-center gap-3">
                                        <span className="text-xs w-20 text-slate-600 font-medium truncate">{city as string}</span>
                                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(count as number / (maxCount as number)) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-bold w-8 text-right">{count as number}</span>
                                    </div>
                                )
                            })}
                            {portfolioAnalytics.byCity.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-xs">Veri yok</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Portfolio Summary */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-violet-500" />
                            Portföy Özeti
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                                <p className="text-xl font-black text-emerald-600">{portfolioAnalytics.active}</p>
                                <p className="text-[10px] text-emerald-500 font-bold">Aktif</p>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                                <p className="text-xl font-black text-rose-600">{portfolioAnalytics.sold}</p>
                                <p className="text-[10px] text-rose-500 font-bold">Satıldı</p>
                            </div>
                            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-center">
                                <p className="text-xl font-black text-cyan-600">{portfolioAnalytics.rented}</p>
                                <p className="text-[10px] text-cyan-500 font-bold">Kirada</p>
                            </div>
                            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-center">
                                <p className="text-xl font-black text-violet-600">{formatCurrencyFull(portfolioAnalytics.avgPricePerSqm)}</p>
                                <p className="text-[10px] text-violet-500 font-bold">Ort. ₺/m²</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                            <span>Satılık: {portfolioAnalytics.byListing['sale'] || 0}</span>
                            <span>Kiralık: {portfolioAnalytics.byListing['rent'] || 0}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
