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

interface ActivityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'complete'
    activity?: any
    customers?: any[]
}

export function ActivityForm({ open, onOpenChange, mode, activity, customers }: ActivityFormProps) {
    const t = useTranslations('Activities')
    const router = useRouter()
    const isCompleteMode = mode === 'complete'

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
        } else if (mode === 'edit') {
            const dueDateStr = formData.get('due_date') as string
            if (dueDateStr) {
                const localDate = new Date(dueDateStr)
                formData.set('due_date', localDate.toISOString())
            }
            formData.append('id', activity.id)
            result = await updateActivity(formData)
        } else if (mode === 'complete') {
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

                        {!isCompleteMode && (
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

                        {isCompleteMode && (
                            <>
                                <div className="p-3 bg-muted rounded-md mb-2 text-sm">
                                    <span className="font-semibold">{activity?.summary}</span> {t('form.completingMsg')}
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.outcome')}</Label>
                                    <select name="outcome" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
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
                                    <Label>{t('form.notes')}</Label>
                                    <Textarea name="notes" placeholder={t('form.notesPlaceholder')} required rows={3} />
                                </div>
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="mb-3 text-sm font-medium">{t('form.nextAction')}</h4>
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
                            </>
                        )}

                    </div>
                    <DialogFooter>
                        <Button type="submit">{isCompleteMode ? t('form.completeAndSave') : t('form.save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
