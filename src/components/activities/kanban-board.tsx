'use client'

import { Activity } from './activity-card'
import { ActivityCard } from './activity-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isToday, isTomorrow, isThisWeek, parseISO, isPast } from 'date-fns'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface KanbanBoardProps {
    activities: Activity[]
    customers?: any[]
    profiles?: any[]
    projects?: any[]
}

interface KanbanColumnProps {
    title: string
    activities: Activity[]
    customers?: any[]
    profiles?: any[]
    projects?: any[]
    variant?: 'default' | 'danger' | 'warning' | 'success' | 'info' | 'primary' | 'secondary'
}

function KanbanColumn({ title, activities, customers, profiles, projects, variant = 'default' }: KanbanColumnProps) {
    const t = useTranslations('Activities')

    const colors = {
        danger: 'bg-red-50 text-red-700 border-red-100',
        warning: 'bg-orange-50 text-orange-700 border-orange-100',
        success: 'bg-green-50 text-green-700 border-green-100',
        info: 'bg-sky-50 text-sky-700 border-sky-100',
        primary: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        secondary: 'bg-slate-50 text-slate-700 border-slate-100',
        default: 'bg-slate-50 text-slate-600 border-slate-200'
    }

    const dotColors = {
        danger: 'bg-red-500',
        warning: 'bg-orange-500',
        info: 'bg-sky-500',
        primary: 'bg-indigo-500',
        success: 'bg-green-500',
        secondary: 'bg-slate-400',
        default: 'bg-slate-300'
    }

    return (
        <div className="flex flex-col w-[260px] shrink-0 h-full rounded-xl bg-slate-50/30 border border-slate-200/60 overflow-hidden">
            <div className={cn("px-2.5 py-2 border-b flex items-center justify-between", colors[variant])}>
                <div className="flex items-center gap-1.5 min-w-0">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColors[variant])} />
                    <h3 className="font-bold text-[11px] uppercase tracking-tight truncate">
                        {title}
                    </h3>
                </div>
                <Badge variant="secondary" className="bg-white/80 hover:bg-white text-[10px] h-4 px-1.5 border-0 font-bold shadow-sm shrink-0">
                    {activities.length}
                </Badge>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-1.5 pb-4">
                    {activities.map((activity) => (
                        <ActivityCard
                            key={activity.id}
                            activity={activity}
                            customers={customers}
                            profiles={profiles}
                            projects={projects}
                        />
                    ))}
                    {activities.length === 0 && (
                        <div className="h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center bg-white/20">
                            <span className="text-[10px] text-slate-400 font-medium italic">
                                {t('kanban.noActivity')}
                            </span>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}

export function KanbanBoard({ activities, customers, profiles, projects }: KanbanBoardProps) {
    const t = useTranslations('Activities')

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
    const completed = activities.filter(a => a.status === 'Completed')

    return (
        <div className="flex grow h-full gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <KanbanColumn variant="danger" title={t('kanban.overdue')} activities={overdue} customers={customers} profiles={profiles} projects={projects} />
            <KanbanColumn variant="info" title={t('kanban.today')} activities={today} customers={customers} profiles={profiles} projects={projects} />
            <KanbanColumn variant="primary" title={t('kanban.tomorrow')} activities={tomorrow} customers={customers} profiles={profiles} projects={projects} />
            <KanbanColumn variant="default" title={t('kanban.thisWeek')} activities={thisWeek} customers={customers} profiles={profiles} projects={projects} />
            <KanbanColumn variant="secondary" title="Tarihsiz" activities={noDate} customers={customers} profiles={profiles} projects={projects} />
            <KanbanColumn variant="success" title={t('kanban.completed')} activities={completed} customers={customers} profiles={profiles} projects={projects} />
        </div>
    )
}
