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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from 'lucide-react'
import { scheduleDeliveryAppointment } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Unit {
    id: string
    unit_number: string
    projects?: { name: string } | null
    sales?: Array<{
        customers: {
            id: string
            full_name: string
        } | null
    }> | null
}

interface ScheduleDeliveryDialogProps {
    units: Unit[]
}

export function ScheduleDeliveryDialog({ units }: ScheduleDeliveryDialogProps) {
    const t = useTranslations('Deliveries')
    const [isOpen, setIsOpen] = useState(false)
    const [unitId, setUnitId] = useState('')
    const [appointmentDate, setAppointmentDate] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    // Find the customer associated with the selected unit
    const selectedUnit = units.find(u => u.id === unitId)
    const activeSale = selectedUnit?.sales?.[0]
    const customer = activeSale?.customers
    const customerName = customer?.full_name || '-'
    const customerId = customer?.id || ''

    const handleSubmit = async (formData: FormData) => {
        if (!unitId || !customerId) {
            toast.error('Lütfen daire seçiniz ve müşterinin tanımlı olduğundan emin olunuz.')
            return
        }

        setLoading(true)
        try {
            formData.append('customer_id', customerId)
            const res = await scheduleDeliveryAppointment(formData)

            if (res.success) {
                toast.success(t('successSchedule'))
                setIsOpen(false)
                setUnitId('')
                setAppointmentDate('')
                setNotes('')
            } else {
                toast.error(res.error || 'Hata oluştu.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Calendar className="h-4 w-4" />
                    {t('scheduleBtn')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{t('scheduleBtn')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    
                    <div className="grid gap-2">
                        <Label htmlFor="unit_id">Teslim Edilecek Daire</Label>
                        <Select name="unit_id" value={unitId} onValueChange={setUnitId}>
                            <SelectTrigger id="unit_id">
                                <SelectValue placeholder="Daire Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                        {unit.projects?.name} - Daire {unit.unit_number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Müşteri (Alıcı)</Label>
                        <Input
                            value={customerName}
                            disabled
                            className="bg-muted text-muted-foreground"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="appointment_date">{t('appointmentDate')}</Label>
                        <Input
                            id="appointment_date"
                            name="appointment_date"
                            type="datetime-local"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">{t('notes')}</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Teslimat randevusu ile ilgili notlar..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={loading || !unitId || !customerId}>
                            {loading ? 'Planlanıyor...' : 'Randevu Oluştur'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
