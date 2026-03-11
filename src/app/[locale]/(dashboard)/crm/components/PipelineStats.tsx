'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, FileText, Handshake, CheckCircle2, Trophy, XCircle, Building2 } from "lucide-react"

import { useTranslations } from 'next-intl'

// ... imports

interface PipelineStatsProps {
    stats: {
        Lead: number
        Prospect: number
        Reservation: number
        Proposal: number
        Negotiation: number
        Sold: number
        Completed: number
        Lost: number
    }
}

export function PipelineStats({ stats }: PipelineStatsProps) {
    const t = useTranslations('CRM')

    const items = [
        { label: t('stats.Lead'), count: stats.Lead, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: t('stats.Prospect'), count: stats.Prospect, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: t('stats.Reservation'), count: stats.Reservation, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: t('stats.Proposal'), count: stats.Proposal, icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { label: t('stats.Negotiation'), count: stats.Negotiation, icon: Handshake, color: 'text-violet-500', bg: 'bg-violet-50' },
        { label: t('stats.Sold'), count: stats.Sold, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: t('stats.Completed'), count: stats.Completed, icon: Trophy, color: 'text-green-600', bg: 'bg-green-100' },
        { label: t('stats.Lost'), count: stats.Lost, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {items.map((item) => (
                <Card key={item.label} className="border-none shadow-sm">
                    <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${item.bg} rounded-t-lg px-4 pt-4`}>
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{item.label}</CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent className={`px-4 py-3 ${item.bg} bg-opacity-30 rounded-b-lg`}>
                        <div className="text-2xl font-bold">{item.count}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
