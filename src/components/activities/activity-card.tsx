'use client'

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
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
    previous_activity_id?: string
}

interface ActivityCardProps {
    activity: Activity
    onComplete?: (id: string) => void // Trigger form externally or handle internally
}

export function ActivityCard({ activity, onComplete }: ActivityCardProps) {
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    const Icon = getActivityIcon(activity.type)
    const isOverdue = new Date(activity.due_date) < new Date() && activity.status === 'Planned'

    return (
        <Card className={`mb-2 hover:shadow-sm transition-shadow border-l-2 ${isOverdue ? 'border-l-red-500' : 'border-l-transparent'}`}>
            <CardContent className="p-2.5">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-full mt-0.5 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            {activity.topic && (
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                                    {translateTopic(activity.topic)}
                                </div>
                            )}
                            <h4 className="font-semibold text-sm leading-none">{activity.summary}</h4>

                            <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="secondary" className={`text-[10px] px-1 py-0 h-4 font-normal ${getStatusColor(activity.status)} bg-transparent border-0 p-0`}>
                                    {isOverdue && activity.status !== 'Completed' ? 'Gecikmiş' : translateStatus(activity.status)}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(activity.due_date), 'd MMM HH:mm', { locale: tr })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-5 w-5 p-0 -mr-1">
                                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setShowComplete(true)}>Tamamla</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setShowEdit(true)}>Düzenle</DropdownMenuItem>
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
                customers={[]}
            />
            <ActivityForm
                open={showComplete}
                onOpenChange={setShowComplete}
                mode="complete"
                activity={activity}
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

function translateStatus(status: string) {
    switch (status) {
        case 'Planned': return 'Planlandı'
        case 'In Progress': return 'Sürüyor'
        case 'Completed': return 'Tamamlandı'
        case 'Cancelled': return 'İptal'
        case 'Overdue': return 'Gecikmiş'
        default: return status
    }
}

function translateTopic(topic: string) {
    const map: Record<string, string> = {
        'General': 'Genel',
        'Sales': 'Satış',
        'Negotiation': 'Pazarlık',
        'Contract': 'Sözleşme',
        'Support': 'Destek',
        'After Sales': 'Satış Sonrası',
        'Collection': 'Tahsilat'
    }
    return map[topic] || topic
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Completed': return 'bg-green-50 text-green-700 border-green-200'
        case 'Cancelled': return 'bg-gray-50 text-gray-500 border-gray-200'
        default: return 'bg-blue-50 text-blue-700 border-blue-200'
    }
}
