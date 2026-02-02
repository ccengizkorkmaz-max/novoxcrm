'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle2, Clock, FileText } from "lucide-react"
import { useTranslations } from 'next-intl'

interface DashboardGeneralStatsProps {
    stats: {
        total: number
        sold: number
        reserved: number
        offers: number
    }
}

export function DashboardGeneralStats({ stats }: DashboardGeneralStatsProps) {
    const t = useTranslations('Dashboard.stats')

    const items = [
        {
            title: t('totalStock'),
            value: stats.total,
            description: t('totalUnits'),
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: t('sold'),
            value: stats.sold,
            description: t('completedSales'),
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: t('reservedUnits'),
            value: stats.reserved,
            description: t('optioned'),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
        {
            title: t('activeOffers'),
            value: stats.offers,
            description: t('offersSent'),
            icon: FileText,
            color: "text-purple-600",
            bg: "bg-purple-50"
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
                <Card key={index} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <div className={`p-2 rounded-lg ${item.bg}`}>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
