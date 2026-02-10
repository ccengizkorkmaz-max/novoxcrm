'use client'

import { Activity } from './activity-card'
import { ActivityCard } from './activity-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isToday, isTomorrow, isThisWeek, parseISO, isPast } from 'date-fns'
import { useTranslations } from 'next-intl'

interface KanbanBoardProps {
    activities: Activity[]
    customers?: any[]
    profiles?: any[]
}

export function KanbanBoard({ activities, customers, profiles }: KanbanBoardProps) {
    const t = useTranslations('Activities.kanban')
    // Categorize activities
    // Categorize activities
    const overdue = activities.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.due_date && isPast(parseISO(a.due_date)) && !isToday(parseISO(a.due_date)))
    const today = activities.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.due_date && isToday(parseISO(a.due_date)))
    const tomorrow = activities.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.due_date && isTomorrow(parseISO(a.due_date)))
    const thisWeek = activities.filter(a =>
        a.status !== 'Completed' &&
        a.status !== 'Cancelled' &&
        a.due_date &&
        !isToday(parseISO(a.due_date)) &&
        !isTomorrow(parseISO(a.due_date)) &&
        !isPast(parseISO(a.due_date)) &&
        isThisWeek(parseISO(a.due_date))
    )
    const noDate = activities.filter(a =>
        a.status !== 'Completed' &&
        a.status !== 'Cancelled' &&
        !a.due_date
    )

    // Completed recently
    const completed = activities.filter(a => a.status === 'Completed').slice(0, 5) // Show last 5 completed for MVP

    return (
        <div className="flex overflow-x-auto pb-4 gap-4 h-[calc(100vh-200px)]">
            <KanbanColumn title={t('overdue')} count={overdue.length} activities={overdue} customers={customers} profiles={profiles} color="border-red-500" emptyText={t('noActivity')} />
            <KanbanColumn title={t('today')} count={today.length} activities={today} customers={customers} profiles={profiles} color="border-blue-500" emptyText={t('noActivity')} />
            <KanbanColumn title={t('tomorrow')} count={tomorrow.length} activities={tomorrow} customers={customers} profiles={profiles} color="border-indigo-500" emptyText={t('noActivity')} />
            <KanbanColumn title={t('thisWeek')} count={thisWeek.length} activities={thisWeek} customers={customers} profiles={profiles} color="border-purple-500" emptyText={t('noActivity')} />
            <KanbanColumn title="Tarihsiz" count={noDate.length} activities={noDate} customers={customers} profiles={profiles} color="border-gray-500" emptyText={t('noActivity')} />
            <KanbanColumn title={t('completed')} count={completed.length} activities={completed} customers={customers} profiles={profiles} color="border-green-500" emptyText={t('noActivity')} />
        </div>
    )
}

function KanbanColumn({ title, count, activities, customers, profiles, color, emptyText }: { title: string, count: number, activities: Activity[], customers?: any[], profiles?: any[], color: string, emptyText?: string }) {
    return (
        <div className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-lg border-t-4 border-muted-foreground/20 h-full p-2">
            <div className={`p-3 font-semibold text-sm flex justify-between items-center border-b mb-2 ${color ? color.replace('border-', 'text-') : ''} border-l-4 pl-3`}>
                {title}
                <span className="bg-background text-foreground text-xs px-2 py-0.5 rounded-full border shadow-sm">{count}</span>
            </div>
            <ScrollArea className="flex-1 pr-3">
                <div className="flex flex-col gap-2">
                    {activities.map(act => (
                        <ActivityCard key={act.id} activity={act} customers={customers} profiles={profiles} />
                    ))}
                    {activities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-md">
                            {emptyText || 'Aktivite yok'}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
