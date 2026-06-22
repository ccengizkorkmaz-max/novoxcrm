'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateCustomer, createCustomer, getSourceOptions, addSourceOption, getSalesReps, getCustomerMeta } from '../actions'
import { toast } from 'sonner'
import { Info, Plus, User, MapPin, Megaphone, UserCheck, Shield, Tag, Building2, Search, ArrowLeft, Save } from 'lucide-react'
import CustomerDemands from './CustomerDemands'
import CustomerProfileTab from './CustomerProfileTab'
import InlineProfileFields from './InlineProfileFields'
import AddressManager from '@/components/shared/AddressManager'
import { cn } from '@/lib/utils'

export interface Customer {
    id: string
    full_name: string
    phone: string
    email: string
    source: string
    address?: string
    postal_code?: string
    district?: string
    city?: string
    country?: string
    portal_username?: string
    portal_password?: string
    customer_number?: string
    created_at: string
    customer_demands?: any[]
    contract_customers?: any[]
    profile_data?: Record<string, any>
    tags?: string[]
    gender?: string
    heard_from?: string
    referral_name?: string
    customer_type?: string
    company_name?: string
    tax_office?: string
    tax_number?: string
    company_address?: string
    company_phone?: string
    company_website?: string
    company_email?: string
    addresses?: any[]
}

interface CustomerFormProps {
    customer?: Customer | null
}

const HEARD_FROM_OPTIONS = [
    'Reklam Panoları', 'Referans', 'TV Reklamları', 'Sponsorluk',
    'Fuar', 'Dijital Reklam', 'Sosyal Medya', 'Gazete / Dergi',
    'Arkadaş / Tanıdık', 'Diğer'
]

export default function CustomerForm({ customer }: CustomerFormProps) {
    const t = useTranslations('Customers')
    const router = useRouter()
    const isCreateMode = !customer
    const [isPending, setIsPending] = useState(false)

    // Customer type
    const [customerType, setCustomerType] = useState<'individual' | 'corporate'>(
        (customer?.customer_type as any) || 'individual'
    )

    // Source options (dynamic)
    const [sourceOptions, setSourceOptions] = useState<{ id: string; label: string }[]>([])
    const [selectedSource, setSelectedSource] = useState(customer?.source || '')
    const [newSourceLabel, setNewSourceLabel] = useState('')
    const [showNewSource, setShowNewSource] = useState(false)

    // Sales reps
    const [salesReps, setSalesReps] = useState<{ id: string; full_name: string; role: string }[]>([])

    // Gender
    const [gender, setGender] = useState(customer?.gender || '')

    // Heard from
    const [heardFrom, setHeardFrom] = useState(customer?.heard_from || '')

    // Meta info
    const [meta, setMeta] = useState<any>(null)

    useEffect(() => {
        getSourceOptions().then(res => {
            if (res.options) setSourceOptions(res.options)
        })
        getSalesReps().then(res => {
            if (res.reps) setSalesReps(res.reps)
        })
        if (customer?.id) {
            getCustomerMeta(customer.id).then(data => {
                if (data) setMeta(data)
            })
        }
    }, [customer?.id])

    const handleAddSource = async () => {
        if (!newSourceLabel.trim()) return
        const res = await addSourceOption(newSourceLabel.trim())
        if (res?.error) {
            toast.error(res.error)
        } else if (res?.option) {
            setSourceOptions(prev => [...prev, { id: res.option.id, label: res.option.label }])
            setSelectedSource(res.option.label)
            setShowNewSource(false)
            setNewSourceLabel('')
            toast.success('Yeni kaynak eklendi')
        }
    }

    const handleSubmit = async (formData: FormData) => {
        formData.set('customer_type', customerType)
        formData.set('gender', gender)
        formData.set('heard_from', heardFrom)
        formData.set('source', selectedSource)
        setIsPending(true)
        try {
            if (isCreateMode) {
                const res = await createCustomer(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Müşteri başarıyla oluşturuldu')
                    router.back()
                }
            } else {
                const res = await updateCustomer(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Müşteri başarıyla güncellendi')
                    router.back()
                }
            }
        } finally {
            setIsPending(false)
        }
    }

    const inputClass = "h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
    const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wide"

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* ═══════ STICKY HEADER ═══════ */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {isCreateMode ? 'Yeni Müşteri Kaydı' : customer?.full_name}
                                </h1>
                                {!isCreateMode && customer?.customer_number && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        {customer.customer_number}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Customer Type Toggle */}
                        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                            <button type="button" onClick={() => setCustomerType('individual')}
                                className={cn("px-5 py-2 rounded-lg text-xs font-bold transition-all",
                                    customerType === 'individual' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                Bireysel
                            </button>
                            <button type="button" onClick={() => setCustomerType('corporate')}
                                className={cn("px-5 py-2 rounded-lg text-xs font-bold transition-all",
                                    customerType === 'corporate' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                                Kurumsal
                            </button>
                        </div>

                        {/* Meta info */}
                        {!isCreateMode && meta && (
                            <div className="hidden sm:flex gap-4 text-[10px] text-slate-400 bg-slate-50 rounded-xl px-4 py-2">
                                <div>
                                    <span className="font-bold block">Oluşturan</span>
                                    <span className="text-slate-600">{meta.creator?.full_name || '—'}</span>
                                </div>
                                <div>
                                    <span className="font-bold block">Tarih</span>
                                    <span className="text-slate-600">{meta.created_at ? new Date(meta.created_at).toLocaleDateString('tr-TR') : '—'}</span>
                                </div>
                                <div>
                                    <span className="font-bold block">Değiştiren</span>
                                    <span className="text-slate-600">{meta.updater?.full_name || '—'}</span>
                                </div>
                                <div>
                                    <span className="font-bold block">Son Değişiklik</span>
                                    <span className="text-slate-600">{meta.updated_at ? new Date(meta.updated_at).toLocaleDateString('tr-TR') : '—'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ FORM ═══════ */}
            <form action={handleSubmit}>
                {!isCreateMode && <input type="hidden" name="id" value={customer!.id} />}

                {/* ═══════ ROW 1: Kişisel + Kaynak + Satış (3 sütun yan yana) ═══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* ── Kişisel Bilgiler ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Kişisel Bilgiler</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1.5">
                                <Label className={labelClass}>Ad Soyad <span className="text-red-500">*</span></Label>
                                <Input name="full_name" defaultValue={customer?.full_name || ''} required className={inputClass} placeholder="Ad Soyad yazın..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Telefon <span className="text-red-500">*</span></Label>
                                <Input name="phone" defaultValue={customer?.phone || ''} required className={inputClass} placeholder="05XX XXX XX XX" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>E-posta</Label>
                                <Input name="email" type="email" defaultValue={customer?.email || ''} className={inputClass} placeholder="ornek@email.com" />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className={labelClass}>Cinsiyet</Label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'male', label: '👨 Erkek' },
                                        { value: 'female', label: '👩 Kadın' },
                                        { value: 'other', label: 'Diğer' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setGender(opt.value)}
                                            className={cn(
                                                "flex-1 h-11 rounded-xl text-sm font-bold border transition-all",
                                                gender === opt.value
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Kaynak & Pazarlama ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Megaphone className="h-4 w-4" />
                            </div>
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Kaynak & Pazarlama</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Kaynak</Label>
                                {showNewSource ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newSourceLabel}
                                            onChange={(e) => setNewSourceLabel(e.target.value)}
                                            placeholder="Yeni kaynak adı..."
                                            className={cn(inputClass, "flex-1")}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                                            autoFocus
                                        />
                                        <Button type="button" size="sm" className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleAddSource}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" className="h-11 rounded-xl text-xs" onClick={() => setShowNewSource(false)}>İptal</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Select value={selectedSource} onValueChange={setSelectedSource}>
                                            <SelectTrigger className={cn(inputClass, "flex-1")}>
                                                <SelectValue placeholder="Kaynak seçin..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {sourceOptions.map(opt => (
                                                    <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                                                ))}
                                                {selectedSource && !sourceOptions.find(o => o.label === selectedSource) && (
                                                    <SelectItem value={selectedSource}>{selectedSource}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewSource(true)}
                                            className="h-11 w-11 shrink-0 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 transition-all"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Bizi Nereden Duydunuz?</Label>
                                <Select value={heardFrom} onValueChange={setHeardFrom}>
                                    <SelectTrigger className={inputClass}>
                                        <SelectValue placeholder="Seçin..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {HEARD_FROM_OPTIONS.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {(heardFrom === 'Referans' || heardFrom === 'Arkadaş / Tanıdık') && (
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Referans Kişi</Label>
                                    <Input name="referral_name" defaultValue={customer?.referral_name || ''} placeholder="Referans adı..." className="h-11 bg-amber-50 border-amber-200 rounded-xl text-sm" />
                                </div>
                            )}
                            {heardFrom !== 'Referans' && heardFrom !== 'Arkadaş / Tanıdık' && (
                                <input type="hidden" name="referral_name" value={customer?.referral_name || ''} />
                            )}
                        </div>
                    </div>

                    {/* ── Satış Temsilcisi + Portal ── */}
                    <div className="space-y-6">
                        {salesReps.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Satış Temsilcisi</h2>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Atanan Temsilci</Label>
                                    <Select name="assigned_rep" defaultValue="">
                                        <SelectTrigger className={inputClass}>
                                            <SelectValue placeholder="Temsilci seçin (opsiyonel)..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {salesReps.map(rep => (
                                                <SelectItem key={rep.id} value={rep.id}>
                                                    {rep.full_name}
                                                    <span className="text-[10px] text-slate-400 ml-2">{rep.role}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Portal Erişimi</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Kullanıcı Adı</Label>
                                    <Input name="portal_username" defaultValue={customer?.portal_username || ''} className={inputClass} placeholder="Kullanıcı adı" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Şifre</Label>
                                    <Input name="portal_password" type="password" defaultValue={customer?.portal_password || ''} className={inputClass} placeholder="••••••••" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════ ROW 2: Adres + Firma (kurumsal) / Talep (yeni) ═══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* ── Adres Bilgileri ── */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        {!isCreateMode && customer ? (
                            <AddressManager addresses={customer.addresses || []} ownerId={customer.id} ownerType="customer" />
                        ) : (
                            <>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Adres Bilgileri</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className={labelClass}>İl</Label>
                                            <Input name="city" defaultValue="" className={inputClass} placeholder="İstanbul" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClass}>İlçe</Label>
                                            <Input name="district" defaultValue="" className={inputClass} placeholder="Beşiktaş" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Adres</Label>
                                        <Textarea name="address" defaultValue="" className="bg-white border-slate-200 rounded-xl resize-none min-h-[80px] text-sm placeholder:text-slate-300" placeholder="Açık adres..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className={labelClass}>Posta Kodu</Label>
                                            <Input name="postal_code" defaultValue="" className={inputClass} placeholder="34000" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={labelClass}>Ülke</Label>
                                            <Input name="country" defaultValue="Türkiye" className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Firma Bilgileri (Kurumsal) ── */}
                    {customerType === 'corporate' && (
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Firma Bilgileri</h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Firma Adı <span className="text-red-500">*</span></Label>
                                    <Input name="company_name" defaultValue={customer?.company_name || ''} required={customerType === 'corporate'} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Vergi Dairesi <span className="text-red-500">*</span></Label>
                                    <Input name="tax_office" defaultValue={customer?.tax_office || ''} required={customerType === 'corporate'} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Vergi No <span className="text-red-500">*</span></Label>
                                    <Input name="tax_number" defaultValue={customer?.tax_number || ''} required={customerType === 'corporate'} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Firma Telefonu</Label>
                                    <Input name="company_phone" defaultValue={customer?.company_phone || ''} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Firma E-posta</Label>
                                    <Input name="company_email" type="email" defaultValue={customer?.company_email || ''} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Web Sitesi</Label>
                                    <Input name="company_website" defaultValue={customer?.company_website || ''} className={inputClass} placeholder="https://" />
                                </div>
                                <div className="col-span-2 lg:col-span-3 space-y-1.5">
                                    <Label className={labelClass}>Firma Adresi</Label>
                                    <Textarea name="company_address" defaultValue={customer?.company_address || ''} className="bg-white border-slate-200 rounded-xl resize-none min-h-[70px] text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Talep & Tercihler (Bireysel / Yeni Kayıt) ── */}
                    {customerType === 'individual' && (
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                    <Search className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Talep & Tercihler</h2>
                            </div>
                            {isCreateMode ? (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Min Bütçe</Label>
                                        <Input name="min_price" type="number" placeholder="0" className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Max Bütçe</Label>
                                        <Input name="max_price" type="number" placeholder="0" className={inputClass} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Mülk Tipi</Label>
                                        <Select name="property_type">
                                            <SelectTrigger className={inputClass}><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Apartment">Daire</SelectItem>
                                                <SelectItem value="Villa">Villa</SelectItem>
                                                <SelectItem value="Office">Ofis</SelectItem>
                                                <SelectItem value="Shop">Dükkan</SelectItem>
                                                <SelectItem value="Land">Arsa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Yatırım Amacı</Label>
                                        <Select name="investment_purpose">
                                            <SelectTrigger className={inputClass}><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Living">Yaşam</SelectItem>
                                                <SelectItem value="Investment">Yatırım</SelectItem>
                                                <SelectItem value="Holiday">Tatil</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <Label className={labelClass}>Oda Sayısı</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                                                <label key={type} className="flex items-center gap-1.5 border border-slate-200 bg-white p-2.5 px-3.5 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all">
                                                    <input type="checkbox" name="room_count" value={type} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                                                    <span className="text-sm font-bold text-slate-700">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className={labelClass}>Konum Tercihi</Label>
                                        <Input name="location_preference" className={inputClass} placeholder="Bölge veya konum..." />
                                    </div>
                                    <div className="col-span-2 lg:col-span-4 space-y-1.5">
                                        <Label className={labelClass}>Notlar</Label>
                                        <Textarea name="notes" className="bg-white border-slate-200 rounded-xl resize-none min-h-[70px] text-sm" placeholder="Ek notlar..." />
                                    </div>
                                </div>
                            ) : (
                                <CustomerDemands
                                    customerId={customer!.id}
                                    demand={Array.isArray(customer!.customer_demands) ? customer!.customer_demands[0] : customer!.customer_demands}
                                    onClose={() => {}}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════ ROW 3: Profil Etiketleri ═══════ */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow mb-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                            <Tag className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Profil</h2>
                    </div>
                    {isCreateMode ? (
                        <InlineProfileFields />
                    ) : (
                        <CustomerProfileTab
                            customerId={customer!.id}
                            initialTags={customer!.tags || []}
                            initialProfileData={customer!.profile_data || {}}
                            onClose={() => {}}
                        />
                    )}
                </div>

                {/* ═══════ STICKY FOOTER ═══════ */}
                <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 py-4 mt-2">
                    <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                        <Button type="button" variant="ghost" className="text-slate-400 hover:text-slate-600 text-sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> İptal
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold rounded-xl shadow-lg shadow-blue-200/60 text-sm px-12"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>Kaydediliyor...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    <span>{isCreateMode ? 'Müşteri Kaydet' : 'Güncelle'}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
