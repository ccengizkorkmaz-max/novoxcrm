'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { createActivity, updateActivity, outcomeActivity } from '@/app/(dashboard)/crm/activities/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ActivityFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit' | 'complete'
    activity?: any
    customers?: any[]
}

export function ActivityForm({ open, onOpenChange, mode, activity, customers }: ActivityFormProps) {
    const router = useRouter()
    const isCompleteMode = mode === 'complete'

    async function handleSubmit(formData: FormData) {
        let result;
        if (mode === 'create') {
            result = await createActivity(formData)
        } else if (mode === 'edit') {
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
                mode === 'create' ? 'Aktivite oluşturuldu' :
                    mode === 'edit' ? 'Aktivite güncellendi' : 'Aktivite tamamlandı'
            )
            onOpenChange(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Yeni Aktivite Planla' :
                            mode === 'edit' ? 'Aktivite Düzenle' :
                                'Aktiviteyi Tamamla'}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">

                        {!isCompleteMode && (
                            <>
                                <input type="hidden" name="customer_id" value={activity?.customer_id || ''} />
                                <div className="grid gap-2">
                                    <Label>Müşteri</Label>
                                    <select
                                        name="customer_id_select" // Renamed to avoid conflict with hidden input if enabled? No, if disabled it's ignored. 
                                        // Actually, if I have hidden input with same name, and select is disabled, hidden wins. 
                                        // If select is enabled, both might be sent or select wins. 
                                        // Best practice: Use the hidden input for the POST value always if we want consistency, 
                                        // OR just rely on the fact that if disabled, select value isn't sent.
                                        // Let's keep name="customer_id" but rely on "disabled".
                                        // If I disable it, the hidden input sends the value.
                                        // If I enable it, the select sends the value (and hidden sends too? Server gets array?).
                                        // createActivity: const customer_id = formData.get('customer_id') -> gets first value.
                                        // If I have both, usually payload is key=val&key=val. formData.get returns first.
                                        // Safe bet: Only render hidden input if we are forcing it (disabling select).
                                        // But simple logic:
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.customer_id || ''}
                                        required={mode === 'create' && !activity?.customer_id}
                                        disabled={mode === 'edit' || (mode === 'create' && !!activity?.customer_id)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {customers?.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Konu Başlığı (Topic)</Label>
                                    <select
                                        name="topic"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        defaultValue={activity?.topic || 'General'}
                                        required
                                    >
                                        <option value="General">Genel</option>
                                        <option value="Sales">Satış Görüşmesi</option>
                                        <option value="Negotiation">Pazarlık / Teklif</option>
                                        <option value="Contract">Sözleşme Süreci</option>
                                        <option value="Support">Destek / Talep</option>
                                        <option value="After Sales">Satış Sonrası</option>
                                        <option value="Collection">Tahsilat</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Tip</Label>
                                        <select
                                            name="type"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            defaultValue={activity?.type || 'Call'}
                                            required
                                        >
                                            <option value="Call">Telefon</option>
                                            <option value="Meeting">Toplantı</option>
                                            <option value="Site Visit">Ziyaret</option>
                                            <option value="Email">Email</option>
                                            <option value="Whatsapp">Whatsapp</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tarih</Label>
                                        <Input
                                            name="due_date"
                                            type="datetime-local"
                                            defaultValue={activity?.due_date ? new Date(activity.due_date).toISOString().slice(0, 16) : ''}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Konu / Özet</Label>
                                    <Input name="summary" defaultValue={activity?.summary || ''} placeholder="Kısa özet..." required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Açıklama</Label>
                                    <Input name="description" defaultValue={activity?.description || ''} placeholder="Detaylar..." />
                                </div>
                            </>
                        )}

                        {isCompleteMode && (
                            <>
                                <div className="p-3 bg-muted rounded-md mb-2 text-sm">
                                    <span className="font-semibold">{activity?.summary}</span> aktivitesini tamamlıyorsunuz.
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sonuç (Outcome)</Label>
                                    <select name="outcome" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                        <option value="">Seçiniz</option>
                                        <option value="Success">Başarılı / Olumlu</option>
                                        <option value="Reached Interested">Ulaşıldı - İlgili</option>
                                        <option value="Reached Not Interested">Ulaşıldı - İlgisiz</option>
                                        <option value="No Answer">Cevap Yok</option>
                                        <option value="Busy">Meşgul</option>
                                        <option value="Follow Up Required">Takip Gerekli</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Görüşme Notları</Label>
                                    <Input name="notes" placeholder="Görüşme nasıl geçti..." required />
                                </div>
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="mb-3 text-sm font-medium">Sonraki Adım (Next Action)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Tip</Label>
                                            <select name="next_action_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                                <option value="">Yok</option>
                                                <option value="Call">Telefon</option>
                                                <option value="Meeting">Toplantı</option>
                                                <option value="Site Visit">Ziyaret</option>
                                                <option value="Whatsapp">Whatsapp</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Tarih</Label>
                                            <Input name="next_action_date" type="datetime-local" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2 mt-3">
                                        <Label>Konu</Label>
                                        <Input name="next_action_summary" placeholder="Otomatik (örn: Takip araması)" />
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                    <DialogFooter>
                        <Button type="submit">{isCompleteMode ? 'Tamamla ve Kaydet' : 'Kaydet'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
