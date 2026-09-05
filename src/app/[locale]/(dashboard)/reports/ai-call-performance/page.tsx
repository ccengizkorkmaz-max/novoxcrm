'use client'

import React, { useState, useEffect } from 'react'
import { getAICallPerformance } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { BackButton } from "@/components/back-button"
import { 
    Phone, PhoneOff, PhoneMissed, Clock, TrendingUp, 
    RefreshCw, Download, BarChart3, Play, Flame, Thermometer,
    ArrowUpRight, Timer
} from 'lucide-react'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'
import { getVapiRecordingUrl, formatTurkeyDateTime } from '@/lib/utils'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f97316', '#6366f1', '#3b82f6']

export default function AICallPerformancePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const loadData = async (isRefresh = false) => {
        if (isRefresh) toast.loading('Yenileniyor...')
        else setLoading(true)
        try {
            const result = await getAICallPerformance()
            setData(result)
            if (isRefresh) toast.success('Rapor güncellendi!')
        } catch (e) {
            toast.error('Veriler yüklenemedi!')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    const handleExport = () => {
        if (!data.recentCalls?.length) return toast.error('Dışa aktarılacak veri yok!')
        const exportData = data.recentCalls.map((c: any) => ({
            'Müşteri': c.customerName,
            'Telefon': c.phone,
            'Sonuç': c.outcome,
            'Süre (sn)': c.duration || '-',
            'Lead Skor': c.leadScore || '-',
            'Özet': c.summary || '-',
            'Tarih': formatTurkeyDateTime(c.executedAt, 'dateTime')
        }))
        exportToExcel(exportData, `ai_arama_performans_${new Date().toISOString().slice(0, 10)}`)
        toast.success('Excel indirildi!')
    }

    const { kpis, outcomeDistribution, dailyTrend, hourlyPerformance, leadScoreDistribution, recentCalls } = data

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Phone className="h-8 w-8 text-blue-600" />
                            AI Arama Performans Raporu
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Yapay zeka aramalarının detaylı performans analizi.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => loadData(true)} className="rounded-xl gap-2">
                        <RefreshCw className="h-4 w-4" /> Yenile
                    </Button>
                    <Button onClick={handleExport} className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4" /> Excel
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardContent className="p-4 flex flex-col items-center">
                        <Phone className="h-5 w-5 text-blue-500 mb-1" />
                        <span className="text-2xl font-black text-slate-900">{kpis.totalCalls}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Arama</span>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardContent className="p-4 flex flex-col items-center">
                        <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
                        <span className="text-2xl font-black text-emerald-600">{kpis.spoke}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konuşulan</span>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardContent className="p-4 flex flex-col items-center">
                        <PhoneMissed className="h-5 w-5 text-red-500 mb-1" />
                        <span className="text-2xl font-black text-red-600">{kpis.noAnswer + kpis.busy}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ulaşılamayan</span>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardContent className="p-4 flex flex-col items-center">
                        <Timer className="h-5 w-5 text-indigo-500 mb-1" />
                        <span className="text-2xl font-black text-indigo-600">{kpis.avgDuration}s</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ort. Süre</span>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-slate-100 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white col-span-2 md:col-span-1">
                    <CardContent className="p-4 flex flex-col items-center">
                        <ArrowUpRight className="h-5 w-5 text-emerald-400 mb-1" />
                        <span className="text-2xl font-black">%{kpis.successRate}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başarı Oranı</span>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Daily Trend */}
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Günlük Arama Trendi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="spoke" name="Konuşulan" stackId="1" fill="#10b981" stroke="#10b981" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="noAnswer" name="Cevapsız" stackId="1" fill="#ef4444" stroke="#ef4444" fillOpacity={0.4} />
                                <Area type="monotone" dataKey="busy" name="Meşgul" stackId="1" fill="#f97316" stroke="#f97316" fillOpacity={0.3} />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Outcome Distribution */}
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Sonuç Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={outcomeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                                    {outcomeDistribution.map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Hourly Performance */}
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Saatlik Performans (Konuşulan)</CardTitle>
                        <CardDescription>Hangi saatte en çok konuşma gerçekleşiyor?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={hourlyPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="spoke" name="Konuşulan" fill="#10b981" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="total" name="Toplam" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Lead Score Distribution */}
                <Card className="rounded-2xl border-slate-100 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-bold">Lead Skor Dağılımı</CardTitle>
                        <CardDescription>Konuşulan aramalardaki AI değerlendirme sonuçları</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={leadScoreDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#f97316" />
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#6b7280" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Calls Table */}
            <Card className="rounded-2xl border-slate-100 shadow-xl">
                <CardHeader className="bg-slate-50/50 border-b px-6 py-4">
                    <CardTitle className="text-lg font-bold">Son Aramalar</CardTitle>
                    <CardDescription>Son 50 AI araması detayları</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/30">
                                    <TableHead className="pl-6 font-bold text-xs uppercase text-slate-400">Müşteri</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Sonuç</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Süre</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Lead Skor</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400">Özet</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Tarih</TableHead>
                                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Kayıt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentCalls?.map((call: any) => (
                                    <TableRow key={call.id} className="hover:bg-slate-50/50">
                                        <TableCell className="pl-6">
                                            <div className="font-bold text-sm text-slate-800">{call.customerName}</div>
                                            <div className="text-xs text-slate-400">{call.phone}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {call.outcome === 'spoke' && <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border text-xs">Konuşuldu</Badge>}
                                            {call.outcome === 'no_answer' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-xs">Cevapsız</Badge>}
                                            {call.outcome === 'busy' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-xs">Meşgul</Badge>}
                                            {call.outcome === 'hung_up' && <Badge className="bg-amber-50 text-amber-600 border-amber-200 border text-xs">Açıp Kapattı</Badge>}
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-bold text-slate-600">
                                            {call.duration ? `${call.duration}s` : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {call.leadScore === 'hot' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-xs gap-1"><Flame className="h-3 w-3" />HOT</Badge>}
                                            {call.leadScore === 'warm' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-xs gap-1"><Thermometer className="h-3 w-3" />WARM</Badge>}
                                            {call.leadScore === 'follow_up' && <Badge className="bg-blue-50 text-blue-600 border-blue-200 border text-xs">Takip</Badge>}
                                            {call.leadScore === 'disqualified' && <Badge className="bg-slate-100 text-slate-500 border-slate-200 border text-xs">DQ</Badge>}
                                            {!call.leadScore && <span className="text-slate-300">-</span>}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <p className="text-xs text-slate-600 line-clamp-2">{call.summary || '-'}</p>
                                        </TableCell>
                                        <TableCell className="text-center text-xs text-slate-500 font-bold">
                                            {formatTurkeyDateTime(call.executedAt, 'short')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {call.recordingUrl ? (
                                                <a href={getVapiRecordingUrl(call.recordingUrl, call.externalId)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    <Play className="h-4 w-4" />
                                                </a>
                                            ) : <span className="text-slate-300">-</span>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
