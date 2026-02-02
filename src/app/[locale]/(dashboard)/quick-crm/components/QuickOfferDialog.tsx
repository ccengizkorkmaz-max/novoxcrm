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
import { Send, Loader2 } from 'lucide-react'
import { createOffer } from '@/app/[locale]/(dashboard)/offers/actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface Props {
    customer: any
    unit: any
}

export function QuickOfferDialog({ customer, unit }: Props) {
    const t = useTranslations('QuickCRM')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [price, setPrice] = useState(unit.price)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createOffer(formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(t('sendOffer') + ' ' + t('unitSelected'))
            setIsOpen(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex flex-col h-16 gap-1">
                    <Send className="h-4 w-4" />
                    <span className="text-[10px]">{t('sendOffer')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('sendOffer')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="customer_id" value={customer.id} />
                    <input type="hidden" name="unit_id" value={unit.id} />
                    <input type="hidden" name="currency" value={unit.currency} />
                    <input type="hidden" name="status" value="Sent" />

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Liste Fiyatı</div>
                        <div className="text-lg font-black">{formatCurrency(unit.price, unit.currency)}</div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Teklif Fiyatı ({unit.currency})</Label>
                        <Input
                            name="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Geçerlilik Tarihi</Label>
                        <Input
                            name="valid_until"
                            type="date"
                            defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Notlar</Label>
                        <Textarea name="notes" placeholder="Teklif mesajınız veya özel notlarınız..." />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Teklifi Kaydet ve Gönder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
