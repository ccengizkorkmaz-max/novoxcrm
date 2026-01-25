'use client'

import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Activity } from "./activity-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check as CheckClassName, Pencil } from "lucide-react"
import { useState } from "react"
import { ActivityForm } from "./activity-form"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ActivityListProps {
    activities: Activity[]
    customers: any[]
}

const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
}

const statusLabels: Record<string, string> = {
    'Pending': 'Bekliyor',
    'In Progress': 'Devam Ediyor',
    'Completed': 'Tamamlandı',
    'Cancelled': 'İptal',
}

const typeLabels: Record<string, string> = {
    'Call': 'Telefon',
    'Meeting': 'Toplantı',
    'Site Visit': 'Ziyaret',
    'Email': 'Email',
    'Whatsapp': 'Whatsapp',
}

const topicLabels: Record<string, string> = {
    'General': 'Genel',
    'Sales': 'Satış',
    'Negotiation': 'Pazarlık',
    'Contract': 'Sözleşme',
    'Support': 'Destek',
    'After Sales': 'Satış Sonrası',
    'Collection': 'Tahsilat',
}

export function ActivityList({ activities, customers }: ActivityListProps) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-slate-50 text-muted-foreground">
                <p>Görüntülenecek aktivite bulunamadı.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Tip / Konu</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Temsilci</TableHead>
                        <TableHead>Özet</TableHead>
                        <TableHead className="w-[150px]">Tarih</TableHead>
                        <TableHead className="w-[120px]">Durum</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {activities.map((activity) => (
                        <ActivityRow key={activity.id} activity={activity} customers={customers} />
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function ActivityRow({ activity, customers }: { activity: Activity, customers: any[] }) {
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    return (
        <TableRow className="hover:bg-slate-50/50 group">
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{typeLabels[activity.type] || activity.type}</span>
                    {activity.topic && (
                        <span className="text-xs text-muted-foreground">{topicLabels[activity.topic] || activity.topic}</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <span className="font-medium text-primary">
                    {activity.customers?.full_name || 'Bilinmiyor'}
                </span>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {activity.owner?.full_name || '-'}
                </span>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{activity.summary}</span>
                    {activity.notes && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{activity.notes}</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {format(new Date(activity.due_date), 'd MMM yyyy', { locale: tr })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.due_date), 'HH:mm', { locale: tr })}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={cn('whitespace-nowrap', statusColors[activity.status])}>
                    {statusLabels[activity.status] || activity.status}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        onClick={() => setShowComplete(true)}
                        title="Tamamla"
                    >
                        <CheckClassName className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowEdit(true)}
                        title="Düzenle"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>

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
                />
            </TableCell>
        </TableRow>
    )
}
