'use client'

import { useState, useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    AlertTriangle, CheckCircle2, Clock, Users, Activity,
    ChevronDown, ChevronUp, Phone, Calendar, Mail, MessageCircle,
    MapPin, Filter, Search, ChevronLeft, ChevronRight, ChevronsLeft,
    ChevronsRight, ArrowUpDown, Maximize2, Minimize2, Sparkles, AlertCircle,
    FileSpreadsheet, PhoneCall, PhoneOff, PhoneMissed, CheckCircle, XCircle,
    MessageSquare, Hash, TrendingUp
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatTurkeyDateTime } from '@/lib/utils'
import { exportToExcel } from '@/lib/report-export'

interface RepData {
    name: string
    total: number
    completed: number
    planned: number
    overdue: number
    idleDays: number
    completionRate: number
    lastActivityDate: string | null
    appointments?: {
        total: number
        attended: number
        noShow: number
        rescheduled: number
        cancelled: number
        planned: number
        showUpRate: number
    }
    contactLogs?: {
        total: number
        positive: number
        negative: number
        unreachable: number
        busy: number
        invalidNumber: number
        whatsapp: number
        pending: number
        reachRate: number
    }
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
        appointmentSummary?: {
            total: number
            attended: number
            noShow: number
            rescheduled: number
            showUpRate: number
        }
        contactSummary?: {
            total: number
            positive: number
            negative: number
            unreachable: number
            busy: number
            invalidNumber: number
            whatsapp: number
            pending: number
            reachRate: number
        }
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

function SummaryCard({ icon: Icon, label, value, color, subtext, active, onClick }: {
    icon: any, label: string, value: string | number, color: string, subtext?: string, active?: boolean, onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-xl border bg-card p-4 flex items-start gap-3.5 transition-all duration-200 shadow-sm",
                onClick && "cursor-pointer hover:border-slate-400 hover:shadow-md",
                active && "ring-2 ring-blue-500 border-transparent bg-blue-50/20"
            )}
        >
            <div className={`p-2.5 rounded-xl shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
                {subtext && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtext}</p>}
            </div>
        </div>
    )
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
    const TypeIcon = typeIcons[activity.type] || Activity

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-colors
            ${activity.isOverdue
                ? 'bg-red-50/80 border-red-200/90 dark:bg-red-950/20 dark:border-red-900/40'
                : 'bg-white border-slate-200/70 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800'}`}>

            <div className={cn("p-1.5 rounded-md shrink-0 mt-0.5", activity.isOverdue ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600")}>
                <TypeIcon className="h-3.5 w-3.5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{activity.customerName}</span>
                        {activity.customerPhone && (
                            <a
                                href={`tel:${activity.customerPhone}`}
                                className="text-blue-600 hover:underline text-[11px] flex items-center gap-1 shrink-0 font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Phone className="h-3 w-3" />
                                {activity.customerPhone}
                            </a>
                        )}
                    </div>
                    {activity.isOverdue && activity.daysSinceDue !== null && (
                        <Badge variant="destructive" className="text-[10px] px-2 py-0.5 h-5 font-bold shrink-0">
                            {activity.daysSinceDue} gün gecikmiş
                        </Badge>
                    )}
                </div>

                <p className="text-slate-600 dark:text-slate-400 font-medium truncate" title={activity.summary}>
                    {activity.summary}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {activity.type}
                    </span>
                    {activity.priority && (
                        <span className={cn(
                            "px-1.5 py-0.5 rounded font-medium",
                            activity.priority === 'Urgent' ? "bg-red-100 text-red-700" :
                            activity.priority === 'High' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
                        )}>
                            {activity.priority === 'Urgent' ? 'Acil' : activity.priority === 'High' ? 'Yüksek' : activity.priority}
                        </span>
                    )}
                    {activity.pipelineStage && activity.pipelineStage !== '-' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                            {statusLabels[activity.pipelineStage] || activity.pipelineStage}
                        </span>
                    )}
                    {activity.projectName && activity.projectName !== '-' && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                            📁 {activity.projectName}
                        </span>
                    )}
                    {activity.dueDate && (
                        <span className={cn(
                            "px-1.5 py-0.5 rounded font-medium flex items-center gap-1",
                            activity.isOverdue ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                        )}>
                            <Calendar className="h-3 w-3" />
                            {formatTurkeyDateTime(activity.dueDate, 'compact')}
                        </span>
                    )}
                </div>
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
        critical: 'border-red-400 bg-red-50/40 dark:bg-red-950/20',
        warning: 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20',
        mild: 'border-orange-300 bg-orange-50/30 dark:bg-orange-950/10',
        ok: 'border-slate-200 bg-white dark:bg-slate-900',
    }

    const overdueActivities = rep.activities.filter(a => a.isOverdue)
    const plannedActivities = rep.activities.filter(a => a.status === 'Planned' && !a.isOverdue)

    // Internal activity list limit state
    const [displayLimit, setDisplayLimit] = useState(5)

    return (
        <div className={`rounded-xl border-2 ${urgencyColors[urgencyLevel]} overflow-hidden transition-all duration-200 shadow-sm`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
                <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm shrink-0
                        ${urgencyLevel === 'critical' ? 'bg-red-600 text-white' :
                            urgencyLevel === 'warning' ? 'bg-amber-600 text-white' :
                                'bg-blue-600 text-white'}`}>
                        {rep.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">{rep.name}</p>
                            {rep.idleDays >= 3 && (
                                <Badge variant="outline" className={cn(
                                    "text-[10px] px-1.5 py-0 h-4 font-bold border",
                                    idleLevel === 'critical' ? "bg-red-100 text-red-800 border-red-300" : "bg-amber-100 text-amber-800 border-amber-300"
                                )}>
                                    ⏸️ {rep.idleDays} gün pasif
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Son aktivite: {rep.lastActivityDate
                                ? formatDistanceToNow(new Date(rep.lastActivityDate), { addSuffix: true, locale: tr })
                                : 'Yok'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Metrics desktop */}
                    <div className="hidden lg:flex items-center gap-2.5 text-xs font-semibold">
                        {rep.contactLogs && rep.contactLogs.total > 0 && (
                            <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-slate-200 dark:border-slate-800 text-[11px]">
                                {rep.contactLogs.positive > 0 && (
                                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold" title="Olumlu Temas">
                                        🟢 {rep.contactLogs.positive}
                                    </span>
                                )}
                                {rep.contactLogs.unreachable > 0 && (
                                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium" title="Ulaşılamadı">
                                        📵 {rep.contactLogs.unreachable}
                                    </span>
                                )}
                                {rep.contactLogs.invalidNumber > 0 && (
                                    <span className="text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-bold" title="Hatalı Numara">
                                        🚫 {rep.contactLogs.invalidNumber}
                                    </span>
                                )}
                                <span className="text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold" title="Ulaşma Başarı Oranı">
                                    📈 %{rep.contactLogs.reachRate}
                                </span>
                            </div>
                        )}
                        {rep.overdue > 0 ? (
                            <span className="flex items-center gap-1 text-red-700 bg-red-100 border border-red-200 dark:bg-red-900/30 dark:text-red-300 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {rep.overdue} gecikmiş
                            </span>
                        ) : (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px]">
                                Geciken Yok
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                            {rep.planned} bekleyen
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            %{rep.completionRate}
                        </span>
                    </div>

                    <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                </div>
            </button>

            {/* Mobile metrics */}
            <div className="sm:hidden px-4 pb-3 flex flex-wrap gap-2 text-xs">
                {rep.contactLogs && rep.contactLogs.total > 0 && (
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                        📞 {rep.contactLogs.total} Log (%{rep.contactLogs.reachRate} Ulaşma)
                    </span>
                )}
                {rep.overdue > 0 && (
                    <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                        ⚠️ {rep.overdue} gecikmiş
                    </span>
                )}
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border">
                    {rep.planned} bekleyen
                </span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                    %{rep.completionRate} tamamlama
                </span>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="border-t border-slate-200/80 bg-slate-50/50 dark:bg-slate-950/30 px-4 pb-4">
                    {/* Overdue Section */}
                    {overdueActivities.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4" />
                                    Gecikmiş Aktiviteler ({overdueActivities.length})
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {overdueActivities.slice(0, displayLimit).map(act => (
                                    <ActivityRow key={act.id} activity={act} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Planned Section */}
                    {plannedActivities.length > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    Bekleyen Planlı Aktiviteler ({plannedActivities.length})
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {plannedActivities.slice(0, displayLimit).map(act => (
                                    <ActivityRow key={act.id} activity={act} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show More / Show Less controls inside Rep card */}
                    {((overdueActivities.length > displayLimit) || (plannedActivities.length > displayLimit)) ? (
                        <div className="mt-3 flex justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setDisplayLimit(prev => prev + 10)
                                }}
                                className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white shadow-xs"
                            >
                                Daha Fazla Aktivite Göster (+10)
                            </Button>
                        </div>
                    ) : displayLimit > 5 && (
                        <div className="mt-3 flex justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setDisplayLimit(5)
                                }}
                                className="h-7 text-xs text-slate-500"
                            >
                                Daralt
                            </Button>
                        </div>
                    )}

                    {overdueActivities.length === 0 && plannedActivities.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 mt-4 font-medium">
                            ✅ Bu temsilcinin bekleyen veya geciken açık aktivitesi bulunmamaktadır.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

type FilterMode = 'all' | 'overdue' | 'idle' | 'completed'
type SortMode = 'overdue' | 'idle' | 'completion' | 'name'

export default function ActivityTrackingClient({ data }: { data: TrackingData }) {
    // Search, Filter & Sort States
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<FilterMode>('all')
    const [sortBy, setSortBy] = useState<SortMode>('overdue')

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState<number>(10)

    // Expanded Cards State
    const [expandedReps, setExpandedReps] = useState<Set<string>>(
        // Auto-expand reps with overdue items
        new Set(data.repData.filter(r => r.overdue > 0).map(r => r.name))
    )

    // Processed (Filtered & Sorted) Reps
    const processedReps = useMemo(() => {
        let result = [...data.repData]

        // 1. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            result = result.filter(rep => {
                const matchesName = rep.name.toLowerCase().includes(q)
                const matchesActivity = rep.activities.some(a =>
                    (a.customerName && a.customerName.toLowerCase().includes(q)) ||
                    (a.projectName && a.projectName.toLowerCase().includes(q)) ||
                    (a.summary && a.summary.toLowerCase().includes(q))
                )
                return matchesName || matchesActivity
            })
        }

        // 2. Tab Filter
        if (filter === 'overdue') {
            result = result.filter(r => r.overdue > 0)
        } else if (filter === 'idle') {
            result = result.filter(r => r.idleDays >= 3)
        } else if (filter === 'completed') {
            result = result.filter(r => r.completionRate === 100 && r.total > 0)
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'overdue') {
                if (b.overdue !== a.overdue) return b.overdue - a.overdue
                return b.idleDays - a.idleDays
            }
            if (sortBy === 'idle') {
                if (b.idleDays !== a.idleDays) return b.idleDays - a.idleDays
                return b.overdue - a.overdue
            }
            if (sortBy === 'completion') {
                return b.completionRate - a.completionRate
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name, 'tr')
            }
            return 0
        })

        return result
    }, [data.repData, searchQuery, filter, sortBy])

    // Pagination calculations
    const effectivePageSize = pageSize === 0 ? processedReps.length || 1 : pageSize
    const totalPages = Math.max(1, Math.ceil(processedReps.length / effectivePageSize))
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

    const startIndex = pageSize === 0 ? 0 : (safeCurrentPage - 1) * pageSize
    const endIndex = pageSize === 0 ? processedReps.length : Math.min(startIndex + pageSize, processedReps.length)
    const currentReps = processedReps.slice(startIndex, endIndex)

    // Expand/Collapse Handlers
    const toggleRep = (name: string) => {
        const next = new Set(expandedReps)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        setExpandedReps(next)
    }

    const expandAll = () => {
        setExpandedReps(new Set(processedReps.map(r => r.name)))
    }

    const collapseAll = () => {
        setExpandedReps(new Set())
    }

    const [showContactMatrix, setShowContactMatrix] = useState(true)

    const { summary } = data
    const contactSummary = summary.contactSummary

    const handleExportContactMatrix = () => {
        const matrixData = data.repData.map(r => ({
            'Temsilci': r.name,
            'Toplam Temas Logu': r.contactLogs?.total || 0,
            'Olumlu / Randevu': r.contactLogs?.positive || 0,
            'Olumsuz': r.contactLogs?.negative || 0,
            'Ulaşılamadı': r.contactLogs?.unreachable || 0,
            'Hatalı / Geçersiz No': r.contactLogs?.invalidNumber || 0,
            'Meşgul': r.contactLogs?.busy || 0,
            'WhatsApp / SMS': r.contactLogs?.whatsapp || 0,
            'Ulaşma Başarı Oranı (%)': `%${r.contactLogs?.reachRate || 0}`,
            'Randevu Katılım Oranı (%)': `%${r.appointments?.showUpRate || 0}`,
            'Toplam Aktivite': r.total,
            'Tamamlanan': r.completed,
            'Geciken': r.overdue,
            'Pasif Gün Sayısı': r.idleDays === 999 ? 'Aktivite Yok' : r.idleDays,
        }))
        exportToExcel(matrixData, `temas_ve_log_analitigi_${new Date().toISOString().slice(0, 10)}`, 'Temas Analitiği')
    }

    const handleExportActivities = () => {
        const allActivities = data.repData.flatMap(r =>
            r.activities.map(a => ({
                'Temsilci': r.name,
                'Müşteri Adı': a.customerName,
                'Telefon': a.customerPhone || '-',
                'Aktivite Türü': a.type,
                'Durum': a.status,
                'Sonuç / Outcome': a.outcome,
                'Özet / Açıklama': a.summary,
                'Öncelik': a.priority,
                'Vade Tarihi': a.dueDate ? formatTurkeyDateTime(a.dueDate, 'dateTime') : '-',
                'Gecikme Durumu': a.isOverdue ? `${a.daysSinceDue} gün gecikmiş` : 'Zamanında / Tamamlandı',
                'İlgili Proje': a.projectName,
                'Satış Aşaması': a.pipelineStage,
                'Oluşturulma Tarihi': a.createdAt ? formatTurkeyDateTime(a.createdAt, 'dateTime') : '-'
            }))
        )
        exportToExcel(allActivities, `aktivite_ve_gorev_raporu_${new Date().toISOString().slice(0, 10)}`, 'Aktivite Listesi')
    }

    return (
        <div className="space-y-6">
            {/* Contact Logs & Call Analytics Section (Item 2 & 4) */}
            <div className="rounded-2xl border bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <PhoneCall className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Temas Sonuçları & Arama Logları Analitiği
                                </h3>
                                <Badge variant="secondary" className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Canlı Log Özeti
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Müşteri arama ve temas sonuçları, ulaşılamayan ve hatalı numara kayıtlarının ekip analitiği
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportContactMatrix}
                            className="h-8 text-xs font-semibold gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Log Matrisi (Excel)</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportActivities}
                            className="h-8 text-xs font-semibold gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                            <span>Tüm Aktiviteler (Excel)</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowContactMatrix(!showContactMatrix)}
                            className="h-8 px-2 text-xs text-slate-500 hover:bg-slate-100"
                            title={showContactMatrix ? "Matrisi Gizle" : "Matrisi Göster"}
                        >
                            {showContactMatrix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                    <div className="rounded-xl border bg-card p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                            <PhoneCall className="h-3.5 w-3.5 text-slate-600" />
                            <span className="text-[11px] font-semibold">Toplam Temas</span>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                            {contactSummary?.total?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-emerald-50/50 border-emerald-200/80 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">🟢 Olumlu</span>
                        </div>
                        <p className="text-xl font-extrabold text-emerald-700">
                            {contactSummary?.positive?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-rose-50/50 border-rose-200/80 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-rose-700 mb-1">
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">🔴 Olumsuz</span>
                        </div>
                        <p className="text-xl font-extrabold text-rose-700">
                            {contactSummary?.negative?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-amber-50/50 border-amber-200/80 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                            <PhoneMissed className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">📵 Ulaşılamadı</span>
                        </div>
                        <p className="text-xl font-extrabold text-amber-700">
                            {contactSummary?.unreachable?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-red-50/70 border-red-200 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-red-700 mb-1">
                            <PhoneOff className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">🚫 Hatalı No</span>
                        </div>
                        <p className="text-xl font-extrabold text-red-700">
                            {contactSummary?.invalidNumber?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-slate-50 border-slate-200 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">📳 Meşgul</span>
                        </div>
                        <p className="text-xl font-extrabold text-slate-700">
                            {contactSummary?.busy?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-teal-50/50 border-teal-200/80 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-teal-700 mb-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">💬 WhatsApp</span>
                        </div>
                        <p className="text-xl font-extrabold text-teal-700">
                            {contactSummary?.whatsapp?.toLocaleString('tr-TR') || 0}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-blue-50/60 border-blue-200 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-blue-700 mb-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">📈 Ulaşma %</span>
                        </div>
                        <p className="text-xl font-extrabold text-blue-700">
                            %{contactSummary?.reachRate || 0}
                        </p>
                    </div>
                </div>

                {/* Rep Contact Matrix Table (Collapsible) */}
                {showContactMatrix && (
                    <div className="border rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs mt-3">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="py-2.5 px-3">Temsilci</th>
                                        <th className="py-2.5 px-3 text-center">Toplam Log</th>
                                        <th className="py-2.5 px-3 text-center text-emerald-700">🟢 Olumlu</th>
                                        <th className="py-2.5 px-3 text-center text-rose-700">🔴 Olumsuz</th>
                                        <th className="py-2.5 px-3 text-center text-amber-700">📵 Ulaşılamadı</th>
                                        <th className="py-2.5 px-3 text-center text-red-700">🚫 Hatalı No</th>
                                        <th className="py-2.5 px-3 text-center text-slate-600">📳 Meşgul</th>
                                        <th className="py-2.5 px-3 text-center text-teal-700">💬 WhatsApp</th>
                                        <th className="py-2.5 px-3 text-center text-blue-700">Ulaşma Başarısı</th>
                                        <th className="py-2.5 px-3 text-center text-purple-700">Randevu Katılım</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.repData.map(rep => {
                                        const c = rep.contactLogs || { total: 0, positive: 0, negative: 0, unreachable: 0, busy: 0, invalidNumber: 0, whatsapp: 0, reachRate: 0 }
                                        const app = rep.appointments || { total: 0, attended: 0, showUpRate: 100 }
                                        return (
                                            <tr
                                                key={rep.name}
                                                onClick={() => {
                                                    setSearchQuery(rep.name)
                                                    setCurrentPage(1)
                                                }}
                                                className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                                title={`${rep.name} filtrelemek için tıklayın`}
                                            >
                                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        {rep.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span>{rep.name}</span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                                    {c.total}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                                                    {c.positive > 0 ? c.positive : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                                                    {c.negative > 0 ? c.negative : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                                                    {c.unreachable > 0 ? c.unreachable : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center font-bold text-red-600">
                                                    {c.invalidNumber > 0 ? (
                                                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                                            {c.invalidNumber}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-slate-600">
                                                    {c.busy > 0 ? c.busy : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center text-teal-600 font-medium">
                                                    {c.whatsapp > 0 ? c.whatsapp : '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full",
                                                                    c.reachRate >= 70 ? "bg-emerald-500" :
                                                                    c.reachRate >= 40 ? "bg-blue-500" : "bg-amber-500"
                                                                )}
                                                                style={{ width: `${Math.min(100, Math.max(0, c.reachRate))}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            %{c.reachRate}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    {app.total > 0 ? (
                                                        <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                                            %{app.showUpRate} ({app.attended}/{app.total})
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryCard
                    icon={Users}
                    label="Aktif Personel"
                    value={summary.totalReps}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    subtext="Son 90 gün aktif temsilciler"
                    active={filter === 'all'}
                    onClick={() => { setFilter('all'); setCurrentPage(1); }}
                />
                <SummaryCard
                    icon={Activity}
                    label="Toplam Aktivite"
                    value={summary.totalActivities.toLocaleString('tr-TR')}
                    color="bg-slate-100 text-slate-700 dark:bg-slate-800"
                    subtext={`${summary.totalCompleted} tamamlanan`}
                />
                <SummaryCard
                    icon={CheckCircle2}
                    label="Tamamlama Oranı"
                    value={`%${summary.completionRate}`}
                    color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                    subtext="Genel başarı oranı"
                    active={filter === 'completed'}
                    onClick={() => { setFilter('completed'); setCurrentPage(1); }}
                />
                <SummaryCard
                    icon={Clock}
                    label="Bekleyen"
                    value={summary.totalPlanned}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                    subtext="Planlı görevler"
                />
                <SummaryCard
                    icon={AlertTriangle}
                    label="Gecikmiş"
                    value={summary.totalOverdue}
                    color={summary.totalOverdue > 0
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"}
                    subtext={summary.totalOverdue > 0 ? "Acil müdahale gerekli" : "Tüm işler güncel"}
                    active={filter === 'overdue'}
                    onClick={() => { setFilter('overdue'); setCurrentPage(1); }}
                />
            </div>

            {/* Filter, Search & Controls Bar */}
            <div className="flex flex-col gap-4 border rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Temsilci adı, müşteri veya aktivite ara..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setFilter('all'); setCurrentPage(1); }}
                            className="h-8 text-xs font-semibold rounded-lg"
                        >
                            Tümü ({data.repData.length})
                        </Button>
                        <Button
                            variant={filter === 'overdue' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => { setFilter('overdue'); setCurrentPage(1); }}
                            className={cn(
                                "h-8 text-xs font-semibold rounded-lg gap-1.5",
                                filter === 'overdue' ? "" : "border-red-200 text-red-700 hover:bg-red-50"
                            )}
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Gecikmiş Var ({data.repData.filter(r => r.overdue > 0).length})
                        </Button>
                        <Button
                            variant={filter === 'idle' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => { setFilter('idle'); setCurrentPage(1); }}
                            className={cn(
                                "h-8 text-xs font-semibold rounded-lg gap-1.5",
                                filter === 'idle' ? "bg-amber-500 text-white hover:bg-amber-600" : "border-amber-200 text-amber-700 hover:bg-amber-50"
                            )}
                        >
                            ⏸️ Hareketsiz ({data.repData.filter(r => r.idleDays >= 3).length})
                        </Button>
                        <Button
                            variant={filter === 'completed' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => { setFilter('completed'); setCurrentPage(1); }}
                            className={cn(
                                "h-8 text-xs font-semibold rounded-lg gap-1.5",
                                filter === 'completed' ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            )}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            %100 Başarı ({data.repData.filter(r => r.completionRate === 100 && r.total > 0).length})
                        </Button>
                    </div>
                </div>

                {/* Sort & Pagination controls bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-500">Sıralama:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortMode)}
                                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                            >
                                <option value="overdue">En Çok Gecikenler</option>
                                <option value="idle">En Çok Pasif Kalanlar</option>
                                <option value="completion">Tamamlama Oranına Göre (% Yüksek)</option>
                                <option value="name">Temsilci Adı (A-Z)</option>
                            </select>
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 px-2 text-[11px] text-blue-600 hover:bg-blue-50">
                                <Maximize2 className="h-3 w-3 mr-1" /> tümünü aç
                            </Button>
                            <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 px-2 text-[11px] text-slate-500 hover:bg-slate-100">
                                <Minimize2 className="h-3 w-3 mr-1" /> kapat
                            </Button>
                        </div>
                    </div>

                    {/* Page size selector */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-slate-500 font-medium">Sayfa Başına:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value))
                                setCurrentPage(1)
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-bold"
                        >
                            <option value={5}>5 Danışman</option>
                            <option value={10}>10 Danışman</option>
                            <option value={20}>20 Danışman</option>
                            <option value={50}>50 Danışman</option>
                            <option value={0}>Tümü ({processedReps.length})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Rep Cards Listing */}
            <div className="space-y-3">
                {currentReps.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white dark:bg-slate-900 p-8">
                        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">Filtreye Uygun Temsilci Bulunamadı</h3>
                        <p className="text-xs text-muted-foreground mt-1">Arama kriterlerinizi sıfırlayarak tüm temsilcileri görüntüleyebilirsiniz.</p>
                        <Button variant="outline" size="sm" className="mt-4 h-8 text-xs" onClick={() => { setSearchQuery(''); setFilter('all'); setPageSize(10); }}>
                            Filtreleri Temizle
                        </Button>
                    </div>
                ) : (
                    currentReps.map(rep => (
                        <RepCard
                            key={rep.name}
                            rep={rep}
                            isExpanded={expandedReps.has(rep.name)}
                            onToggle={() => toggleRep(rep.name)}
                        />
                    ))
                )}
            </div>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Toplam <span className="font-extrabold text-slate-900 dark:text-slate-100">{processedReps.length}</span> temsilciden{' '}
                        <span className="font-bold text-blue-600">{startIndex + 1} - {endIndex}</span> arası gösteriliyor (Sayfa {safeCurrentPage} / {totalPages})
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(1)}
                            disabled={safeCurrentPage === 1}
                            title="İlk Sayfa"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs font-bold"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Önceki
                        </Button>

                        {/* Page Number Buttons */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                            .map((p, idx, arr) => {
                                const prevPage = arr[idx - 1]
                                const showEllipsis = prevPage && p - prevPage > 1
                                return (
                                    <div key={p} className="flex items-center">
                                        {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                                        <Button
                                            variant={safeCurrentPage === p ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn("h-8 w-8 text-xs font-bold p-0", safeCurrentPage === p ? "bg-blue-600 hover:bg-blue-700" : "")}
                                            onClick={() => setCurrentPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    </div>
                                )
                            })}

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs font-bold"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage === totalPages}
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={safeCurrentPage === totalPages}
                            title="Son Sayfa"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
