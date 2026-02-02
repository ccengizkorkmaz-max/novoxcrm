'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Pencil } from 'lucide-react'
import { updateReservation } from '../../inventory/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface EditOptionDialogProps {
    unitId: string
    unitNumber: string
    projectName?: string
    currentExpiry?: string
}

export function EditOptionDialog({ unitId, unitNumber, projectName, currentExpiry }: EditOptionDialogProps) {
    const t = useTranslations('Options')
    const [isOpen, setIsOpen] = useState(false)
    const [expiryDate, setExpiryDate] = useState(currentExpiry ? currentExpiry.split('T')[0] : "")

    const handleSubmit = async (formData: FormData) => {
        const result = await updateReservation(formData)
        if (result.success) {
            setIsOpen(false)
            toast.success(t('messages.optionUpdated'))
        } else {
            toast.error(result.error || t('messages.updateError'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title={t('actions.editOption')}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('dialog.editTitle')}</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => { await handleSubmit(formData) }}>
                    <input type="hidden" name="unit_id" value={unitId} />

                    <div className="grid gap-4 py-4">
                        <div className="text-sm">
                            <span className="font-semibold">{projectName}</span> - <span className="font-semibold">{unitNumber}</span> {t('dialog.editDesc')}.
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expiry_date">{t('dialog.newExpiry')}</Label>
                            <Input
                                id="expiry_date"
                                name="expiry_date"
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('dialog.cancel')}</Button>
                        <Button type="submit">{t('dialog.update')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
