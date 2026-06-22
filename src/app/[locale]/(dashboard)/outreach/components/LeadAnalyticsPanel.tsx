'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, DollarSign, Users, Award } from 'lucide-react'
import { getLeadSourceAnalytics } from '../actions'

interface SourceStat {
    source: string
    totalLeads: number
    convertedLeads: number
    lostLeads: number
    activeLeads: number
    revenue: number
    conversionRate: number
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

export function LeadAnalyticsPanel() {
    const [data, setData] = useState<SourceStat[]>([])
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const stats = await getLeadSourceAnalytics()
            setData(stats)
        })
    }, [])

    const totalLeads = data.reduce((sum, d) => sum + d.totalLeads, 0)
    const totalConverted = data.reduce((sum, d) => sum + d.convertedLeads, 0)
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
    
    const avgConversionRate = totalLeads > 0 
        ? Math.round((totalConverted / totalLeads) * 100) 
        : 0

    // Find best source (highest conversion rate with at least some leads)
    const bestSource = [...data]
        .filter(d => d.totalLeads >= 3)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0]

    return (
        <div className="space-y-6">
            {/* Loading state */}
            {isPending && data.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    Analitik yükleniyor...
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border-indigo-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-indigo-400">Toplam Aday Hacmi</CardTitle>
                                <Users className="h-4 w-4 text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">{totalLeads}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Tüm kanallardan gelen toplam lead</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-emerald-400">Ortalama Dönüşüm</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">%{avgConversionRate}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Nitelikli müşteriye dönüşüm oranı</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-amber-400">Toplam Fırsat Değeri</CardTitle>
                                <DollarSign className="h-4 w-4 text-amber-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalRevenue)}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Oluşturulan toplam pipeline değeri</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border-violet-500/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-violet-400">En Başarılı Kanal</CardTitle>
                                <Award className="h-4 w-4 text-violet-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">
                                    {bestSource ? `${bestSource.source} (%${bestSource.conversionRate})` : '-'}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1.5">En yüksek dönüşüm oranına sahip kanal</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Channel Performance Breakdown */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-indigo-400" />
                                Kanal Bazlı Performans Raporu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {data.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    Henüz analiz edilecek lead kaydı bulunamadı.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                <th className="py-2.5 px-4">Kaynak Kanal</th>
                                                <th className="py-2.5 px-4 text-center">Toplam Aday</th>
                                                <th className="py-2.5 px-4 text-center">Dönüşüm Durumu</th>
                                                <th className="py-2.5 px-4 text-center">Dönüşüm Oranı</th>
                                                <th className="py-2.5 px-4 text-right">Oluşturulan Hacim</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-xs">
                                            {data.map((stat, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                                                        <Badge variant="outline" className="bg-indigo-500/5 text-indigo-500 border-indigo-500/10">
                                                            {stat.source}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                                                        {stat.totalLeads}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="text-emerald-500 font-semibold" title="Dönüştü">{stat.convertedLeads} K</span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-amber-500 font-semibold" title="Aktif">{stat.activeLeads} A</span>
                                                            <span className="text-muted-foreground">•</span>
                                                            <span className="text-red-500 font-semibold" title="Kaybedildi">{stat.lostLeads} B</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center flex-col gap-1">
                                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">%{stat.conversionRate}</span>
                                                            <div className="w-16 bg-muted rounded-full h-1 overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-emerald-500" 
                                                                    style={{ width: `${stat.conversionRate}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatCurrency(stat.revenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
