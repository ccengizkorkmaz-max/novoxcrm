'use client'

import { useState } from 'react'
import {
    format, addDays, subDays, isSameDay, isToday, isPast, parseISO
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock,
    Plus, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ActivityStreamCard, ActivityItem } from './activity-stream-card'
import { ActivityForm } from './activity-form'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface ActivityDailyViewProps {
    activities: ActivityItem[]
    customers: any[]
    profiles: any[]
    projects: any[]
    meetings?: any[]
    currentUserId?: string
    onRefresh?: () => void
}

const HOURS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
]

export function ActivityDailyView({
    activities,
    customers,
    profiles,
    projects,
    meetings,
    currentUserId,
    onRefresh
}: ActivityDailyViewProps) {
    const locale = useLocale()
    const dateLocale = locale === 'tr' ? tr : enUS
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [createDefaultDate, setCreateDefaultDate] = useState<string>('')

    const dayActivities = activities.filter(a => {
        if (!a.due_date) return false
        try {
            return isSameDay(parseISO(a.due_date), selectedDate)
        } catch {
            return false
        }
    })

    const completedCount = dayActivities.filter(a => a.status === 'Completed').length
    const pendingCount = dayActivities.length - completedCount

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1))
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1))
    const handleToday = () => setSelectedDate(new Date())

    const openCreateAtHour = (hourStr: string) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        setCreateDefaultDate(`${dateStr}T${hourStr}`)
        setCreateDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Day Selector Header Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border rounded-xl shadow-xs">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevDay} className="h-9 w-9 rounded-lg">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={isToday(selectedDate) ? "secondary" : "outline"}
                        size="sm"
                        onClick={handleToday}
                        className={cn("h-9 font-bold text-xs px-3", isToday(selectedDate) && "bg-violet-100 text-violet-800 hover:bg-violet-200 border-violet-200")}
                    >
                        Bugün
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleNextDay} className="h-9 w-9 rounded-lg">
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="ml-2 flex flex-col">
                        <span className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight flex items-center gap-2">
                            {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: dateLocale })}
                            {isToday(selectedDate) && (
                                <Badge className="bg-violet-600 text-white text-[10px] uppercase font-black">
                                    Bugün
                                </Badge>
                            )}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                            {dayActivities.length > 0
                                ? `Toplam ${dayActivities.length} aktivite • ${completedCount} tamamlandı, ${pendingCount} bekliyor`
                                : 'Bu gün için henüz aktivite planlanmamış'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <input
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) setSelectedDate(new Date(e.target.value))
                        }}
                        className="h-9 px-3 text-xs border rounded-lg bg-slate-50 font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                    <Button
                        onClick={() => {
                            setCreateDefaultDate(format(selectedDate, "yyyy-MM-dd'T'10:00"))
                            setCreateDialogOpen(true)
                        }}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 gap-1.5 shadow-sm rounded-lg"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Aktivite Ekle</span>
                    </Button>
                </div>
            </div>

            {/* Daily Timeline Schedule */}
            {dayActivities.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2 bg-slate-50/50 rounded-xl">
                    <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                        <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {format(selectedDate, 'd MMMM', { locale: dateLocale })} gününde planlı aktivite yok
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Müşteri araması, online toplantı veya saha ziyareti planlayarak gününüzü verimli hale getirin.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setCreateDefaultDate(format(selectedDate, "yyyy-MM-dd'T'10:00"))
                                setCreateDialogOpen(true)
                            }}
                            className="mt-2 bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold"
                            size="sm"
                        >
                            <Plus className="h-4 w-4" /> Aktivite Oluştur
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-3">
                    {/* Render time-slotted stream */}
                    {dayActivities
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                        .map(activity => (
                            <ActivityStreamCard
                                key={activity.id}
                                activity={activity}
                                customers={customers}
                                profiles={profiles}
                                projects={projects}
                                meetings={meetings}
                                currentUserId={currentUserId}
                                onRefresh={onRefresh}
                            />
                        ))}
                </div>
            )}

            {/* Create Dialog */}
            <ActivityForm
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                mode="create"
                customers={customers}
                profiles={profiles}
                projects={projects}
                activity={createDefaultDate ? { due_date: createDefaultDate } : undefined}
            />
        </div>
    )
}
