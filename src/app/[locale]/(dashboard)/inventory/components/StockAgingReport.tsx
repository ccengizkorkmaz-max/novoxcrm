'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AgingUnit {
    id: string
    unit_number: string
    block: string
    type: string
    price: number
    currency: string
    area_gross: number
    projectName: string
    daysOnMarket: number
    agingBucket: string
    pricePerM2: number | null
}

interface StockAgingReportProps {
    data: AgingUnit[]
}

const BUCKET_COLORS: Record<string, string> = {
    '0-30 gün': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    '31-60 gün': 'bg-blue-100 text-blue-800 border-blue-200',
    '61-90 gün': 'bg-amber-100 text-amber-800 border-amber-200',
    '91-180 gün': 'bg-orange-100 text-orange-800 border-orange-200',
    '180+ gün': 'bg-red-100 text-red-800 border-red-200',
}

export function StockAgingReport({ data }: StockAgingReportProps) {
    const [expandedBucket, setExpandedBucket] = useState<string | null>(null)

    // Group by aging bucket
    const buckets: Record<string, AgingUnit[]> = {
        '0-30 gün': [],
        '31-60 gün': [],
        '61-90 gün': [],
        '91-180 gün': [],
        '180+ gün': [],
    }

    data.forEach(unit => {
        if (buckets[unit.agingBucket]) {
            buckets[unit.agingBucket].push(unit)
        }
    })

    const totalValue = data.reduce((sum, u) => sum + u.price, 0)

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Stok Yaşlandırma Raporu
                </CardTitle>
                <p className="text-xs text-muted-foreground">Satıştaki ünitelerin piyasada kalma süresi analizi</p>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Summary Bar */}
                <div className="flex h-4 rounded-full overflow-hidden">
                    {Object.entries(buckets).map(([bucket, units]) => {
                        const pct = data.length > 0 ? (units.length / data.length) * 100 : 0
                        if (pct === 0) return null
                        const colors = BUCKET_COLORS[bucket] || ''
                        const bgColor = colors.split(' ')[0] || 'bg-slate-200'
                        return (
                            <div
                                key={bucket}
                                className={`${bgColor} transition-all cursor-pointer hover:opacity-90`}
                                style={{ width: `${pct}%` }}
                                title={`${bucket}: ${units.length} ünite (%${Math.round(pct)})`}
                                onClick={() => setExpandedBucket(expandedBucket === bucket ? null : bucket)}
                            />
                        )
                    })}
                </div>

                {/* Bucket cards */}
                <div className="grid grid-cols-5 gap-2">
                    {Object.entries(buckets).map(([bucket, units]) => {
                        const value = units.reduce((sum, u) => sum + u.price, 0)
                        const isExpanded = expandedBucket === bucket
                        return (
                            <button
                                key={bucket}
                                className={`text-left p-2 rounded-lg border transition-all ${isExpanded ? 'ring-2 ring-primary/50' : ''} ${BUCKET_COLORS[bucket] || 'bg-slate-50'}`}
                                onClick={() => setExpandedBucket(isExpanded ? null : bucket)}
                            >
                                <p className="text-[10px] font-bold">{bucket}</p>
                                <p className="text-lg font-black">{units.length}</p>
                                <p className="text-[9px] opacity-70">{formatCurrency(value, 'TRY')}</p>
                            </button>
                        )
                    })}
                </div>

                {/* Expanded bucket detail */}
                {expandedBucket && buckets[expandedBucket]?.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className={`px-3 py-2 ${BUCKET_COLORS[expandedBucket] || 'bg-slate-50'}`}>
                            <span className="text-xs font-bold">{expandedBucket} — {buckets[expandedBucket].length} ünite</span>
                        </div>
                        <div className="divide-y max-h-64 overflow-y-auto">
                            {buckets[expandedBucket].map(unit => (
                                <div key={unit.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30">
                                    <div>
                                        <span className="font-bold">{unit.projectName}</span>
                                        <span className="text-muted-foreground"> • {unit.block} / {unit.unit_number}</span>
                                        <span className="text-muted-foreground"> • {unit.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold">{formatCurrency(unit.price, unit.currency)}</span>
                                        <Badge variant="outline" className="ml-2 text-[9px] px-1">
                                            {unit.daysOnMarket} gün
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>
                            Ortalama stokta kalma: <strong>{Math.round(data.reduce((sum, u) => sum + u.daysOnMarket, 0) / data.length)} gün</strong>
                            {' • '}
                            Toplam stok değeri: <strong>{formatCurrency(totalValue, 'TRY')}</strong>
                        </span>
                    </div>
                )}

                {data.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">Satışta ünite bulunmuyor.</p>
                )}
            </CardContent>
        </Card>
    )
}
