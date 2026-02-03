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
    const [price, setPrice] = useState(unit?.price || 0)

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
                <button
                    disabled={!unit}
                    className="flex flex-col items-center justify-center h-16 w-full gap-1 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600">{t('sendOffer')}</span>
                </button>
            </DialogTrigger>
            {unit && (
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
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('listPrice')}</div>
                            <div className="text-lg font-black">{formatCurrency(unit.price, unit.currency)}</div>
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('offerPrice')} ({unit.currency})</Label>
                            <Input
                                name="price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('validUntil')}</Label>
                            <Input
                                name="valid_until"
                                type="date"
                                defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('activityNotes')}</Label>
                            <Textarea name="notes" placeholder={t('activityNotesPlaceholder')} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {t('saveAndSend')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            )}
        </Dialog>
    )
}
