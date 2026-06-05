'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    AlertTriangle, CheckCircle2, Clock, Users, Activity,
    ChevronDown, ChevronUp, Phone, Calendar, Mail, MessageCircle,
    MapPin, BarChart3, Eye, Filter
} from 'lucide-react'

interface RepData {
    name: string
    total: number
    completed: number
    planned: number
    overdue: number
    idleDays: number
    completionRate: number
    lastActivityDate: string | null
    activities: ActivityItem[]
}

interface ActivityItem {
    id: string
    type: string
    status: string
    outcome: string
    summary: string
    priority: string
    dueDate: string | null
    createdAt: string
    completedAt: string | null
    isOverdue: boolean
    daysSinceDue: number | null
    customerName: string
    customerPhone: string
    pipelineStage: string
    projectName: string
}

interface TrackingData {
    repData: RepData[]
    summary: {
        totalReps: number
        totalActivities: number
        totalCompleted: number
        totalPlanned: number
        totalOverdue: number
        completionRate: number
    }
}

const typeIcons: Record<string, any> = {
    'Telefon': Phone,
    'Toplantı': Calendar,
    'E-posta': Mail,
    'WhatsApp': MessageCircle,
    'Saha Gezisi': MapPin,
}

const statusLabels: Record<string, string> = {
    'Lead': 'Aday', 'Prospect': 'Fırsat', 'Reservation': 'Opsiyon',
    'Proposal': 'Teklif', 'Negotiation': 'Pazarlık', 'Sold': 'Satıldı',
    'Contract': 'Sözleşme', 'Completed': 'Kazanıldı',
}

function SummaryCard({ icon: Icon, label, value, color, subtext }: {
    icon: any, label: string, value: string | number, color: string, subtext?: string
}) {
    return (
        <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
                {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
            </div>
        </div>
    )
}

function RepCard({ rep, isExpanded, onToggle }: {
    rep: RepData, isExpanded: boolean, onToggle: () => void
}) {
    const urgencyLevel = rep.overdue >= 10 ? 'critical' : rep.overdue >= 5 ? 'warning' : rep.overdue > 0 ? 'mild' : 'ok'
    const idleLevel = rep.idleDays >= 7 ? 'critical' : rep.idleDays >= 3 ? 'warning' : 'ok'

    const urgencyColors = {
        critical: 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20',
        warning: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20',
        mild: 'border-orange-300/40 bg-orange-50/30 dark:bg-orange-950/10',
        ok: 'border-border bg-card',
    }

    const overdueActivities = rep.activities.filter(a => a.isOverdue)
    const plannedActivities = rep.activities.filter(a => a.status === 'Planned' && !a.isOverdue)

    return (
        <div className={`rounded-xl border-2 ${urgencyColors[urgencyLevel]} overflow-hidden transition-all duration-200`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${urgencyLevel === 'critical' ? 'bg-red-500 text-white' :
                            urgencyLevel === 'warning' ? 'bg-amber-500 text-white' :
                                'bg-primary/10 text-primary'}`}>
                        {rep.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-base">{rep.name}</p>
                        <p className="text-xs text-muted-foreground">
                            Son aktivite: {rep.lastActivityDate
                                ? formatDistanceToNow(new Date(rep.lastActivityDate), { addSuffix: true, locale: tr })
                                : 'Yok'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-4 text-sm">
                        {rep.overdue > 0 && (
                            <span className="flex items-center gap-1.5 text-red-600 font-semibold bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {rep.overdue} gecikmiş
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {rep.planned} bekleyen
                        </span>
                        <span className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            %{rep.completionRate}
                        </span>
                        {rep.idleDays >= 3 && (
                            <span className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full
                                ${idleLevel === 'critical' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' :
                                    'text-amber-600 bg-amber-100 dark:bg-amber-900/30'}`}>
                                ⏸️ {rep.idleDays} gün hareketsiz
                            </span>
                        )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </button>

            {/* Mobile metrics */}
            <div className="sm:hidden px-4 pb-3 flex flex-wrap gap-2 text-xs">
                {rep.overdue > 0 && (
                    <span className="text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                        {rep.overdue} gecikmiş
                    </span>
                )}
                <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {rep.planned} bekleyen
                </span>
                <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    %{rep.completionRate}
                </span>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="border-t px-4 pb-4">
                    {/* Overdue Section */}
                    {overdueActivities.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4" />
                                Gecikmiş Aktiviteler ({overdueActivities.length})
                            </h4>
                            <div className="space-y-2">
                                {overdueActivities.map(act => (
                                    <ActivityRow key={act.id} activity={act} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Planned Section */}
                    {plannedActivities.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                Bekleyen Aktiviteler ({plannedActivities.length})
                            </h4>
                            <div className="space-y-2">
                                {plannedActivities.slice(0, 10).map(act => (
                                    <ActivityRow key={act.id} activity={act} />
                                ))}
                                {plannedActivities.length > 10 && (
                                    <p className="text-xs text-muted-foreground text-center py-1">
                                        +{plannedActivities.length - 10} daha fazla bekleyen aktivite
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {overdueActivities.length === 0 && plannedActivities.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Açık aktivite yok — tüm işler tamamlanmış ✅
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
    const TypeIcon = typeIcons[activity.type] || Activity

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm
            ${activity.isOverdue
                ? 'bg-red-50/80 border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
                : 'bg-muted/30 border-border/50'}`}>

            <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${activity.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className="font-medium">{activity.customerName}</span>
                        {activity.customerPhone && (
                            <span className="text-muted-foreground ml-2 text-xs">{activity.customerPhone}</span>
                        )}
                    </div>
                    {activity.isOverdue && activity.daysSinceDue !== null && (
                        <span className="text-red-600 font-semibold text-xs whitespace-nowrap bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                            {activity.daysSinceDue} gün gecikmiş
                        </span>
                    )}
                </div>

                <p className="text-muted-foreground truncate">{activity.summary}</p>

                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-muted px-2 py-0.5 rounded">{activity.type}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">{activity.priority}</span>
                    {activity.pipelineStage !== '-' && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                            {statusLabels[activity.pipelineStage] || activity.pipelineStage}
                        </span>
                    )}
                    {activity.projectName !== '-' && (
                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded">
                            {activity.projectName}
                        </span>
                    )}
                    {activity.dueDate && (
                        <span className={`px-2 py-0.5 rounded ${activity.isOverdue ? 'bg-red-100 text-red-600' : 'bg-muted'}`}>
                            📅 {format(new Date(activity.dueDate), 'dd MMM yyyy', { locale: tr })}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

type FilterMode = 'all' | 'overdue' | 'idle'

export default function ActivityTrackingClient({ data }: { data: TrackingData }) {
    const [expandedReps, setExpandedReps] = useState<Set<string>>(
        // Auto-expand reps with overdue items
        new Set(data.repData.filter(r => r.overdue > 0).map(r => r.name))
    )
    const [filter, setFilter] = useState<FilterMode>('all')

    const toggleRep = (name: string) => {
        const next = new Set(expandedReps)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        setExpandedReps(next)
    }

    const filteredReps = data.repData.filter(rep => {
        if (filter === 'overdue') return rep.overdue > 0
        if (filter === 'idle') return rep.idleDays >= 3
        return true
    })

    const { summary } = data

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryCard
                    icon={Users}
                    label="Aktif Personel"
                    value={summary.totalReps}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    subtext="Son 90 gün"
                />
                <SummaryCard
                    icon={Activity}
                    label="Toplam Aktivite"
                    value={summary.totalActivities.toLocaleString('tr-TR')}
                    color="bg-slate-100 text-slate-600 dark:bg-slate-800"
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Tamamlama Oranı"
                    value={`%${summary.completionRate}`}
                    color="bg-green-100 text-green-600 dark:bg-green-900/30"
                    subtext={`${summary.totalCompleted.toLocaleString('tr-TR')} tamamlandı`}
                />
                <SummaryCard
                    icon={Clock}
                    label="Bekleyen"
                    value={summary.totalPlanned}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                />
                <SummaryCard
                    icon={AlertTriangle}
                    label="Gecikmiş"
                    value={summary.totalOverdue}
                    color={summary.totalOverdue > 0
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-green-100 text-green-600 dark:bg-green-900/30"}
                    subtext={summary.totalOverdue > 0 ? "Acil müdahale gerekli" : "Sorun yok"}
                />
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                >
                    Tümü ({data.repData.length})
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${filter === 'overdue' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'}`}
                >
                    Gecikmiş ({data.repData.filter(r => r.overdue > 0).length})
                </button>
                <button
                    onClick={() => setFilter('idle')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${filter === 'idle' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300'}`}
                >
                    Hareketsiz ({data.repData.filter(r => r.idleDays >= 3).length})
                </button>
            </div>

            {/* Rep Cards */}
            <div className="space-y-3">
                {filteredReps.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Bu filtreye uygun danışman bulunamadı.
                    </div>
                ) : (
                    filteredReps.map(rep => (
                        <RepCard
                            key={rep.name}
                            rep={rep}
                            isExpanded={expandedReps.has(rep.name)}
                            onToggle={() => toggleRep(rep.name)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
