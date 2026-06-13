'use client'

import React, { useState, useEffect } from 'react'
import { getProjectPerformance } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { BackButton } from "@/components/back-button"
import { Building2, RefreshCw, Download, TrendingUp, Timer, Package } from 'lucide-react'
import { exportToExcel } from '@/lib/report-export'
import { toast } from 'sonner'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend
} from 'recharts'

const PROJECT_COLORS = ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']

export default function ProjectPerformancePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getProjectPerformance().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-emerald-600 animate-spin" /></div>

    const { projectStats, monthlyTrend, projectNames } = data

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-emerald-600" />
                            Proje Bazlı Performans
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Her projenin satış hızı, envanter ve ciro karşılaştırması.</p>
                    </div>
                </div>
                <Button onClick={() => {
                    exportToExcel(projectStats.map((p: any) => ({
                        'Proje': p.name, 'Toplam Ünite': p.totalUnits, 'Satılan': p.soldUnits, 'Satılık': p.forSaleUnits,
                        'Doluluk %': p.occupancyRate, 'Aylık Hız': p.monthlyVelocity, 'Tükenme (Ay)': p.depletionMonths || '-',
                        'Ciro (₺)': p.totalRevenue
                    })), `proje_performans_${new Date().toISOString().slice(0, 10)}`)
                    toast.success('Excel indirildi!')
                }} className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"><Download className="h-4 w-4" /> Excel</Button>
            </div>

            {/* Project Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectStats.map((p: any, i: number) => (
                    <Card key={p.id} className="rounded-2xl shadow-md border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: PROJECT_COLORS[i % PROJECT_COLORS.length] }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-black flex items-center justify-between">
                                {p.name}
                                <Badge className="bg-slate-100 text-slate-700 font-black text-xs">%{p.occupancyRate}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Progress bar */}
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="h-2.5 rounded-full transition-all" style={{ width: `${p.occupancyRate}%`, backgroundColor: PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div><div className="text-lg font-black text-slate-900">{p.totalUnits}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Toplam</div></div>
                                <div><div className="text-lg font-black text-emerald-600">{p.soldUnits}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Satılan</div></div>
                                <div><div className="text-lg font-black text-blue-600">{p.forSaleUnits}</div><div className="text-[9px] text-slate-400 font-bold uppercase">Satılık</div></div>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t pt-2 border-slate-100">
                                <div className="flex items-center gap-1 text-slate-500"><TrendingUp className="h-3 w-3" /><span className="font-bold">{p.monthlyVelocity}/ay</span></div>
                                {p.depletionMonths && <div className="flex items-center gap-1 text-slate-500"><Timer className="h-3 w-3" /><span className="font-bold">~{p.depletionMonths} ay</span></div>}
                                <div className="font-black text-slate-800">{(p.totalRevenue / 1000000).toFixed(1)}M ₺</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Monthly Trend */}
            <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Proje Bazlı Aylık Satış Trendi</CardTitle><CardDescription>Son 6 ay</CardDescription></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                            {projectNames?.slice(0, 8).map((name: string, i: number) => (
                                <Bar key={name} dataKey={name} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} radius={[4, 4, 0, 0]} stackId="a" />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="rounded-2xl shadow-xl"><CardHeader className="bg-slate-50/50 border-b px-6 py-4"><CardTitle className="text-lg font-bold">Proje Detay Tablosu</CardTitle></CardHeader>
                <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50/30">
                    <TableHead className="pl-6 font-bold text-xs uppercase text-slate-400">Proje</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Toplam</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Satılan</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Satılık</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Rezerve</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Doluluk</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Hız (Ay)</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Tükenme</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-slate-400 text-right pr-6">Ciro</TableHead>
                </TableRow></TableHeader><TableBody>
                    {projectStats.map((p: any) => (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                            <TableCell className="pl-6 font-bold text-sm">{p.name}</TableCell>
                            <TableCell className="text-center font-bold">{p.totalUnits}</TableCell>
                            <TableCell className="text-center"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">{p.soldUnits}</Badge></TableCell>
                            <TableCell className="text-center"><Badge className="bg-blue-50 text-blue-700 border-blue-200 border">{p.forSaleUnits}</Badge></TableCell>
                            <TableCell className="text-center"><Badge className="bg-amber-50 text-amber-700 border-amber-200 border">{p.reservedUnits}</Badge></TableCell>
                            <TableCell className="text-center font-black">%{p.occupancyRate}</TableCell>
                            <TableCell className="text-center font-bold text-slate-600">{p.monthlyVelocity}</TableCell>
                            <TableCell className="text-center font-bold text-slate-600">{p.depletionMonths ? `${p.depletionMonths} ay` : '-'}</TableCell>
                            <TableCell className="text-right pr-6 font-black">{(p.totalRevenue / 1000000).toFixed(1)}M ₺</TableCell>
                        </TableRow>
                    ))}
                </TableBody></Table></div></CardContent>
            </Card>
        </div>
    )
}
