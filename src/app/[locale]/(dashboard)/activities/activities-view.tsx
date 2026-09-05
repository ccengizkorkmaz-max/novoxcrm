'use client'

import { useState, useMemo } from 'react'
import {
    isToday, isTomorrow, isYesterday, isPast, isThisWeek, isThisMonth,
    parseISO, format, startOfWeek, endOfWeek, addDays
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
    Plus, Filter, ChevronUp, ChevronDown, Check, X, Calendar as CalendarIcon,
    Search, Clock, CheckCircle2, AlertTriangle, Video, Phone,
    Building2, RefreshCw, LayoutList, CalendarDays, CalendarRange,
    Grid3X3, Sparkles, User, ArrowUpDown, BarChart3
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ActivityStreamCard, ActivityItem } from '@/components/activities/activity-stream-card'
import { ActivityDailyView } from '@/components/activities/activity-daily-view'
import { ActivityWeeklyView } from '@/components/activities/activity-weekly-view'
import { ActivityCalendar } from '@/components/activities/activity-calendar'
import { ActivityForm } from '@/components/activities/activity-form'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ActivitiesViewProps {
    initialActivities: any[]
    customers: any[]
    profiles: any[]
    projects: any[]
    meetings?: any[]
    user: any
}

type TimeBucketFilter = 'upcoming' | 'today' | 'week' | 'month' | 'overdue' | 'past' | 'all'
type ViewMode = 'stream' | 'daily' | 'weekly' | 'monthly'

export function ActivitiesView({
    initialActivities,
    customers,
    profiles,
    projects,
    meetings = [],
    user
}: ActivitiesViewProps) {
    const t = useTranslations('Activities')
    const tCrm = useTranslations('CRM')
    const locale = useLocale()
    const router = useRouter()
    const dateLocale = locale === 'tr' ? tr : enUS

    // Main view & filter states
    const [viewMode, setViewMode] = useState<ViewMode>('stream')
    const [timeBucket, setTimeBucket] = useState<TimeBucketFilter>('upcoming')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    // Detailed filter states
    const [onlyMyActivities, setOnlyMyActivities] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
    const [selectedOwners, setSelectedOwners] = useState<string[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [customDateStart, setCustomDateStart] = useState<string>('')
    const [customDateEnd, setCustomDateEnd] = useState<string>('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Lookup maps
    const projectMap = useMemo(() => new Map(projects.map((p: any) => [p.id, p.name])), [projects])

    // Normalize activities to typed objects
    const allActivities: ActivityItem[] = useMemo(() => {
        return initialActivities.map(a => ({
            id: a.id,
            type: a.type,
            topic: a.topic,
            summary: a.summary,
            customer_id: a.customer_id,
            customers: a.customers,
            leads: a.leads,
            owner: a.owner,
            owner_id: a.owner_id,
            due_date: a.due_date,
            status: a.status,
            outcome: a.outcome,
            notes: a.notes,
            description: a.description,
            priority: a.priority,
            reminder_at: a.reminder_at,
            project_id: a.project_id,
            projects: a.project_id ? { name: projectMap.get(a.project_id) || '' } : undefined,
            daily_room_name: a.daily_room_name,
            meeting_id: a.meeting_id
        }))
    }, [initialActivities, projectMap])

    // KPI Counters (Calculated from full activity set)
    const stats = useMemo(() => {
        const now = new Date()
        let todayTotal = 0
        let todayDone = 0
        let overdueCount = 0
        let thisWeekCount = 0
        let onlineMeetingsCount = 0
        let upcomingTotal = 0

        allActivities.forEach(a => {
            if (!a.due_date) return
            const d = parseISO(a.due_date)
            const isDone = a.status === 'Completed'
            const isCanc = a.status === 'Cancelled'
            const isPastDue = isPast(d) && !isDone && !isCanc && !isToday(d)

            if (isToday(d) && !isCanc) {
                todayTotal++
                if (isDone) todayDone++
            }

            if (isPastDue || a.status === 'Overdue') {
                overdueCount++
            }

            if (isThisWeek(d, { weekStartsOn: 1 }) && !isCanc) {
                thisWeekCount++
            }

            if ((a.type === 'OnlineMeeting' || a.topic === 'Online Toplantı') && !isDone && !isCanc) {
                onlineMeetingsCount++
            }

            if (!isDone && !isCanc && (d >= now || isToday(d))) {
                upcomingTotal++
            }
        })

        return {
            todayTotal,
            todayDone,
            overdueCount,
            thisWeekCount,
            onlineMeetingsCount,
            upcomingTotal
        }
    }, [allActivities])

    // Filter logic
    const filteredActivities = useMemo(() => {
        const now = new Date()

        return allActivities.filter(a => {
            // 1. Owner Filter
            if (onlyMyActivities && a.owner_id !== user.id && (a as any).user_id !== user.id) {
                return false
            }
            if (selectedOwners.length > 0 && a.owner_id && !selectedOwners.includes(a.owner_id)) {
                return false
            }

            // 2. Project Filter
            if (selectedProjectId && a.project_id !== selectedProjectId) {
                return false
            }

            // 3. Type Filter
            if (selectedTypes.length > 0 && !selectedTypes.includes(a.type)) {
                return false
            }

            // 4. Status Filter
            if (selectedStatuses.length > 0) {
                const isOverdue = a.status === 'Overdue' || (a.status !== 'Completed' && a.status !== 'Cancelled' && a.due_date && isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date)))
                const matches = selectedStatuses.some(st => {
                    if (st === 'Overdue') return isOverdue
                    if (st === 'Planned') return (a.status === 'Planned' || a.status === 'Pending') && !isOverdue
                    return a.status === st && !isOverdue
                })
                if (!matches) return false
            }

            // 5. Priority Filter
            if (selectedPriorities.length > 0 && !selectedPriorities.includes(a.priority || 'Medium')) {
                return false
            }

            // 6. Search query
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase()
                const customerName = (a.customers?.full_name || a.leads?.full_name || '').toLowerCase()
                const projectName = (a.projects?.name || '').toLowerCase()
                const summary = (a.summary || '').toLowerCase()
                const description = (a.description || '').toLowerCase()
                const notes = (a.notes || '').toLowerCase()
                const ownerName = (a.owner?.full_name || '').toLowerCase()

                const matchesQuery = customerName.includes(query) ||
                    projectName.includes(query) ||
                    summary.includes(query) ||
                    description.includes(query) ||
                    notes.includes(query) ||
                    ownerName.includes(query)

                if (!matchesQuery) return false
            }

            // 7. Time Bucket Pill Filter (Screenshot Style: Yaklaşan, Bugün, Bu Hafta, Bu Ay, Gecikenler, Geçmiş, Tümü)
            if (timeBucket !== 'all') {
                const isDone = a.status === 'Completed'
                const isCanc = a.status === 'Cancelled'

                if (!a.due_date) {
                    if (timeBucket === 'past' && !isDone && !isCanc) return false
                    if (timeBucket !== 'past' && (isDone || isCanc)) return false
                } else {
                    const d = parseISO(a.due_date)
                    const isPastDue = isPast(d) && !isDone && !isCanc && !isToday(d)

                    switch (timeBucket) {
                        case 'upcoming':
                            // Yaklaşan: Bugün ve ileri tarihteki planlı/bekleyen işler
                            if (isDone || isCanc || (isPast(d) && !isToday(d))) return false
                            break
                        case 'today':
                            if (!isToday(d)) return false
                            break
                        case 'week':
                            if (!isThisWeek(d, { weekStartsOn: 1 })) return false
                            break
                        case 'month':
                            if (!isThisMonth(d)) return false
                            break
                        case 'overdue':
                            if (!isPastDue && a.status !== 'Overdue') return false
                            break
                        case 'past':
                            if (!isDone && !isCanc && !isPast(d)) return false
                            break
                    }
                }
            }

            // 8. Custom Date Range
            if (customDateStart && a.due_date) {
                const start = new Date(customDateStart)
                start.setHours(0, 0, 0, 0)
                if (parseISO(a.due_date) < start) return false
            }
            if (customDateEnd && a.due_date) {
                const end = new Date(customDateEnd)
                end.setHours(23, 59, 59, 999)
                if (parseISO(a.due_date) > end) return false
            }

            return true
        })
    }, [
        allActivities, onlyMyActivities, selectedOwners, selectedProjectId,
        selectedTypes, selectedStatuses, selectedPriorities, searchQuery,
        timeBucket, customDateStart, customDateEnd, user.id
    ])

    // Sorted Activities
    const sortedActivities = useMemo(() => {
        return [...filteredActivities].sort((a, b) => {
            const timeA = new Date(a.due_date || 0).getTime()
            const timeB = new Date(b.due_date || 0).getTime()
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
        })
    }, [filteredActivities, sortOrder])

    // Group activities for Agenda/Stream view
    const groupedActivities = useMemo(() => {
        const groups: { title: string; subtitle?: string; badgeColor?: string; activities: ActivityItem[] }[] = []

        const overdueList: ActivityItem[] = []
        const todayList: ActivityItem[] = []
        const tomorrowList: ActivityItem[] = []
        const thisWeekList: ActivityItem[] = []
        const futureList: ActivityItem[] = []
        const completedList: ActivityItem[] = []

        sortedActivities.forEach(act => {
            if (act.status === 'Completed' || act.status === 'Cancelled') {
                completedList.push(act)
                return
            }

            const d = act.due_date ? parseISO(act.due_date) : null
            if (!d) {
                futureList.push(act)
                return
            }

            if (isPast(d) && !isToday(d)) {
                overdueList.push(act)
            } else if (isToday(d)) {
                todayList.push(act)
            } else if (isTomorrow(d)) {
                tomorrowList.push(act)
            } else if (isThisWeek(d, { weekStartsOn: 1 })) {
                thisWeekList.push(act)
            } else {
                futureList.push(act)
            }
        })

        if (overdueList.length > 0 && timeBucket !== 'past') {
            groups.push({
                title: 'Geciken Aktiviteler',
                subtitle: `${overdueList.length} aktivite planlanan tarihi geçti`,
                badgeColor: 'bg-red-100 text-red-700 border-red-200',
                activities: overdueList
            })
        }

        if (todayList.length > 0 && (timeBucket === 'all' || timeBucket === 'upcoming' || timeBucket === 'today' || timeBucket === 'week' || timeBucket === 'month')) {
            groups.push({
                title: 'Bugün',
                subtitle: format(new Date(), 'EEEE, d MMMM', { locale: dateLocale }),
                badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
                activities: todayList
            })
        }

        if (tomorrowList.length > 0 && (timeBucket === 'all' || timeBucket === 'upcoming' || timeBucket === 'week' || timeBucket === 'month')) {
            groups.push({
                title: 'Yarın',
                subtitle: format(addDays(new Date(), 1), 'EEEE, d MMMM', { locale: dateLocale }),
                badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
                activities: tomorrowList
            })
        }

        if (thisWeekList.length > 0 && (timeBucket === 'all' || timeBucket === 'upcoming' || timeBucket === 'week' || timeBucket === 'month')) {
            groups.push({
                title: 'Bu Hafta İçinde',
                subtitle: 'Haftanın kalan günlerindeki planlar',
                badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
                activities: thisWeekList
            })
        }

        if (futureList.length > 0 && (timeBucket === 'all' || timeBucket === 'upcoming' || timeBucket === 'month')) {
            groups.push({
                title: 'Gelecek Planlar',
                subtitle: 'İlerleyen tarihlerdeki randevu ve görevler',
                badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
                activities: futureList
            })
        }

        if (completedList.length > 0 && (timeBucket === 'all' || timeBucket === 'past')) {
            groups.push({
                title: 'Tamamlanan & Geçmiş',
                subtitle: 'Sonuçlandırılmış veya kapatılmış kayıtlar',
                badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                activities: completedList
            })
        }

        return groups
    }, [sortedActivities, timeBucket, dateLocale])

    const resetFilters = () => {
        setTimeBucket('upcoming')
        setSearchQuery('')
        setOnlyMyActivities(false)
        setSelectedTypes([])
        setSelectedStatuses([])
        setSelectedPriorities([])
        setSelectedOwners([])
        setSelectedProjectId('')
        setCustomDateStart('')
        setCustomDateEnd('')
        setSortOrder('asc')
    }

    const hasActiveFilters = searchQuery !== '' ||
        onlyMyActivities ||
        selectedTypes.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedPriorities.length > 0 ||
        selectedOwners.length > 0 ||
        selectedProjectId !== '' ||
        customDateStart !== '' ||
        customDateEnd !== ''

    return (
        <div className="flex flex-col gap-5 max-w-7xl mx-auto w-full px-2 sm:px-4">
            {/* Top Row: Title + KPI Summaries + New Activity Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span>Aktivite Yönetimi</span>
                        <Badge variant="outline" className="text-xs font-black bg-slate-100 text-slate-700 border-slate-300">
                            {filteredActivities.length} Kayıt
                        </Badge>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Müşteri görüşmeleri, online sunumlar ve randevularınızı tek ekrandan kolayca yönetin.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Link href="/crm/rep-tracking">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 text-xs gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-blue-50/50 font-semibold"
                            title="Temsilci Takip ve Arama Raporları"
                        >
                            <User className="h-3.5 w-3.5 text-blue-600" />
                            <span>Temsilci Takip</span>
                        </Button>
                    </Link>

                    <Link href="/reports/activity-tracking">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 text-xs gap-1.5 rounded-xl border-slate-200 text-slate-700 hover:text-violet-700 hover:bg-violet-50/50 font-semibold hidden sm:inline-flex"
                            title="Detaylı Aktivite Raporu"
                        >
                            <BarChart3 className="h-3.5 w-3.5 text-violet-600" />
                            <span>Aktivite Raporu</span>
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.refresh()}
                        className="h-10 text-xs gap-1.5 rounded-xl border-slate-200"
                        title="Sayfayı Yenile"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>

                    <Button
                        onClick={() => setShowCreate(true)}
                        className="h-10 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm gap-2 transition-transform active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Yeni Aktivite</span>
                    </Button>
                </div>
            </div>

            {/* KPI Cards: Bir Bakışta Durum */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Bugün */}
                <div
                    onClick={() => { setTimeBucket('today'); setViewMode('stream'); }}
                    className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-md",
                        timeBucket === 'today' ? "ring-2 ring-violet-500 border-violet-300" : "border-slate-200/90"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bugünkü Planlar</span>
                        <div className="h-7 w-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.todayTotal}</span>
                        <span className="text-xs font-semibold text-emerald-600">
                            ({stats.todayDone} tamamlandı)
                        </span>
                    </div>
                </div>

                {/* 2. Gecikenler */}
                <div
                    onClick={() => { setTimeBucket('overdue'); setViewMode('stream'); }}
                    className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-md",
                        timeBucket === 'overdue' ? "ring-2 ring-red-500 border-red-300" : "border-slate-200/90"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geciken / Acil</span>
                        <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className={cn(
                            "text-2xl sm:text-3xl font-black",
                            stats.overdueCount > 0 ? "text-red-600 animate-pulse" : "text-slate-900"
                        )}>
                            {stats.overdueCount}
                        </span>
                        <span className="text-xs font-medium text-slate-500">aksiyon bekliyor</span>
                    </div>
                </div>

                {/* 3. Bu Hafta */}
                <div
                    onClick={() => { setTimeBucket('week'); setViewMode('weekly'); }}
                    className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs hover:shadow-md",
                        timeBucket === 'week' ? "ring-2 ring-blue-500 border-blue-300" : "border-slate-200/90"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bu Hafta</span>
                        <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <CalendarDays className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.thisWeekCount}</span>
                        <span className="text-xs font-medium text-slate-500">toplam aktivite</span>
                    </div>
                </div>

                {/* 4. Canlı Online Toplantılar */}
                <div
                    onClick={() => { setTimeBucket('upcoming'); setViewMode('stream'); }}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Toplantı</span>
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Video className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.onlineMeetingsCount}</span>
                        <span className="text-xs font-medium text-slate-500">canlı oda planlı</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation & View Selector Area (Exact Screenshot Style Top Pill Group) */}
            <div className="flex flex-col gap-3 p-3 sm:p-4 bg-white border rounded-2xl shadow-xs">
                {/* Row 1: Time Pill Group + View Perspective Toggle */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Time Pill Group (Screenshot: ✓ Yaklaşan, Bugün, Geçmiş, Tümü) */}
                    <div className="flex items-center flex-wrap gap-1.5">
                        <Button
                            variant={timeBucket === 'upcoming' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('upcoming')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'upcoming'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'upcoming' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Yaklaşan
                            <span className={cn(
                                "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                                timeBucket === 'upcoming' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                            )}>
                                {stats.upcomingTotal}
                            </span>
                        </Button>

                        <Button
                            variant={timeBucket === 'today' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('today')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'today'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'today' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Bugün
                            {stats.todayTotal > 0 && (
                                <span className={cn(
                                    "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                                    timeBucket === 'today' ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                                )}>
                                    {stats.todayTotal}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant={timeBucket === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('week')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'week'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'week' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Bu Hafta
                        </Button>

                        <Button
                            variant={timeBucket === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('month')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'month'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'month' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Bu Ay
                        </Button>

                        <Button
                            variant={timeBucket === 'overdue' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('overdue')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'overdue'
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                                    : "text-red-700 hover:bg-red-50 border border-red-200"
                            )}
                        >
                            {timeBucket === 'overdue' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Gecikenler
                            {stats.overdueCount > 0 && (
                                <span className={cn(
                                    "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                                    timeBucket === 'overdue' ? "bg-white/20 text-white" : "bg-red-100 text-red-800"
                                )}>
                                    {stats.overdueCount}
                                </span>
                            )}
                        </Button>

                        <Button
                            variant={timeBucket === 'past' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('past')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'past'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'past' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Geçmiş
                        </Button>

                        <Button
                            variant={timeBucket === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeBucket('all')}
                            className={cn(
                                "h-9 px-3.5 text-xs font-bold rounded-lg transition-all",
                                timeBucket === 'all'
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {timeBucket === 'all' && <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />}
                            Tümü
                        </Button>
                    </div>

                    {/* View Mode Segmented Controls (📋 Gündem / 📅 Günlük / 🗓️ Haftalık / 📆 Aylık) */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={() => setViewMode('stream')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'stream'
                                    ? "bg-white text-violet-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <LayoutList className="h-3.5 w-3.5" />
                            <span>Gündem</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('daily')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'daily'
                                    ? "bg-white text-violet-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <Clock className="h-3.5 w-3.5" />
                            <span>Günlük</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('weekly')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'weekly'
                                    ? "bg-white text-violet-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>Haftalık</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('monthly')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                viewMode === 'monthly'
                                    ? "bg-white text-violet-700 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>Aylık</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Live Search & Quick Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Müşteri adı, proje, konu veya açıklama ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-lg border-slate-200 bg-slate-50/60 focus:bg-white transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <Button
                        variant={showAdvancedFilters ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={cn(
                            "h-9 px-3 text-xs gap-1.5 font-bold rounded-lg border-dashed w-full sm:w-auto",
                            hasActiveFilters ? "border-violet-400 text-violet-700 bg-violet-50/50" : "border-slate-300 text-slate-700"
                        )}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        <span>Filtreler</span>
                        {hasActiveFilters && (
                            <span className="h-2 w-2 rounded-full bg-violet-600" />
                        )}
                        {showAdvancedFilters ? <ChevronUp className="h-3.5 w-3.5 ml-1 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />}
                    </Button>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-9 px-2.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg gap-1"
                            title="Tüm filtreleri sıfırla"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>Sıfırla</span>
                        </Button>
                    )}
                </div>

                {/* Row 3: Quick Type Category Filter (All, Randevular, Online Görüşme, Aramalar, WhatsApp, Görevler) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-1 scrollbar-none text-xs border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider mr-1">Tür:</span>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes([])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                            selectedTypes.length === 0
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        Tümü
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes(['OfficeMeeting', 'Meeting', 'Site Visit'])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1",
                            selectedTypes.includes('OfficeMeeting') && selectedTypes.includes('Meeting')
                                ? "bg-amber-600 text-white"
                                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                        )}
                    >
                        <span>🏢 Randevular (Ofis & Saha)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes(['OnlineMeeting'])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1",
                            selectedTypes.length === 1 && selectedTypes[0] === 'OnlineMeeting'
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                        )}
                    >
                        <span>📹 Online Görüşmeler</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes(['Call'])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1",
                            selectedTypes.length === 1 && selectedTypes[0] === 'Call'
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60"
                        )}
                    >
                        <span>📞 Telefon Görüşmeleri</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes(['Whatsapp'])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1",
                            selectedTypes.length === 1 && selectedTypes[0] === 'Whatsapp'
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60"
                        )}
                    >
                        <span>💬 WhatsApp</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTypes(['Task'])}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1",
                            selectedTypes.length === 1 && selectedTypes[0] === 'Task'
                                ? "bg-slate-700 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        )}
                    >
                        <span>✅ Görevler</span>
                    </button>
                </div>

                {/* Collapsible Advanced Filters Drawer */}
                {showAdvancedFilters && (
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {/* Filter by Ownership & Project */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                    Sorumluluk
                                </label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="filter-my-adv"
                                        checked={onlyMyActivities}
                                        onCheckedChange={(c) => setOnlyMyActivities(!!c)}
                                    />
                                    <Label htmlFor="filter-my-adv" className="text-xs font-semibold cursor-pointer text-slate-700">
                                        Yalnızca Benim Aktivitelerim
                                    </Label>
                                </div>
                            </div>

                            {projects.length > 0 && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                        Proje
                                    </label>
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                        className="h-8 w-full px-2 text-xs border rounded-md bg-white text-slate-700"
                                    >
                                        <option value="">Tüm Projeler</option>
                                        {projects.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {profiles.length > 1 && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                        Danışman
                                    </label>
                                    <select
                                        value={selectedOwners[0] || ''}
                                        onChange={(e) => setSelectedOwners(e.target.value ? [e.target.value] : [])}
                                        className="h-8 w-full px-2 text-xs border rounded-md bg-white text-slate-700"
                                    >
                                        <option value="">Tüm Danışmanlar</option>
                                        {profiles.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Filter by Type */}
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                Aktivite Tipi
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'OnlineMeeting', label: '📹 Online Toplantı' },
                                    { id: 'Meeting', label: '🏛️ Toplantı' },
                                    { id: 'Call', label: '📞 Arama' },
                                    { id: 'Whatsapp', label: '💬 WhatsApp' },
                                    { id: 'Site Visit', label: '🏗️ Saha Ziyareti' },
                                    { id: 'Task', label: '✅ Görev' },
                                ].map(type => {
                                    const isSel = selectedTypes.includes(type.id)
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTypes(prev =>
                                                    prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                                                )
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-lg border font-medium transition-all",
                                                isSel
                                                    ? "bg-violet-600 text-white border-violet-600 shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            {type.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Filter by Priority */}
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                                Öncelik
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'Urgent', label: '⚡ Acil' },
                                    { id: 'High', label: 'Yüksek' },
                                    { id: 'Medium', label: 'Orta' },
                                    { id: 'Low', label: 'Düşük' },
                                ].map(p => {
                                    const isSel = selectedPriorities.includes(p.id)
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPriorities(prev =>
                                                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                                                )
                                            }}
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-lg border font-medium transition-all",
                                                isSel
                                                    ? "bg-slate-800 text-white border-slate-800"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Rendering based on ViewMode */}
            {viewMode === 'daily' && (
                <ActivityDailyView
                    activities={filteredActivities}
                    customers={customers}
                    profiles={profiles}
                    projects={projects}
                    meetings={meetings}
                    currentUserId={user.id}
                    onRefresh={() => router.refresh()}
                />
            )}

            {viewMode === 'weekly' && (
                <ActivityWeeklyView
                    activities={filteredActivities}
                    customers={customers}
                    profiles={profiles}
                    projects={projects}
                    meetings={meetings}
                    currentUserId={user.id}
                    onRefresh={() => router.refresh()}
                />
            )}

            {viewMode === 'monthly' && (
                <ActivityCalendar
                    activities={filteredActivities}
                    customers={customers}
                    profiles={profiles}
                    projects={projects}
                    onSelectDate={() => setViewMode('daily')}
                />
            )}

            {viewMode === 'stream' && (
                <div className="space-y-6">
                    {groupedActivities.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-2xl">
                            <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">
                                        Filtreye uygun aktivite bulunamadı
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Seçilen zaman dilimi veya arama kriterine uyan aktivite kaydı yok.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {hasActiveFilters && (
                                        <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                                            Filtreleri Temizle
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => setShowCreate(true)}
                                        className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 font-bold text-xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Yeni Aktivite Ekle
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        groupedActivities.map((group, idx) => (
                            <div key={idx} className="space-y-3">
                                {/* Group Section Header */}
                                <div className="flex items-center justify-between pb-1 px-1">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                            {group.title}
                                        </h2>
                                        {group.subtitle && (
                                            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                                                • {group.subtitle}
                                            </span>
                                        )}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", group.badgeColor)}
                                    >
                                        {group.activities.length} Aktivite
                                    </Badge>
                                </div>

                                {/* Activity Stream Cards */}
                                <div className="space-y-2.5">
                                    {group.activities.map(activity => (
                                        <ActivityStreamCard
                                            key={activity.id}
                                            activity={activity}
                                            customers={customers}
                                            profiles={profiles}
                                            projects={projects}
                                            meetings={meetings}
                                            currentUserId={user.id}
                                            onRefresh={() => router.refresh()}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Activity Form Modal */}
            <ActivityForm
                open={showCreate}
                onOpenChange={setShowCreate}
                mode="create"
                customers={customers}
                profiles={profiles}
                projects={projects}
            />
        </div>
    )
}
