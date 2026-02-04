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
import { useTranslations } from 'next-intl'

interface ActivitiesViewProps {
    initialActivities: any[]
    customers: any[]
    user: any
}

export function ActivitiesView({ initialActivities, customers, user }: ActivitiesViewProps) {
    const t = useTranslations('Activities')
    const [showCreate, setShowCreate] = useState(false)
    const [showFilters, setShowFilters] = useState(true)

    const ACTIVITY_TYPES = [
        { id: 'Call', label: t('type.Call') },
        { id: 'Meeting', label: t('type.Meeting') },
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

    // Filter States
    const [onlyMyActivities, setOnlyMyActivities] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
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
        description: a.description
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

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Header & Controls */}
            <div className="flex flex-col gap-0 border rounded-lg bg-card shadow-sm">
                {/* Top Bar */}
                <div className="flex items-center justify-start gap-3 p-3 bg-muted/20 border-b first:rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showFilters ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-2 relative"
                        >
                            <Filter className="h-4 w-4" />
                            {t('filters.title')}
                            {(selectedTypes.length > 0 || selectedTopics.length > 0 || onlyMyActivities || dateFilter !== 'all' || sortOrder !== 'newest') && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                            )}
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {(selectedTypes.length > 0 || selectedTopics.length > 0 || onlyMyActivities || dateFilter !== 'all' || sortOrder !== 'newest') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setOnlyMyActivities(false)
                                    setSelectedTypes([])
                                    setSelectedTopics([])
                                    setDateFilter('all')
                                    setSortOrder('newest')
                                }}
                                title={t('filters.clear')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button onClick={() => setShowCreate(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> {t('newActivity')}
                    </Button>
                </div>

                {/* Collapsible Filter Area */}
                {showFilters && (
                    <div className="p-4 pb-8 bg-slate-50/50 space-y-2 animate-in slide-in-from-top-2 duration-200 border-t">
                        {/* Row 1: Source */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">{t('filters.view')}:</span>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="filter-my"
                                    checked={onlyMyActivities}
                                    onCheckedChange={(c) => setOnlyMyActivities(!!c)}
                                />
                                <Label htmlFor="filter-my" className="cursor-pointer font-normal">{t('filters.onlyMyActivities')}</Label>
                            </div>
                        </div>



                        {/* Row 2: Types */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">{t('filters.types')}:</span>
                            {ACTIVITY_TYPES.map(type => (
                                <div key={type.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`type-${type.id}`}
                                        checked={selectedTypes.includes(type.id)}
                                        onCheckedChange={() => toggleType(type.id)}
                                    />
                                    <Label htmlFor={`type-${type.id}`} className="cursor-pointer font-normal">{type.label}</Label>
                                </div>
                            ))}
                        </div>



                        {/* Row 3: Topics */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">{t('filters.topics')}:</span>
                            {ACTIVITY_TOPICS.map(topic => (
                                <div key={topic.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`topic-${topic.id}`}
                                        checked={selectedTopics.includes(topic.id)}
                                        onCheckedChange={() => toggleTopic(topic.id)}
                                    />
                                    <Label htmlFor={`topic-${topic.id}`} className="cursor-pointer font-normal">{topic.label}</Label>
                                </div>
                            ))}
                        </div>

                        {/* Row 4: Date Range */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('filters.dateRange')}:
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant={dateFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('all')}
                                    className="h-8"
                                >
                                    {t('filters.allDates')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'today' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('today')}
                                    className="h-8"
                                >
                                    {t('filters.today')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'week' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('week')}
                                    className="h-8"
                                >
                                    {t('filters.thisWeek')}
                                </Button>
                                <Button
                                    variant={dateFilter === 'month' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter('month')}
                                    className="h-8"
                                >
                                    {t('filters.thisMonth')}
                                </Button>
                            </div>
                        </div>

                        {/* Row 5: Sort Order */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground flex items-center gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                {t('filters.sortBy')}:
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant={sortOrder === 'newest' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortOrder('newest')}
                                    className="h-8"
                                >
                                    {t('filters.newest')}
                                </Button>
                                <Button
                                    variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSortOrder('oldest')}
                                    className="h-8"
                                >
                                    {t('filters.oldest')}
                                </Button>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="kanban" className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center px-1">
                    <TabsList>
                        <TabsTrigger value="kanban">{t('tabs.kanban')}</TabsTrigger>
                        <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="kanban" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-2">
                        <KanbanBoard activities={activities} customers={customers} />
                    </div>
                </TabsContent>

                <TabsContent value="list" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto">
                        <ActivityList activities={activities} customers={customers} />
                    </div>
                </TabsContent>
            </Tabs>

            <ActivityForm
                open={showCreate}
                onOpenChange={setShowCreate}
                mode="create"
                customers={customers}
            />
        </div>
    )
}
