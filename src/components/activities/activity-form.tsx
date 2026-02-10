'use client'

import { useState } from 'react'
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

interface ActivityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'complete'
    activity?: any
    customers?: any[]
    profiles?: any[]
}

export function ActivityForm({ open, onOpenChange, mode, activity, customers, profiles }: ActivityFormProps) {
    const t = useTranslations('Activities')
    const router = useRouter()
    const [status, setStatus] = useState(activity?.status || 'Planned')
    const isCompleteMode = mode === 'complete' || status === 'Completed'

    async function handleSubmit(formData: FormData) {
        let result;
        if (mode === 'create') {
            // Convert local datetime-local value to ISO UTC string
            const dueDateStr = formData.get('due_date') as string
            if (dueDateStr) {
                const localDate = new Date(dueDateStr)
                formData.set('due_date', localDate.toISOString())
            }
            result = await createActivity(formData)
        } else if (mode === 'edit' && status !== 'Completed') {
            const dueDateStr = formData.get('due_date') as string
            if (dueDateStr) {
                const localDate = new Date(dueDateStr)
                formData.set('due_date', localDate.toISOString())
            }
            formData.append('id', activity.id)
            result = await updateActivity(formData)
        } else if (isCompleteMode) {
            // This covers both mode === 'complete' AND mode === 'edit' where status became 'Completed'
            formData.append('id', activity.id)
            // If in edit mode, ensure other fields are also captured if needed, 
            // but outcomeActivity is focused on the completion flow.
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
            <DialogContent className="sm:max-w-[500px]" key={open ? `activity-${activity?.customer_id || 'new'}` : 'closed'}>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? t('form.createTitle') :
                            mode === 'edit' ? t('form.editTitle') :
                                t('form.completeTitle')}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">

                        {/* Basic Info - Hidden only in specialized complete mode */}
                        {mode !== 'complete' && (
                            <>
                                <input type="hidden" name="customer_id" value={activity?.customer_id || ''} />
                                <div className="grid gap-2">
                                    <Label>{t('form.customer')}</Label>
                                    <select
                                        name="customer_id_select"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.customer_id || ''}
                                        required={mode === 'create' && !activity?.customer_id}
                                        disabled={mode === 'edit' || (mode === 'create' && !!activity?.customer_id)}
                                    >
                                        <option value="">{t('form.select')}</option>
                                        {customers?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.full_name}</option>
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
                                    <Input name="summary" defaultValue={activity?.summary || ''} placeholder={t('form.summaryPlaceholder')} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.description')}</Label>
                                    <Textarea name="description" defaultValue={activity?.description || ''} placeholder={t('form.descriptionPlaceholder')} rows={3} />
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
                                    <Textarea name="notes" placeholder={t('form.notesPlaceholder')} required rows={3} className="border-2" />
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
