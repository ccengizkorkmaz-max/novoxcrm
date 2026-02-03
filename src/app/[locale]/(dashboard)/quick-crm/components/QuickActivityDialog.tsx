'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Loader2 } from 'lucide-react'
import { createActivity } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'

interface Props {
    customer: any
    unit: any
}

export function QuickActivityDialog({ customer, unit }: Props) {
    const t = useTranslations('QuickCRM')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createActivity(formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(t('logActivity') + ' ' + t('unitSelected'))
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    className="flex flex-col items-center justify-center h-16 w-full gap-1 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600">{t('logActivity')}</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('logActivity')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="customer_id" value={customer.id} />
                    {unit && <input type="hidden" name="unit_id" value={unit.id} />}
                    <input type="hidden" name="project_id" value={unit?.projects?.id || ''} />

                    <div className="grid gap-2">
                        <Label>{t('activityType')}</Label>
                        <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                            <option value="Phone">{t('activityPhone')}</option>
                            <option value="Meeting">{t('activityMeeting')}</option>
                            <option value="Whatsapp">Whatsapp</option>
                            <option value="Email">Email</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('activitySummary')}</Label>
                        <Input name="summary" placeholder={t('activitySummaryPlaceholder')} required />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('activityNotes')}</Label>
                        <Textarea name="notes" placeholder={t('activityNotesPlaceholder')} className="min-h-[100px]" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t('save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
