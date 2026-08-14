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
import { createCustomer } from '../actions'
import { toast } from 'sonner'
import { UserPlus, User, Phone, Mail, Building2, MapPin, ShieldCheck, Plus, Loader2, Target } from 'lucide-react'

interface NewContactModalProps {
    profiles?: { id: string; full_name: string }[]
    buttonVariant?: 'default' | 'outline' | 'secondary'
    buttonSize?: 'default' | 'sm' | 'lg'
    buttonClassName?: string
    triggerText?: string
    onSuccess?: () => void
}

export default function NewContactModal({
    profiles = [],
    buttonVariant = 'default',
    buttonSize = 'sm',
    buttonClassName = '',
    triggerText = 'Yeni Kontak Ekle',
    onSuccess
}: NewContactModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Form state
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [customerType, setCustomerType] = useState('individual')
    const [companyName, setCompanyName] = useState('')
    const [taxOffice, setTaxOffice] = useState('')
    const [taxNumber, setTaxNumber] = useState('')
    const [source, setSource] = useState('Telefon / Manuel Ekleme')
    const [assignedTo, setAssignedTo] = useState('')
    const [gender, setGender] = useState('')
    const [city, setCity] = useState('')
    const [district, setDistrict] = useState('')
    const [address, setAddress] = useState('')
    const [smsConsent, setSmsConsent] = useState('yes')
    const [emailConsent, setEmailConsent] = useState('yes')
    const [callConsent, setCallConsent] = useState('yes')

    const resetForm = () => {
        setFullName('')
        setPhone('')
        setEmail('')
        setCustomerType('individual')
        setCompanyName('')
        setTaxOffice('')
        setTaxNumber('')
        setSource('Telefon / Manuel Ekleme')
        setAssignedTo('')
        setGender('')
        setCity('')
        setDistrict('')
        setAddress('')
        setSmsConsent('yes')
        setEmailConsent('yes')
        setCallConsent('yes')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName.trim()) {
            toast.error('Lütfen Ad Soyad / Kontak adını giriniz.')
            return
        }

        const formData = new FormData()
        formData.append('full_name', fullName.trim())
        if (phone.trim()) formData.append('phone', phone.trim())
        if (email.trim()) formData.append('email', email.trim())
        formData.append('customer_type', customerType)
        if (companyName.trim()) formData.append('company_name', companyName.trim())
        if (taxOffice.trim()) formData.append('tax_office', taxOffice.trim())
        if (taxNumber.trim()) formData.append('tax_number', taxNumber.trim())
        if (source.trim()) formData.append('source', source.trim())
        if (assignedTo && assignedTo !== 'unassigned') formData.append('assigned_to', assignedTo)
        if (gender) formData.append('gender', gender)
        if (city.trim()) formData.append('city', city.trim())
        if (district.trim()) formData.append('district', district.trim())
        if (address.trim()) formData.append('address', address.trim())
        formData.append('sms_consent', smsConsent)
        formData.append('email_consent', emailConsent)
        formData.append('call_consent', callConsent)

        startTransition(async () => {
            try {
                const res = await createCustomer(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Yeni kontak başarıyla eklendi!')
                    resetForm()
                    setOpen(false)
                    if (onSuccess) onSuccess()
                    router.refresh()
                }
            } catch (err: any) {
                console.error(err)
                toast.error('Kontak eklenirken beklenmeyen bir hata oluştu.')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={buttonVariant}
                    size={buttonSize}
                    className={`gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all ${buttonClassName}`}
                >
                    <UserPlus className="w-4 h-4" />
                    <span>{triggerText}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <UserPlus className="w-5 h-5 text-emerald-600" />
                        Yeni Kontak Kaydı Oluştur
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Sisteme yeni bir müşteri veya kontak eklemek için aşağıdaki bilgileri doldurunuz.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    {/* Temel Bilgiler */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            Kişisel Bilgiler
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1 md:col-span-2">
                                <Label className="text-xs font-bold text-slate-700">Ad Soyad / Kontak Adı *</Label>
                                <div className="relative">
                                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Örn: Ahmet Yılmaz"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="pl-9 text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Telefon Numarası</Label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="0532 123 45 67"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="pl-9 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">E-Posta Adresi</Label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        type="email"
                                        placeholder="ahmet@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="pl-9 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kurumsal Bilgiler & Müşteri Tipi */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            Kurumsal &amp; Firma Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Müşteri Tipi</Label>
                                <Select value={customerType} onValueChange={setCustomerType}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Seçiniz..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">👤 Bireysel Kontak</SelectItem>
                                        <SelectItem value="corporate">🏢 Kurumsal Kontak / Firma</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {customerType === 'corporate' && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-slate-700">Firma Adı / Şirket Unvanı</Label>
                                    <Input
                                        placeholder="Örn: Yılmaz İnşaat A.Ş."
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            )}

                            {customerType === 'corporate' && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Vergi Dairesi</Label>
                                        <Input
                                            placeholder="Kadıköy V.D."
                                            value={taxOffice}
                                            onChange={e => setTaxOffice(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-slate-700">Vergi Numarası</Label>
                                        <Input
                                            placeholder="1234567890"
                                            value={taxNumber}
                                            onChange={e => setTaxNumber(e.target.value)}
                                            className="text-xs"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Kaynak & Temsilci Ataması */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-amber-500" />
                            Kaynak &amp; Temsilci Ataması
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Kazanım Kaynağı</Label>
                                <Select value={source} onValueChange={setSource}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Kaynak Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Telefon / Manuel Ekleme">📞 Telefon / Manuel Ekleme</SelectItem>
                                        <SelectItem value="Referans">👥 Referans</SelectItem>
                                        <SelectItem value="Web Sitesi">🌐 Web Sitesi</SelectItem>
                                        <SelectItem value="Sosyal Medya / Meta">📲 Sosyal Medya / Meta</SelectItem>
                                        <SelectItem value="Saha / Stand">🏢 Saha / Stand Ziyareti</SelectItem>
                                        <SelectItem value="Diğer">📌 Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {profiles.length > 0 && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-slate-700">Atanan Satış Temsilcisi</Label>
                                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue placeholder="Temsilci Seçin (Opsiyonel)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Atanmamış</SelectItem>
                                            {profiles.filter((p: any) => !p.is_external && p.role !== 'broker').map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Adres Bilgileri */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            Adres Bilgileri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">İl (Şehir)</Label>
                                <Input
                                    placeholder="İstanbul"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">İlçe</Label>
                                <Input
                                    placeholder="Kadıköy"
                                    value={district}
                                    onChange={e => setDistrict(e.target.value)}
                                    className="text-xs"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label className="text-xs font-bold text-slate-700">Açık Adres</Label>
                                <Textarea
                                    placeholder="Mahalle, sokak, bina no vb."
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="text-xs resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* İletişim İzinleri (İYS) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                            İletişim İzinleri (İYS)
                        </h3>
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={smsConsent === 'yes'}
                                    onChange={e => setSmsConsent(e.target.checked ? 'yes' : 'no')}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>SMS İzni Var</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailConsent === 'yes'}
                                    onChange={e => setEmailConsent(e.target.checked ? 'yes' : 'no')}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>E-Posta İzni Var</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={callConsent === 'yes'}
                                    onChange={e => setCallConsent(e.target.checked ? 'yes' : 'no')}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Arama İzni Var</span>
                            </label>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t gap-2">
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Kontak Kaydet
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
