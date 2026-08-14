'use client'

import { useState, useEffect, useTransition } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { CalendarPlus, Calendar, Clock, MapPin, FileText, Plus, Loader2, UserCheck } from 'lucide-react'

interface QuickAppointmentModalProps {
    customerId: string
    customerName: string
    saleId?: string
    disabled?: boolean
    disabledTooltip?: string
    trigger?: React.ReactNode
    onCreated?: (newAppointment: any) => void
    initialRepresentativeId?: string
}

const DEFAULT_LOCATIONS = [
    { value: 'Satış Ofisi', label: '🏢 Satış Ofisi' },
    { value: 'Saha / Proje Alanı', label: '🏗️ Saha / Proje Alanı' },
    { value: 'Müşteri Adresi', label: '🏠 Müşteri Adresi' },
    { value: 'Online (Zoom / Google Meet)', label: '💻 Online (Zoom / Google Meet)' },
    { value: 'Dış Mekan / Kafe', label: '☕ Dış Mekan / Kafe' },
]

export default function QuickAppointmentModal({
    customerId,
    customerName,
    saleId,
    disabled = false,
    disabledTooltip = 'Önce bir satış temsilcisi atamalısınız!',
    trigger,
    onCreated,
    initialRepresentativeId
}: QuickAppointmentModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Default due date: Tomorrow 10:00
    const getDefaultDateTime = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
    }

    // ALL hooks must be called before any conditional returns (React Rules of Hooks)
    const [dateTime, setDateTime] = useState(getDefaultDateTime())
    const [location, setLocation] = useState('Satış Ofisi')
    const [summary, setSummary] = useState('Proje Sunumu ve Görüşme')
    const [notes, setNotes] = useState('')
    const [customLocations, setCustomLocations] = useState<{ value: string; label: string }[]>([])
    const [isAddingLocation, setIsAddingLocation] = useState(false)
    const [newLocationInput, setNewLocationInput] = useState('')
    const [reps, setReps] = useState<{ id: string; full_name: string; phone?: string }[]>([])
    const [selectedRepId, setSelectedRepId] = useState<string>(initialRepresentativeId || '')

    // Load representatives and customer's assigned rep
    useEffect(() => {
        if (open) {
            const supabase = createClient()
            supabase
                .from('profiles')
                .select('id, full_name, phone, role')
                .eq('is_active', true)
                .neq('role', 'broker')
                .order('full_name')
                .then(({ data }) => {
                    if (data) {
                        setReps(data)
                    }
                })

            if (customerId && !selectedRepId) {
                supabase
                    .from('customers')
                    .select('assigned_to')
                    .eq('id', customerId)
                    .single()
                    .then(({ data }) => {
                        if (data?.assigned_to) {
                            setSelectedRepId(data.assigned_to)
                        }
                    })
            }
        }
    }, [open, customerId])

    // Load custom locations from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('quick_appointment_locations')
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        setCustomLocations(parsed)
                    }
                }
            } catch (err) {
                console.error('Failed to load custom locations', err)
            }
        }
    }, [])

    const allLocations = [...DEFAULT_LOCATIONS, ...customLocations]

    const handleAddLocation = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmed = newLocationInput.trim()
        if (!trimmed) return

        // Check if already exists
        const exists = allLocations.some(l => l.value.toLowerCase() === trimmed.toLowerCase())
        if (exists) {
            setLocation(trimmed)
            setIsAddingLocation(false)
            setNewLocationInput('')
            return
        }

        const newLocObj = { value: trimmed, label: `📍 ${trimmed}` }
        const updated = [...customLocations, newLocObj]
        setCustomLocations(updated)
        setLocation(trimmed)
        setIsAddingLocation(false)
        setNewLocationInput('')

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('quick_appointment_locations', JSON.stringify(updated))
            } catch (err) {
                console.error(err)
            }
        }
        toast.success(`"${trimmed}" konumu eklendi ve seçildi.`)
    }

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
                    notes: notes.trim(),
                    representativeId: selectedRepId || undefined
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

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                Randevu Yeri / Konumu
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsAddingLocation(!isAddingLocation)
                                    setNewLocationInput('')
                                }}
                                className="h-5 px-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-0.5"
                                title="Yeni Randevu Yeri Ekle"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Yeni Konum Ekle</span>
                            </Button>
                        </div>

                        {isAddingLocation && (
                            <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                    Yeni Konum Adı
                                </Label>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        placeholder="Örn: Merkez Ofis, Starbucks vb."
                                        value={newLocationInput}
                                        onChange={e => setNewLocationInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddLocation()
                                            }
                                        }}
                                        autoFocus
                                        className="h-8 text-xs bg-white border-emerald-300 focus-visible:ring-emerald-500"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddLocation}
                                        className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0"
                                    >
                                        Ekle
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddingLocation(false)
                                            setNewLocationInput('')
                                        }}
                                        className="h-8 px-2 text-xs text-slate-500 shrink-0"
                                    >
                                        İptal
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="text-xs font-medium bg-white">
                                <SelectValue placeholder="Konum Seçiniz" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {allLocations.map((loc) => (
                                    <SelectItem key={loc.value} value={loc.value} className="text-xs">
                                        {loc.label}
                                    </SelectItem>
                                ))}
                                <div className="p-1 border-t mt-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setIsAddingLocation(true)
                                        }}
                                        className="flex items-center gap-1.5 w-full text-left text-xs text-emerald-600 font-semibold px-2 py-1.5 rounded hover:bg-emerald-50 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Yeni Konum Ekle...</span>
                                    </button>
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                            Temsilci Ekle
                        </Label>
                        <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                            <SelectTrigger className="text-xs font-medium bg-white">
                                <SelectValue placeholder="Temsilci Seçiniz (Atanmış Temsilci)" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {reps.map((rep) => (
                                    <SelectItem key={rep.id} value={rep.id} className="text-xs">
                                        👤 {rep.full_name} {rep.phone ? `(${rep.phone})` : ''}
                                    </SelectItem>
                                ))}
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
