'use client'

import React, { useState, useEffect } from 'react'
import { getMayaTracking } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"
import { Bot, RefreshCw, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function MayaTrackingPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMayaTracking().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-violet-600 animate-spin" /></div>

    const { isEmpty, kpis, tasks, dailyTrend, statusChart } = data

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Bot className="h-8 w-8 text-violet-600" />
                        MAYA Takip Raporu
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Yapay zeka satış asistanı MAYA&apos;ya atanan görevlerin durumu.</p>
                </div>
            </div>

            {isEmpty ? (
                /* Empty State */
                <Card className="rounded-3xl shadow-xl border-none bg-gradient-to-br from-violet-50 to-indigo-50">
                    <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
                        <div className="h-24 w-24 rounded-full bg-violet-100 flex items-center justify-center">
                            <Bot className="h-12 w-12 text-violet-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">MAYA henüz aktif görev almadı</h2>
                        <p className="text-slate-500 max-w-lg font-medium leading-relaxed">
                            AI aramaları başladığında, &quot;Takip Edilmeli&quot; olarak belirlenen müşteriler otomatik olarak MAYA&apos;ya atanacak ve bu raporda görünecektir.
                            <br/><br/>
                            MAYA, müşteri takip aramalarını yapay zeka ile otomatize ederek satış ekibinizin zamanını değerlendirir.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <Badge className="bg-violet-100 text-violet-700 border-violet-200 border px-4 py-2 text-sm font-bold">🤖 AI Takip Araması</Badge>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border px-4 py-2 text-sm font-bold">📞 Otomatik Hatırlatma</Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border px-4 py-2 text-sm font-bold">📊 Performans İzleme</Badge>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                            <Bot className="h-5 w-5 text-violet-500 mb-1" />
                            <span className="text-2xl font-black">{kpis.total}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Görev</span>
                        </CardContent></Card>
                        <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                            <Clock className="h-5 w-5 text-orange-500 mb-1" />
                            <span className="text-2xl font-black text-orange-600">{kpis.pending}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bekleyen</span>
                        </CardContent></Card>
                        <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1" />
                            <span className="text-2xl font-black text-emerald-600">{kpis.completed}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamamlanan</span>
                        </CardContent></Card>
                        <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                            <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
                            <span className="text-2xl font-black text-red-600">{kpis.overdue}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geciken</span>
                        </CardContent></Card>
                        <Card className="rounded-2xl shadow-md"><CardContent className="p-4 flex flex-col items-center">
                            <Calendar className="h-5 w-5 text-blue-500 mb-1" />
                            <span className="text-2xl font-black text-blue-600">{kpis.todayTasks}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bugün</span>
                        </CardContent></Card>
                        <Card className="rounded-2xl shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white"><CardContent className="p-4 flex flex-col items-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-1" />
                            <span className="text-2xl font-black">%{kpis.completionRate}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tamamlanma</span>
                        </CardContent></Card>
                    </div>

                    {/* Charts */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Durum Dağılımı</CardTitle></CardHeader>
                            <CardContent className="flex items-center justify-center"><ResponsiveContainer width="100%" height={260}>
                                <PieChart><Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                    {statusChart.map((s: any, i: number) => <Cell key={i} fill={s.color} />)}
                                </Pie><Tooltip /></PieChart>
                            </ResponsiveContainer></CardContent>
                        </Card>
                        <Card className="rounded-2xl shadow-md"><CardHeader className="pb-2"><CardTitle className="text-base font-bold">Günlük Görev Trendi</CardTitle></CardHeader>
                            <CardContent><ResponsiveContainer width="100%" height={260}>
                                <BarChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Görev" fill="#8b5cf6" radius={[6, 6, 0, 0]} /></BarChart>
                            </ResponsiveContainer></CardContent>
                        </Card>
                    </div>

                    {/* Tasks Table */}
                    <Card className="rounded-2xl shadow-xl"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Görev Listesi</CardTitle></CardHeader>
                        <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/30">
                            <TableHead className="pl-6 font-bold text-xs uppercase text-slate-400">Görev</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400">Müşteri</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Durum</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Vade</TableHead>
                            <TableHead className="font-bold text-xs uppercase text-slate-400 text-center pr-6">Oluşturma</TableHead>
                        </TableRow></TableHeader><TableBody>
                            {tasks.map((t: any) => (
                                <TableRow key={t.id} className={`hover:bg-slate-50/50 ${t.isOverdue ? 'bg-red-50/30' : ''}`}>
                                    <TableCell className="pl-6 font-medium text-sm max-w-[300px]"><p className="line-clamp-2">{t.summary}</p></TableCell>
                                    <TableCell><div className="font-bold text-sm">{t.customerName}</div><div className="text-xs text-slate-400">{t.phone}</div></TableCell>
                                    <TableCell className="text-center">
                                        {t.isOverdue ? <Badge className="bg-red-50 text-red-600 border-red-200 border text-xs gap-1"><AlertTriangle className="h-3 w-3" />Gecikmiş</Badge>
                                            : t.status === 'Completed' ? <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Tamamlandı</Badge>
                                            : <Badge className="bg-amber-50 text-amber-600 border-amber-200 border text-xs gap-1"><Clock className="h-3 w-3" />Bekliyor</Badge>}
                                    </TableCell>
                                    <TableCell className="text-center text-xs text-slate-500 font-bold">{t.dueDate ? format(new Date(t.dueDate), 'd MMM', { locale: tr }) : '-'}</TableCell>
                                    <TableCell className="text-center pr-6 text-xs text-slate-500">{format(new Date(t.createdAt), 'd MMM HH:mm', { locale: tr })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody></Table></div></CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
