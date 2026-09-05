'use client'

import React, { useState } from 'react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO,
    isToday
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, CheckCircle2, X, Plus, Calendar as CalendarIcon, Video, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, formatTurkeyDateTime } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ActivityForm } from './activity-form'
import { cancelActivity, deleteActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'

interface ActivityCalendarProps {
    activities: any[]
    customers: any[]
    profiles: any[]
    projects?: any[]
    onSelectDate?: (date: Date) => void
}

export function ActivityCalendar({ activities, customers, profiles, projects, onSelectDate }: ActivityCalendarProps) {
    const locale = useLocale()
    const router = useRouter()
    const dateLocale = locale === 'tr' ? tr : enUS
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedActivity, setSelectedActivity] = useState<any>(null)
    const [showEdit, setShowEdit] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [createDefaultDate, setCreateDefaultDate] = useState<string>('')

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const renderHeader = () => {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border-b">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9 rounded-lg">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-9 font-bold text-xs px-3">
                        Bu Ay
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9 rounded-lg">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="ml-2 text-lg sm:text-xl font-black text-slate-900 capitalize tracking-tight">
                        {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={() => {
                            setCreateDefaultDate(format(new Date(), "yyyy-MM-dd'T'10:00"))
                            setShowCreate(true)
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 gap-1.5 shadow-sm rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Aktivite Ekle
                    </Button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = []
        const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 })

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="py-2.5 text-center text-xs font-black text-slate-500 uppercase tracking-wider border-b bg-slate-50/80">
                    {format(addDays(startDate, i), 'EEEE', { locale: dateLocale })}
                </div>
            )
        }

        return <div className="grid grid-cols-7">{days}</div>
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate
        })

        const rows: React.ReactNode[] = []
        let days: React.ReactNode[] = []

        calendarDays.forEach((day, i) => {
            const dayActivities = activities.filter(a => a.due_date && isSameDay(parseISO(a.due_date), day))
            const isCurDay = isToday(day)
            const isThisMonth = isSameMonth(day, monthStart)

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "relative min-h-[130px] border-b border-r p-2 transition-all flex flex-col group/cell",
                        !isThisMonth ? "bg-slate-50/50 text-slate-400" : "bg-white hover:bg-slate-50/40",
                        isCurDay && "bg-violet-50/20"
                    )}
                >
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-all",
                            isCurDay
                                ? "bg-violet-600 text-white shadow-xs"
                                : isThisMonth ? "text-slate-800" : "text-slate-400"
                        )}>
                            {format(day, 'd')}
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setCreateDefaultDate(format(day, "yyyy-MM-dd'T'10:00"))
                                setShowCreate(true)
                            }}
                            className="h-6 w-6 text-slate-300 hover:text-violet-600 hover:bg-violet-50 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity"
                            title="Bu güne aktivite ekle"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="mt-1.5 space-y-1 flex-1 overflow-hidden">
                        {dayActivities.slice(0, 3).map(activity => {
                            const isDone = activity.status === 'Completed'
                            const isOnline = activity.type === 'OnlineMeeting' || activity.topic === 'Online Toplantı'
                            const isOverdue = activity.due_date && new Date(activity.due_date) < new Date() && !isDone && activity.status !== 'Cancelled'

                            return (
                                <div
                                    key={activity.id}
                                    className={cn(
                                        "group flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md border cursor-pointer truncate shadow-2xs transition-all hover:scale-[1.01]",
                                        isDone ? "bg-slate-100 text-slate-500 border-slate-200 line-through opacity-70" :
                                            isOverdue ? "bg-red-50 text-red-700 border-red-200 font-bold" :
                                                activity.priority === 'Urgent' ? "bg-red-50 text-red-800 border-red-200 font-bold" :
                                                    isOnline ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                                        "bg-violet-50 text-violet-800 border-violet-200 font-medium"
                                    )}
                                    onClick={() => {
                                        setSelectedActivity(activity)
                                        setShowEdit(true)
                                    }}
                                    title={`${activity.summary || activity.customers?.full_name} | ${formatTurkeyDateTime(activity.due_date, 'time')} | ${activity.owner?.full_name || '-'}`}
                                >
                                    <span className="text-[10px] font-bold shrink-0 opacity-75">
                                        {formatTurkeyDateTime(activity.due_date, 'time')}
                                    </span>
                                    <span className="truncate font-medium flex-1">
                                        {activity.summary || activity.customers?.full_name || 'Aktivite'}
                                    </span>
                                </div>
                            )
                        })}

                        {dayActivities.length > 3 && (
                            <div
                                onClick={() => {
                                    if (onSelectDate) onSelectDate(day)
                                }}
                                className="text-[10px] font-bold text-violet-600 hover:underline pl-1 cursor-pointer"
                            >
                                +{dayActivities.length - 3} daha...
                            </div>
                        )}
                    </div>
                </div>
            )

            if ((i + 1) % 7 === 0) {
                rows.push(
                    <div className="grid grid-cols-7" key={day.toString()}>
                        {days}
                    </div>
                )
                days = []
            }
        })

        return <div>{rows}</div>
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border shadow-xs overflow-hidden min-w-[750px]">
            {renderHeader()}
            <div className="flex-1 overflow-auto">
                {renderDays()}
                {renderCells()}
            </div>

            {/* Modals */}
            <ActivityForm
                open={showCreate}
                onOpenChange={setShowCreate}
                mode="create"
                customers={customers}
                profiles={profiles}
                projects={projects}
                activity={createDefaultDate ? { due_date: createDefaultDate } : undefined}
            />

            {selectedActivity && (
                <ActivityForm
                    open={showEdit}
                    onOpenChange={setShowEdit}
                    mode="edit"
                    activity={selectedActivity}
                    customers={customers}
                    profiles={profiles}
                    projects={projects}
                />
            )}
        </div>
    )
}

