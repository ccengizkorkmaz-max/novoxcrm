'use client'

import React, { useState, useEffect } from 'react'
import { getBrokerPerformance } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { BackButton } from "@/components/back-button"
import { Users, RefreshCw, Download, TrendingUp, DollarSign, Phone, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function BrokerPerformancePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getBrokerPerformance().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" /></div>

    const { brokerStats, topBySales, topByRevenue } = data

    const roleLabels: Record<string, string> = { broker: 'Broker', sales_rep: 'Satış', manager: 'Yönetici', owner: 'Sahip', crm_manager: 'CRM Manager' }

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Users className="h-8 w-8 text-indigo-600" />
                            Broker / Danışman Performans
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Ekip bazlı satış, ciro ve aktivite karşılaştırması.</p>
                    </div>
                </div>
                <Button onClick={() => {
                    exportToExcel(brokerStats.map((b: any) => ({
                        'Ad': b.name, 'Rol': roleLabels[b.role] || b.role, 'Satış': b.salesCount, 'Lead': b.totalLeads,
                        'Ciro (₺)': b.totalRevenue, 'Dönüşüm %': b.conversionRate, 'Aktivite': b.activityCount,
                        'Arama': b.calls, 'Toplantı': b.meetings
                    })), `broker_performans_${new Date().toISOString().slice(0, 10)}`)
                    toast.success('Excel indirildi!')
                }} className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700"><Download className="h-4 w-4" /> Excel</Button>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <Users className="h-5 w-5 text-indigo-500 mb-1" />
                    <span className="text-2xl font-black">{brokerStats.length}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Ekip</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
                    <span className="text-2xl font-black text-emerald-600">{brokerStats.reduce((s: number, b: any) => s + b.salesCount, 0)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Satış</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                    <DollarSign className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="text-2xl font-black text-amber-600">{(brokerStats.reduce((s: number, b: any) => s + b.totalRevenue, 0) / 1000000).toFixed(1)}M</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Ciro</span>
                </CardContent></Card>
                <Card className="rounded-2xl shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white"><CardContent className="p-4 flex flex-col items-center">
                    <Phone className="h-5 w-5 text-blue-400 mb-1" />
                    <span className="text-2xl font-black">{brokerStats.reduce((s: number, b: any) => s + b.activityCount, 0)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">30g Aktivite</span>
                </CardContent></Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Top 10 — Satış Adedi</CardTitle></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topBySales} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} /><Tooltip /><Bar dataKey="value" name="Satış" fill="#6366f1" radius={[0, 6, 6, 0]} /></BarChart>
                    </ResponsiveContainer></CardContent>
                </Card>
                <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Top 10 — Ciro (Milyon ₺)</CardTitle></CardHeader>
                    <CardContent><ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topByRevenue} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} /><Tooltip /><Bar dataKey="value" name="Ciro (M₺)" fill="#10b981" radius={[0, 6, 6, 0]} /></BarChart>
                    </ResponsiveContainer></CardContent>
                </Card>
            </div>

            {/* Broker Table */}
            <Card className="rounded-2xl shadow-xl"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Ekip Detay Tablosu</CardTitle></CardHeader>
                <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/30">
                    <TableHead className="pl-6 font-bold text-xs uppercase text-slate-400">Ad</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Rol</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Satış</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Lead</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Dönüşüm</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Ciro</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Aktivite</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Arama</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Toplantı</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center pr-6">Son Aktivite</TableHead>
                </TableRow></TableHeader><TableBody>
                    {brokerStats.map((b: any) => (
                        <TableRow key={b.id} className="hover:bg-slate-50/50">
                            <TableCell className="pl-6 font-bold text-sm">{b.name}</TableCell>
                            <TableCell className="text-center"><Badge className="bg-slate-100 text-slate-600 text-xs">{roleLabels[b.role] || b.role}</Badge></TableCell>
                            <TableCell className="text-center font-black text-emerald-600">{b.salesCount}</TableCell>
                            <TableCell className="text-center font-bold">{b.totalLeads}</TableCell>
                            <TableCell className="text-center"><Badge className={`${b.conversionRate > 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'} border text-xs`}>%{b.conversionRate}</Badge></TableCell>
                            <TableCell className="text-right font-black">{b.totalRevenue > 0 ? `${(b.totalRevenue / 1000000).toFixed(1)}M` : '-'}</TableCell>
                            <TableCell className="text-center font-bold">{b.activityCount}</TableCell>
                            <TableCell className="text-center">{b.calls}</TableCell>
                            <TableCell className="text-center">{b.meetings}</TableCell>
                            <TableCell className="text-center pr-6 text-xs text-slate-500">{b.lastActivity ? format(new Date(b.lastActivity), 'd MMM', { locale: tr }) : '-'}</TableCell>
                        </TableRow>
                    ))}
                </TableBody></Table></div></CardContent>
            </Card>
        </div>
    )
}
