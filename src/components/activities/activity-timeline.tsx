'use client'

import { useState } from 'react'
import { ActivityCard, Activity } from './activity-card'
import { Button } from '@/components/ui/button'
import { Plus, CornerDownRight, ChevronDown } from 'lucide-react'
import { ActivityForm } from './activity-form'

interface ActivityTimelineProps {
    activities: any[]
    customer: any
}

export function ActivityTimeline({ activities, customer }: ActivityTimelineProps) {
    const [showCreate, setShowCreate] = useState(false)
    const [visibleCount, setVisibleCount] = useState(5)

    // Ensure activities are sorted desc
    const sortedActivities = [...activities].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())

    // Map to Activity type safely
    const mappedActivities: Activity[] = sortedActivities.map(a => ({
        id: a.id,
        type: a.type,
        topic: a.topic,
        summary: a.summary,
        customer_id: a.customer_id,
        customers: a.customers || { full_name: customer.full_name }, // Fallback to prop customer
        due_date: a.due_date,
        status: a.status,
        outcome: a.outcome,
        notes: a.notes,
        previous_activity_id: a.previous_activity_id
    }))

    // Slice
    const displayedActivities = mappedActivities.slice(0, visibleCount)
    const hasMore = mappedActivities.length > visibleCount

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-start gap-4 mb-2 w-full p-1">
                <Button size="sm" onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Ekle
                </Button>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Zaman Tüneli
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {activities.length}
                    </span>
                </h3>
            </div>

            <div className="space-y-1 relative pl-4 border-l-2 border-muted ml-2">
                {displayedActivities.map((activity, index) => {
                    const parent = mappedActivities.find(p => p.id === activity.previous_activity_id)
                    return (
                        <div key={activity.id} className="relative group">
                            <div className="absolute -left-[25px] top-4 bg-background rounded-full p-1 border z-10">
                                <div className={`w-1.5 h-1.5 rounded-full mb-0 ${activity.status === 'Completed' ? 'bg-green-500' : 'bg-primary'}`}></div>
                            </div>

                            {/* Connector Line if previous activity exists in the FULL list (parent) */}
                            {parent && (
                                <div className="absolute -left-[22px] h-full top-6 w-0.5 bg-border z-0" />
                            )}

                            {parent && (
                                <div className="flex items-center gap-1.5 mb-1 ml-0.5 text-xs text-muted-foreground bg-muted/30 p-1 rounded-md w-fit">
                                    <CornerDownRight className="h-3 w-3 text-muted-foreground/70" />
                                    <span className="text-[10px]">
                                        Ref: <span className="font-medium text-foreground">{parent.summary}</span>
                                        {parent.outcome && <span className="text-muted-foreground/70 ml-1">({parent.outcome})</span>}
                                    </span>
                                </div>
                            )}

                            <ActivityCard activity={activity} />
                        </div>
                    )
                })}

                {mappedActivities.length === 0 && (
                    <div className="text-muted-foreground text-sm italic pl-2">Kayıt bulunamadı.</div>
                )}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2 border-t mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setVisibleCount(prev => prev + 5)} className="text-muted-foreground h-8 text-xs">
                        <ChevronDown className="mr-2 h-3 w-3" /> Daha Fazla ({mappedActivities.length - visibleCount})
                    </Button>
                </div>
            )}

            <ActivityForm
                open={showCreate}
                onOpenChange={setShowCreate}
                mode="create"
                activity={{ customer_id: customer.id }} // Pre-select customer
                customers={[customer]} // Only this customer available in dropdown
            />
        </div>
    )
}
