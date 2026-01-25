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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOffer } from '@/app/(dashboard)/offers/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CreateOfferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    unitId: string
    unitPrice: number
    unitCurrency: string
    customers: { id: string, full_name: string }[]
}

export function CreateOfferDialog({
    open,
    onOpenChange,
    unitId,
    unitPrice,
    unitCurrency,
    customers
}: CreateOfferDialogProps) {
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        const result = await createOffer(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Teklif başarıyla oluşturuldu')
            onOpenChange(false)
            router.push('/offers')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Teklif Oluştur</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => { await handleSubmit(formData) }}>
                    <input type="hidden" name="unit_id" value={unitId} />
                    <input type="hidden" name="currency" value={unitCurrency} />

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

                        <div className="space-y-2">
                            <Label>Teklif Fiyatı ({unitCurrency})</Label>
                            <Input
                                name="price"
                                type="number"
                                defaultValue={unitPrice}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Input name="notes" placeholder="Teklif notu..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit">Teklifi Oluştur</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
