'use client'

import { format } from 'date-fns'
import { enUS, tr } from 'date-fns/locale'
import { CalendarIcon, CheckCircle2, Phone, Mail, MessageSquare, Briefcase, FileText, User, MoreHorizontal, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActivityForm } from './activity-form'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

export interface Activity {
    id: string
    type: string
    topic?: string
    summary: string
    customer_id: string
    customers?: { full_name: string }
    owner?: { full_name: string }
    due_date: string
    status: 'Planned' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled'
    outcome?: string
    notes?: string
    description?: string
    previous_activity_id?: string
}

interface ActivityCardProps {
    activity: Activity
    customers?: any[]
    onComplete?: (id: string) => void // Trigger form externally or handle internally
}

export function ActivityCard({ activity, customers, onComplete }: ActivityCardProps) {
    const t = useTranslations('Activities')
    const locale = useLocale()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    const Icon = getActivityIcon(activity.type)
    const isOverdue = activity.due_date ? new Date(activity.due_date) < new Date() && activity.status === 'Planned' : false

    return (
        <Card
            className={`mb-2 hover:shadow-sm transition-all border-l-2 cursor-pointer hover:bg-slate-50/80 ${isOverdue ? 'border-l-red-500' : 'border-l-transparent'}`}
            onClick={() => setShowEdit(true)}
        >
            <CardContent className="p-2.5">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-full mt-0.5 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            {activity.topic && (
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                                    {t(`topic.${activity.topic}`)}
                                </div>
                            )}
                            <h4 className="font-semibold text-sm leading-none">{activity.summary}</h4>

                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="secondary" className={`text-[10px] px-1 py-0 h-4 font-normal ${getStatusColor(activity.status)} bg-transparent border-0 p-0`}>
                                    {isOverdue && activity.status !== 'Completed' ? t('kanban.overdue') : t(`status.${activity.status}`)}
                                </Badge>
                                {activity.due_date && (
                                    <>
                                        <span className="text-[10px] text-muted-foreground">•</span>
                                        <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(activity.due_date), 'd MMM HH:mm', { locale: locale === 'tr' ? tr : enUS })}
                                        </span>
                                    </>
                                )}
                            </div>

                            {activity.description && (
                                <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3 bg-muted/30 p-2 rounded-md border border-muted-foreground/5 italic">
                                    "{activity.description}"
                                </p>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0 -mr-1 hover:bg-slate-200/50">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setShowComplete(true); }}>{t('actions.complete')}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); setShowEdit(true); }}>{t('actions.edit')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>

            {/* Dialogs */}
            <ActivityForm
                open={showEdit}
                onOpenChange={setShowEdit}
                mode="edit"
                activity={activity}
                customers={customers}
            />
            <ActivityForm
                open={showComplete}
                onOpenChange={setShowComplete}
                mode="complete"
                activity={activity}
                customers={customers}
            />
        </Card>
    )
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'Call': return Phone
        case 'Email': return Mail
        case 'Whatsapp': return MessageSquare
        case 'Meeting': return Briefcase
        case 'Site Visit': return HomeIcon // Need to import or use Briefcase
        case 'Offer Sent': return FileText
        default: return CalendarIcon
    }
}

function HomeIcon(props: any) {
    return <Briefcase {...props} /> // Fallback
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Completed': return 'bg-green-50 text-green-700 border-green-200'
        case 'Cancelled': return 'bg-gray-50 text-gray-500 border-gray-200'
        default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
}
