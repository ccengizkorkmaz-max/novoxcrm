'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/activities/kanban-board'
import { Activity } from '@/components/activities/activity-card'
import { Button } from '@/components/ui/button'
import { Plus, Filter, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { ActivityForm } from '@/components/activities/activity-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityList } from '@/components/activities/activity-list'

interface ActivitiesViewProps {
    initialActivities: any[]
    customers: any[]
    user: any
}

const ACTIVITY_TYPES = [
    { id: 'Call', label: 'Telefon' },
    { id: 'Meeting', label: 'Toplantı' },
    { id: 'Site Visit', label: 'Ziyaret' },
    { id: 'Email', label: 'Email' },
    { id: 'Whatsapp', label: 'Whatsapp' },
]

const ACTIVITY_TOPICS = [
    { id: 'General', label: 'Genel' },
    { id: 'Sales', label: 'Satış' },
    { id: 'Negotiation', label: 'Pazarlık' },
    { id: 'Contract', label: 'Sözleşme' },
    { id: 'Support', label: 'Destek' },
    { id: 'After Sales', label: 'Satış Sonrası' },
    { id: 'Collection', label: 'Tahsilat' },
]

export function ActivitiesView({ initialActivities, customers, user }: ActivitiesViewProps) {
    const [showCreate, setShowCreate] = useState(false)
    const [showFilters, setShowFilters] = useState(true)

    // Filter States
    const [onlyMyActivities, setOnlyMyActivities] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

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

        return true
    })

    // Map to Activity Interface
    const activities: Activity[] = filteredActivities.map(a => ({
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
        notes: a.notes
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
                            Filtreler
                            {(selectedTypes.length > 0 || selectedTopics.length > 0 || onlyMyActivities) && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                            )}
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {(selectedTypes.length > 0 || selectedTopics.length > 0 || onlyMyActivities) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setOnlyMyActivities(false)
                                    setSelectedTypes([])
                                    setSelectedTopics([])
                                }}
                                title="Filtreleri Temizle"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button onClick={() => setShowCreate(true)} size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Yeni Aktivite
                    </Button>
                </div>

                {/* Collapsible Filter Area */}
                {showFilters && (
                    <div className="p-4 pb-8 bg-slate-50/50 space-y-2 animate-in slide-in-from-top-2 duration-200 border-t">
                        {/* Row 1: Source */}
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">Görünüm:</span>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="filter-my"
                                    checked={onlyMyActivities}
                                    onCheckedChange={(c) => setOnlyMyActivities(!!c)}
                                />
                                <Label htmlFor="filter-my" className="cursor-pointer font-normal">Sadece Benim Aktivitelerim</Label>
                            </div>
                        </div>



                        {/* Row 2: Types */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-6">
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">Tipler:</span>
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
                            <span className="text-sm font-semibold w-24 shrink-0 text-muted-foreground">Konular:</span>
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


                    </div>
                )}
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="kanban" className="flex flex-col gap-4 flex-1 min-h-0">
                <div className="flex items-center px-1">
                    <TabsList>
                        <TabsTrigger value="kanban">Panolar</TabsTrigger>
                        <TabsTrigger value="list">Liste</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="kanban" className="mt-0 flex-1 min-h-0 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-2">
                        <KanbanBoard activities={activities} />
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
