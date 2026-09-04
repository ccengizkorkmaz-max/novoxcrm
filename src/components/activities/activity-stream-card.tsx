'use client'

import { useState } from 'react'
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
    Calendar as CalendarIcon, Phone, Mail, MessageSquare, Briefcase,
    FileText, User, MoreHorizontal, Video, Building2, CheckCircle2,
    Copy, Check, Play, ExternalLink, Trash2, X, Pencil, Clock,
    AlertCircle, Sparkles, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActivityForm } from './activity-form'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { cancelActivity, deleteActivity, outcomeActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

export interface ActivityItem {
    id: string
    type: string
    topic?: string
    summary: string
    customer_id?: string
    customers?: {
        id?: string
        full_name: string
        phone?: string
        email?: string
        customer_type?: string
        company_name?: string | null
        company?: { name: string } | null
    }
    leads?: {
        id?: string
        full_name: string
        phone?: string
        email?: string
    }
    owner?: { id?: string; full_name: string; phone?: string }
    projects?: { name: string }
    project_id?: string
    due_date: string
    status: 'Planned' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled' | 'Pending'
    outcome?: string
    notes?: string
    description?: string
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
    reminder_at?: string
    owner_id?: string
    daily_room_name?: string
    meeting_id?: string
}

interface ActivityStreamCardProps {
    activity: ActivityItem
    customers?: any[]
    profiles?: any[]
    projects?: any[]
    meetings?: any[]
    currentUserId?: string
    onRefresh?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    'Planned': { label: 'Planlandı', bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200' },
    'Pending': { label: 'Beklemede', bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200' },
    'In Progress': { label: 'Devam Ediyor', bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Completed': { label: 'Tamamlandı', bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Overdue': { label: 'Gecikmiş', bg: 'bg-red-50 text-red-700', text: 'text-red-700', border: 'border-red-200' },
    'Cancelled': { label: 'İptal', bg: 'bg-slate-100 text-slate-500', text: 'text-slate-500', border: 'border-slate-200' },
}

const TYPE_ICONS: Record<string, any> = {
    'Call': Phone,
    'Meeting': Briefcase,
    'OfficeMeeting': Building2,
    'OnlineMeeting': Video,
    'Site Visit': Building2,
    'Whatsapp': MessageSquare,
    'Email': Mail,
    'Task': CheckCircle2,
}

const TYPE_EMOJIS: Record<string, string> = {
    'Call': '📞',
    'Meeting': '🏛️',
    'OfficeMeeting': '🏢',
    'OnlineMeeting': '📹',
    'Site Visit': '🏗️',
    'Whatsapp': '💬',
    'Email': '✉️',
    'Task': '✅',
}

export function ActivityStreamCard({
    activity,
    customers = [],
    profiles = [],
    projects = [],
    meetings = [],
    currentUserId,
    onRefresh
}: ActivityStreamCardProps) {
    const locale = useLocale()
    const router = useRouter()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const dateLocale = locale === 'tr' ? tr : enUS
    const dueDate = activity.due_date ? new Date(activity.due_date) : new Date()
    const isPastDue = activity.due_date && isPast(dueDate) && activity.status !== 'Completed' && activity.status !== 'Cancelled'
    const computedStatus = isPastDue ? 'Overdue' : (activity.status || 'Planned')
    const statusInfo = STATUS_CONFIG[computedStatus] || STATUS_CONFIG['Planned']

    const isOnline = activity.type === 'OnlineMeeting' || activity.topic === 'Online Toplantı' || (activity.summary && activity.summary.toLowerCase().includes('online'))
    
    // Check if matched to meetings table for live room name
    const matchedMeeting = meetings.find(m => 
        (activity.meeting_id && m.id === activity.meeting_id) ||
        (m.customer_id && m.customer_id === activity.customer_id && Math.abs(new Date(m.scheduled_at).getTime() - dueDate.getTime()) < 60 * 60 * 1000)
    )

    const roomName = activity.daily_room_name || matchedMeeting?.daily_room_name || matchedMeeting?.id
    const meetingId = matchedMeeting?.id || activity.meeting_id || activity.id

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.novoxcrm.com'
    const localePrefix = locale === 'tr' ? '' : `/${locale}`
    const guestUrl = roomName ? `${origin}/meeting/${roomName}` : `${origin}/meeting/${activity.id}`
    const hostUrl = `${origin}${localePrefix}/meetings/${meetingId}`

    const customerPhone = activity.customers?.phone || activity.leads?.phone
    const customerName = activity.customers?.full_name || activity.leads?.full_name || 'Bilinmiyor'
    const projectName = activity.projects?.name || ''
    const ownerName = activity.owner?.full_name || '-'

    const handleCopy = (text: string, key: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        toast.success(`${label} kopyalandı!`)
        setTimeout(() => setCopiedKey(null), 2500)
    }

    const handleQuickComplete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsProcessing(true)
        try {
            const formData = new FormData()
            formData.append('id', activity.id)
            formData.append('outcome', 'Success')
            formData.append('notes', 'Aktivite başarıyla tamamlandı olarak işaretlendi.')
            const res = await outcomeActivity(formData)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Aktivite tamamlandı olarak işaretlendi ✅')
                if (onRefresh) onRefresh()
                router.refresh()
            }
        } catch (err: any) {
            toast.error(err.message || 'Hata oluştu')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleCancel = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Bu aktiviteyi iptal etmek istediğinize emin misiniz?')) {
            setIsProcessing(true)
            const result = await cancelActivity(activity.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Aktivite iptal edildi')
                if (onRefresh) onRefresh()
                router.refresh()
            }
            setIsProcessing(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Bu aktiviteyi kalıcı olarak silmek istediğinize emin misiniz?')) {
            setIsProcessing(true)
            const result = await deleteActivity(activity.id)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Aktivite silindi')
                if (onRefresh) onRefresh()
                router.refresh()
            }
            setIsProcessing(false)
        }
    }

    const Icon = TYPE_ICONS[activity.type] || CalendarIcon
    const emoji = TYPE_EMOJIS[activity.type] || '📌'

    // Clean summary text
    let displayTitle = activity.summary || `${customerName}`
    displayTitle = displayTitle.replace(/\s*\(CallID:\s*[a-f0-9-]+\)/gi, '').trim()

    return (
        <>
            <Card
                onClick={() => setShowEdit(true)}
                className={cn(
                    "group relative border transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden rounded-xl bg-white",
                    isPastDue ? "border-red-200 hover:border-red-300 bg-red-50/10" : "border-slate-200/90 hover:border-slate-300",
                    activity.status === 'Completed' ? "opacity-85 bg-slate-50/50" : "",
                    activity.status === 'Cancelled' ? "opacity-60 bg-slate-50" : ""
                )}
            >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Date + Main Content */}
                    <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                        {/* 1. Date Block (Like Screenshot: 4 EYL 13:00) */}
                        <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[68px] py-2 px-1.5 rounded-xl bg-slate-50/80 border border-slate-200/80 group-hover:bg-violet-50/40 group-hover:border-violet-200 transition-colors shrink-0 text-center select-none">
                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 leading-none">
                                {format(dueDate, 'd')}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">
                                {format(dueDate, 'MMM', { locale: dateLocale })}
                            </span>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-1.5 leading-none">
                                {format(dueDate, 'HH:mm')}
                            </span>

                            {isToday(dueDate) && (
                                <span className="mt-1.5 px-1 py-0.2 text-[9px] font-black uppercase tracking-tight bg-violet-100 text-violet-700 rounded">
                                    Bugün
                                </span>
                            )}
                            {isTomorrow(dueDate) && (
                                <span className="mt-1.5 px-1 py-0.2 text-[9px] font-black uppercase tracking-tight bg-blue-100 text-blue-700 rounded">
                                    Yarın
                                </span>
                            )}
                            {isPastDue && (
                                <span className="mt-1.5 px-1 py-0.2 text-[9px] font-black uppercase tracking-tight bg-red-100 text-red-700 rounded animate-pulse">
                                    Gecikmiş
                                </span>
                            )}
                        </div>

                        {/* 2. Content Details */}
                        <div className="flex flex-col min-w-0 flex-1 space-y-2">
                            {/* Title & Status Row */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base select-none">{emoji}</span>
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-[280px] sm:max-w-[450px] lg:max-w-[600px] group-hover:text-blue-600 transition-colors" title={displayTitle}>
                                    {displayTitle}
                                </h3>

                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[10px] px-2 py-0.5 font-bold border rounded-full shrink-0",
                                        statusInfo.bg,
                                        statusInfo.border
                                    )}
                                >
                                    {statusInfo.label}
                                </Badge>

                                {activity.priority === 'Urgent' && (
                                    <Badge className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0 h-4">
                                        ⚡ ACİL
                                    </Badge>
                                )}
                                {activity.priority === 'High' && (
                                    <Badge className="bg-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0 h-4">
                                        YÜKSEK
                                    </Badge>
                                )}
                            </div>

                            {/* Metadata Row with Icons (👤 Müşteri, 🏢 Proje, 🧑‍💼 Danışman) */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                                {activity.customer_id ? (
                                    <Link
                                        href={`/customers/${activity.customer_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-600 hover:underline"
                                    >
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{customerName}</span>
                                    </Link>
                                ) : (
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{customerName}</span>
                                    </span>
                                )}

                                {projectName && (
                                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{projectName}</span>
                                    </span>
                                )}

                                {ownerName && ownerName !== '-' && (
                                    <span className="flex items-center gap-1.5 font-medium text-slate-500">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{ownerName}</span>
                                    </span>
                                )}

                                {activity.topic && activity.topic !== 'General' && (
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
                                        {activity.topic}
                                    </span>
                                )}
                            </div>

                            {/* Optional Notes / Description Preview */}
                            {(activity.description || activity.notes) && (
                                <p className="text-xs text-slate-500 line-clamp-1 italic font-normal">
                                    {activity.description || activity.notes}
                                </p>
                            )}

                            {/* 3. Screenshot Style Action/Link Boxes (Online Meeting Links or Phone actions) */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {isOnline ? (
                                    <>
                                        {/* Green Müşteri Katılım Linki Box */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-950 transition-colors shadow-xs"
                                        >
                                            <span className="text-emerald-700">🔗</span>
                                            <span className="font-sans font-bold text-emerald-800 mr-1 text-[11px]">
                                                👥 Müşteri Katılım Linki:
                                            </span>
                                            <span className="text-emerald-700 font-medium truncate max-w-[170px] sm:max-w-[280px]">
                                                {guestUrl}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(guestUrl, 'guest', 'Müşteri Linki')}
                                                className="h-5 px-1.5 ml-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/80 shrink-0 gap-1 text-[10px] font-sans font-bold"
                                            >
                                                {copiedKey === 'guest' ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                        <span>Kopyalandı</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>Kopyala</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Purple Danışman (Host) Linki Box */}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100/80 border border-violet-300/80 px-3 py-1.5 rounded-lg text-xs font-mono text-violet-950 transition-colors shadow-xs"
                                        >
                                            <span className="text-violet-700">👤</span>
                                            <span className="font-sans font-bold text-violet-800 mr-1 text-[11px]">
                                                👑 Danışman (Host) Linki:
                                            </span>
                                            <span className="text-violet-700 font-medium truncate max-w-[170px] sm:max-w-[280px]">
                                                {hostUrl}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(hostUrl, 'host', 'Danışman Linki')}
                                                className="h-5 px-1.5 ml-1.5 text-violet-700 hover:text-violet-950 hover:bg-violet-200/80 shrink-0 gap-1 text-[10px] font-sans font-bold"
                                            >
                                                {copiedKey === 'host' ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-violet-600" />
                                                        <span>Kopyalandı</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3" />
                                                        <span>Kopyala</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Phone / WhatsApp quick actions if phone exists */}
                                        {customerPhone && (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <a
                                                    href={`tel:${customerPhone}`}
                                                    className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                                                    title={`Ara: ${customerPhone}`}
                                                >
                                                    <Phone className="h-3 w-3" />
                                                    <span>{customerPhone}</span>
                                                </a>

                                                <a
                                                    href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                                                    title="WhatsApp Sohbeti Başlat"
                                                >
                                                    <MessageSquare className="h-3 w-3" />
                                                    <span>WhatsApp</span>
                                                </a>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Action Column (Katıl Button & Dropdown Options) */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                        {isOnline && activity.status !== 'Completed' && activity.status !== 'Cancelled' && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    window.open(`${localePrefix}/meetings/${meetingId}`, '_blank')
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-sm gap-1.5 text-xs transition-transform active:scale-95"
                            >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                Katıl
                            </Button>
                        )}

                        {activity.status !== 'Completed' && activity.status !== 'Cancelled' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleQuickComplete}
                                disabled={isProcessing}
                                className="h-9 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs gap-1.5"
                                title="Aktiviteyi Tamamla"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">Tamamla</span>
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => setShowEdit(true)} className="gap-2 text-xs">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Düzenle
                                </DropdownMenuItem>

                                {activity.status !== 'Completed' && (
                                    <DropdownMenuItem onClick={handleQuickComplete} className="gap-2 text-xs text-emerald-600 font-medium">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Tamamlandı İşaretle
                                    </DropdownMenuItem>
                                )}

                                {activity.status !== 'Cancelled' && (
                                    <DropdownMenuItem onClick={handleCancel} className="gap-2 text-xs text-amber-600">
                                        <X className="h-3.5 w-3.5" />
                                        İptal Et
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={handleDelete} className="gap-2 text-xs text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Kalıcı Olarak Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </Card>

            {/* Edit / Complete Dialog */}
            <ActivityForm
                open={showEdit}
                onOpenChange={setShowEdit}
                mode="edit"
                activity={activity}
                customers={customers}
                profiles={profiles}
                projects={projects}
            />
        </>
    )
}
