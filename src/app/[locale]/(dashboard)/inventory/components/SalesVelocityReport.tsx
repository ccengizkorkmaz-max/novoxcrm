'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, TrendingUp, Target, Clock, BarChart3, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VelocityProject {
    projectId: string
    projectName: string
    totalUnits: number
    availableUnits: number
    soldUnits: number
    occupancyRate: number
    monthlyVelocity: number
    estimatedMonthsToDepletion: number | null
    avgPrice: number
    totalStockValue: number
    monthlyBreakdown: { month: string; count: number }[]
}

interface SalesVelocityReportProps {
    data: VelocityProject[]
}

export function SalesVelocityReport({ data }: SalesVelocityReportProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Rocket className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Satış hızı verisi bulunamadı.</p>
                </CardContent>
            </Card>
        )
    }

    // Overall stats
    const totalAvailable = data.reduce((s, p) => s + p.availableUnits, 0)
    const totalSold = data.reduce((s, p) => s + p.soldUnits, 0)
    const totalAll = data.reduce((s, p) => s + p.totalUnits, 0)
    const totalStockValue = data.reduce((s, p) => s + p.totalStockValue, 0)
    const avgVelocity = data.reduce((s, p) => s + p.monthlyVelocity, 0)

    const getDepletionColor = (months: number | null) => {
        if (months === null) return 'text-slate-400'
        if (months <= 3) return 'text-red-600'
        if (months <= 6) return 'text-orange-600'
        if (months <= 12) return 'text-amber-600'
        return 'text-emerald-600'
    }

    const getDepletionLabel = (months: number | null) => {
        if (months === null) return 'Hesaplanamıyor'
        if (months <= 1) return '< 1 ay'
        return `~${months} ay`
    }

    const getVelocityBarWidth = (velocity: number) => {
        const maxVelocity = Math.max(...data.map(p => p.monthlyVelocity), 1)
        return Math.round((velocity / maxVelocity) * 100)
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    Satış Hızı & Stok Tahminleri
                </CardTitle>
                <p className="text-xs text-muted-foreground">Son 6 aylık satış hızına göre stok tükenme tahmini</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Toplam Stok</p>
                        <p className="text-xl font-black text-blue-700">{totalAvailable}</p>
                        <p className="text-[10px] text-blue-500">{totalAll} toplam ünite</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Toplam Satış</p>
                        <p className="text-xl font-black text-emerald-700">{totalSold}</p>
                        <p className="text-[10px] text-emerald-500">%{totalAll > 0 ? Math.round((totalSold / totalAll) * 100) : 0} doluluk</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Aylık Hız</p>
                        <p className="text-xl font-black text-amber-700">{avgVelocity.toFixed(1)}</p>
                        <p className="text-[10px] text-amber-500">ünite/ay</p>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Stok Değeri</p>
                        <p className="text-lg font-black text-violet-700">{formatCurrency(totalStockValue, 'TRY')}</p>
                        <p className="text-[10px] text-violet-500">satıştaki envanter</p>
                    </div>
                </div>

                {/* Per-Project Detail */}
                <div className="space-y-3">
                    {data.map((project) => (
                        <div key={project.projectId} className="border rounded-lg overflow-hidden">
                            {/* Project Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-slate-900">{project.projectName}</h3>
                                    <Badge variant="outline" className="text-[9px]">
                                        {project.availableUnits}/{project.totalUnits} mevcut
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Velocity */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="font-bold text-slate-700">{project.monthlyVelocity} ünite/ay</span>
                                    </div>
                                    {/* Depletion Estimate */}
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${getDepletionColor(project.estimatedMonthsToDepletion)}`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        {getDepletionLabel(project.estimatedMonthsToDepletion)}
                                    </div>
                                </div>
                            </div>

                            {/* Progress & Details */}
                            <div className="px-4 py-3 space-y-3">
                                {/* Occupancy Bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-muted-foreground">Doluluk Oranı</span>
                                        <span className="font-bold">%{project.occupancyRate}</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${project.occupancyRate >= 80 ? 'bg-emerald-500' :
                                                    project.occupancyRate >= 50 ? 'bg-amber-500' :
                                                        'bg-blue-500'
                                                }`}
                                            style={{ width: `${project.occupancyRate}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Velocity Bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-muted-foreground">Satış Hızı (Aylık)</span>
                                        <span className="font-bold">{project.monthlyVelocity} ünite/ay</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
                                            style={{ width: `${getVelocityBarWidth(project.monthlyVelocity)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Monthly Trend Mini Chart */}
                                {project.monthlyBreakdown.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Aylık Satış Trendi</p>
                                        <div className="flex items-end gap-1 h-12">
                                            {project.monthlyBreakdown.map((m, i) => {
                                                const maxCount = Math.max(...project.monthlyBreakdown.map(x => x.count), 1)
                                                const height = (m.count / maxCount) * 100
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${m.month}: ${m.count} satış`}>
                                                        <span className="text-[8px] font-bold text-slate-600">{m.count > 0 ? m.count : ''}</span>
                                                        <div
                                                            className={`w-full rounded-t-sm transition-all ${m.count > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-slate-100'}`}
                                                            style={{ height: `${Math.max(height, 4)}%`, minHeight: '2px' }}
                                                        />
                                                        <span className="text-[7px] text-muted-foreground truncate w-full text-center">{m.month.split(' ')[0]}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Key Metrics */}
                                <div className="flex items-center gap-4 pt-1 border-t text-[10px] text-muted-foreground">
                                    <span>Ortalama Fiyat: <strong className="text-foreground">{formatCurrency(project.avgPrice, 'TRY')}</strong></span>
                                    <span>Kalan Stok Değeri: <strong className="text-foreground">{formatCurrency(project.totalStockValue, 'TRY')}</strong></span>
                                    {project.estimatedMonthsToDepletion && project.estimatedMonthsToDepletion <= 3 && (
                                        <span className="flex items-center gap-1 text-red-600 font-bold">
                                            <AlertTriangle className="h-3 w-3" /> Stok tükeniyor!
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Tahminler son 6 aylık ortalama satış hızına dayanmaktadır.</span>
                </div>
            </CardContent>
        </Card>
    )
}
