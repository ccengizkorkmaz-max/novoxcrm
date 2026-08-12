'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createQuickAppointment } from '../actions'
import { toast } from 'sonner'
import { CalendarPlus, Calendar, Clock, MapPin, FileText, Plus, Loader2 } from 'lucide-react'

interface QuickAppointmentModalProps {
    customerId: string
    customerName: string
    saleId?: string
    disabled?: boolean
    disabledTooltip?: string
    trigger?: React.ReactNode
    onCreated?: (newAppointment: any) => void
}

export default function QuickAppointmentModal({
    customerId,
    customerName,
    saleId,
    disabled = false,
    disabledTooltip = 'Önce bir satış temsilcisi atamalısınız!',
    trigger,
    onCreated
}: QuickAppointmentModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    if (disabled) {
        return (
            <span title={disabledTooltip} className="inline-block cursor-not-allowed">
                <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-5 px-1.5 py-0 text-[10px] font-semibold text-slate-400 border-slate-200 opacity-60 gap-0.5 pointer-events-none"
                >
                    <CalendarPlus className="h-2.5 w-2.5" />
                    Randevu
                </Button>
            </span>
        )
    }

    // Default due date: Tomorrow 10:00
    const getDefaultDateTime = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
    }

    const [dateTime, setDateTime] = useState(getDefaultDateTime())
    const [location, setLocation] = useState('Satış Ofisi')
    const [summary, setSummary] = useState('Proje Sunumu ve Görüşme')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!dateTime) {
            toast.error('Lütfen randevu tarih ve saatini seçiniz.')
            return
        }

        startTransition(async () => {
            try {
                const res = await createQuickAppointment({
                    customerId,
                    saleId,
                    dueDate: dateTime,
                    location,
                    summary: summary.trim() || 'Müşteri Randevusu',
                    notes: notes.trim()
                })

                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success(`${customerName} için randevu oluşturuldu!`)
                    setOpen(false)
                    if (onCreated && res?.activity) {
                        onCreated(res.activity)
                    }
                    router.refresh()
                }
            } catch (err) {
                console.error(err)
                toast.error('Randevu oluşturulurken bir hata oluştu.')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 py-0 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 bg-emerald-50/60 rounded border border-emerald-200 gap-0.5 flex-shrink-0"
                        title="Hızlı Randevu Oluştur"
                    >
                        <CalendarPlus className="h-3 w-3 text-emerald-600" />
                        <span>Randevu</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md p-6 rounded-2xl">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Hızlı Randevu Oluştur
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        <strong className="text-slate-700 font-semibold">{customerName}</strong> müşterisi ile randevu planlayın.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-3">
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            Randevu Tarihi ve Saati *
                        </Label>
                        <Input
                            type="datetime-local"
                            value={dateTime}
                            onChange={e => setDateTime(e.target.value)}
                            className="text-xs font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            Randevu Yeri / Konumu
                        </Label>
                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="text-xs font-medium">
                                <SelectValue placeholder="Konum Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Satış Ofisi">🏢 Satış Ofisi</SelectItem>
                                <SelectItem value="Saha / Proje Alanı">🏗️ Saha / Proje Alanı</SelectItem>
                                <SelectItem value="Müşteri Adresi">🏠 Müşteri Adresi</SelectItem>
                                <SelectItem value="Online / Zoom / Meet">💻 Online (Zoom / Google Meet)</SelectItem>
                                <SelectItem value="Dış Mekan / Kafe">☕ Dış Mekan / Kafe</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            Randevu Konusu / Özet
                        </Label>
                        <Input
                            placeholder="Örn: Proje Sunumu ve Fiyat Teklifi"
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            className="text-xs font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700">Notlar (Opsiyonel)</Label>
                        <Textarea
                            placeholder="Ek ayrıntılar, katılanlar veya hatırlatmalar..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="text-xs resize-none"
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="pt-3 border-t gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="text-xs"
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Randevu Oluştur
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
