'use client'

import React, { useState, useEffect } from 'react'
import { getLeadFunnel } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { BackButton } from "@/components/back-button"
import { RefreshCw, TrendingDown, ArrowDown, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

export default function LeadFunnelPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getLeadFunnel().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    if (loading || !data) return <div className="flex items-center justify-center h-96"><RefreshCw className="h-8 w-8 text-purple-600 animate-spin" /></div>

    const { funnel, totalSales, lost } = data

    return (
        <div className="flex flex-col gap-6 p-1 md:p-6 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Filter className="h-8 w-8 text-purple-600" />
                        Lead Dönüşüm Hunisi
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Satış pipeline&apos;ında her aşamanın dönüşüm oranları.</p>
                </div>
            </div>

            {/* Funnel Visual */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card className="rounded-2xl shadow-xl">
                        <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Satış Hunisi</CardTitle><CardDescription>Toplam {totalSales} kayıt</CardDescription></CardHeader>
                        <CardContent className="space-y-3 py-6">
                            {funnel.map((stage: any, i: number) => {
                                const maxCount = Math.max(...funnel.map((f: any) => f.count), 1)
                                const widthPercent = Math.max((stage.count / maxCount) * 100, 8)
                                return (
                                    <div key={stage.stage} className="flex items-center gap-4">
                                        <div className="w-24 text-right">
                                            <span className="text-sm font-bold text-slate-700">{stage.stage}</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <div className="h-10 rounded-lg transition-all flex items-center px-4" style={{ width: `${widthPercent}%`, backgroundColor: stage.color, minWidth: '60px' }}>
                                                <span className="text-white font-black text-sm">{stage.count}</span>
                                            </div>
                                        </div>
                                        {i > 0 && (
                                            <div className="w-20 text-right">
                                                <span className={`text-xs font-black ${stage.conversionFromPrev > 50 ? 'text-emerald-600' : stage.conversionFromPrev > 20 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    %{stage.conversionFromPrev}
                                                    <ArrowDown className="h-3 w-3 inline ml-0.5" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            {/* Lost */}
                            {lost > 0 && (
                                <div className="flex items-center gap-4 border-t pt-3 mt-3 border-slate-200">
                                    <div className="w-24 text-right"><span className="text-sm font-bold text-red-500">Kayıp / İptal</span></div>
                                    <div className="flex-1"><div className="h-8 rounded-lg bg-red-100 flex items-center px-4" style={{ width: `${Math.max((lost / Math.max(...funnel.map((f: any) => f.count), 1)) * 100, 8)}%`, minWidth: '60px' }}>
                                        <span className="text-red-700 font-black text-sm">{lost}</span>
                                    </div></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stats sidebar */}
                <div className="space-y-4">
                    <Card className="rounded-2xl shadow-md bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-black">Genel Özet</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between"><span className="text-purple-200 text-sm">Toplam Pipeline</span><span className="font-black text-lg">{totalSales}</span></div>
                                <div className="flex justify-between"><span className="text-purple-200 text-sm">Lead Sayısı</span><span className="font-black text-lg">{funnel[0]?.count || 0}</span></div>
                                <div className="flex justify-between"><span className="text-purple-200 text-sm">Kapanan Satış</span><span className="font-black text-lg">{funnel[funnel.length - 1]?.count || 0}</span></div>
                                <div className="flex justify-between"><span className="text-purple-200 text-sm">Kayıp/İptal</span><span className="font-black text-lg">{lost}</span></div>
                                <div className="border-t border-white/20 pt-3">
                                    <div className="flex justify-between"><span className="text-purple-200 text-sm">Genel Dönüşüm</span>
                                        <span className="font-black text-xl">
                                            %{funnel[0]?.count > 0 ? Math.round((funnel[funnel.length - 1]?.count / funnel[0]?.count) * 100) : 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-md">
                        <CardContent className="p-6 space-y-3">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-500" />Aşama Dönüşüm Oranları</h3>
                            {funnel.slice(1).map((s: any, i: number) => (
                                <div key={s.stage} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">{funnel[i].stage} → {s.stage}</span>
                                    <span className={`font-black ${s.conversionFromPrev > 50 ? 'text-emerald-600' : s.conversionFromPrev > 20 ? 'text-amber-600' : 'text-red-600'}`}>%{s.conversionFromPrev}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bar Chart */}
            <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2"><CardTitle className="text-base font-bold">Aşama Karşılaştırması</CardTitle></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={funnel}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="stage" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                            <Bar dataKey="count" name="Kayıt" radius={[8, 8, 0, 0]}>
                                {funnel.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
