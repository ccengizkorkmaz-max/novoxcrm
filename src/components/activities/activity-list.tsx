'use client'

import { format } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { Activity } from "./activity-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check as CheckClassName, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { ActivityForm } from "./activity-form"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import { Card } from "@/components/ui/card"

interface ActivityListProps {
    activities: Activity[]
    customers: any[]
    profiles: any[]
}

const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
    'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
}

const ITEMS_PER_PAGE = 20

export function ActivityList({ activities, customers, profiles }: ActivityListProps) {
    const t = useTranslations('Activities')
    const [currentPage, setCurrentPage] = useState(1)

    const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const currentActivities = activities.slice(startIndex, endIndex)

    if (activities.length === 0) {
        return (
            <Card className="p-8">
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <p>{t('table.empty')}</p>
                </div>
            </Card>
        )
    }

    return (
        <Card className="flex flex-col h-full">
            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                            <TableHead className="w-[150px]">{t('table.date')}</TableHead>
                            <TableHead className="w-[120px]">{t('table.status')}</TableHead>
                            <TableHead className="w-[120px]">{t('table.typeTopic')}</TableHead>
                            <TableHead>{t('table.customer')}</TableHead>
                            <TableHead>{t('table.agent')}</TableHead>
                            <TableHead>{t('table.summary')}</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentActivities.map((activity) => (
                            <ActivityRow key={activity.id} activity={activity} customers={customers} profiles={profiles} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="border-t p-4 flex items-center justify-between bg-white">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Önceki
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Toplam {activities.length} aktivite, Sayfa {currentPage} / {totalPages}
                    </div>
                </div>
            )}
        </Card>
    )
}

function ActivityRow({ activity, customers, profiles }: { activity: Activity, customers: any[], profiles: any[] }) {
    const t = useTranslations('Activities')
    const locale = useLocale()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    return (
        <TableRow className="hover:bg-slate-50/50 group">
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">
                        {format(new Date(activity.due_date), 'd MMM yyyy', { locale: locale === 'en' ? enUS : tr })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.due_date), 'HH:mm', { locale: locale === 'en' ? enUS : tr })}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={cn('whitespace-nowrap', statusColors[activity.status])}>
                    {t(`status.${activity.status}`)}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{t(`type.${activity.type}`)}</span>
                    {activity.topic && (
                        <span className="text-xs text-muted-foreground">{t(`topic.${activity.topic}`)}</span>
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
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        onClick={() => setShowComplete(true)}
                        title={t('actions.complete')}
                    >
                        <CheckClassName className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => setShowEdit(true)}
                        title={t('actions.edit')}
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
                    profiles={profiles}
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
