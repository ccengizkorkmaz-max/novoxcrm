'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, Key, Banknote, BadgeCheck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

import { useTranslations } from 'next-intl'

interface InventoryStatsProps {
    units: any[]
}

export function InventoryStats({ units }: InventoryStatsProps) {
    const t = useTranslations('Inventory.stats')
    // Determine the main currency based on first item or default to TRY
    // In a real app we might sum currencies separately, but for MVP we assume predominant currency
    const currency = units.length > 0 ? units[0].currency : 'TRY'

    const totalUnits = units.length
    const forSaleCount = units.filter(u => u.status === 'For Sale').length
    const reservedCount = units.filter(u => u.status === 'Reserved').length
    const soldCount = units.filter(u => u.status === 'Sold').length

    // Calculate Portfolio Value (For Sale only, or Total Potential?)
    // Usually "Portfolio Value" implies what is on the shelf (For Sale).
    // Let's show Estimated Revenue (For Sale)
    const portfolioValue = units
        .filter(u => u.status === 'For Sale')
        .reduce((sum, u) => sum + (Number(u.price) || 0), 0)

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('total')}</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnits}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('forSale')}</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{forSaleCount}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('reserved')}</CardTitle>
                    <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{reservedCount}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('sold')}</CardTitle>
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{soldCount}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('portfolioValue')}</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold tracking-tight">
                        {formatCurrency(portfolioValue, currency)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('portfolioDesc')}</p>
                </CardContent>
            </Card>
        </div>
    )
}
