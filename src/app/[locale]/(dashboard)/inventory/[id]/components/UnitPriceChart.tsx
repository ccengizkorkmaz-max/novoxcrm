'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PriceHistoryItem {
    id: string
    date: string
    oldValue: string
    newValue: string
    description: string
    user: string
}

interface UnitPriceChartProps {
    priceHistory: PriceHistoryItem[]
    currentPrice: number
    currency: string
}

export function UnitPriceChart({ priceHistory, currentPrice, currency }: UnitPriceChartProps) {
    if (priceHistory.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Fiyat Geçmişi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                        <DollarSign className="h-6 w-6 opacity-30 mb-2" />
                        <p className="text-xs">Henüz fiyat değişikliği kaydı yok</p>
                        <p className="text-lg font-black text-foreground mt-2">{formatCurrency(currentPrice, currency)}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Build price points from history (most recent first in timeline, reverse for chart)
    const pricePoints = priceHistory
        .filter(h => h.oldValue && h.newValue)
        .reverse()
        .map(h => ({
            date: new Date(h.date),
            price: Number(h.newValue),
            oldPrice: Number(h.oldValue),
            description: h.description,
            user: h.user
        }))

    // Add current price as last point if needed
    if (pricePoints.length > 0) {
        const lastPoint = pricePoints[pricePoints.length - 1]
        if (lastPoint.price !== currentPrice) {
            pricePoints.push({
                date: new Date(),
                price: currentPrice,
                oldPrice: lastPoint.price,
                description: 'Mevcut fiyat',
                user: ''
            })
        }
    }

    // Calculate chart dimensions
    const allPrices = pricePoints.map(p => p.price)
    const firstPrice = pricePoints[0]?.oldPrice || currentPrice
    allPrices.push(firstPrice) // Include the initial price
    const minPrice = Math.min(...allPrices) * 0.95
    const maxPrice = Math.max(...allPrices) * 1.05
    const priceRange = maxPrice - minPrice

    // Total change
    const totalChange = currentPrice - firstPrice
    const totalChangePercent = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0

    // SVG chart
    const chartWidth = 400
    const chartHeight = 120
    const padding = { top: 10, bottom: 20, left: 10, right: 10 }
    const innerW = chartWidth - padding.left - padding.right
    const innerH = chartHeight - padding.top - padding.bottom

    // Generate points including initial price
    const points: { x: number, y: number, price: number, label: string }[] = []

    // Starting point
    points.push({
        x: padding.left,
        y: padding.top + innerH - ((firstPrice - minPrice) / priceRange) * innerH,
        price: firstPrice,
        label: 'Başlangıç'
    })

    pricePoints.forEach((p, i) => {
        const x = padding.left + ((i + 1) / pricePoints.length) * innerW
        const y = padding.top + innerH - ((p.price - minPrice) / priceRange) * innerH
        points.push({ x, y, price: p.price, label: p.description })
    })

    // Build polyline
    const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

    // Build gradient fill path
    const fillPath = `M${points[0].x},${padding.top + innerH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${padding.top + innerH} Z`

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Fiyat Geçmişi ({priceHistory.length} değişiklik)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {totalChange !== 0 && (
                            <Badge className={`text-[10px] px-2 ${totalChange > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                {totalChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                {totalChange > 0 ? '+' : ''}{totalChangePercent.toFixed(1)}%
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Price */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Güncel Fiyat</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(currentPrice, currency)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Başlangıç</p>
                        <p className="text-sm font-bold text-slate-500">{formatCurrency(firstPrice, currency)}</p>
                    </div>
                </div>

                {/* SVG Chart */}
                <div className="bg-slate-50/50 rounded-lg p-2">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                        {/* Gradient Fill */}
                        <defs>
                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={totalChange >= 0 ? '#f43f5e' : '#10b981'} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={totalChange >= 0 ? '#f43f5e' : '#10b981'} stopOpacity="0.02" />
                            </linearGradient>
                        </defs>
                        <path d={fillPath} fill="url(#priceGrad)" />
                        <polyline
                            points={polyline}
                            fill="none"
                            stroke={totalChange >= 0 ? '#f43f5e' : '#10b981'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Data Points */}
                        {points.map((p, i) => (
                            <g key={i}>
                                <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={totalChange >= 0 ? '#f43f5e' : '#10b981'} strokeWidth="2" />
                                {/* Price label on first and last */}
                                {(i === 0 || i === points.length - 1) && (
                                    <text
                                        x={p.x}
                                        y={p.y - 10}
                                        fontSize="9"
                                        fontWeight="bold"
                                        fill="#475569"
                                        textAnchor={i === 0 ? 'start' : 'end'}
                                    >
                                        {new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(p.price)}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>
                </div>

                {/* Change History List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {priceHistory.map((item) => {
                        const oldP = Number(item.oldValue)
                        const newP = Number(item.newValue)
                        const change = newP - oldP
                        const changePercent = oldP > 0 ? ((newP - oldP) / oldP) * 100 : 0
                        return (
                            <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 text-xs">
                                <div className="flex items-center gap-2">
                                    {change > 0 ? (
                                        <TrendingUp className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                                    ) : change < 0 ? (
                                        <TrendingDown className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <Minus className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                    )}
                                    <div>
                                        <span className="font-medium text-slate-500 line-through mr-1">
                                            {formatCurrency(oldP, currency)}
                                        </span>
                                        <span className="font-bold text-slate-900">
                                            → {formatCurrency(newP, currency)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[9px] px-1.5 ${change > 0 ? 'text-rose-600 border-rose-200' : 'text-emerald-600 border-emerald-200'}`}>
                                        {change > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(item.date).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
