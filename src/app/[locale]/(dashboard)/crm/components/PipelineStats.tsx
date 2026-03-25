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
}

export function PipelineStats({ stats }: PipelineStatsProps) {
    const t = useTranslations('CRM')

    const items = [
        { label: t('stats.Lead'),        count: stats.Lead,        icon: Users,        color: 'text-blue-500',    bg: 'bg-blue-50' },
        { label: t('stats.Prospect'),    count: stats.Prospect,    icon: Target,       color: 'text-indigo-500',  bg: 'bg-indigo-50' },
        { label: t('stats.Reservation'), count: stats.Reservation, icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50' },
        { label: t('stats.Proposal'),    count: stats.Proposal,    icon: FileText,     color: 'text-cyan-500',    bg: 'bg-cyan-50' },
        { label: t('stats.Negotiation'), count: stats.Negotiation, icon: Handshake,    color: 'text-violet-500',  bg: 'bg-violet-50' },
        { label: t('stats.Sold'),        count: stats.Sold,        icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: t('stats.Completed'),   count: stats.Completed,   icon: Trophy,       color: 'text-green-600',   bg: 'bg-green-100' },
        { label: t('stats.Lost'),        count: stats.Lost,        icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50' },
    ]

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {items.map((item) => (
                <Card key={item.label} className={`flex-1 min-w-[120px] border-none shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden ${item.bg}`}>
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="flex flex-col space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate max-w-[80px]" title={item.label}>{item.label}</span>
                            <span className={`text-xl font-black ${item.color}`}>{item.count}</span>
                        </div>
                        <div className={`h-7 w-7 rounded-lg bg-white/60 shadow-sm flex items-center justify-center flex-shrink-0`}>
                            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
