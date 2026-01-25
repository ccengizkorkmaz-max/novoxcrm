'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createOffer } from '@/app/(dashboard)/offers/actions'

interface CreateOfferDialogProps {
    customers: any[]
    units: any[]
}

export function CreateOfferDialog({ customers, units }: CreateOfferDialogProps) {
    const [open, setOpen] = useState(false)

    // We'll wrap the server action to close the dialog on success
    async function handleSubmit(formData: FormData) {
        const result = await createOffer(formData)
        if (result?.success) {
            setOpen(false)
        } else {
            console.error(result?.error)
            alert('Hata: ' + result?.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Yeni Teklif Oluştur</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni Satış Teklifi</DialogTitle>
                    <DialogDescription>
                        Müşteri ve ünite seçerek teklif detaylarını giriniz.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer">Müşteri</Label>
                            <select id="customer" name="customer_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                <option value="">Seçiniz</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Ünite</Label>
                            <select id="unit" name="unit_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                <option value="">Seçiniz</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.projects?.name} - {u.name} ({u.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Teklif Fiyatı</Label>
                            <Input id="price" name="price" type="number" placeholder="Örn: 5000000" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Para Birimi</Label>
                            <select id="currency" name="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="TRY">
                                <option value="TRY">TRY</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="valid_until">Geçerlilik Tarihi</Label>
                        <Input id="valid_until" name="valid_until" type="date" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Peşinat Tutarı (Opsiyonel)</Label>
                            <Input name="advance" type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Taksit Sayısı</Label>
                            <Input name="installments" type="number" defaultValue="1" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notlar</Label>
                        <Textarea id="notes" name="notes" placeholder="Özel ödeme koşulları vb." />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                        <Button type="submit">Teklifi Oluştur</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
