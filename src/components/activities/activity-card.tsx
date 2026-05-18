'use client'

import { format } from 'date-fns'
import { enUS, tr } from 'date-fns/locale'
import { CalendarIcon, Phone, Mail, MessageSquare, Briefcase, FileText, User, MoreHorizontal, Video, Building2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActivityForm } from './activity-form'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from "@/lib/utils"

export interface Activity {
    id: string
    type: string
    topic?: string
    summary: string
    customer_id: string
    customers?: { full_name: string }
    owner?: { full_name: string }
    projects?: { name: string }
    project_id?: string
    due_date: string
    status: 'Planned' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled'
    outcome?: string
    notes?: string
    description?: string
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
    reminder_at?: string
    owner_id?: string
    previous_activity_id?: string
}

interface ActivityCardProps {
    activity: Activity
    customers?: any[]
    profiles?: any[]
    projects?: any[]
    onComplete?: (id: string) => void
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'Call': return Phone
        case 'Email': return Mail
        case 'Whatsapp': return MessageSquare
        case 'OnlineMeeting': return Video
        case 'OfficeMeeting': return Building2
        case 'Meeting':
        case 'Site Visit': return Briefcase
        case 'Offer Sent': return FileText
        default: return CalendarIcon
    }
}

export function ActivityCard({ activity, customers, profiles, projects, onComplete }: ActivityCardProps) {
    const t = useTranslations('Activities')
    const locale = useLocale()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    const Icon = getActivityIcon(activity.type)
    const isOverdue = activity.due_date ? new Date(activity.due_date) < new Date() && activity.status !== 'Completed' && activity.status !== 'Cancelled' : false
    const isCompleted = activity.status === 'Completed'
    const isCancelled = activity.status === 'Cancelled'

    return (
        <>
            <Card
                className={cn(
                    "group relative border shadow-sm transition-all hover:shadow-md cursor-pointer bg-white overflow-hidden",
                    isOverdue ? "border-red-200 shadow-red-50" : "border-slate-200",
                    isCompleted ? "opacity-75 bg-slate-50" : "",
                    isCancelled ? "opacity-60 bg-slate-50" : ""
                )}
                onClick={() => setShowEdit(true)}
            >
                <CardContent className="p-2.5 space-y-2">
                    {/* Header: Icon, Type/Topic, Priority */}
                    <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border shadow-sm transition-colors",
                                isOverdue ? "bg-red-50 text-red-600 border-red-100" :
                                    isCompleted ? "bg-green-50 text-green-600 border-green-100" :
                                        "bg-white text-slate-500 border-slate-200 group-hover:border-blue-200 group-hover:text-blue-600"
                            )}>
                                <Icon className="h-3 w-3" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none truncate">
                                    {activity.topic ? t(`topic.${activity.topic}`) : t(`type.${activity.type}`)}
                                </span>
                                {activity.priority && activity.priority !== 'Medium' && (
                                    <span className={cn(
                                        "text-[9px] font-bold leading-tight mt-0.5",
                                        activity.priority === 'Urgent' ? "text-red-600" :
                                            activity.priority === 'High' ? "text-orange-600" :
                                                "text-blue-500"
                                    )}>
                                        {t(`form.priority${activity.priority}`)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-5 w-5 -mr-1 text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setShowComplete(true); }}>
                                    {t('actions.complete')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setShowEdit(true); }}>
                                    {t('actions.edit')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Body: Summary, Description & Customer */}
                    <div className="min-w-0">
                        <h4 className={cn(
                            "text-[12px] font-bold text-slate-700 leading-tight mb-1 group-hover:text-blue-700 transition-colors line-clamp-2 inline-flex items-start gap-1",
                            isCompleted && "text-slate-500 font-medium",
                            isCancelled && "line-through text-slate-400 font-medium"
                        )}>
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />}
                            <span className="line-clamp-2">{activity.summary}</span>
                        </h4>
                        {activity.description && (
                            <p className="text-[10px] text-slate-500 leading-snug line-clamp-2 mb-1">
                                {activity.description}
                            </p>
                        )}
                        {activity.customers?.full_name && (
                            <Link href={`/customers/${activity.customer_id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold truncate bg-slate-50/50 hover:bg-slate-100 hover:text-blue-600 cursor-pointer rounded px-1 w-fit max-w-full transition-colors">
                                    <User className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">{activity.customers.full_name}</span>
                                </div>
                            </Link>
                        )}
                        {(activity as any).projects?.name && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold truncate bg-blue-50/50 rounded px-1 w-fit max-w-full mt-0.5">
                                <Building2 className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate">{(activity as any).projects.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer: Date & Owner */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                        {activity.due_date ? (
                            <div className={cn(
                                "flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                isOverdue
                                    ? "bg-red-50 text-red-600"
                                    : "bg-slate-50/80 text-slate-500"
                            )}>
                                <CalendarIcon className="h-2.5 w-2.5" />
                                {format(new Date(activity.due_date), 'd MMM, HH:mm', { locale: locale === 'tr' ? tr : enUS })}
                            </div>
                        ) : (
                            <span className="text-[9px] text-slate-400 italic">No Date</span>
                        )}

                        {activity.owner?.full_name && (
                            <div title={activity.owner.full_name} className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-600 uppercase shrink-0">
                                {activity.owner.full_name.substring(0, 2)}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <ActivityForm
                open={showEdit}
                onOpenChange={setShowEdit}
                mode="edit"
                activity={activity}
                customers={customers}
                profiles={profiles}
                projects={projects}
            />
            <ActivityForm
                open={showComplete}
                onOpenChange={setShowComplete}
                mode="complete"
                activity={activity}
                customers={customers}
                profiles={profiles}
                projects={projects}
            />
        </>
    )
}
