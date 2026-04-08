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
        <div className="flex gap-1 mb-3 overflow-hidden">
            {items.map((item) => (
                <Card key={item.label} className={`flex-1 border-none shadow-sm overflow-hidden ${item.bg}`}>
                    <CardContent className="px-2 py-1.5 flex items-center justify-between gap-1">
                        <div className="flex flex-col space-y-0 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 truncate" title={item.label}>{item.label}</span>
                            <span className={`text-base font-black leading-tight ${item.color}`}>{item.count}</span>
                        </div>
                        <div className={`h-5 w-5 rounded flex-shrink-0 flex items-center justify-center bg-white/60`}>
                            <item.icon className={`h-3 w-3 ${item.color}`} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
