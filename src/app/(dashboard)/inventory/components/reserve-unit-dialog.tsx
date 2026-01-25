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
import { Combobox } from '@/components/ui/combobox'
import { reserveUnit } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReserveUnitDialogProps {
    unitId: string
    unitNumber: string
    projectName?: string
    customers: any[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode // Custom trigger
}

export function ReserveUnitDialog({ unitId, unitNumber, projectName, customers, open, onOpenChange, children }: ReserveUnitDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const router = useRouter()

    const isControlled = open !== undefined && onOpenChange !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen

    const [selectedCustomerId, setSelectedCustomerId] = useState("")

    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 3)
    const [expiryDate, setExpiryDate] = useState(defaultDate.toISOString().split('T')[0])
    const [depositAmount, setDepositAmount] = useState(0)

    const handleSubmit = async (formData: FormData) => {
        if (!selectedCustomerId) {
            toast.error("Lütfen bir müşteri seçiniz.")
            return
        }

        const result = await reserveUnit(formData)
        if (result.success) {
            setIsOpen(false)
            toast.success("Ünite başarıyla opsiyonlandı.")
            router.refresh()
        } else {
            toast.error(result.error || "Bir hata oluştu.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children ? (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            ) : !isControlled && (
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline">Opsiyonla</Button>
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Üniteyi Opsiyonla</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="unit_id" value={unitId} />
                    <input type="hidden" name="customer_id" value={selectedCustomerId} />

                    <div className="grid gap-4 py-4">
                        <div className="text-sm">
                            <span className="font-semibold">{projectName}</span> - <span className="font-semibold">{unitNumber}</span> nolu ünite rezervasyonu için detayları giriniz.
                        </div>

                        <div className="grid gap-2">
                            <Label>Müşteri</Label>
                            <Combobox
                                items={customers?.map((c: any) => ({ value: c.id, label: c.full_name })) || []}
                                value={selectedCustomerId}
                                onChange={setSelectedCustomerId}
                                placeholder="Müşteri Seçiniz..."
                                searchPlaceholder="Müşteri Ara..."
                                emptyText="Müşteri bulunamadı."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expiry_date">Opsiyon Bitiş Tarihi</Label>
                            <Input
                                id="expiry_date"
                                name="expiry_date"
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="deposit_amount">Kapora Tutarı (Opsiyonel)</Label>
                            <div className="relative">
                                <Input
                                    id="deposit_amount"
                                    name="deposit_amount"
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                                    placeholder="0"
                                />
                                <div className="absolute right-3 top-2 text-sm text-muted-foreground font-semibold">
                                    TRY
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                0 girilirse kapora beklenmeden opsiyon kesinleşir.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>İptal</Button>
                        <Button type="submit">Opsiyonu Tamamla</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
