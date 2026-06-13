'use client'

import React, { useState, useEffect } from 'react'
import { getWhatsAppAnalytics } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { BackButton } from "@/components/back-button"
import { MessageSquare, RefreshCw, Download, Bot, Users, BarChart3, Flame, Thermometer, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#6b7280', '#10b981', '#8b5cf6']

export default function WhatsAppAnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const loadData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true)
        try {
            const result = await getWhatsAppAnalytics()
            setData(result)
            if (isRefresh) toast.success('Rapor güncellendi!')
        } catch { toast.error('Veriler yüklenemedi!') }
        finally { setLoading(false) }
    }

    useEffect(() => { loadData() }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-green-600 animate-spin" /></div>

    const { kpis, leadScoreChart, dailyTrend, dowChart, lengthChart, recentConvs } = data

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-green-600" />
                            WhatsApp Konuşma Analizi
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">WhatsApp bot konuşmalarının detaylı analizi ve lead skorlama dağılımı.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => loadData(true)} className="rounded-xl gap-2"><RefreshCw className="h-4 w-4" /> Yenile</Button>
                    <Button onClick={() => {
                        if (!recentConvs?.length) return
                        exportToExcel(recentConvs.map((c: any) => ({ 'Müşteri': c.customerName, 'Telefon': c.phone, 'Lead Skor': c.leadScore, 'Mesaj': c.messageCount, 'Tarih': format(new Date(c.updatedAt), 'dd.MM.yyyy HH:mm', { locale: tr }) })), `whatsapp_analiz_${new Date().toISOString().slice(0, 10)}`)
                        toast.success('Excel indirildi!')
                    }} className="rounded-xl gap-2 bg-green-600 hover:bg-green-700"><Download className="h-4 w-4" /> Excel</Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <MessageSquare className="h-5 w-5 text-green-500 mb-1" />
                    <span className="text-2xl font-black">{kpis.totalConversations}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Konuşma</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <BarChart3 className="h-5 w-5 text-blue-500 mb-1" />
                    <span className="text-2xl font-black">{kpis.avgMsgsPerConv}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ort. Mesaj/Konuşma</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <Bot className="h-5 w-5 text-purple-500 mb-1" />
                    <span className="text-2xl font-black">%{kpis.botResponseRate}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bot Yanıt Oranı</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white"><CardContent className="p-4 flex flex-col items-center">
                    <Users className="h-5 w-5 text-green-400 mb-1" />
                    <span className="text-2xl font-black">{kpis.totalMessages}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Mesaj</span>
                </CardContent></Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Lead Skor Dağılımı</CardTitle></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={280}>
                        <PieChart><Pie data={leadScoreChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {leadScoreChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie><Tooltip /></PieChart>
                    </ResponsiveContainer></CardContent>
                </Card>
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Günlük Konuşma Trendi</CardTitle></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={280}>
                        <BarChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Konuşma" fill="#22c55e" radius={[6, 6, 0, 0]} /></BarChart>
                    </ResponsiveContainer></CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Hafta Günü Dağılımı</CardTitle></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dowChart}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Konuşma" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart>
                    </ResponsiveContainer></CardContent>
                </Card>
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Konuşma Uzunluğu</CardTitle><CardDescription>Mesaj sayısına göre konuşma dağılımı</CardDescription></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={250}>
                        <BarChart data={lengthChart}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Konuşma" fill="#f97316" radius={[6, 6, 0, 0]} /></BarChart>
                    </ResponsiveContainer></CardContent>
                </Card>
            </div>

            {/* Recent Conversations Table */}
            <Card className="rounded-2xl shadow-xl"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Son Konuşmalar</CardTitle></CardHeader>
                <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/30">
                    <TableHead className="pl-6 font-bold text-xs uppercase text-slate-400">Müşteri</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Lead Skor</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Mesaj</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Son Aktivite</TableHead>
                </TableRow></TableHeader><TableBody>
                    {recentConvs?.map((c: any) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/50">
                            <TableCell className="pl-6"><div className="font-bold text-sm">{c.customerName}</div><div className="text-xs text-slate-400">{c.phone}</div></TableCell>
                            <TableCell className="text-center">
                                {c.leadScore === 'hot' && <Badge className="bg-red-50 text-red-600 border-red-200 border text-xs gap-1"><Flame className="h-3 w-3" />Sıcak</Badge>}
                                {c.leadScore === 'warm' && <Badge className="bg-orange-50 text-orange-600 border-orange-200 border text-xs gap-1"><Thermometer className="h-3 w-3" />Ilık</Badge>}
                                {c.leadScore === 'call_requested' && <Badge className="bg-purple-50 text-purple-600 border-purple-200 border text-xs gap-1"><Phone className="h-3 w-3" />Arama</Badge>}
                                {c.leadScore === 'cold' && <Badge className="bg-blue-50 text-blue-600 border-blue-200 border text-xs">Soğuk</Badge>}
                                {c.leadScore === 'disqualified' && <Badge className="bg-slate-100 text-slate-500 border text-xs">DQ</Badge>}
                                {(!c.leadScore || c.leadScore === 'unknown') && <Badge className="bg-slate-50 text-slate-400 border text-xs">Belirsiz</Badge>}
                            </TableCell>
                            <TableCell className="text-center font-bold text-sm">{c.messageCount}</TableCell>
                            <TableCell className="text-center text-xs text-slate-500 font-bold">{format(new Date(c.updatedAt), 'd MMM HH:mm', { locale: tr })}</TableCell>
                        </TableRow>
                    ))}
                </TableBody></Table></div></CardContent>
            </Card>
        </div>
    )
}
