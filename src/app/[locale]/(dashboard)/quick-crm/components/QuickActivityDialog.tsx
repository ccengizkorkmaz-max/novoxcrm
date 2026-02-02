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
                <Button variant="outline" className="flex flex-col h-16 gap-1">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-[10px]">{t('logActivity')}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('logActivity')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 pt-4">
                    <input type="hidden" name="customer_id" value={customer.id} />
                    <input type="hidden" name="unit_id" value={unit.id} />
                    <input type="hidden" name="project_id" value={unit.projects?.id} />

                    <div className="grid gap-2">
                        <Label>Aktivite Tipi</Label>
                        <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                            <option value="Phone">Telefon</option>
                            <option value="Meeting">Toplantı / Ofis Ziyareti</option>
                            <option value="Whatsapp">Whatsapp</option>
                            <option value="Email">E-posta</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Konu</Label>
                        <Input name="summary" placeholder="Örn: Proje detayları görüşüldü" required />
                    </div>

                    <div className="grid gap-2">
                        <Label>Notlar</Label>
                        <Textarea name="notes" placeholder="Görüşme detaylarını buraya yazabilirsiniz..." className="min-h-[100px]" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
