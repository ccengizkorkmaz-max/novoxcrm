'use client'

import React, { useState, useEffect } from 'react'
import { getCrmStatistics } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import {
    RefreshCw, Users, UserPlus, TrendingUp, Clock, Target, ArrowUpRight,
    BarChart3, MapPin, Building2, Megaphone, Filter, Flame, UserCheck
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
    PieChart, Pie, AreaChart, Area, Legend
} from 'recharts'

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb', '#7c3aed'
]

const LEAD_STATUS_COLORS: Record<string, string> = {
    'Yeni': '#3b82f6',
    'İletişime Geçildi': '#f59e0b',
    'Nitelikli': '#8b5cf6',
    'Dönüştürüldü': '#10b981',
    'Kaybedildi': '#ef4444'
}

const LEAD_SCORE_COLORS: Record<string, string> = {
    '🔥 Sıcak (Hot)': '#ef4444',
    '🌤️ Ilık (Warm)': '#f59e0b',
    '❄️ Soğuk (Cold)': '#3b82f6',
    '🚫 Elendi': '#6b7280'
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

function MiniPieChart({ data, colors }: { data: any[], colors?: Record<string, string> }) {
    if (!data || data.length === 0) return <p className="text-sm text-slate-400 italic p-4">Veri bulunamadı</p>
    return (
        <div className="flex items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name">
                        {data.map((entry, i) => (
                            <Cell key={i} fill={colors?.[entry.name] || COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} Adet`, '']} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 min-w-0">
                {data.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors?.[item.name] || COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600 truncate">{item.name}</span>
                        <span className="ml-auto font-bold text-slate-800 shrink-0">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function HorizontalBarList({ data, colorField }: { data: any[], colorField?: Record<string, string> }) {
    if (!data || data.length === 0) return <p className="text-sm text-slate-400 italic p-4">Veri bulunamadı</p>
    const maxVal = Math.max(...data.map(d => d.value), 1)
    return (
        <div className="space-y-2">
            {data.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-28 truncate text-right shrink-0" title={item.name}>{item.name}</span>
                    <div className="flex-1 relative h-7">
                        <div
                            className="h-full rounded-md flex items-center px-2 transition-all"
                            style={{
                                width: `${Math.max((item.value / maxVal) * 100, 5)}%`,
                                backgroundColor: colorField?.[item.name] || COLORS[i % COLORS.length],
                                minWidth: '32px'
                            }}
                        >
                            <span className="text-white text-xs font-bold">{item.value}</span>
                        </div>
                    </div>
                </div>
            ))}
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

    const { kpis, demographics, sources, projectLeadDist, leadStats, monthlyTrend, utm } = data

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
                        <p className="text-slate-500 mt-1 text-sm font-medium">Tüm müşteri ve lead verilerinizin kapsamlı demografik ve istatistiksel analizi.</p>
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
                <KpiCard icon={Users} label="Toplam Müşteri" value={kpis.totalCustomers} color="text-indigo-600" bgColor="bg-indigo-100" />
                <KpiCard icon={Target} label="Toplam Lead" value={kpis.totalLeads} color="text-purple-600" bgColor="bg-purple-100" />
                <KpiCard icon={TrendingUp} label="Dönüşüm Oranı" value={`%${kpis.conversionRate}`} sub={`${kpis.convertedLeads} dönüştürüldü`} color="text-emerald-600" bgColor="bg-emerald-100" />
                <KpiCard icon={UserPlus} label="Bu Ay Müşteri" value={kpis.newCustomersThisMonth} sub="Son 30 gün" color="text-blue-600" bgColor="bg-blue-100" />
                <KpiCard icon={Flame} label="Bu Ay Lead" value={kpis.newLeadsThisMonth} sub="Son 30 gün" color="text-rose-600" bgColor="bg-rose-100" />
                <KpiCard icon={Clock} label="Ort. Dönüşüm" value={`${kpis.avgConversionDays} gün`} sub="Lead → Müşteri" color="text-amber-600" bgColor="bg-amber-100" />
                <KpiCard icon={ArrowUpRight} label="Dönüştürülen" value={kpis.convertedLeads} color="text-teal-600" bgColor="bg-teal-100" />
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 2. MÜŞTERİ DEMOGRAFİK ANALİZİ */}
            {/* ══════════════════════════════════════════ */}
            <div>
                <SectionTitle icon={Users} title="Müşteri Demografik Analizi" description="Cinsiyet, şehir, ilçe ve müşteri tipi dağılımları" color="bg-indigo-600" />
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Cinsiyet Dağılımı</CardTitle></CardHeader>
                        <CardContent><MiniPieChart data={demographics.genderDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Müşteri Tipi</CardTitle></CardHeader>
                        <CardContent><MiniPieChart data={demographics.customerTypeDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Şehir (Top 15)</CardTitle></CardHeader>
                        <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={demographics.cityDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">İlçe (Top 15)</CardTitle></CardHeader>
                        <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={demographics.districtDist} /></CardContent>
                    </Card>
                </div>
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 3. KAYNAK ANALİZİ */}
            {/* ══════════════════════════════════════════ */}
            <div>
                <SectionTitle icon={Megaphone} title="Kaynak Analizi" description="Müşterilerin ve lead'lerin nereden geldiği" color="bg-pink-600" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Müşteri Kaynağı</CardTitle></CardHeader>
                        <CardContent className="max-h-80 overflow-y-auto"><HorizontalBarList data={sources.customerSourceDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Lead Kaynağı</CardTitle></CardHeader>
                        <CardContent className="max-h-80 overflow-y-auto"><HorizontalBarList data={sources.leadSourceDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Nereden Duydunuz?</CardTitle></CardHeader>
                        <CardContent><MiniPieChart data={sources.heardFromDist} /></CardContent>
                    </Card>
                </div>
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 4. PROJE BAZLI LEAD İSTATİSTİKLERİ */}
            {/* ══════════════════════════════════════════ */}
            {projectLeadDist && projectLeadDist.length > 0 && (
                <div>
                    <SectionTitle icon={Building2} title="Proje Bazlı Lead Dağılımı" description="Her projeye ait lead sayıları ve durum breakdown'ları" color="bg-emerald-600" />
                    <Card className="rounded-2xl shadow-md">
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={Math.max(projectLeadDist.length * 50, 200)}>
                                <BarChart data={projectLeadDist} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                                    <Tooltip />
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
            {/* 5. LEAD İSTATİSTİKLERİ */}
            {/* ══════════════════════════════════════════ */}
            <div>
                <SectionTitle icon={Filter} title="Lead İstatistikleri" description="Durum, sıcaklık skoru, alt durum ve temsilci bazlı dağılımlar" color="bg-purple-600" />
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Durum Dağılımı</CardTitle></CardHeader>
                        <CardContent><MiniPieChart data={leadStats.leadStatusDist} colors={LEAD_STATUS_COLORS} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Sıcaklık Skoru</CardTitle></CardHeader>
                        <CardContent><MiniPieChart data={leadStats.leadScoreDist} colors={LEAD_SCORE_COLORS} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Alt Durum</CardTitle></CardHeader>
                        <CardContent><HorizontalBarList data={leadStats.leadSubStatusDist} /></CardContent>
                    </Card>
                    <Card className="rounded-2xl shadow-md">
                        <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">Temsilci Dağılımı</CardTitle></CardHeader>
                        <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={leadStats.repLeadDist} /></CardContent>
                    </Card>
                </div>
            </div>

            {/* ══════════════════════════════════════════ */}
            {/* 6. ZAMAN BAZLI TRENDLER */}
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
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
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
            {/* 7. UTM / REKLAM ANALİZİ */}
            {/* ══════════════════════════════════════════ */}
            {(utm.utmSourceDist.length > 0 || utm.utmCampaignDist.length > 0) && (
                <div>
                    <SectionTitle icon={Target} title="Reklam (UTM) Analizi" description="Reklam kaynağı, kampanya ve medium bazlı lead dağılımları" color="bg-amber-600" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="rounded-2xl shadow-md">
                            <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Kaynak</CardTitle></CardHeader>
                            <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={utm.utmSourceDist} /></CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-md">
                            <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Kampanya</CardTitle></CardHeader>
                            <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={utm.utmCampaignDist} /></CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-md">
                            <CardHeader className="pb-1"><CardTitle className="text-sm font-bold text-slate-700">UTM Medium</CardTitle></CardHeader>
                            <CardContent className="max-h-72 overflow-y-auto"><HorizontalBarList data={utm.utmMediumDist} /></CardContent>
                        </Card>
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
