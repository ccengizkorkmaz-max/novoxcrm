'use client'

import { useState } from 'react'
import {
    format, startOfWeek, endOfWeek, addWeeks, subWeeks,
    eachDayOfInterval, isSameDay, isToday, parseISO, addDays
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, Clock, User, Building2, Video, Phone, CheckCircle2,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActivityItem } from './activity-stream-card'
import { ActivityForm } from './activity-form'
import { useLocale } from 'next-intl'
import { cn, formatTurkeyDateTime } from '@/lib/utils'

interface ActivityWeeklyViewProps {
    activities: ActivityItem[]
    customers: any[]
    profiles: any[]
    projects: any[]
    meetings?: any[]
    currentUserId?: string
    onRefresh?: () => void
}

const TYPE_ICONS: Record<string, any> = {
    'Call': Phone,
    'Meeting': Briefcase,
    'OfficeMeeting': Building2,
    'OnlineMeeting': Video,
    'Site Visit': Building2,
    'Task': CheckCircle2,
}

export function ActivityWeeklyView({
    activities,
    customers,
    profiles,
    projects,
    meetings,
    currentUserId,
    onRefresh
}: ActivityWeeklyViewProps) {
    const locale = useLocale()
    const dateLocale = locale === 'tr' ? tr : enUS
    const [currentDate, setCurrentDate] = useState<Date>(new Date())
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<any>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [createDefaultDate, setCreateDefaultDate] = useState<string>('')

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }) // Sunday

    const weekDays = eachDayOfInterval({
        start: weekStart,
        end: weekEnd
    })

    const handlePrevWeek = () => setCurrentDate(prev => subWeeks(prev, 1))
    const handleNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1))
    const handleThisWeek = () => setCurrentDate(new Date())

    const handleAddForDay = (day: Date) => {
        setCreateDefaultDate(format(day, "yyyy-MM-dd'T'10:00"))
        setCreateDialogOpen(true)
    }

    const totalWeekActivities = activities.filter(a => {
        if (!a.due_date) return false
        const d = parseISO(a.due_date)
        return d >= weekStart && d <= weekEnd
    }).length

    return (
        <div className="flex flex-col gap-4">
            {/* Week Selector Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border rounded-xl shadow-xs">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek} className="h-9 w-9 rounded-lg">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleThisWeek}
                        className="h-9 font-bold text-xs px-3"
                    >
                        Bu Hafta
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextWeek} className="h-9 w-9 rounded-lg">
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="ml-2 flex flex-col">
                        <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {format(weekStart, 'd MMMM', { locale: dateLocale })} — {format(weekEnd, 'd MMMM yyyy', { locale: dateLocale })}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                            Haftalık toplam {totalWeekActivities} planlı aktivite
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => {
                            setCreateDefaultDate(format(new Date(), "yyyy-MM-dd'T'10:00"))
                            setCreateDialogOpen(true)
                        }}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 gap-1.5 shadow-sm rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Aktivite Ekle
                    </Button>
                </div>
            </div>

            {/* 7 Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 min-h-[550px]">
                {weekDays.map((day) => {
                    const dayActivities = activities.filter(a => {
                        if (!a.due_date) return false
                        try {
                            return isSameDay(parseISO(a.due_date), day)
                        } catch {
                            return false
                        }
                    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

                    const isCurrentDay = isToday(day)

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "flex flex-col rounded-xl border bg-slate-50/60 p-2.5 transition-all min-h-[300px]",
                                isCurrentDay
                                    ? "border-violet-400 bg-violet-50/30 shadow-xs ring-1 ring-violet-400"
                                    : "border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                        {format(day, 'EEEE', { locale: dateLocale })}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={cn(
                                            "text-base font-black leading-none",
                                            isCurrentDay ? "text-violet-700" : "text-slate-800"
                                        )}>
                                            {format(day, 'd MMM', { locale: dateLocale })}
                                        </span>
                                        {isCurrentDay && (
                                            <span className="text-[9px] font-extrabold uppercase bg-violet-600 text-white px-1 py-0.2 rounded">
                                                Bugün
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shadow-xs">
                                        {dayActivities.length}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleAddForDay(day)}
                                        className="h-6 w-6 text-slate-400 hover:text-violet-700 hover:bg-violet-100 rounded"
                                        title={`${format(day, 'd MMMM')} için aktivite ekle`}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Column Cards */}
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-0.5">
                                {dayActivities.length === 0 ? (
                                    <div
                                        onClick={() => handleAddForDay(day)}
                                        className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-300/80 rounded-lg p-3 text-center cursor-pointer hover:bg-white/80 hover:border-violet-300 transition-colors group"
                                    >
                                        <Plus className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                                        <span className="text-[11px] text-slate-400 group-hover:text-violet-600 font-medium mt-1">
                                            Aktivite Ekle
                                        </span>
                                    </div>
                                ) : (
                                    dayActivities.map(activity => {
                                        const Icon = TYPE_ICONS[activity.type] || CalendarIcon
                                        const isOnline = activity.type === 'OnlineMeeting' || activity.topic === 'Online Toplantı'
                                        const isDone = activity.status === 'Completed'
                                        const isPastDue = activity.due_date && new Date(activity.due_date) < new Date() && !isDone && activity.status !== 'Cancelled'

                                        let displayTitle = activity.summary || activity.customers?.full_name || 'Aktivite'
                                        displayTitle = displayTitle.replace(/\s*\(CallID:\s*[a-f0-9-]+\)/gi, '').trim()

                                        return (
                                            <div
                                                key={activity.id}
                                                onClick={() => {
                                                    setSelectedActivity(activity)
                                                    setEditDialogOpen(true)
                                                }}
                                                className={cn(
                                                    "group p-2.5 rounded-lg border bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1.5",
                                                    isPastDue ? "border-red-200 hover:border-red-300 bg-red-50/20" : "border-slate-200/90 hover:border-violet-300",
                                                    isDone ? "opacity-75 bg-slate-50 line-through" : ""
                                                )}
                                            >
                                                {/* Card Header: Time & Type */}
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                                                            {formatTurkeyDateTime(activity.due_date, 'time')}
                                                        </span>
                                                        {isOnline && (
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                                                📹 Online
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Icon className="h-3 w-3 text-slate-400 shrink-0" />
                                                </div>

                                                {/* Summary / Customer */}
                                                <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-violet-700 transition-colors">
                                                    {displayTitle}
                                                </p>

                                                {/* Meta: Customer & Project */}
                                                <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
                                                    {activity.customers?.full_name && (
                                                        <span className="truncate flex items-center gap-1 font-medium">
                                                            <User className="h-2.5 w-2.5 shrink-0" />
                                                            {activity.customers.full_name}
                                                        </span>
                                                    )}
                                                    {activity.projects?.name && (
                                                        <span className="truncate text-blue-600 font-semibold flex items-center gap-1">
                                                            <Building2 className="h-2.5 w-2.5 shrink-0" />
                                                            {activity.projects.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Edit / Create Modals */}
            <ActivityForm
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                mode="create"
                customers={customers}
                profiles={profiles}
                projects={projects}
                activity={createDefaultDate ? { due_date: createDefaultDate } : undefined}
            />

            <ActivityForm
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                mode="edit"
                customers={customers}
                profiles={profiles}
                projects={projects}
                activity={selectedActivity}
            />
        </div>
    )
}
