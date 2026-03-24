'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, FileText, Handshake, CheckCircle2, Trophy, XCircle } from "lucide-react"
import { useTranslations } from 'next-intl'

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
    projectBreakdown?: Record<string, Record<string, number>>
}

export function PipelineStats({ stats, projectBreakdown }: PipelineStatsProps) {
    const t = useTranslations('CRM')

    const items = [
        { key: 'Lead',        label: t('stats.Lead'),        count: stats.Lead,        icon: Users,       color: 'text-blue-500',    bg: 'bg-blue-50',    bar: 'bg-blue-300' },
        { key: 'Prospect',    label: t('stats.Prospect'),    count: stats.Prospect,    icon: Target,      color: 'text-indigo-500',  bg: 'bg-indigo-50',  bar: 'bg-indigo-300' },
        { key: 'Reservation', label: t('stats.Reservation'), count: stats.Reservation, icon: Clock,       color: 'text-amber-500',   bg: 'bg-amber-50',   bar: 'bg-amber-300' },
        { key: 'Proposal',    label: t('stats.Proposal'),    count: stats.Proposal,    icon: FileText,    color: 'text-cyan-500',    bg: 'bg-cyan-50',    bar: 'bg-cyan-300' },
        { key: 'Negotiation', label: t('stats.Negotiation'), count: stats.Negotiation, icon: Handshake,   color: 'text-violet-500',  bg: 'bg-violet-50',  bar: 'bg-violet-300' },
        { key: 'Sold',        label: t('stats.Sold'),        count: stats.Sold,        icon: CheckCircle2,color: 'text-emerald-500', bg: 'bg-emerald-50', bar: 'bg-emerald-300' },
        { key: 'Completed',   label: t('stats.Completed'),   count: stats.Completed,   icon: Trophy,      color: 'text-green-600',   bg: 'bg-green-100',  bar: 'bg-green-400' },
        { key: 'Lost',        label: t('stats.Lost'),        count: stats.Lost,        icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',     bar: 'bg-red-300' },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {items.map((item) => {
                const breakdown = projectBreakdown?.[item.key]
                const breakdownEntries = breakdown
                    ? Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 4)
                    : []

                return (
                    <Card key={item.label} className="border-none shadow-sm overflow-hidden">
                        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${item.bg} px-4 pt-4`}>
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{item.label}</CardTitle>
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                        </CardHeader>
                        <CardContent className={`px-4 pt-2 pb-3 ${item.bg} bg-opacity-30`}>
                            <div className="text-2xl font-bold mb-2">{item.count}</div>
                            {breakdownEntries.length > 0 && (
                                <div className="space-y-1 border-t border-black/5 pt-2">
                                    {breakdownEntries.map(([name, count]) => (
                                        <div key={name} className="flex items-center justify-between gap-1">
                                            <span className="text-[10px] text-muted-foreground truncate flex-1 leading-tight">
                                                {name.replace('NOVO PARK ', '').replace('NOVO ', '')}
                                            </span>
                                            <span className={`text-[10px] font-bold ${item.color} tabular-nums flex-shrink-0`}>
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

