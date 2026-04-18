'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import {
    MapPin, Target, TrendingUp, Users, Medal,
    AlertTriangle, Clock, ArrowRight, Flame,
    Phone, Calendar, Mail, MessageSquare, FileText,
    ChevronRight, Zap
} from 'lucide-react'

interface BrokerDashboardProps {
    portfolioStats: {
        total: number
        active: number
        sold: number
        rented: number
        expiringCount: number
    }
    leadStats: {
        unassigned: number
        totalToday: number
    }
    revenueStats: {
        totalGCI: number
        monthlyGCI: number
        pendingPayments: number
    }
    topAgents: Array<{
        name: string
        earnings: number
        deals: number
    }>
    pipelineStats?: {
        lead: number
        prospect: number
        showing: number
        proposal: number
        negotiation: number
        contract: number
        lost: number
        totalActive: number
    }
    recentActivities?: Array<{
        id: string
        type: string
        summary: string
        created_at: string
        customers?: { full_name: string } | null
    }>
}

function formatCurrency(amount: number) {
    if (!amount) return '₺0'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} saat önce`
    const days = Math.floor(hours / 24)
    return `${days} gün önce`
}

const ACTIVITY_ICONS: Record<string, any> = {
    Call: Phone,
    Meeting: Calendar,
    Email: Mail,
    Note: MessageSquare,
    Task: FileText,
}

export function BrokerDashboardWidget({
    portfolioStats,
    leadStats,
    revenueStats,
    topAgents,
    pipelineStats,
    recentActivities,
}: BrokerDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                            </div>
                            {portfolioStats.expiringCount > 0 && (
                                <Badge className="bg-red-100 text-red-600 border-red-200 text-[10px] font-bold animate-pulse">
                                    {portfolioStats.expiringCount} yetki bitiyor
                                </Badge>
                            )}
                        </div>
                        <p className="text-2xl font-black text-slate-900">{portfolioStats.active}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Aktif Portföy</p>
                        <div className="flex gap-2 mt-2 text-[10px]">
                            <span className="text-rose-500 font-bold">{portfolioStats.sold} satıldı</span>
                            <span className="text-cyan-500 font-bold">{portfolioStats.rented} kirada</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn("border shadow-sm hover:shadow-md transition-shadow", leadStats.unassigned > 0 && "border-red-200")}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", leadStats.unassigned > 0 ? "bg-red-50" : "bg-blue-50")}>
                                {leadStats.unassigned > 0
                                    ? <AlertTriangle className="h-5 w-5 text-red-500" />
                                    : <Target className="h-5 w-5 text-blue-600" />
                                }
                            </div>
                        </div>
                        <p className={cn("text-2xl font-black", leadStats.unassigned > 0 ? "text-red-600" : "text-blue-600")}>{leadStats.unassigned}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Atanmamış Talep</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Bugün {leadStats.totalToday} yeni talep</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-violet-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-violet-600">{formatCurrency(revenueStats.monthlyGCI)}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Bu Ay GCI</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Toplam: {formatCurrency(revenueStats.totalGCI)}</p>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-amber-600">{formatCurrency(revenueStats.pendingPayments)}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Bekleyen Ödeme</p>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Pipeline Funnel */}
            {pipelineStats && (
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-500" />
                            Satış Pipeline
                        </CardTitle>
                        <Link href="/crm" className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1">
                            CRM'e Git <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Yeni Talep', count: pipelineStats.lead, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
                                { label: 'İletişim', count: pipelineStats.prospect, color: 'bg-cyan-500', bgColor: 'bg-cyan-50' },
                                { label: 'Gösterim', count: pipelineStats.showing, color: 'bg-violet-500', bgColor: 'bg-violet-50' },
                                { label: 'Teklif', count: pipelineStats.proposal, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
                                { label: 'Pazarlık', count: pipelineStats.negotiation, color: 'bg-orange-500', bgColor: 'bg-orange-50' },
                                { label: 'Sözleşme / Kapandı', count: pipelineStats.contract, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
                            ].map((stage) => {
                                const maxCount = Math.max(pipelineStats.lead, pipelineStats.prospect, pipelineStats.showing, pipelineStats.proposal, pipelineStats.negotiation, pipelineStats.contract, 1)
                                const pct = Math.round((stage.count / maxCount) * 100)
                                return (
                                    <div key={stage.label} className="flex items-center gap-3">
                                        <div className="w-28 flex-shrink-0">
                                            <span className="text-[11px] font-medium text-slate-600">{stage.label}</span>
                                        </div>
                                        <div className={cn("flex-1 h-7 rounded-lg overflow-hidden", stage.bgColor)}>
                                            <div
                                                className={cn("h-full rounded-lg flex items-center pl-2 transition-all duration-500", stage.color)}
                                                style={{ width: `${Math.max(pct, stage.count > 0 ? 8 : 0)}%` }}
                                            >
                                                {stage.count > 0 && (
                                                    <span className="text-[10px] text-white font-bold">{stage.count}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-8 text-right">
                                            <span className="text-xs font-mono font-bold text-slate-500">{stage.count}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs">
                            <span className="text-muted-foreground">Toplam Aktif: <strong className="text-slate-900">{pipelineStats.totalActive}</strong></span>
                            <span className="text-red-500 font-medium">Kayıp: {pipelineStats.lost}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Row 3: Quick Actions + Top Agents + Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick Actions */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold">Hızlı Erişim</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2.5">
                        {[
                            { label: 'Yeni Portföy', href: '/portfolios', icon: MapPin, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                            { label: 'İşlem Yönetimi', href: '/crm', icon: Target, color: 'bg-blue-50 text-blue-600 border-blue-200' },
                            { label: 'Hak Edişler', href: '/agent-transactions', icon: TrendingUp, color: 'bg-violet-50 text-violet-600 border-violet-200' },
                            { label: 'Sıralama', href: '/leaderboard', icon: Medal, color: 'bg-amber-50 text-amber-600 border-amber-200' },
                        ].map((action) => (
                            <Link key={action.href} href={action.href}>
                                <div className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm cursor-pointer", action.color)}>
                                    <action.icon className="h-5 w-5" />
                                    <span className="text-xs font-bold">{action.label}</span>
                                    <ArrowRight className="h-3 w-3 ml-auto opacity-50" />
                                </div>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                {/* Top 3 Agents */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            Bu Ayın Yıldızları
                        </CardTitle>
                        <Link href="/leaderboard" className="text-[10px] text-blue-600 hover:underline font-bold">
                            Tümünü Gör →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {topAgents.length > 0 ? (
                            <div className="space-y-2.5">
                                {topAgents.slice(0, 3).map((agent, index) => (
                                    <div key={index} className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border",
                                        index === 0 ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200" :
                                        "bg-slate-50 border-slate-200"
                                    )}>
                                        <div className="w-6 flex justify-center">
                                            {index === 0 ? <span className="text-lg">🥇</span> :
                                             index === 1 ? <span className="text-lg">🥈</span> :
                                             <span className="text-lg">🥉</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{agent.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{agent.deals} işlem</p>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600">{formatCurrency(agent.earnings)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-xs">Henüz işlem kaydı yok</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            Son Aktiviteler
                        </CardTitle>
                        <Link href="/activities" className="text-[10px] text-blue-600 hover:underline font-bold">
                            Tümünü Gör →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentActivities && recentActivities.length > 0 ? (
                            <div className="space-y-2.5">
                                {recentActivities.map((activity) => {
                                    const ActivityIcon = ACTIVITY_ICONS[activity.type] || MessageSquare
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <ActivityIcon className="h-3.5 w-3.5 text-slate-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">{activity.summary}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {(activity as any).customers?.full_name && (
                                                        <span className="text-[10px] text-blue-600 font-medium">{(activity as any).customers.full_name}</span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">{timeAgo(activity.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground">
                                <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-xs">Henüz aktivite yok</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
