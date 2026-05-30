'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock, Loader2, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createActivity, updateActivity, outcomeActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/ui/combobox'
import { VoiceInput } from '@/components/ui/voice-input'
import { Link } from '@/i18n/routing'

function UpcomingActivitiesInfo({ customerId }: { customerId: string }) {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!customerId) {
            setActivities([])
            return
        }

        async function fetchRecent() {
            setLoading(true)
            const supabase = createClient()
            const { data } = await supabase
                .from('activities')
                .select('id, summary, due_date, status, type')
                .eq('customer_id', customerId)
                .in('status', ['Planned', 'In Progress'])
                .order('due_date', { ascending: true })
                .limit(3)

            if (data) setActivities(data)
            setLoading(false)
        }

        fetchRecent()
    }, [customerId])

    if (!customerId) return null
    if (loading) return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mt-3 p-3 bg-muted/50 rounded-md border border-dashed">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> Müşteri planları kontrol ediliyor...
        </div>
    )
    if (activities.length === 0) return null

    return (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md p-2.5 mt-2 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
            <p className="font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5 text-[11px]">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                Yaklaşan {activities.length} Planlı Aktivite
            </p>
            <ul className="space-y-1 max-h-[100px] overflow-y-auto">
                {activities.map(act => {
                    // Clean up long Call IDs from summary display
                    let displaySummary = act.summary || ''
                    displaySummary = displaySummary.replace(/\s*\(CallID:\s*[a-f0-9-]+\)/gi, '').trim()
                    if (displaySummary.length > 50) displaySummary = displaySummary.substring(0, 50) + '…'
                    
                    return (
                        <li key={act.id} className="flex items-center justify-between text-amber-900 dark:text-amber-300 bg-white/60 dark:bg-black/20 px-2 py-1.5 rounded border border-amber-100 dark:border-amber-900/30 text-[11px] gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="capitalize text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded shrink-0">{act.type === 'Site Visit' ? 'Ziyaret' : act.type === 'Call' ? 'Arama' : act.type === 'Meeting' ? 'Toplantı' : act.type}</span>
                                <span className="truncate font-medium" title={act.summary}>{displaySummary}</span>
                            </div>
                            <span className="flex items-center gap-0.5 whitespace-nowrap text-[10px] text-amber-600 dark:text-amber-300 shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(act.due_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

interface ActivityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'complete'
    activity?: any
    customers?: any[]
    profiles?: any[]
    projects?: any[]
    defaultCustomerId?: string
}

export function ActivityForm({ open, onOpenChange, mode, activity, customers, profiles, projects, defaultCustomerId }: ActivityFormProps) {
    const t = useTranslations('Activities')
    const router = useRouter()

    // Form States
    const [summary, setSummary] = useState(activity?.summary || '')
    const [description, setDescription] = useState(activity?.description || '')
    const [notes, setNotes] = useState(activity?.notes || '')
    const [status, setStatus] = useState(activity?.status || 'Planned')
    const [selectedCustomerId, setSelectedCustomerId] = useState(activity?.customer_id || defaultCustomerId || '')
    const [selectedProjectId, setSelectedProjectId] = useState(activity?.project_id || '')
    const [isProcessingVoice, setIsProcessingVoice] = useState(false)

    useEffect(() => {
        if (open && activity) {
            setSummary(activity?.summary || '')
            setDescription(activity?.description || '')
            setNotes(activity?.notes || '')
            setStatus(activity?.status || 'Planned')
            setSelectedCustomerId(activity?.customer_id || '')
            setSelectedProjectId(activity?.project_id || '')
        }
    }, [open, activity])

    // Ensure the current customer is in the list even if not in the top 1000
    const comboboxItems = useMemo(() => {
        const items = customers?.map((c: any) => ({ value: c.id, label: c.full_name })) || []

        // If we have a selected customer but they aren't in the list, add them
        if (selectedCustomerId && !items.find(i => i.value === selectedCustomerId)) {
            const currentCustomerName = activity?.customers?.full_name || activity?.customer?.full_name || 'Seçili Müşteri'
            items.unshift({ value: selectedCustomerId, label: currentCustomerName })
        }

        return items
    }, [customers, selectedCustomerId, activity])

    // Derived State
    const isCompleteMode = mode === 'complete' || status === 'Completed'

    const handleVoiceData = (text: string, data?: any) => {
        // If we have structured data from the AI, use it to fill the whole form
        if (data) {
            if (isCompleteMode) {
                if (data.description) setNotes((prev: string) => prev ? prev + "\n" + data.description : data.description)
                // We could also auto-select outcome if we find a way to set the ref or form value
            } else {
                if (data.summary) setSummary(data.summary)
                if (data.description) setDescription(data.description)
                // Other fields could be filled here too if needed
            }
            return
        }

        // Fallback to simple text append if no structured data
        if (isCompleteMode) {
            setNotes((prev: string) => prev ? prev + "\n" + text : text)
        } else {
            setDescription((prev: string) => prev ? prev + "\n" + text : text)
        }

        // Suggest summary if empty and in create/edit mode
        if (!summary && !isCompleteMode) {
            const firstSentence = text.split('.')[0]
            if (firstSentence && firstSentence.length < 50) {
                setSummary(firstSentence)
            } else {
                setSummary("Sesli Not: " + text.substring(0, 20) + "...")
            }
        }
    }

    async function handleSubmit(formData: FormData) {
        let result;

        // Helper: convert datetime-local string to UTC ISO string
        const toUTC = (key: string) => {
            const val = formData.get(key) as string
            if (val && val.trim() !== '') {
                formData.set(key, new Date(val).toISOString())
            }
        }

        if (mode === 'create') {
            toUTC('due_date')
            toUTC('reminder_at')
            result = await createActivity(formData)
        } else if (mode === 'edit' && status !== 'Completed') {
            toUTC('due_date')
            toUTC('reminder_at')
            toUTC('next_action_date')
            formData.append('id', activity.id)
            result = await updateActivity(formData)
        } else if (isCompleteMode) {
            toUTC('next_action_date')
            formData.append('id', activity.id)
            result = await outcomeActivity(formData)
        }

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(
                mode === 'create' ? t('form.success.created') :
                    mode === 'edit' ? t('form.success.updated') : t('form.success.completed')
            )
            onOpenChange(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-visible" key={open ? `activity-${activity?.customer_id || 'new'}` : 'closed'}>
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>
                            {mode === 'create' ? t('form.createTitle') :
                                mode === 'edit' ? t('form.editTitle') :
                                    t('form.completeTitle')}
                        </DialogTitle>

                        {/* Voice Input Button - Visible in Header */}
                        <VoiceInput
                            onTranscriptionComplete={handleVoiceData}
                            isProcessing={isProcessingVoice}
                        />
                    </div>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">

                        {/* Basic Info - Hidden only in specialized complete mode */}
                        {mode !== 'complete' && (
                            <>
                                <input type="hidden" name="customer_id" value={selectedCustomerId} />
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>{t('form.customer')}</Label>
                                        {selectedCustomerId && (
                                            <Button 
                                                variant="link" 
                                                size="sm"
                                                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                                                asChild
                                            >
                                                <Link href={`/customers/${selectedCustomerId}`}>
                                                    Müşteri Profiline Git
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <Combobox
                                            items={comboboxItems}
                                            value={selectedCustomerId}
                                            onChange={setSelectedCustomerId}
                                            placeholder={t('form.select')}
                                            searchPlaceholder={t('form.search') || 'Müşteri Ara...'}
                                            emptyText={t('form.noResults') || 'Müşteri bulunamadı.'}
                                            disabled={mode === 'edit' || (mode === 'create' && !!activity?.customer_id)}
                                        />
                                        <UpcomingActivitiesInfo customerId={selectedCustomerId} />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Proje</Label>
                                    <select
                                        name="project_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={selectedProjectId}
                                        onChange={(e) => setSelectedProjectId(e.target.value)}
                                    >
                                        <option value="">Proje Seçiniz (Opsiyonel)</option>
                                        {projects?.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('form.topic')}</Label>
                                    <select
                                        name="topic"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.topic || 'General'}
                                        required
                                    >
                                        <option value="General">{t('topic.General')}</option>
                                        <option value="Sales">{t('topic.Sales')}</option>
                                        <option value="Negotiation">{t('topic.Negotiation')}</option>
                                        <option value="Contract">{t('topic.Contract')}</option>
                                        <option value="Support">{t('topic.Support')}</option>
                                        <option value="After Sales">{t('topic.After Sales')}</option>
                                        <option value="Collection">{t('topic.Collection')}</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('table.status')}</Label>
                                    <select
                                        name="status"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Planned">{t('status.Planned')}</option>
                                        <option value="In Progress">{t('status.In Progress')}</option>
                                        <option value="Completed">{t('status.Completed')}</option>
                                        <option value="Cancelled">{t('status.Cancelled')}</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('form.owner')}</Label>
                                    <select
                                        name="owner_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.owner_id || ''}
                                    >
                                        <option value="">{t('form.selectOwner') || 'Ata...'}</option>
                                        {profiles?.map((p: any) => (
                                            <option key={p.id} value={p.id}>{p.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.type')}</Label>
                                        <select
                                            name="type"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            defaultValue={activity?.type || 'Call'}
                                            required
                                        >
                                            <option value="Call">{t('type.Call')}</option>
                                            <option value="Meeting">{t('type.Meeting')}</option>
                                            <option value="OfficeMeeting">{t('type.OfficeMeeting')}</option>
                                            <option value="OnlineMeeting">{t('type.OnlineMeeting')}</option>
                                            <option value="Site Visit">{t('type.Site Visit')}</option>
                                            <option value="Email">{t('type.Email')}</option>
                                            <option value="Whatsapp">{t('type.Whatsapp')}</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.date')}</Label>
                                        <Input
                                            name="due_date"
                                            type="datetime-local"
                                            defaultValue={activity?.due_date
                                                ? new Date(new Date(activity.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                                : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.priority') || 'Öncelik'}</Label>
                                        <select
                                            name="priority"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            defaultValue={activity?.priority || 'Medium'}
                                        >
                                            <option value="Low">{t('form.priorityLow') || 'Düşük'}</option>
                                            <option value="Medium">{t('form.priorityMedium') || 'Orta'}</option>
                                            <option value="High">{t('form.priorityHigh') || 'Yüksek'}</option>
                                            <option value="Urgent">{t('form.priorityUrgent') || 'Acil'}</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.reminder') || 'Hatırlatıcı'}</Label>
                                        <Input
                                            name="reminder_at"
                                            type="datetime-local"
                                            defaultValue={activity?.reminder_at
                                                ? new Date(new Date(activity.reminder_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                                                : ''
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('form.summary')}</Label>
                                    <Input
                                        name="summary"
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder={t('form.summaryPlaceholder')}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.description')}</Label>
                                    <Textarea
                                        name="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('form.descriptionPlaceholder')}
                                        rows={3}
                                    />
                                    {/* Additional hidden notes field just in case */}
                                    <input type="hidden" name="notes" value={notes} />
                                </div>
                            </>
                        )}

                        {/* Completion Details - outcome, notes, next action */}
                        {isCompleteMode && (
                            <div className={cn("space-y-4 pt-4 border-t mt-2", mode === 'edit' && "bg-muted/30 p-4 rounded-lg border")}>
                                {mode === 'complete' && (
                                    <div className="p-3 bg-muted rounded-md mb-2 text-sm">
                                        <span className="font-semibold">{activity?.summary}</span> {t('form.completingMsg')}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label className="font-bold text-primary">{t('form.outcome')}</Label>
                                    <select name="outcome" className="flex h-10 w-full rounded-md border-2 border-primary/20 bg-background px-3 py-2 text-sm focus:border-primary" required>
                                        <option value="">{t('form.select')}</option>
                                        <option value="Success">{t('form.outcomes.Success')}</option>
                                        <option value="Reached Interested">{t('form.outcomes.Reached Interested')}</option>
                                        <option value="Reached Not Interested">{t('form.outcomes.Reached Not Interested')}</option>
                                        <option value="No Answer">{t('form.outcomes.No Answer')}</option>
                                        <option value="Busy">{t('form.outcomes.Busy')}</option>
                                        <option value="Follow Up Required">{t('form.outcomes.Follow Up Required')}</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-bold">{t('form.notes')}</Label>
                                    <Textarea
                                        name="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('form.notesPlaceholder')}
                                        required
                                        rows={3}
                                        className="border-2"
                                    />
                                </div>

                                <div className="border-t-2 border-dashed pt-4 mt-2">
                                    <h4 className="mb-3 text-sm font-bold flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">!</span>
                                        {t('form.nextAction')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>{t('form.type')}</Label>
                                            <select name="next_action_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">{t('form.none')}</option>
                                                <option value="Call">{t('type.Call')}</option>
                                                <option value="Meeting">{t('type.Meeting')}</option>
                                                <option value="OfficeMeeting">{t('type.OfficeMeeting')}</option>
                                                <option value="OnlineMeeting">{t('type.OnlineMeeting')}</option>
                                                <option value="Site Visit">{t('type.Site Visit')}</option>
                                                <option value="Whatsapp">{t('type.Whatsapp')}</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>{t('form.date')}</Label>
                                            <Input name="next_action_date" type="datetime-local" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <Label>{t('topic.General')}</Label>
                                        <Input name="next_action_summary" placeholder={t('form.summaryPlaceholder')} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" className={cn(isCompleteMode && "bg-green-600 hover:bg-green-700 w-full")}>
                            {isCompleteMode ? t('form.completeAndSave') : t('form.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
