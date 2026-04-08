'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/activities/kanban-board'
import { Activity } from '@/components/activities/activity-card'
import { Button } from '@/components/ui/button'
import { Plus, Filter, ChevronUp, ChevronDown, Check, X, Calendar, ArrowUpDown } from 'lucide-react'
import { ActivityForm } from '@/components/activities/activity-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityList } from '@/components/activities/activity-list'
import { ActivityCalendar } from '@/components/activities/activity-calendar'
import { useTranslations } from 'next-intl'

interface ActivitiesViewProps {
    initialActivities: any[]
    customers: any[]
    profiles: any[]
    user: any
}

export function ActivitiesView({ initialActivities, customers, profiles, user }: ActivitiesViewProps) {
    const t = useTranslations('Activities')
    const tCrm = useTranslations('CRM')
    const [showCreate, setShowCreate] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

    const ACTIVITY_TYPES = [
        { id: 'Call', label: t('type.Call') },
        { id: 'Meeting', label: t('type.Meeting') },
        { id: 'OfficeMeeting', label: t('type.OfficeMeeting') },
        { id: 'OnlineMeeting', label: t('type.OnlineMeeting') },
        { id: 'Site Visit', label: t('type.Site Visit') },
        { id: 'Email', label: t('type.Email') },
        { id: 'Whatsapp', label: t('type.Whatsapp') },
    ]

    const ACTIVITY_TOPICS = [
        { id: 'General', label: t('topic.General') },
        { id: 'Sales', label: t('topic.Sales') },
        { id: 'Negotiation', label: t('topic.Negotiation') },
        { id: 'Contract', label: t('topic.Contract') },
        { id: 'Support', label: t('topic.Support') },
        { id: 'After Sales', label: t('topic.After Sales') },
        { id: 'Collection', label: t('topic.Collection') },
    ]

    const ACTIVITY_STATUSES = [
        { id: 'Planned', label: t('status.Planned') },
        { id: 'In Progress', label: t('status.In Progress') },
        { id: 'Completed', label: t('status.Completed') },
        { id: 'Cancelled', label: t('status.Cancelled') },
    ]

    const LEAD_STATUSES = [
        { id: 'Lead', label: tCrm('status.Lead') },
        { id: 'Prospect', label: tCrm('status.Prospect') },
        { id: 'Reservation', label: tCrm('status.Reservation') },
        { id: 'Proposal', label: tCrm('status.Proposal') },
        { id: 'Negotiation', label: tCrm('status.Negotiation') },
        { id: 'Sold', label: tCrm('status.Sold') },
        { id: 'Lost', label: tCrm('status.Lost') },
    ]

    // Filter States
    const [onlyMyActivities, setOnlyMyActivities] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedLeadStatuses, setSelectedLeadStatuses] = useState<string[]>([])
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
    const [selectedOwners, setSelectedOwners] = useState<string[]>([])
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

    // Clientside Filtering
    const filteredActivities = initialActivities.filter(a => {
        // Owner Filter
        if (onlyMyActivities && a.owner_id !== user.id) return false

        // Type Filter
        if (selectedTypes.length > 0) {
            if (!selectedTypes.includes(a.type)) return false
        }

        // Topic Filter
        if (selectedTopics.length > 0) {
            const topic = a.topic || 'General'
            if (!selectedTopics.includes(topic)) return false
        }

        // Status Filter
        if (selectedStatuses.length > 0) {
            if (!selectedStatuses.includes(a.status)) return false
        }

        // Lead Status Filter
        if (selectedLeadStatuses.length > 0) {
            const customerSales = a.customers?.sales || []
            const hasMatchingStatus = customerSales.some((s: any) => selectedLeadStatuses.includes(s.status))
            if (!hasMatchingStatus) return false
        }

        // Priority Filter
        if (selectedPriorities.length > 0) {
            if (!selectedPriorities.includes(a.priority || 'Medium')) return false
        }

        // Owner Filter (Multi-select)
        if (selectedOwners.length > 0) {
            if (!selectedOwners.includes(a.owner_id)) return false
        }

        // Date Filter
        if (dateFilter !== 'all' && a.due_date) {
            const activityDate = new Date(a.due_date)
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            if (dateFilter === 'today') {
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                if (activityDate < today || activityDate >= tomorrow) return false
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                if (activityDate < weekAgo) return false
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(today)
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                if (activityDate < monthAgo) return false
            }
        }

        return true
    })

    // Sort by date
    const sortedActivities = [...filteredActivities].sort((a, b) => {
        const dateA = new Date(a.due_date || 0).getTime()
        const dateB = new Date(b.due_date || 0).getTime()
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    // Map to Activity Interface
    const activities: Activity[] = sortedActivities.map(a => ({
        id: a.id,
        type: a.type,
        topic: a.topic,
        summary: a.summary,
        customer_id: a.customer_id,
        customers: a.customers,
        owner: a.owner,
        due_date: a.due_date,
        status: a.status,
        outcome: a.outcome,
        notes: a.notes,
        description: a.description,
        priority: a.priority,
        reminder_at: a.reminder_at,
        owner_id: a.owner_id
    }))

    const toggleType = (id: string) => {
        setSelectedTypes(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleStatus = (id: string) => {
        setSelectedStatuses(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleLeadStatus = (id: string) => {
        setSelectedLeadStatuses(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const togglePriority = (id: string) => {
        setSelectedPriorities(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const toggleOwner = (id: string) => {
        setSelectedOwners(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header & Controls */}
            <div className="flex flex-col gap-0 border rounded-lg bg-white shadow-sm">
                {/* Top Bar */}
                <div className="flex items-center justify-start gap-3 p-3 border-b first:rounded-t-lg bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showFilters ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2 relative h-9 border-dashed"
                        >
                            <Filter className="h-4 w-4" />
                            {t('filters.title')}
                            {(selectedTypes.length > 0 || selectedTopics.length > 0 || selectedStatuses.length > 0 || selectedLeadStatuses.length > 0 || onlyMyActivities || dateFilter !== 'all' || sortOrder !== 'newest') && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                            )}
                            {showFilters ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                        </Button>
                        <Button
                            variant={dateFilter === 'today' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => setDateFilter('today')}
                            className="h-9"
                        >
                            {t('filters.today')}
                        </Button>
                        {(selectedTypes.length > 0 || selectedTopics.length > 0 || selectedStatuses.length > 0 || selectedLeadStatuses.length > 0 || onlyMyActivities || dateFilter !== 'all' || sortOrder !== 'newest') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                onClick={() => {
                                    setOnlyMyActivities(false)
                                    setSelectedTypes([])
                                    setSelectedTopics([])
                                    setSelectedStatuses([])
                                    setSelectedLeadStatuses([])
                                    setSelectedPriorities([])
                                    setSelectedOwners([])
                                    setDateFilter('all')
                                    setSortOrder('newest')
                                }}
                                title={t('filters.clear')}
                            >
                                <span className="text-xs mr-2">{t('filters.clear')}</span>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1" />

                    <Button onClick={() => setShowCreate(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9">
                        <Plus className="mr-2 h-4 w-4" /> {t('newActivity')}
                    </Button>
                </div>

                {/* Collapsible Filter Area */}
                {showFilters && (
                    <div className="p-5 pb-8 space-y-5 animate-in slide-in-from-top-2 duration-200 bg-white">
                        {/* Row 1: Source */}
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('filters.view')}</span>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="filter-my"
                                    checked={onlyMyActivities}
                                    onCheckedChange={(c) => setOnlyMyActivities(!!c)}
                                />
                                <Label htmlFor="filter-my" className="cursor-pointer font-medium text-slate-700">{t('filters.onlyMyActivities')}</Label>
                            </div>
                        </div>

                        {/* Row 2: Types */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('filters.types')}</span>
                            {ACTIVITY_TYPES.map(type => (
                                <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`type-${type.id}`}
                                        checked={selectedTypes.includes(type.id)}
                                        onCheckedChange={() => toggleType(type.id)}
                                    />
                                    <Label htmlFor={`type-${type.id}`} className="cursor-pointer font-normal text-slate-600">{type.label}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 3: Statuses */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('filters.statuses')}</span>
                            {ACTIVITY_STATUSES.map(status => (
                                <div key={status.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`status-${status.id}`}
                                        checked={selectedStatuses.includes(status.id)}
                                        onCheckedChange={() => toggleStatus(status.id)}
                                    />
                                    <Label htmlFor={`status-${status.id}`} className="cursor-pointer font-normal text-slate-600">{status.label}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 3b: Lead Statuses */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('filters.leadStatuses')}</span>
                            {LEAD_STATUSES.map(status => (
                                <div key={status.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`lead-status-${status.id}`}
                                        checked={selectedLeadStatuses.includes(status.id)}
                                        onCheckedChange={() => toggleLeadStatus(status.id)}
                                    />
                                    <Label htmlFor={`lead-status-${status.id}`} className="cursor-pointer font-normal text-slate-600">{status.label}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 4: Topics */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('filters.topics')}</span>
                            {ACTIVITY_TOPICS.map(topic => (
                                <div key={topic.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`topic-${topic.id}`}
                                        checked={selectedTopics.includes(topic.id)}
                                        onCheckedChange={() => toggleTopic(topic.id)}
                                    />
                                    <Label htmlFor={`topic-${topic.id}`} className="cursor-pointer font-normal text-slate-600">{topic.label}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 4b: Priorities */}
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">Öncelik</span>
                            {['Urgent', 'High', 'Medium', 'Low'].map(p => (
                                <div key={p} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`priority-${p}`}
                                        checked={selectedPriorities.includes(p)}
                                        onCheckedChange={() => togglePriority(p)}
                                    />
                                    <Label htmlFor={`priority-${p}`} className="cursor-pointer font-normal text-slate-600 text-sm">{t(`form.priority${p}`)}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 4c: Assignees (if admin) */}
                        {profiles.length > 1 && (
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
                                <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400">{t('form.owner')}</span>
                                {profiles.map(p => (
                                    <div key={p.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`owner-${p.id}`}
                                            checked={selectedOwners.includes(p.id)}
                                            onCheckedChange={() => toggleOwner(p.id)}
                                        />
                                        <Label htmlFor={`owner-${p.id}`} className="cursor-pointer font-normal text-slate-600 text-sm">{p.full_name}</Label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Row 5: Date Range */}
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400 flex items-center gap-2">
                                {t('filters.dateRange')}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant={dateFilter === 'all' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('all')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.allDates')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'today' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('today')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.today')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'week' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('week')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.thisWeek')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'month' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('month')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.thisMonth')}
                                </Button>
                            </div>
                        </div>

                        {/* Row 6: Sort Order */}
                        <div className="flex items-center gap-6">
                            <span className="text-xs font-bold uppercase tracking-wider w-24 shrink-0 text-slate-400 flex items-center gap-2">
                                {t('filters.sortBy')}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant={sortOrder === 'newest' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortOrder('newest')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.newest')}
                                </Button>
                                <Button
                                    variant={sortOrder === 'oldest' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortOrder('oldest')}
                                    className="h-8 text-xs"
                                >
                                    {t('filters.oldest')}
                                </Button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="calendar" className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center px-1">
                    <TabsList>
                        <TabsTrigger value="calendar">{t('tabs.calendar')}</TabsTrigger>
                        <TabsTrigger value="kanban">{t('tabs.kanban')}</TabsTrigger>
                        <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="calendar" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto rounded-lg border bg-card">
                        <ActivityCalendar activities={activities} customers={customers} profiles={profiles} />
                    </div>
                </TabsContent>

                <TabsContent value="kanban" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-2">
                        <KanbanBoard activities={activities} customers={customers} profiles={profiles} />
                    </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <ActivityList activities={activities} customers={customers} profiles={profiles} />
                    </div>
                </TabsContent>
            </Tabs>

            <ActivityForm
                open={showCreate}
                onOpenChange={setShowCreate}
                mode="create"
                customers={customers}
                profiles={profiles}
            />
        </div>
    )
}
