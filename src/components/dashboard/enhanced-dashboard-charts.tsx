'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend, CartesianGrid, Area, AreaChart, ComposedChart, Line } from 'recharts'
import { SalesFunnel } from './sales-funnel'
import { ProjectOccupancy } from './project-occupancy'
import { SalesLeaderboard } from './sales-leaderboard'
import { useTranslations } from 'next-intl'
import { TrendingUp, TrendingDown, Target, Users, BarChart3, Funnel } from 'lucide-react'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface EnhancedDashboardChartsProps {
    monthlySales: any[]
    opportunityDist: any[]
    funnelData: any[]
    projectOccupancy: any[]
    leaderboard: any[]
    monthlyComparison: {
        thisMonth: number
        lastMonth: number
        thisMonthCount: number
        lastMonthCount: number
    }
}

export function EnhancedDashboardCharts({
    monthlySales,
    opportunityDist,
    funnelData,
    projectOccupancy,
    leaderboard,
    monthlyComparison
}: EnhancedDashboardChartsProps) {
    const t = useTranslations('Dashboard')

    const monthGrowth = monthlyComparison.lastMonth > 0
        ? (((monthlyComparison.thisMonth - monthlyComparison.lastMonth) / monthlyComparison.lastMonth) * 100).toFixed(1)
        : monthlyComparison.thisMonth > 0 ? '100' : '0'
    const isGrowthPositive = Number(monthGrowth) >= 0

    const countGrowth = monthlyComparison.lastMonthCount > 0
        ? (((monthlyComparison.thisMonthCount - monthlyComparison.lastMonthCount) / monthlyComparison.lastMonthCount) * 100).toFixed(1)
        : monthlyComparison.thisMonthCount > 0 ? '100' : '0'
    const isCountGrowthPositive = Number(countGrowth) >= 0

    return (
        <div className="space-y-6">
            {/* Row 1: Monthly Comparison Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Bu Ay Satış Hacmi</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    {monthlyComparison.thisMonth.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </p>
                                <div className={`flex items-center gap-1 mt-1 ${isGrowthPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isGrowthPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    <span className="text-xs font-bold">%{monthGrowth}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">geçen aya göre</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Target className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Bu Ay Satış Adedi</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">
                                    {monthlyComparison.thisMonthCount} adet
                                </p>
                                <div className={`flex items-center gap-1 mt-1 ${isCountGrowthPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isCountGrowthPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    <span className="text-xs font-bold">%{countGrowth}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">geçen aya göre</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Sales Chart + Funnel */}
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">{t('charts.monthlySales')}</CardTitle>
                        <CardDescription className="text-xs">Aylık satış hacmi ve adet karşılaştırması</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={monthlySales}>
                                    <defs>
                                        <linearGradient id="barGradientNew" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                                            <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                                        </linearGradient>
                                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                                            if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                                            return `${value}`
                                        }}
                                    />
                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(8px)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 20px -1px rgb(0 0 0 / 0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="total"
                                        fill="url(#barGradientNew)"
                                        radius={[6, 6, 0, 0]}
                                        barSize={32}
                                        name="Hacim (₺)"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10b981"
                                        strokeWidth={2.5}
                                        dot={{ fill: '#10b981', r: 3 }}
                                        name="Adet"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Satış Hunisi</CardTitle>
                        <CardDescription className="text-xs">Pipeline aşamalarına göre fırsat dağılımı</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SalesFunnel data={funnelData} />
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Project Occupancy + Opportunity Distribution */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Proje Doluluk Oranları</CardTitle>
                        <CardDescription className="text-xs">Projelere göre ünite satış durumu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProjectOccupancy data={projectOccupancy} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">{t('charts.opportunityDistribution')}</CardTitle>
                        <CardDescription className="text-xs">Satış durumlarına göre dağılım</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={opportunityDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        nameKey="name"
                                        strokeWidth={0}
                                    >
                                        {opportunityDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(8px)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 20px -1px rgb(0 0 0 / 0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span className="text-xs font-medium text-slate-600">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Leaderboard */}
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-amber-500" />
                                Satış Ekibi Sıralaması
                            </CardTitle>
                            <CardDescription className="text-xs">Toplam satış hacmine göre sıralama</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <SalesLeaderboard data={leaderboard} />
                </CardContent>
            </Card>
        </div>
    )
}
