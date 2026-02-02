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
import { Calendar, Loader2 } from 'lucide-react'
import { updateSaleToReservation } from '@/app/[locale]/(dashboard)/crm/actions'
import { toast } from 'sonner'

interface Props {
    customer: any
    unit: any
    saleId: string
}

export function QuickReservationDialog({ customer, unit, saleId }: Props) {
    const t = useTranslations('QuickCRM')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Default 3 days from now
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 3)
    const [expiryDate, setExpiryDate] = useState(defaultExpiry.toISOString().split('T')[0])

    async function handleReserve() {
        setLoading(true)
        const res = await updateSaleToReservation(saleId, unit.id, expiryDate)
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(t('option') + ' ' + t('unitSelected'))
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-16 gap-1 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[10px]">{t('option')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('option')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Müşteri / Ünite</div>
                        <div className="text-sm font-semibold">{customer.full_name} - {unit.block}.{unit.unit_number}</div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Opsiyon Bitiş Tarihi</Label>
                        <Input
                            type="date"
                            value={expiryDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">Varsayılan olarak 3 gün tanımlanmıştır.</p>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleReserve} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Opsiyonu Kesinleştir
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
