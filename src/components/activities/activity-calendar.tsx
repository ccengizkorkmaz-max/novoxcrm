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
    isEqual
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'
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
}

export function ActivityCalendar({ activities, customers, profiles, projects }: ActivityCalendarProps) {
    const locale = useLocale()
    const router = useRouter()
    const dateLocale = locale === 'tr' ? tr : enUS
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedActivity, setSelectedActivity] = useState<any>(null)
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-4 py-4 border-b">
                <h2 className="text-lg font-semibold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
                </h2>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                        Bugün
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
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
                <div key={i} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-b">
                    {format(addDays(startDate, i), 'EEEE', { locale: dateLocale })}
                </div>
            )
        }

        return <div className="grid grid-cols-7 bg-muted/20">{days}</div>
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

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "relative min-h-[120px] border-b border-r p-2 transition-colors hover:bg-muted/30",
                        !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground",
                        isSameDay(day, new Date()) && "bg-primary/5"
                    )}
                >
                    <span className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                        isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                    )}>
                        {format(day, 'd')}
                    </span>

                    <div className="mt-2 space-y-1">
                        {dayActivities.slice(0, 4).map(activity => (
                            <div
                                key={activity.id}
                                className={cn(
                                    "group flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs rounded border cursor-pointer truncate shadow-sm transition-all hover:scale-[1.02]",
                                    activity.status === 'Completed' ? "bg-green-100 text-green-800 border-green-200 line-through opacity-70" :
                                        activity.priority === 'Urgent' ? "bg-red-100 text-red-800 border-red-200 font-semibold" :
                                            activity.priority === 'High' ? "bg-orange-100 text-orange-800 border-orange-200" :
                                                "bg-blue-100 text-blue-800 border-blue-200"
                                )}
                                onClick={() => {
                                    setSelectedActivity(activity)
                                    setShowEdit(true)
                                }}
                                title={`${activity.summary} | ${activity.customers?.full_name || 'Bilinmiyor'} | Sorumlu: ${activity.owner?.full_name || '-'} (${activity.type})`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                                    style={{
                                        backgroundColor: activity.type === 'Meeting' ? '#8b5cf6' :
                                            activity.type === 'Call' ? '#3b82f6' :
                                                activity.type === 'Site Visit' ? '#f59e0b' : '#64748b'
                                    }}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="truncate font-medium">{activity.summary}</span>
                                    {activity.owner?.full_name && (
                                        <span className="text-[8px] opacity-80 leading-tight font-bold text-muted-foreground mt-0.5">
                                            {activity.owner.full_name}
                                        </span>
                                    )}
                                </div>

                                {activity.status !== 'Completed' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedActivity(activity);
                                                setShowEdit(true);
                                            }}>
                                                <Pencil className="h-3 w-3 mr-2" />
                                                Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedActivity(activity);
                                                setShowComplete(true);
                                            }}>
                                                <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
                                                Tamamla
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Bu aktiviteyi iptal etmek istediğinize emin misiniz?')) {
                                                    const result = await cancelActivity(activity.id);
                                                    if (result?.error) toast.error(result.error);
                                                    else { toast.success('Aktivite iptal edildi'); router.refresh(); }
                                                }
                                            }}>
                                                <X className="h-3 w-3 mr-2 text-red-600" />
                                                İptal Et
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Bu aktiviteyi kalıcı olarak silmek istediğinize emin misiniz?')) {
                                                    const result = await deleteActivity(activity.id);
                                                    if (result?.error) toast.error(result.error);
                                                    else { toast.success('Aktivite silindi'); router.refresh(); }
                                                }
                                            }}>
                                                <X className="h-3 w-3 mr-2" />
                                                Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}
                        {dayActivities.length > 4 && (
                            <div className="text-[10px] text-muted-foreground pl-1">
                                +{dayActivities.length - 4} daha...
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
        <div className="flex flex-col h-full bg-card min-w-[800px]">
            {renderHeader()}
            <div className="flex-1 overflow-auto">
                {renderDays()}
                {renderCells()}
            </div>

            {selectedActivity && (
                <>
                    <ActivityForm
                        open={showEdit}
                        onOpenChange={setShowEdit}
                        mode="edit"
                        activity={selectedActivity}
                        customers={customers}
                        profiles={profiles}
                        projects={projects}
                    />
                    <ActivityForm
                        open={showComplete}
                        onOpenChange={setShowComplete}
                        mode="complete"
                        activity={selectedActivity}
                        customers={customers}
                        profiles={profiles}
                        projects={projects}
                    />
                </>
            )}
        </div>
    )
}
