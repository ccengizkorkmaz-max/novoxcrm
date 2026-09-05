'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createQuickAppointment, getTenantSalesOfficesAction, getTenantSalesRepsAction } from '../actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
    CalendarPlus,
    Calendar,
    Clock,
    MapPin,
    FileText,
    Plus,
    Loader2,
    UserCheck,
    Building2,
    MessageCircle,
    Navigation,
    ExternalLink,
    CheckCircle2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface QuickAppointmentModalProps {
    customerId: string
    customerName: string
    customerPhone?: string | null
    saleId?: string
    disabled?: boolean
    disabledTooltip?: string
    trigger?: React.ReactNode
    onCreated?: (newAppointment: any) => void
    initialRepresentativeId?: string
    profiles?: any[]
    onOpenAdvancedActivity?: () => void
}

const STATIC_LOCATIONS = [
    { value: 'Satış Ofisi', label: '🏢 Satış Ofisi (Genel)' },
    { value: 'Saha / Proje Alanı', label: '🏗️ Saha / Proje Alanı' },
    { value: 'Müşteri Adresi', label: '🏠 Müşteri Adresi' },
    { value: 'Online (Zoom / Google Meet)', label: '💻 Online (Zoom / Google Meet)' },
    { value: 'Dış Mekan / Kafe', label: '☕ Dış Mekan / Kafe' },
]

export default function QuickAppointmentModal({
    customerId,
    customerName,
    customerPhone,
    saleId,
    disabled = false,
    disabledTooltip = 'Önce bir satış temsilcisi atamalısınız!',
    trigger,
    onCreated,
    initialRepresentativeId,
    profiles = [],
    onOpenAdvancedActivity
}: QuickAppointmentModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Default due date: Tomorrow 10:00
    const getDefaultDateTime = () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        const pad = (n: number) => n.toString().padStart(2, '0')
        return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
    }

    const [dateTime, setDateTime] = useState(getDefaultDateTime())
    const [location, setLocation] = useState('Satış Ofisi')
    const [summary, setSummary] = useState('Proje Sunumu ve Görüşme')
    const [notes, setNotes] = useState('')
    const [customLocations, setCustomLocations] = useState<{ value: string; label: string }[]>([])
    const [salesOffices, setSalesOffices] = useState<any[]>([])
    const [isAddingLocation, setIsAddingLocation] = useState(false)
    const [newLocationInput, setNewLocationInput] = useState('')
    const [reps, setReps] = useState<{ id: string; full_name: string; phone?: string }[]>([])
    const [selectedRepId, setSelectedRepId] = useState<string>(initialRepresentativeId || '')
    const [activeCustomerPhone, setActiveCustomerPhone] = useState<string>(customerPhone || '')

    // Keep representative updated with initialRepresentativeId when opened
    useEffect(() => {
        if (initialRepresentativeId) {
            setSelectedRepId(initialRepresentativeId)
        }
    }, [initialRepresentativeId, open])

    // WhatsApp notification toggles
    const [sendCustomerWa, setSendCustomerWa] = useState(true)
    const [sendRepWa, setSendRepWa] = useState(true)

    // Load representatives, customer data & configured corporate sales offices
    useEffect(() => {
        if (open) {
            // First initialize from props if available
            if (profiles && profiles.length > 0) {
                const tenantReps = profiles.filter((p: any) => !p.is_external && p.role !== 'broker')
                if (tenantReps.length > 0) {
                    setReps(tenantReps)
                }
            }

            // Always fetch authenticated tenant reps via server action
            getTenantSalesRepsAction().then(res => {
                if (res?.reps && res.reps.length > 0) {
                    setReps(res.reps)
                }
            }).catch(console.error)

            const supabase = createClient()
            if (customerId) {
                supabase
                    .from('customers')
                    .select('assigned_to, phone')
                    .eq('id', customerId)
                    .single()
                    .then(({ data }) => {
                        if (data?.assigned_to && !selectedRepId) {
                            setSelectedRepId(data.assigned_to)
                        }
                        if (data?.phone) {
                            setActiveCustomerPhone(data.phone)
                        }
                    })
            }

            // Load registered tenant sales offices
            getTenantSalesOfficesAction().then(res => {
                if (res?.offices && res.offices.length > 0) {
                    setSalesOffices(res.offices)
                    // Auto-select first registered office if user is on default
                    if (!location || location === 'Satış Ofisi') {
                        setLocation(res.offices[0].name)
                    }
                }
            }).catch(console.error)
        }
    }, [open, customerId, profiles])

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

    // Build all available locations: Registered Offices + Static + Custom
    const officeLocations = salesOffices.map((off: any) => ({
        value: off.name,
        label: `🏢 ${off.name}${off.projectName ? ` (${off.projectName})` : ''}`,
        isOffice: true,
        officeData: off
    }))

    const allLocations = [
        ...officeLocations,
        ...STATIC_LOCATIONS,
        ...customLocations
    ]

    // Find currently selected sales office details
    const currentOffice = salesOffices.find(
        (o: any) => o.name === location || location.includes(o.name)
    )

    const handleAddLocation = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const trimmed = newLocationInput.trim()
        if (!trimmed) return

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
                    className="h-5 px-2 py-0 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 opacity-70 gap-0.5 pointer-events-none"
                >
                    <CalendarPlus className="h-2.5 w-2.5 text-slate-500" />
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
                    representativeId: selectedRepId || undefined,
                    sendCustomerWa,
                    sendRepWa
                })

                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success(
                        `${customerName} için randevu oluşturuldu! ${
                            sendCustomerWa && activeCustomerPhone
                                ? 'Müşteriye ve danışmana WhatsApp bildirimi gönderildi.'
                                : ''
                        }`
                    )
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
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 py-0 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/90 bg-emerald-100/70 rounded border border-emerald-300 gap-0.5 flex-shrink-0 shadow-2xs"
                        title="Hızlı Randevu Oluştur"
                    >
                        <CalendarPlus className="h-3 w-3 text-emerald-700" />
                        <span>Randevu</span>
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent 
                side="right" 
                className="w-full sm:!max-w-[580px] p-0 flex flex-col h-full bg-white border-l border-slate-200 shadow-2xl z-[100]"
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                    <SheetHeader className="p-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
                        <div className="flex items-center justify-between pr-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs shrink-0">
                                    <Calendar className="w-5 h-5 text-emerald-700" />
                                </div>
                                <div>
                                    <SheetTitle className="text-lg font-bold text-slate-900 leading-tight">
                                        Hızlı Randevu Oluştur
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-slate-600 font-medium mt-0.5">
                                        <strong className="text-slate-900 font-bold">{customerName}</strong> müşterisi ile randevu planlayın.
                                    </SheetDescription>
                                </div>
                            </div>

                            {onOpenAdvancedActivity && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setOpen(false)
                                        onOpenAdvancedActivity()
                                    }}
                                    className="h-8 px-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 rounded-lg gap-1.5 shadow-2xs shrink-0 transition-all active:scale-95"
                                    title="Tüm aktivite tipleri, ses kaydı ve detaylı alanlar için gelişmiş formu aç"
                                >
                                    <span>Gelişmiş Form</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </SheetHeader>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Date & Time */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            Randevu Tarihi ve Saati *
                        </Label>
                        <Input
                            type="datetime-local"
                            value={dateTime}
                            onChange={e => setDateTime(e.target.value)}
                            className="text-sm font-semibold text-slate-900 border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                            required
                        />
                    </div>

                    {/* Location Selection & Real Sales Office Details */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-rose-600" />
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
                                className="h-6 px-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 gap-1"
                                title="Yeni Randevu Yeri Ekle"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Yeni Konum Ekle</span>
                            </Button>
                        </div>

                        {isAddingLocation && (
                            <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-1">
                                <Label className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                                    Yeni Konum Adı
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Örn: Bornova Şube, Starbucks vb."
                                        value={newLocationInput}
                                        onChange={e => setNewLocationInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddLocation()
                                            }
                                        }}
                                        autoFocus
                                        className="h-9 text-xs font-medium text-slate-900 bg-white border-emerald-300 focus-visible:ring-emerald-600"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddLocation}
                                        className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0"
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
                                        className="h-9 px-2.5 text-xs text-slate-600 font-semibold border-slate-300 shrink-0"
                                    >
                                        İptal
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="text-sm font-semibold text-slate-900 bg-white border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                                <SelectValue placeholder="Konum Seçiniz" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                                {salesOffices.length > 0 && (
                                    <div className="px-2 py-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50/80">
                                        🏢 Kurumsal Satış Ofisleri
                                    </div>
                                )}
                                {allLocations.map((loc, idx) => (
                                    <SelectItem key={`${loc.value}-${idx}`} value={loc.value} className="text-xs font-medium text-slate-900">
                                        {loc.label}
                                    </SelectItem>
                                ))}
                                <div className="p-1.5 border-t border-slate-200 mt-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setIsAddingLocation(true)
                                        }}
                                        className="flex items-center gap-1.5 w-full text-left text-xs text-emerald-700 font-bold px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Yeni Konum Ekle...</span>
                                    </button>
                                </div>
                            </SelectContent>
                        </Select>

                        {/* Registered Office Rich Location Card */}
                        {currentOffice && (
                            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-1.5 text-xs text-slate-800 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>{currentOffice.name}</span>
                                        {currentOffice.projectName && (
                                            <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 py-0">
                                                {currentOffice.projectName}
                                            </Badge>
                                        )}
                                    </div>
                                    {currentOffice.mapsUrl && (
                                        <a
                                            href={currentOffice.mapsUrl.startsWith('http') ? currentOffice.mapsUrl : `https://${currentOffice.mapsUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                            title="Google Maps'te Görüntüle"
                                        >
                                            <Navigation className="w-3 h-3" />
                                            <span>Haritada Aç</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    )}
                                </div>
                                {currentOffice.address && (
                                    <p className="text-slate-600 font-medium leading-relaxed pl-5">
                                        📍 {currentOffice.address} {currentOffice.district ? `· ${currentOffice.district}` : ''} {currentOffice.city ? `(${currentOffice.city})` : ''}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sales Representative */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-indigo-600" />
                            Satış Temsilcisi
                        </Label>
                        <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                            <SelectTrigger className="text-sm font-semibold text-slate-900 bg-white border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                                <SelectValue placeholder="Temsilci Seçiniz (Atanmış Temsilci)" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {reps.map((rep) => (
                                    <SelectItem key={rep.id} value={rep.id} className="text-xs font-medium text-slate-900">
                                        👤 {rep.full_name} {rep.phone ? `(${rep.phone})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Summary / Topic */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-600" />
                            Randevu Konusu / Özet
                        </Label>
                        <Input
                            placeholder="Örn: Proje Sunumu ve Fiyat Teklifi"
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            className="text-sm font-semibold text-slate-900 border-slate-300 bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                    </div>

                    {/* WhatsApp Notification Box (Meta Official Templates) */}
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-emerald-950">
                                    WhatsApp Bildirimleri
                                </span>
                            </div>
                            <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                                Meta Cloud API
                            </span>
                        </div>

                        {/* Customer WhatsApp Notification */}
                        <div className="flex items-start gap-2.5 pt-1">
                            <input
                                id="sendCustomerWaCheckbox"
                                type="checkbox"
                                checked={sendCustomerWa && Boolean(activeCustomerPhone)}
                                disabled={!activeCustomerPhone}
                                onChange={(e) => setSendCustomerWa(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <label htmlFor="sendCustomerWaCheckbox" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900">
                                        Müşteriye Randevu Daveti Gönder
                                    </span>
                                    {activeCustomerPhone ? (
                                        <Badge variant="outline" className="text-[10px] font-bold bg-white text-emerald-800 border-emerald-300 py-0">
                                            {activeCustomerPhone}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 py-0">
                                            Telefon Eksik
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                                    Onaylı <strong>randevu_musteri</strong> şablonu ile tarih, ofis adresi ve Google Maps linki iletilir.
                                </p>
                            </label>
                        </div>

                        {/* Representative WhatsApp Notification */}
                        <div className="flex items-start gap-2.5 pt-1 border-t border-emerald-200/60">
                            <input
                                id="sendRepWaCheckbox"
                                type="checkbox"
                                checked={sendRepWa}
                                onChange={(e) => setSendRepWa(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                            />
                            <label htmlFor="sendRepWaCheckbox" className="flex-1 cursor-pointer">
                                <span className="text-xs font-bold text-slate-900">
                                    Satış Danışmanına WhatsApp Hatırlatması Gönder
                                </span>
                                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">
                                    Onaylı <strong>randevu_hatrlatma</strong> şablonu ile danışmana randevu detayları ve Tamamlandı/İptal/Ertelendi hızlı yanıt butonları gider.
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* Notes (Optional) */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-900">Notlar (Opsiyonel)</Label>
                        <Textarea
                            placeholder="Ek ayrıntılar, katılanlar veya hatırlatmalar..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="text-xs font-medium text-slate-900 border-slate-300 resize-none"
                            rows={2}
                        />
                    </div>

                    </div>

                    {/* Pinned Bottom Footer */}
                    <SheetFooter className="p-4 border-t border-slate-200 bg-slate-50/90 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {onOpenAdvancedActivity ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setOpen(false)
                                    onOpenAdvancedActivity()
                                }}
                                className="h-9 px-3 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border border-dashed border-indigo-300 rounded-lg gap-1.5 justify-start sm:justify-center transition-all"
                                title="Gelişmiş Aktivite Formu ile Arama, Ziyaret, Ses Kaydı veya Detaylı Not ekleyin"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>Gelişmiş Aktivite Formuna Geç</span>
                            </Button>
                        ) : (
                            <div className="hidden sm:block" />
                        )}

                        <div className="flex items-center gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                                className="h-9 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100"
                            >
                                İptal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-md px-4"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Randevu Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Randevu Oluştur &amp; Gönder
                                    </>
                                )}
                            </Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
