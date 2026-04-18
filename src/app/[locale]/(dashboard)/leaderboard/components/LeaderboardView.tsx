'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    Trophy, Medal, Crown, TrendingUp, MapPin, Users,
    Flame, Star, Award, ChevronDown
} from 'lucide-react'

interface LeaderboardViewProps {
    agents: any[]
    transactions: any[]
    portfolios: any[]
}

function formatCurrency(amount: number, currency: string = 'TRY') {
    if (!amount) return '₺0'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function LeaderboardView({ agents, transactions, portfolios }: LeaderboardViewProps) {
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month')

    // Filter transactions by period
    const now = new Date()
    const filteredTransactions = transactions.filter(t => {
        if (period === 'all') return true
        const d = new Date(t.transaction_date)
        if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        if (period === 'quarter') {
            const q = Math.floor(now.getMonth() / 3)
            const tq = Math.floor(d.getMonth() / 3)
            return q === tq && d.getFullYear() === now.getFullYear()
        }
        if (period === 'year') return d.getFullYear() === now.getFullYear()
        return true
    })

    // Calculate agent stats
    const agentStats = agents.map(agent => {
        // Transactions where this agent is listing or buyer agent
        const myTransactions = filteredTransactions.filter(
            t => t.listing_agent_id === agent.id || t.buyer_agent_id === agent.id
        )

        const totalEarned = myTransactions.reduce((sum, t) => {
            if (t.listing_agent_id === agent.id) sum += (t.listing_agent_share || 0)
            if (t.buyer_agent_id === agent.id) sum += (t.buyer_agent_share || 0)
            return sum
        }, 0)

        const totalVolume = myTransactions.reduce((sum, t) => sum + (t.sale_price || 0), 0)
        const dealCount = myTransactions.length

        // Portfolio count
        const myPortfolios = portfolios.filter(p => p.agent_id === agent.id)
        const activePortfolios = myPortfolios.filter(p => p.status === 'active').length
        const soldPortfolios = myPortfolios.filter(p => p.status === 'sold').length

        return {
            ...agent,
            totalEarned,
            totalVolume,
            dealCount,
            activePortfolios,
            soldPortfolios,
            totalPortfolios: myPortfolios.length,
        }
    })

    // Sort by earnings
    const byEarnings = [...agentStats].sort((a, b) => b.totalEarned - a.totalEarned)
    const byVolume = [...agentStats].sort((a, b) => b.totalVolume - a.totalVolume)
    const byDeals = [...agentStats].sort((a, b) => b.dealCount - a.dealCount)
    const byPortfolios = [...agentStats].sort((a, b) => b.totalPortfolios - a.totalPortfolios)

    const PERIOD_LABELS: Record<string, string> = {
        month: 'Bu Ay',
        quarter: 'Bu Çeyrek',
        year: 'Bu Yıl',
        all: 'Tüm Zamanlar'
    }

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />
        if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />
        if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />
        return <span className="text-xs font-black text-slate-400 w-5 text-center">{index + 1}</span>
    }

    const getRankBg = (index: number) => {
        if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
        if (index === 1) return 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
        if (index === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
        return 'border-slate-100'
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
    }

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600',
            'bg-cyan-600', 'bg-amber-600', 'bg-indigo-600', 'bg-pink-600'
        ]
        const idx = (name || '').charCodeAt(0) % colors.length
        return colors[idx]
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
                {(['month', 'quarter', 'year', 'all'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                            period === p
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-white text-slate-500 border hover:bg-slate-50"
                        )}
                    >
                        {PERIOD_LABELS[p]}
                    </button>
                ))}
            </div>

            {/* Top 3 Podium */}
            {byEarnings.length >= 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {byEarnings.slice(0, 3).map((agent, index) => (
                        <Card key={agent.id} className={cn(
                            "border-2 shadow-sm transition-all hover:shadow-md overflow-hidden",
                            index === 0 ? "border-yellow-300 md:order-2 md:-mt-2" : index === 1 ? "border-slate-300 md:order-1" : "border-amber-300 md:order-3"
                        )}>
                            <div className={cn(
                                "px-4 py-3 flex items-center gap-3",
                                index === 0 ? "bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50" :
                                index === 1 ? "bg-gradient-to-r from-slate-50 to-slate-100" :
                                "bg-gradient-to-r from-orange-50 to-amber-50"
                            )}>
                                {getRankIcon(index)}
                                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-black", getAvatarColor(agent.full_name))}>
                                    {getInitials(agent.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm truncate">{agent.full_name}</h3>
                                    <p className="text-[10px] text-muted-foreground">{agent.dealCount} işlem</p>
                                </div>
                                {index === 0 && <Flame className="h-5 w-5 text-orange-500 animate-pulse" />}
                            </div>
                            <CardContent className="p-4">
                                <div className="text-center mb-3">
                                    <p className={cn(
                                        "text-2xl font-black",
                                        index === 0 ? "text-yellow-600" : index === 1 ? "text-slate-600" : "text-amber-700"
                                    )}>
                                        {formatCurrency(agent.totalEarned)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Toplam Kazanç</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-900">{agent.dealCount}</p>
                                        <p className="text-[9px] text-muted-foreground">İşlem</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-900">{agent.activePortfolios}</p>
                                        <p className="text-[9px] text-muted-foreground">Portföy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-blue-600">{formatCurrency(agent.totalVolume)}</p>
                                        <p className="text-[9px] text-muted-foreground">Hacim</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Full Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Earnings */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-emerald-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            En Çok Kazanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {byEarnings.map((agent, index) => (
                                <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50", getRankBg(index))}>
                                    <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0", getAvatarColor(agent.full_name))}>
                                        {getInitials(agent.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-bold truncate block">{agent.full_name}</span>
                                    </div>
                                    <span className="text-xs font-black text-emerald-600">{formatCurrency(agent.totalEarned)}</span>
                                </div>
                            ))}
                            {byEarnings.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-xs">Henüz veri yok</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* By Deal Count */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-blue-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            En Çok İşlem Kapatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {byDeals.map((agent, index) => (
                                <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50", getRankBg(index))}>
                                    <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0", getAvatarColor(agent.full_name))}>
                                        {getInitials(agent.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-bold truncate block">{agent.full_name}</span>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-black">{agent.dealCount} işlem</Badge>
                                </div>
                            ))}
                            {byDeals.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-xs">Henüz veri yok</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* By Volume */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-violet-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Star className="h-4 w-4 text-violet-600" />
                            En Yüksek Satış Hacmi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {byVolume.map((agent, index) => (
                                <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50", getRankBg(index))}>
                                    <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0", getAvatarColor(agent.full_name))}>
                                        {getInitials(agent.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-bold truncate block">{agent.full_name}</span>
                                    </div>
                                    <span className="text-xs font-black text-violet-600">{formatCurrency(agent.totalVolume)}</span>
                                </div>
                            ))}
                            {byVolume.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-xs">Henüz veri yok</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* By Portfolio Count */}
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-amber-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-amber-600" />
                            En Çok Portföy Alan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {byPortfolios.map((agent, index) => (
                                <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50", getRankBg(index))}>
                                    <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0", getAvatarColor(agent.full_name))}>
                                        {getInitials(agent.full_name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-bold truncate block">{agent.full_name}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">{agent.activePortfolios} aktif</Badge>
                                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">{agent.soldPortfolios} satıldı</Badge>
                                    </div>
                                </div>
                            ))}
                            {byPortfolios.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-xs">Henüz veri yok</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
