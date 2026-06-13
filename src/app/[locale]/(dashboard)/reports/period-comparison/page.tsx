'use client'

import React, { useState, useEffect } from 'react'
import { getPeriodComparison } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, LineChart, Line
} from 'recharts'

export default function PeriodComparisonPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getPeriodComparison().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-cyan-600 animate-spin" /></div>

    const { comparison, sixMonthTrend } = data

    const MetricCard = ({ title, icon: Icon, iconColor, thisMonth, lastMonth, change, format: fmt }: any) => (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${iconColor}`} /><span className="text-sm font-bold text-slate-500">{title}</span></div>
                    <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${change > 0 ? 'bg-emerald-50 text-emerald-600' : change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : change < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                        {change > 0 ? '+' : ''}{change}%
                    </div>
                </div>
                <div className="flex items-end gap-4">
                    <div>
                        <div className="text-3xl font-black text-slate-900">{fmt ? fmt(thisMonth) : thisMonth}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bu Ay</div>
                    </div>
                    <div className="pb-1">
                        <div className="text-xl font-bold text-slate-400">{fmt ? fmt(lastMonth) : lastMonth}</div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Geçen Ay</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const formatRevenue = (v: number) => v > 0 ? `${(v / 1000000).toFixed(1)}M` : '0'

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-8 w-8 text-cyan-600" />
                        Dönemsel Karşılaştırma
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Bu ay vs geçen ay performans analizi ve 6 aylık trend.</p>
                </div>
            </div>

            {/* Month-over-Month Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Satış Adedi" icon={TrendingUp} iconColor="text-emerald-500" thisMonth={comparison.sales.thisMonth} lastMonth={comparison.sales.lastMonth} change={comparison.sales.change} />
                <MetricCard title="Ciro" icon={DollarSign} iconColor="text-amber-500" thisMonth={comparison.revenue.thisMonth} lastMonth={comparison.revenue.lastMonth} change={comparison.revenue.change} format={formatRevenue} />
                <MetricCard title="Yeni Lead" icon={Users} iconColor="text-blue-500" thisMonth={comparison.leads.thisMonth} lastMonth={comparison.leads.lastMonth} change={comparison.leads.change} />
                <MetricCard title="Aktivite" icon={Activity} iconColor="text-purple-500" thisMonth={comparison.activities.thisMonth} lastMonth={comparison.activities.lastMonth} change={comparison.activities.change} />
            </div>

            {/* 6-Month Charts */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-bold">6 Aylık Satış & Lead Trendi</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sixMonthTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="sales" name="Satış" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="leads" name="Yeni Lead" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-bold">6 Aylık Ciro Trendi (Milyon ₺)</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={sixMonthTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" name="Ciro (M₺)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-base font-bold">6 Aylık Aktivite Trendi</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={sixMonthTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="activities" name="Aktivite" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
