'use client'

import { format } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { Activity } from "./activity-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check as CheckClassName, Pencil, ChevronLeft, ChevronRight, X, Plus } from "lucide-react"
import { useState } from "react"
import { ActivityForm } from "./activity-form"
import { Badge } from "@/components/ui/badge"
import { cn, formatTurkeyDateTime } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from 'next/navigation'
import { cancelActivity } from "@/app/[locale]/(dashboard)/crm/activities/actions"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"
import { Card } from "@/components/ui/card"

interface ActivityListProps {
    activities: Activity[]
    customers: any[]
    profiles: any[]
    projects?: any[]
}

const statusColors: Record<string, string> = {
    'Planned': 'bg-amber-100 text-amber-800 border-amber-200',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'Completed': 'bg-green-100 text-green-800 border-green-200',
    'Overdue': 'bg-red-100 text-red-800 border-red-200',
    'Cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
}

const ITEMS_PER_PAGE = 20

export function ActivityList({ activities, customers, profiles, projects }: ActivityListProps) {
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
        <Card className="flex flex-col h-full border-slate-200 shadow-sm overflow-hidden">
            {/* Scrollable Table Container */}
            <div className="flex-1 overflow-auto relative">
                <Table className="table-fixed w-full min-w-[1000px] lg:min-w-full">
                    <TableHeader className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-20">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="w-[110px] text-xs font-bold uppercase tracking-wider">{t('table.date')}</TableHead>
                            <TableHead className="w-[100px] text-xs font-bold uppercase tracking-wider">{t('table.status')}</TableHead>
                            <TableHead className="w-[110px] text-xs font-bold uppercase tracking-wider">{t('table.typeTopic')}</TableHead>
                            <TableHead className="w-[150px] text-xs font-bold uppercase tracking-wider">{t('table.customer')}</TableHead>
                            <TableHead className="w-[30px] text-xs font-bold uppercase tracking-wider"></TableHead>
                            <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider">{t('table.agent')}</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider">{t('table.summary')}</TableHead>
                            <TableHead className="w-[180px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentActivities.map((activity) => (
                            <ActivityRow key={activity.id} activity={activity} customers={customers} profiles={profiles} projects={projects} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="border-t p-3 flex items-center justify-between bg-white z-10">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                            Önceki
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Sonraki
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                        Toplam {activities.length} aktivite • Sayfa {currentPage} / {totalPages}
                    </div>
                </div>
            )}
        </Card>
    )
}

function ActivityRow({ activity, customers, profiles, projects }: { activity: Activity, customers: any[], profiles: any[], projects?: any[] }) {
    const t = useTranslations('Activities')
    const locale = useLocale()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)

    return (
        <TableRow className="hover:bg-slate-50/50 group border-slate-100">
            <TableCell>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">
                        {activity.due_date ? formatTurkeyDateTime(activity.due_date, 'date') : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                        {activity.due_date ? formatTurkeyDateTime(activity.due_date, 'time') : ''}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                {(() => {
                    const isOverdue = activity.due_date && new Date(activity.due_date) < new Date() && activity.status !== 'Completed' && activity.status !== 'Cancelled'
                    const statusKey = isOverdue ? 'Overdue' : (activity.status || 'Planned')
                    return (
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0.5 font-bold border-0', statusColors[statusKey] || statusColors['Planned'])}>
                            {t(`status.${statusKey}`)}
                        </Badge>
                    )
                })()}
            </TableCell>
            <TableCell>
                <div className="flex flex-col max-w-full">
                    <span className="text-[11px] font-bold text-slate-600 leading-tight truncate">{t(`type.${activity.type}`)}</span>
                    {activity.topic && (
                        <span className="text-[10px] text-slate-400 font-medium truncate italic">{t(`topic.${activity.topic}`)}</span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="max-w-full truncate">
                    {activity.customer_id ? (
                        <Link href={`/customers/${activity.customer_id}`}>
                            <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                                {activity.customers?.full_name || 'Bilinmiyor'}
                            </span>
                        </Link>
                    ) : (
                        <span className="text-xs font-bold text-slate-600">
                            {activity.customers?.full_name || 'Bilinmiyor'}
                        </span>
                    )}
                </div>
            </TableCell>
                        <TableCell className="w-[30px] text-center">
                          <ActivityCreateButton customerId={activity.customer_id} customers={customers} profiles={profiles} />
                        </TableCell>
            <TableCell>
                <div className="max-w-full truncate">
                    <span className="text-[11px] text-slate-600 font-medium">
                        {activity.owner?.full_name || '-'}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex flex-col max-w-full overflow-hidden">
                    <span className="text-xs font-medium text-slate-800 truncate" title={activity.summary}>
                        {activity.summary}
                    </span>
                    {(activity as any).projects?.name && (
                        <span className="text-[10px] text-blue-600 font-semibold truncate">
                            📁 {(activity as any).projects.name}
                        </span>
                    )}
                    {activity.description && (
                        <span className="text-[10px] text-slate-500 truncate" title={activity.description}>
                            {activity.description}
                        </span>
                    )}
                    {activity.notes && (
                        <span className="text-[10px] text-slate-400 truncate italic" title={activity.notes}>
                            {activity.notes}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex justify-end gap-1 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100/80 rounded-full transition-all"
                        onClick={(e) => { e.stopPropagation(); setShowComplete(true); }}
                        title={t('actions.complete')}
                    >
                        <CheckClassName className="h-5 w-5 stroke-[3px]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100/80 rounded-full transition-all"
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Bu aktiviteyi iptal etmek istediğinize emin misiniz?')) {
                                const result = await cancelActivity(activity.id);
                                if (result?.error) toast.error(result.error);
                                else { toast.success('Aktivite iptal edildi'); window.location.reload(); }
                            }
                        }}
                        title={t('status.Cancelled')}
                    >
                        <X className="h-5 w-5 stroke-[3px]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/80 rounded-full transition-all"
                        onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
                        title={t('actions.edit')}
                    >
                        <Pencil className="h-4 w-4 stroke-[2.5px]" />
                    </Button>
                </div>

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
                />
            </TableCell>
        </TableRow>
    )
}

// Inline create button with dialog
function ActivityCreateButton({ customerId, customers, profiles }: { customerId: string | null, customers: any[], profiles: any[] }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                onClick={(e) => { e.stopPropagation(); setOpen(true) }}
                title="Yeni Aktivite"
            >
                <Plus className="h-4 w-4" />
            </Button>
            <ActivityForm
                open={open}
                onOpenChange={setOpen}
                mode="create"
                defaultCustomerId={customerId || undefined}
                customers={customers}
                profiles={profiles}
            />
        </>
    )
}
