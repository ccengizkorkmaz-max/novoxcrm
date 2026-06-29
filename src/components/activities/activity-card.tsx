'use client'

import { format } from 'date-fns'
import { enUS, tr } from 'date-fns/locale'
import { CalendarIcon, Phone, Mail, MessageSquare, Briefcase, FileText, User, MoreHorizontal, Video, Building2, CheckCircle2, Bot, Info } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ActivityForm } from './activity-form'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { cancelActivity, deleteActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { MiniAudioPlayer } from "@/components/ui/mini-audio-player"

export interface Activity {
    id: string
    type: string
    topic?: string
    summary: string
    customer_id: string
    customers?: { 
        full_name: string
        customer_type?: string
        company_name?: string | null
        company?: { name: string } | null
    }
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
    call_recording_url?: string
    next_action_type?: string
    next_action_date?: string
    lead_id?: string
    leads?: { full_name: string }
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
        case 'Transcript': return Bot
        case 'System': return Info
        default: return CalendarIcon
    }
}

const OUTCOME_TR: Record<string, string> = {
    'Success': 'Başarılı',
    'Reached Interested': 'Ulaşıldı, İlgilendi',
    'Reached Not Interested': 'Ulaşıldı, İlgilenmedi',
    'No Answer': 'Cevap Yok',
    'Busy': 'Meşgul',
    'Follow Up Required': 'Takip Gerekli',
    'success': 'Başarılı',
    'no_answer': 'Cevap Yok',
    'busy': 'Meşgul',
    'hung_up': 'Açtı, Kapattı',
    'answered': 'Görüşüldü',
    'converted': 'Dönüşüm Sağlandı',
}

function outcomeLabel(outcome: string): string {
    return OUTCOME_TR[outcome] || outcome
}

export function ActivityCard({ activity, customers, profiles, projects, onComplete }: ActivityCardProps) {
    const t = useTranslations('Activities')
    const locale = useLocale()
    const router = useRouter()
    const [showEdit, setShowEdit] = useState(false)
    const [showComplete, setShowComplete] = useState(false)
    const [showDetail, setShowDetail] = useState(false)

    const Icon = getActivityIcon(activity.type)
    const isOverdue = activity.due_date ? new Date(activity.due_date) < new Date() && activity.status !== 'Completed' && activity.status !== 'Cancelled' : false
    const isCompleted = activity.status === 'Completed'
    const isCancelled = activity.status === 'Cancelled'
    const isReadOnly = isCompleted || isCancelled

    // Clean Call IDs from display
    const cleanText = (text: string) => {
        return text.replace(/\s*\(CallID:\s*[a-f0-9-]+\)/gi, '').replace(/\s*\[Call ID:\s*[a-f0-9-]+\]/gi, '').replace(/Vapi Call ID:\s*[a-f0-9-]+\.?\s*/gi, '').trim()
    }

    return (
        <>
            <Card
                className={cn(
                    "group relative border shadow-sm transition-all hover:shadow-md cursor-pointer bg-white overflow-hidden",
                    isOverdue ? "border-red-200 shadow-red-50" : "border-slate-200",
                    isCompleted ? "opacity-75 bg-slate-50" : "",
                    isCancelled ? "opacity-60 bg-slate-50" : ""
                )}
                onClick={() => isReadOnly ? setShowDetail(true) : setShowEdit(true)}
            >
                <CardContent className="p-3 space-y-2">
                    {/* Header: Icon, Type/Topic, Priority */}
                    <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border shadow-sm transition-colors",
                                isOverdue ? "bg-red-50 text-red-600 border-red-200" :
                                    isCompleted ? "bg-green-50 text-green-600 border-green-200" :
                                        isCancelled ? "bg-slate-100 text-slate-400 border-slate-200" :
                                        "bg-slate-50 text-slate-600 border-slate-200 group-hover:border-blue-300 group-hover:text-blue-600"
                            )}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wide leading-none truncate">
                                        {activity.topic ? t(`topic.${activity.topic}`) : t(`type.${activity.type}`)}
                                    </span>
                                    <span className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 uppercase tracking-wide",
                                        isOverdue ? "bg-red-100 text-red-700 border border-red-200" :
                                        isCompleted ? "bg-green-100 text-green-700 border border-green-200" :
                                        isCancelled ? "bg-slate-200 text-slate-500 border border-slate-300" :
                                        activity.status === 'In Progress' ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                        "bg-amber-100 text-amber-700 border border-amber-200"
                                    )}>
                                        {isOverdue ? 'Gecikmiş' :
                                         isCompleted ? 'Tamamlandı' :
                                         isCancelled ? 'İptal' :
                                         activity.status === 'In Progress' ? 'Devam Ediyor' :
                                         'Planlandı'}
                                    </span>
                                </div>
                                {activity.priority && activity.priority !== 'Medium' && (
                                    <span className={cn(
                                        "text-[10px] font-bold leading-tight mt-0.5",
                                        activity.priority === 'Urgent' ? "text-red-600" :
                                            activity.priority === 'High' ? "text-orange-600" :
                                                "text-blue-600"
                                    )}>
                                        {t(`form.priority${activity.priority}`)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!isReadOnly && (
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
                                    <DropdownMenuItem onSelect={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('Bu aktiviteyi iptal etmek istediğinize emin misiniz?')) {
                                            const result = await cancelActivity(activity.id);
                                            if (result?.error) toast.error(result.error);
                                            else { toast.success('Aktivite iptal edildi'); router.refresh(); }
                                        }
                                    }}>
                                        İptal Et
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600 focus:text-red-700" onSelect={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('Bu aktiviteyi kalıcı olarak silmek istediğinize emin misiniz?')) {
                                            const result = await deleteActivity(activity.id);
                                            if (result?.error) toast.error(result.error);
                                            else { toast.success('Aktivite silindi'); router.refresh(); }
                                        }
                                    }}>
                                        Sil
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Body: Summary, Description & Customer */}
                    <div className="min-w-0">
                        {(() => {
                            const displaySummary = cleanText(activity.summary || '')
                            return (
                                <h4 className={cn(
                                    "text-[13px] font-bold text-slate-800 leading-snug mb-1 group-hover:text-blue-700 transition-colors line-clamp-2 inline-flex items-start gap-1",
                                    isCompleted && "text-slate-700 font-semibold",
                                    isCancelled && "line-through text-slate-400 font-medium"
                                )}>
                                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                                    <span className="line-clamp-2">{displaySummary}</span>
                                </h4>
                            )
                        })()}
                        {activity.description && (() => {
                            const desc = cleanText(activity.description)
                            const displayDesc = desc.replace(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*https?:\/\/[^\s]+/g, '').trim()
                            return (
                                <p className="text-xs text-slate-600 leading-snug line-clamp-2 mb-1">
                                    {displayDesc}
                                </p>
                            )
                        })()}
                        {(() => {
                            const recordingMatch = activity.description?.match(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*(https?:\/\/[^\s]+)/)
                            const recUrl = recordingMatch ? recordingMatch[1] : activity.call_recording_url
                            
                            if (!recUrl) return null;
                            
                            return (
                                <div className="mt-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                    <MiniAudioPlayer src={recUrl} />
                                </div>
                            )
                        })()}
                        {activity.customers?.full_name && (() => {
                            const c = activity.customers
                            const customerTypeLabel = c.customer_type === 'company' ? 'Firma' : 'Kişi'
                            const companyInfo = c.company?.name || c.company_name
                            return (
                                <Link href={`/customers/${activity.customer_id}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 text-[11px] text-slate-700 font-semibold truncate bg-slate-100 hover:bg-slate-200 hover:text-blue-700 cursor-pointer rounded px-1.5 py-0.5 w-fit max-w-full transition-colors">
                                        <User className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{c.full_name} ({customerTypeLabel}{companyInfo ? ` - ${companyInfo}` : ''})</span>
                                    </div>
                                </Link>
                            )
                        })()}
                        {activity.leads?.full_name && (
                            <Link href={`/leads?search=${encodeURIComponent(activity.leads.full_name)}`} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <div className="flex items-center gap-1 text-[11px] text-orange-700 font-semibold truncate bg-orange-50 hover:bg-orange-100 cursor-pointer rounded px-1.5 py-0.5 w-fit max-w-full border border-orange-100 transition-colors">
                                    <User className="h-3 w-3 shrink-0 text-orange-500" />
                                    <span className="truncate">{activity.leads.full_name} (Müşteri Adayı)</span>
                                </div>
                            </Link>
                        )}
                        {(activity as any).projects?.name && (
                            <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold truncate bg-blue-50 rounded px-1.5 py-0.5 w-fit max-w-full mt-0.5">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{(activity as any).projects.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer: Date & Owner */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        {activity.due_date ? (
                            <div className={cn(
                                "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
                                isOverdue
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-slate-100 text-slate-700"
                            )}>
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(activity.due_date), 'd MMM, HH:mm', { locale: locale === 'tr' ? tr : enUS })}
                            </div>
                        ) : (
                            <span className="text-[10px] text-slate-400 italic">Tarih Yok</span>
                        )}

                        {activity.owner?.full_name && (
                            <div title={activity.owner.full_name} className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-600 uppercase shrink-0">
                                {activity.owner.full_name.substring(0, 2)}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Read-only detail dialog for completed/cancelled activities */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            Aktivite Detayı
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                                isCompleted ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="text-xs uppercase font-bold text-slate-500 tracking-wide">
                                    {activity.topic ? t(`topic.${activity.topic}`) : t(`type.${activity.type}`)}
                                </span>
                                <span className={cn("ml-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                                    isCompleted ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                                )}>
                                    {isCompleted ? 'Tamamlandı' : 'İptal Edildi'}
                                </span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 rounded-lg p-4 border">
                            <h3 className="text-sm font-bold text-slate-800">{cleanText(activity.summary || '')}</h3>
                        </div>

                        {/* Description / Call Summary */}
                        {activity.description && (() => {
                            const desc = cleanText(activity.description)
                            // Split transcript from summary if present
                            const transcriptMarker = desc.indexOf('📝 Transkript:')
                            let summaryPart = transcriptMarker > 0 ? desc.substring(0, transcriptMarker).trim() : desc
                            let transcriptPart = transcriptMarker > 0 ? desc.substring(transcriptMarker + '📝 Transkript:'.length).trim() : null

                            // Remove recording tag
                            summaryPart = summaryPart.replace(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*https?:\/\/[^\s]+/g, '').trim()
                            if (transcriptPart) {
                                transcriptPart = transcriptPart.replace(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*https?:\/\/[^\s]+/g, '').trim()
                            }

                            return (
                                <>
                                    {summaryPart && (
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 block mb-1">Açıklama:</span>
                                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-md border">{summaryPart}</p>
                                        </div>
                                    )}
                                    {transcriptPart && (
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500 block mb-1">📝 Transkript:</span>
                                            <div className="text-sm text-slate-700 bg-blue-50 p-3 rounded-md border border-blue-100 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                                                {transcriptPart}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {activity.outcome && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">Sonuç:</span>
                                <span className="text-sm font-semibold text-slate-800">{outcomeLabel(activity.outcome)}</span>
                            </div>
                        )}

                        {activity.notes && !activity.description?.includes(activity.notes) && (
                            <div>
                                <span className="text-xs font-semibold text-slate-500 block mb-1">Notlar:</span>
                                <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-md border border-amber-100 whitespace-pre-wrap max-h-[200px] overflow-y-auto">{activity.notes}</p>
                            </div>
                        )}

                        {(() => {
                            const recordingMatch = activity.description?.match(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*(https?:\/\/[^\s]+)/)
                            const recUrl = recordingMatch ? recordingMatch[1] : activity.call_recording_url
                            
                            if (!recUrl) return null;
                            
                            return (
                                <div>
                                    <span className="text-xs font-semibold text-slate-500 block mb-1">🎙️ Arama Kaydı:</span>
                                    <MiniAudioPlayer src={recUrl} className="max-w-sm" />
                                </div>
                            )
                        })()}

                        <div className="flex items-center justify-between pt-3 border-t text-sm text-slate-600">
                            {activity.due_date && (
                                <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {format(new Date(activity.due_date), 'd MMMM yyyy, HH:mm', { locale: locale === 'tr' ? tr : enUS })}
                                </div>
                            )}
                            {activity.customers?.full_name && (() => {
                                const c = activity.customers
                                const customerTypeLabel = c.customer_type === 'company' ? 'Firma' : 'Kişi'
                                const companyInfo = c.company?.name || c.company_name
                                return (
                                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                                        <User className="h-3.5 w-3.5 text-slate-500" />
                                        {c.full_name} ({customerTypeLabel}{companyInfo ? ` - ${companyInfo}` : ''})
                                    </div>
                                )
                            })()}
                            {activity.leads?.full_name && (
                                <div className="flex items-center gap-1 font-semibold text-slate-700">
                                    <User className="h-3.5 w-3.5 text-orange-500" />
                                    {activity.leads.full_name} (Müşteri Adayı)
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit form — only for non-completed activities */}
            {!isReadOnly && (
                <>
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
            )}
        </>
    )
}
