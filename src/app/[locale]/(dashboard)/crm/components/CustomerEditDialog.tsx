'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateCustomer, createCustomer, getSourceOptions, addSourceOption, getSalesReps, getCustomerMeta } from '../actions'
import { toast } from 'sonner'
import { Info, Plus, User, MapPin, Megaphone, UserCheck, Shield, Tag, Building2, Search } from 'lucide-react'
import CustomerDemands from './CustomerDemands'
import CustomerProfileTab from './CustomerProfileTab'
import InlineProfileFields from './InlineProfileFields'
import AddressManager from '@/components/shared/AddressManager'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/ui/combobox'

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
    company_id?: string | null
}

interface CustomerEditDialogProps {
    customer: Customer | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const HEARD_FROM_OPTIONS = [
    'Reklam Panoları', 'Referans', 'TV Reklamları', 'Sponsorluk',
    'Fuar', 'Dijital Reklam', 'Sosyal Medya', 'Gazete / Dergi',
    'Arkadaş / Tanıdık', 'Diğer'
]

export function CustomerEditDialog({ customer, isOpen, onOpenChange }: CustomerEditDialogProps) {
    const t = useTranslations('Customers')
    const router = useRouter()
    const isCreateMode = !customer
    const [isPending, setIsPending] = useState(false)

    // Customer type
    const customerType = 'individual'

    // Companies list and selection
    const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState(customer?.company_id || '')

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
    const [showMeta, setShowMeta] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setSelectedSource(customer?.source || '')
            setGender(customer?.gender || '')
            setHeardFrom(customer?.heard_from || '')
            setSelectedCompanyId(customer?.company_id || '')
            setShowNewSource(false)
            setNewSourceLabel('')
            setMeta(null)

            getSourceOptions().then(res => {
                if (res.options) setSourceOptions(res.options)
            })
            getSalesReps().then(res => {
                if (res.reps) setSalesReps(res.reps)
            })
            import('@/app/[locale]/(dashboard)/companies/company-actions').then(m => {
                m.getActiveCompanies().then(list => {
                    setCompaniesList(list)
                })
            })
            if (customer?.id) {
                getCustomerMeta(customer.id).then(data => {
                    if (data) setMeta(data)
                })
            }
        }
    }, [isOpen, customer])

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
        formData.set('company_id', selectedCompanyId)
        setIsPending(true)
        try {
            if (isCreateMode) {
                const res = await createCustomer(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Müşteri başarıyla oluşturuldu')
                    onOpenChange(false)
                    router.refresh()
                }
            } else {
                const res = await updateCustomer(formData)
                if (res?.error) {
                    toast.error(res.error)
                } else {
                    toast.success('Müşteri başarıyla güncellendi')
                    onOpenChange(false)
                    router.refresh()
                }
            }
        } finally {
            setIsPending(false)
        }
    }

    const inputClass = "h-11 bg-slate-50/70 border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300"
    const labelClass = "text-[11px] font-bold text-slate-500 ml-0.5"

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[96vw] w-[96vw] sm:max-h-[85dvh] rounded-2xl flex flex-col p-0 overflow-hidden border-none shadow-2xl gap-0">
                {/* ═══════ HEADER ═══════ */}
                <DialogHeader className="px-7 py-4 shrink-0 border-b bg-gradient-to-r from-white via-blue-50/30 to-white">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/60">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {!isCreateMode && customer.customer_number && (
                                <span className="text-[11px] font-black px-3 py-1 bg-blue-100 text-blue-700 rounded-lg shrink-0 tracking-wide">
                                    {customer.customer_number}
                                </span>
                            )}
                            <span className="text-lg font-bold truncate">
                                {isCreateMode ? 'Yeni Müşteri Kaydı' : customer?.full_name}
                            </span>
                        </div>

                         {/* Meta info */}
                        {!isCreateMode && meta && (
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    className="h-9 w-9 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"
                                    onMouseEnter={() => setShowMeta(true)}
                                    onMouseLeave={() => setShowMeta(false)}
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                                {showMeta && (
                                    <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kayıt Bilgileri</p>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                { label: 'Oluşturan', value: meta.creator?.full_name, bg: 'bg-slate-50' },
                                                { label: 'Oluşturma Tarihi', value: meta.created_at ? new Date(meta.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null, bg: 'bg-slate-50' },
                                                { label: 'Değiştiren', value: meta.updater?.full_name, bg: 'bg-blue-50' },
                                                { label: 'Son Değişiklik', value: meta.updated_at ? new Date(meta.updated_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null, bg: 'bg-blue-50' },
                                            ].map((item, i) => (
                                                <div key={i} className={cn("p-2.5 rounded-lg", item.bg)}>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</p>
                                                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{item.value || '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* ═══════ TABS ═══════ */}
                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-7 py-2.5 shrink-0 border-b bg-white">
                        <TabsList className={cn(
                            "grid max-w-xl bg-slate-100/80 p-1 rounded-xl",
                            isCreateMode ? 'grid-cols-2' : 'grid-cols-4'
                        )}>
                            <TabsTrigger value="details" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Genel Bilgiler
                            </TabsTrigger>
                            {!isCreateMode && (
                                <TabsTrigger value="demands" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Talep ve Tercihler
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="profile" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Profil
                            </TabsTrigger>
                            {!isCreateMode && (
                                <TabsTrigger value="addresses" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Adresler
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* ═══════ DETAILS TAB ═══════ */}
                    <TabsContent value="details" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                        <form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            {!isCreateMode && <input type="hidden" name="id" value={customer.id} />}

                            <div className="flex-1 overflow-y-auto px-7 py-6 bg-slate-50/40">
                                {/* ═══════ THREE COLUMN GRID ═══════ */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                                    {/* ══ COLUMN 1: Kişisel + Adres ══ */}
                                    <div className="space-y-5">
                                        {/* Kişisel Bilgiler */}
                                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Kişisel Bilgiler</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
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
                                                <div className="space-y-1.5">
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
                                                                        : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
                                                                )}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Firma / Şirket</Label>
                                                    <Combobox
                                                        items={companiesList.map(c => ({ value: c.id, label: c.name }))}
                                                        value={selectedCompanyId}
                                                        onChange={setSelectedCompanyId}
                                                        placeholder="Firma arayın veya seçin..."
                                                        searchPlaceholder="Firma ara..."
                                                        emptyText="Kayıtlı firma bulunamadı."
                                                    />
                                                    <input type="hidden" name="company_id" value={selectedCompanyId || ''} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Adres */}
                                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Adres Bilgileri</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>İl</Label>
                                                        <Input name="city" defaultValue={customer?.city || ''} className={inputClass} placeholder="İstanbul" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>İlçe</Label>
                                                        <Input name="district" defaultValue={customer?.district || ''} className={inputClass} placeholder="Beşiktaş" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Adres</Label>
                                                    <Textarea name="address" defaultValue={customer?.address || ''} className="bg-slate-50/70 border-slate-200 rounded-xl resize-none min-h-[80px] text-sm focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300" placeholder="Açık adres yazın..." />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>Posta Kodu</Label>
                                                        <Input name="postal_code" defaultValue={customer?.postal_code || ''} className={inputClass} placeholder="34000" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>Ülke</Label>
                                                        <Input name="country" defaultValue={customer?.country || 'Türkiye'} className={inputClass} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ══ COLUMN 2: Kaynak + Satış + Portal ══ */}
                                    <div className="space-y-5">
                                        {/* Kaynak & Pazarlama */}
                                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                    <Megaphone className="h-4 w-4" />
                                                </div>
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Kaynak & Pazarlama</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Kaynak</Label>
                                                    {showNewSource ? (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={newSourceLabel}
                                                                onChange={(e) => setNewSourceLabel(e.target.value)}
                                                                placeholder="Yeni kaynak adı yazın..."
                                                                className={cn(inputClass, "flex-1")}
                                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                                                                autoFocus
                                                            />
                                                            <Button type="button" size="sm" className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleAddSource}>
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            <Button type="button" size="sm" variant="ghost" className="h-11 px-3 rounded-xl text-xs" onClick={() => setShowNewSource(false)}>İptal</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <Select value={selectedSource} onValueChange={setSelectedSource}>
                                                                <SelectTrigger className={cn(inputClass, "flex-1")}>
                                                                    <SelectValue placeholder="Kaynak seçin..." />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl shadow-xl">
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
                                                                className="h-11 w-11 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all shrink-0"
                                                                title="Yeni kaynak ekle"
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
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            {HEARD_FROM_OPTIONS.map(opt => (
                                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {(heardFrom === 'Referans' || heardFrom === 'Arkadaş / Tanıdık') && (
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>Referans Kişi</Label>
                                                        <Input name="referral_name" defaultValue={customer?.referral_name || ''} placeholder="Referans olan kişinin adı..." className="h-11 bg-amber-50/70 border-amber-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all" />
                                                    </div>
                                                )}
                                                {heardFrom !== 'Referans' && heardFrom !== 'Arkadaş / Tanıdık' && (
                                                    <input type="hidden" name="referral_name" value={customer?.referral_name || ''} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Satış Temsilcisi */}
                                        {salesReps.length > 0 && (
                                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                                                        <UserCheck className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Satış Temsilcisi</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Atanan Temsilci</Label>
                                                    <Select name="assigned_rep" defaultValue="">
                                                        <SelectTrigger className={inputClass}>
                                                            <SelectValue placeholder="Temsilci seçin (opsiyonel)..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            {salesReps.map(rep => (
                                                                <SelectItem key={rep.id} value={rep.id}>
                                                                    <span>{rep.full_name}</span>
                                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md ml-2">{rep.role}</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Portal */}
                                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Portal Erişimi</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Kullanıcı Adı</Label>
                                                    <Input name="portal_username" defaultValue={customer?.portal_username || ''} className={inputClass} placeholder="Portal kullanıcı adı" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className={labelClass}>Şifre</Label>
                                                    <Input name="portal_password" type="password" defaultValue={customer?.portal_password || ''} className={inputClass} placeholder="••••••••" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ══ COLUMN 3: Firma (Kurumsal) / Talep (Bireysel) / Profil ══ */}
                                    <div className="space-y-5">

                                        {/* Talep & Tercihler — create mode */}
                                        {isCreateMode && (
                                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                                                        <Search className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Talep & Tercihler</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className={labelClass}>Min Bütçe</Label>
                                                            <Input name="min_price" type="number" placeholder="0" className={inputClass} />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className={labelClass}>Max Bütçe</Label>
                                                            <Input name="max_price" type="number" placeholder="0" className={inputClass} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>Oda Sayısı</Label>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {['1+1', '2+1', '3+1', '4+1', 'Villa'].map(type => (
                                                                <label key={type} className="flex items-center space-x-1.5 border border-slate-200 bg-white p-2.5 px-3.5 rounded-xl cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all">
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
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <Label className={labelClass}>Mülk Tipi</Label>
                                                            <Select name="property_type">
                                                                <SelectTrigger className={inputClass}><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                                                <SelectContent className="rounded-xl shadow-xl">
                                                                    <SelectItem value="Apartment">Daire</SelectItem>
                                                                    <SelectItem value="Villa">Villa</SelectItem>
                                                                    <SelectItem value="Office">Ofis</SelectItem>
                                                                    <SelectItem value="Shop">Dükkan</SelectItem>
                                                                    <SelectItem value="Commercial">Ticari</SelectItem>
                                                                    <SelectItem value="Land">Arsa</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className={labelClass}>Yatırım Amacı</Label>
                                                            <Select name="investment_purpose">
                                                                <SelectTrigger className={inputClass}><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                                                <SelectContent className="rounded-xl shadow-xl">
                                                                    <SelectItem value="Living">Yaşam</SelectItem>
                                                                    <SelectItem value="Investment">Yatırım</SelectItem>
                                                                    <SelectItem value="Holiday">Tatil</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className={labelClass}>Notlar</Label>
                                                        <Textarea name="notes" className="bg-slate-50/70 border-slate-200 rounded-xl resize-none min-h-[70px] text-sm" placeholder="Ek notlar..." />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profil — bireysel & create */}
                                        {isCreateMode && customerType === 'individual' && (
                                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2.5 mb-4">
                                                    <div className="h-7 w-7 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                                                        <Tag className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Profil Etiketleri</p>
                                                </div>
                                                <InlineProfileFields />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ═══════ FOOTER ═══════ */}
                            <DialogFooter className="px-7 py-4 border-t bg-white shrink-0">
                                <div className="flex items-center justify-between w-full gap-4">
                                    <Button type="button" variant="ghost" className="text-sm text-slate-400 hover:text-slate-600 px-6" onClick={() => onOpenChange(false)}>
                                        İptal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold rounded-xl shadow-lg shadow-blue-200/60 transition-all text-sm px-12"
                                    >
                                        {isPending ? (
                                            <div className="flex items-center gap-2">
                                                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                                <span>Kaydediliyor...</span>
                                            </div>
                                        ) : isCreateMode ? 'Müşteri Kaydet' : 'Güncelle'}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* ═══════ DEMANDS TAB (edit only) ═══════ */}
                    {!isCreateMode && customer && (
                        <TabsContent value="demands" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                            <CustomerDemands
                                customerId={customer.id}
                                demand={Array.isArray(customer.customer_demands) ? customer.customer_demands[0] : customer.customer_demands}
                                onClose={() => onOpenChange(false)}
                            />
                        </TabsContent>
                    )}

                    {/* ═══════ PROFILE TAB ═══════ */}
                    {!isCreateMode && customer && (
                        <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                            <CustomerProfileTab
                                customerId={customer.id}
                                initialTags={customer.tags || []}
                                initialProfileData={customer.profile_data || {}}
                                onClose={() => onOpenChange(false)}
                            />
                        </TabsContent>
                    )}
                    {!isCreateMode && customer && (
                        <TabsContent value="addresses" className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col overflow-y-auto px-7 py-6">
                            <AddressManager addresses={customer.addresses || []} ownerId={customer.id} ownerType="customer" />
                        </TabsContent>
                    )}
                    {isCreateMode && (
                        <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto px-7 py-5">
                                <InlineProfileFields />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
