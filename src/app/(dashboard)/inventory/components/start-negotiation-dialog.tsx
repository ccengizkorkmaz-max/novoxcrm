'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { createSale } from '@/app/(dashboard)/crm/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface StartNegotiationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    unitId: string
    customers: { id: string, full_name: string }[]
}

export function StartNegotiationDialog({
    open,
    onOpenChange,
    unitId,
    customers
}: StartNegotiationDialogProps) {
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        const result = await createSale(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Satış süreci başlatıldı')
            onOpenChange(false)
            router.push('/crm')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Görüşme Başlat</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="unit_id" value={unitId} />

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Müşteri</Label>
                            <select
                                name="customer_id"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="">Müşteri Seçiniz</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.full_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">Süreci Başlat</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
