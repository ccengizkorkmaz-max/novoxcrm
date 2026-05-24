'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, FileText, Handshake, CheckCircle2, Trophy, XCircle, Phone, Eye, Send, FileSignature } from "lucide-react"
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
    tenantType?: string
}

export function PipelineStats({ stats, tenantType = 'developer' }: PipelineStatsProps) {
    const t = useTranslations('CRM')
    const isBroker = tenantType === 'broker'

    const devItems = [
        { label: t('stats.Lead'),        count: stats.Lead,        icon: Users,        color: 'text-blue-500',    bg: 'bg-blue-50' },
        { label: t('stats.Prospect'),    count: stats.Prospect,    icon: Target,       color: 'text-indigo-500',  bg: 'bg-indigo-50' },
        { label: t('stats.Reservation'), count: stats.Reservation, icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50' },
        { label: t('stats.Proposal'),    count: stats.Proposal,    icon: FileText,     color: 'text-cyan-500',    bg: 'bg-cyan-50' },
        { label: t('stats.Negotiation'), count: stats.Negotiation, icon: Handshake,    color: 'text-violet-500',  bg: 'bg-violet-50' },
        { label: t('stats.Sold'),        count: stats.Sold,        icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: t('stats.Completed'),   count: stats.Completed,   icon: Trophy,       color: 'text-green-600',   bg: 'bg-green-100' },
        { label: t('stats.Lost'),        count: stats.Lost,        icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50' },
    ]

    // Broker pipeline: maps to the same DB statuses but with different labels
    // Lead → Yeni Talep, Prospect → İletişim, Reservation → Gösterim,
    // Proposal → Teklif, Negotiation → Pazarlık, Sold → Sözleşme, Completed → Kapandı
    const brokerItems = [
        { label: 'Yeni Talep',   count: stats.Lead,        icon: Users,          color: 'text-blue-500',    bg: 'bg-blue-50' },
        { label: 'İletişim',     count: stats.Prospect,    icon: Phone,          color: 'text-indigo-500',  bg: 'bg-indigo-50' },
        { label: 'Gösterim',     count: stats.Reservation, icon: Eye,            color: 'text-amber-500',   bg: 'bg-amber-50' },
        { label: 'Teklif',       count: stats.Proposal,    icon: Send,           color: 'text-cyan-500',    bg: 'bg-cyan-50' },
        { label: 'Pazarlık',     count: stats.Negotiation, icon: Handshake,      color: 'text-violet-500',  bg: 'bg-violet-50' },
        { label: 'Sözleşme',     count: stats.Sold,        icon: FileSignature,  color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Kapandı',      count: stats.Completed,   icon: Trophy,         color: 'text-green-600',   bg: 'bg-green-100' },
        { label: 'Kaybedildi',   count: stats.Lost,        icon: XCircle,        color: 'text-red-500',     bg: 'bg-red-50' },
    ]

    const items = isBroker ? brokerItems : devItems

    return (
        <div className="flex gap-1 mb-1 overflow-hidden">
            {items.map((item) => (
                <Card key={item.label} className={`flex-1 border-none shadow-sm overflow-hidden ${item.bg}`}>
                    <CardContent className="px-2 py-1 flex items-center justify-between gap-1">
                        <div className="flex flex-col space-y-0 min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 truncate" title={item.label}>{item.label}</span>
                            <span className={`text-sm font-black leading-tight ${item.color}`}>{item.count}</span>
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
