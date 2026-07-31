'use client'

import React, { useState, useEffect } from 'react'
import { getCrmStatistics } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import {
    RefreshCw, Users, UserPlus, TrendingUp, Clock, Target, ArrowUpRight,
    BarChart3, Building2, Flame
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    AreaChart, Area, Legend
} from 'recharts'

/** Türk rakam formatı: 1.234, 12.345 */
function fmtNum(n: number | string): string {
    const num = typeof n === 'string' ? parseInt(n, 10) : n
    if (isNaN(num)) return '0'
    return num.toLocaleString('tr-TR')
}

function KpiCard({ icon: Icon, label, value, sub, color, bgColor }: {
    icon: any, label: string, value: string | number, sub?: string, color: string, bgColor: string
}) {
    return (
        <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow border-0 overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
                        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
                    </div>
                    <div className={`p-3 rounded-xl ${bgColor}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SectionTitle({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
    )
}

export default function CrmStatisticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const loadData = () => {
        setLoading(true)
        getCrmStatistics()
            .then(r => { setData(r); setLoading(false) })
            .catch(() => setLoading(false))
    }

    useEffect(() => { loadData() }, [])

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-3">
                    <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 font-medium">İstatistikler yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (data.error) {
        return <div className="text-center text-red-500 mt-12">Hata: {data.error}</div>
    }

    const { kpis, projectLeadDist, monthlyTrend, utm } = data

    return (
        <div className="flex flex-col gap-8 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-indigo-600" />
                            CRM Müşteri & Lead İstatistikleri
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Tüm müşteri ve lead verilerinizin kapsamlı istatistiksel analizi.</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" /> Yenile
                </button>
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 1. KPI KARTLARI */}
            {/* ══════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <KpiCard icon={Users} label="Toplam Müşteri" value={fmtNum(kpis.totalCustomers)} color="text-indigo-600" bgColor="bg-indigo-100" />
                <KpiCard icon={Target} label="Toplam Lead" value={fmtNum(kpis.totalLeads)} color="text-purple-600" bgColor="bg-purple-100" />
                <KpiCard icon={TrendingUp} label="Dönüşüm Oranı" value={`%${kpis.conversionRate}`} sub={`${fmtNum(kpis.convertedLeads)} dönüştürüldü`} color="text-emerald-600" bgColor="bg-emerald-100" />
                <KpiCard icon={UserPlus} label="Bu Ay Müşteri" value={fmtNum(kpis.newCustomersThisMonth)} sub="Son 30 gün" color="text-blue-600" bgColor="bg-blue-100" />
                <KpiCard icon={Flame} label="Bu Ay Lead" value={fmtNum(kpis.newLeadsThisMonth)} sub="Son 30 gün" color="text-rose-600" bgColor="bg-rose-100" />
                <KpiCard icon={Clock} label="Ort. Dönüşüm" value={`${fmtNum(kpis.avgConversionDays)} gün`} sub="Lead → Müşteri" color="text-amber-600" bgColor="bg-amber-100" />
                <KpiCard icon={ArrowUpRight} label="Dönüştürülen" value={fmtNum(kpis.convertedLeads)} color="text-teal-600" bgColor="bg-teal-100" />
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 2. PROJE BAZLI LEAD İSTATİSTİKLERİ */}
            {/* ══════════════════════════════════════════ */}
            {projectLeadDist && projectLeadDist.length > 0 && (
                <div>
                    <SectionTitle icon={Building2} title="Proje Bazlı Lead Dağılımı" description="Her projeye ait lead sayıları ve durum breakdown'ları" color="bg-emerald-600" />
                    <Card className="rounded-2xl shadow-md">
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={Math.max(projectLeadDist.length * 50, 200)}>
                                <BarChart data={projectLeadDist} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtNum(v)} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: any) => [fmtNum(value), '']} />
                                    <Legend />
                                    <Bar dataKey="new" name="Yeni" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="contacted" name="İletişim" stackId="a" fill="#f59e0b" />
                                    <Bar dataKey="qualified" name="Nitelikli" stackId="a" fill="#8b5cf6" />
                                    <Bar dataKey="converted" name="Dönüşüm" stackId="a" fill="#10b981" />
                                    <Bar dataKey="lost" name="Kayıp" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ══════════════════════════════════════════ */}
            {/* 3. ZAMAN BAZLI TRENDLER */}
            {/* ══════════════════════════════════════════ */}
            <div>
                <SectionTitle icon={TrendingUp} title="Aylık Trendler (Son 12 Ay)" description="Müşteri, lead ve dönüşüm sayılarının aylık değişimi" color="bg-blue-600" />
                <Card className="rounded-2xl shadow-md">
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtNum(v)} />
                                <Tooltip formatter={(value: any) => [fmtNum(value), '']} />
                                <Legend />
                                <Area type="monotone" dataKey="customers" name="Müşteri" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
                                <Area type="monotone" dataKey="leads" name="Lead" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                                <Area type="monotone" dataKey="converted" name="Dönüşüm" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorConverted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 4. UTM / REKLAM ANALİZİ */}
            {/* ══════════════════════════════════════════ */}
            {(utm.utmSourceDist.length > 0 || utm.utmCampaignDist.length > 0) && (
                <div>
                    <SectionTitle icon={Target} title="Reklam (UTM) Analizi" description="Reklam kaynağı, kampanya ve medium bazlı lead dağılımları" color="bg-amber-600" />
                    <div className="grid md:grid-cols-3 gap-6">
                        {utm.utmSourceDist.length > 0 && (
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Kaynak</CardTitle></CardHeader>
                                <CardContent className="max-h-72 overflow-y-auto">
                                    <div className="space-y-2">
                                        {utm.utmSourceDist.map((item: any, i: number) => (
                                            <div key={item.name} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1">
                                                <span className="text-slate-600 truncate">{item.name}</span>
                                                <span className="font-bold text-slate-800">{fmtNum(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {utm.utmCampaignDist.length > 0 && (
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Kampanya</CardTitle></CardHeader>
                                <CardContent className="max-h-72 overflow-y-auto">
                                    <div className="space-y-2">
                                        {utm.utmCampaignDist.map((item: any, i: number) => (
                                            <div key={item.name} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1">
                                                <span className="text-slate-600 truncate">{item.name}</span>
                                                <span className="font-bold text-slate-800">{fmtNum(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {utm.utmMediumDist.length > 0 && (
                            <Card className="rounded-2xl shadow-md">
                                <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Medium</CardTitle></CardHeader>
                                <CardContent className="max-h-72 overflow-y-auto">
                                    <div className="space-y-2">
                                        {utm.utmMediumDist.map((item: any, i: number) => (
                                            <div key={item.name} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1">
                                                <span className="text-slate-600 truncate">{item.name}</span>
                                                <span className="font-bold text-slate-800">{fmtNum(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <div className="rounded-xl border bg-muted/30 p-6 text-center">
                <p className="text-xs text-muted-foreground italic">
                    Bu rapor, CRM veritabanındaki tüm müşteri ve lead kayıtlarını analiz etmektedir. Veriler gerçek zamanlı olarak güncellenmektedir.
                </p>
            </div>
        </div>
    )
}
