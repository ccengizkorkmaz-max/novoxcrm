'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, Key, Banknote, BadgeCheck, TrendingUp, DollarSign, PieChart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useTranslations } from 'next-intl'

interface InventoryStatsProps {
    units: any[]
}

export function InventoryStats({ units }: InventoryStatsProps) {
    const t = useTranslations('Inventory.stats')
    const currency = units.length > 0 ? units[0].currency : 'TRY'

    const totalUnits = units.length
    const forSaleCount = units.filter(u => u.status === 'For Sale').length
    const reservedCount = units.filter(u => u.status === 'Reserved').length
    const soldCount = units.filter(u => u.status === 'Sold').length
    const blockedCount = units.filter(u => u.status === 'Blocked').length
    const optionCount = units.filter(u => u.status === 'Option').length
    const rentedCount = units.filter(u => u.status === 'Rented').length
    const deliveredCount = units.filter(u => u.status === 'Delivered').length

    // Portfolio calculations
    const portfolioValue = units
        .filter(u => u.status === 'For Sale')
        .reduce((sum, u) => sum + (Number(u.price) || 0), 0)

    const soldValue = units
        .filter(u => u.status === 'Sold' || u.status === 'Delivered')
        .reduce((sum, u) => sum + (Number(u.price) || 0), 0)

    const totalValue = units.reduce((sum, u) => sum + (Number(u.price) || 0), 0)

    const occupancyRate = totalUnits > 0 ? Math.round(((soldCount + deliveredCount) / totalUnits) * 100) : 0

    // Monthly sales speed (approximate: sold units / months since first unit)
    const oldestUnit = units.reduce((min: any, u: any) => {
        const d = new Date(u.created_at)
        return !min || d < min ? d : min
    }, null)
    const monthsActive = oldestUnit
        ? Math.max(1, Math.round((new Date().getTime() - new Date(oldestUnit).getTime()) / (1000 * 60 * 60 * 24 * 30)))
        : 1
    const monthlySalesSpeed = Math.round((soldCount + deliveredCount) / monthsActive * 10) / 10
    const estimatedMonthsToSellOut = forSaleCount > 0 && monthlySalesSpeed > 0
        ? Math.round(forSaleCount / monthlySalesSpeed)
        : null

    return (
        <div className="space-y-4 mb-6">
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">{t('total')}</CardTitle>
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{totalUnits}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">{t('forSale')}</CardTitle>
                        <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{forSaleCount}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">{t('reserved')}</CardTitle>
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{reservedCount}</div>
                        {(blockedCount > 0 || optionCount > 0) && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                                {blockedCount > 0 && `${blockedCount} Bloke`}
                                {blockedCount > 0 && optionCount > 0 && ' • '}
                                {optionCount > 0 && `${optionCount} Opsiyon`}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">{t('sold')}</CardTitle>
                        <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">{soldCount + deliveredCount}</div>
                        {deliveredCount > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">{deliveredCount} teslim edildi</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Doluluk</CardTitle>
                        <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-xl font-bold">%{occupancyRate}</div>
                        {monthlySalesSpeed > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">{monthlySalesSpeed}/ay hız</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">{t('portfolioValue')}</CardTitle>
                        <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 px-4">
                        <div className="text-lg font-bold tracking-tight">
                            {formatCurrency(portfolioValue, currency)}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{t('portfolioDesc')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Portfolio Value Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="shadow-sm bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Satılan Değer</span>
                        </div>
                        <p className="text-lg font-black text-emerald-900">{formatCurrency(soldValue, currency)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote className="h-4 w-4 text-blue-600" />
                            <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Kalan Portföy</span>
                        </div>
                        <p className="text-lg font-black text-blue-900">{formatCurrency(portfolioValue, currency)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm bg-gradient-to-br from-slate-50 to-white border-slate-100">
                    <CardContent className="pt-4 pb-3 px-4">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-slate-600" />
                            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Toplam Portföy</span>
                        </div>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(totalValue, currency)}</p>
                        {estimatedMonthsToSellOut && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                Tahmini tükenme: ~{estimatedMonthsToSellOut} ay
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
