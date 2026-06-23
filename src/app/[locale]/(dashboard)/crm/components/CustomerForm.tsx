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
import { Info, Plus, User, MapPin, Megaphone, UserCheck, Shield, Tag, Building2, Search, ArrowLeft, Save, Phone, Mail, Filter, Clock, PhoneOff, ChevronDown, ChevronUp, ShieldCheck, XCircle } from 'lucide-react'
import CustomerDemands from './CustomerDemands'
import CustomerProfileTab from './CustomerProfileTab'
import InlineProfileFields from './InlineProfileFields'
import AddressManager from '@/components/shared/AddressManager'
import { cn } from '@/lib/utils'
import { Combobox } from '@/components/ui/combobox'
import { Switch } from '@/components/ui/switch'
import { toggleCommunication } from '@/app/[locale]/(dashboard)/crm/actions'
import { AiMatchWidget } from '@/components/customers/AiMatchWidget'
import { ActivityTimeline } from '@/components/activities/activity-timeline'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
    communication_enabled?: boolean
}

interface CustomerFormProps {
    customer?: Customer | null
    activities?: any[]
    contracts?: any[]
    sales?: any[]
    profiles?: any[]
}

const HEARD_FROM_OPTIONS = [
    'Reklam Panoları', 'Referans', 'TV Reklamları', 'Sponsorluk',
    'Fuar', 'Dijital Reklam', 'Sosyal Medya', 'Gazete / Dergi',
    'Arkadaş / Tanıdık', 'Diğer'
]

export default function CustomerForm({ customer, activities, contracts = [], sales = [], profiles = [] }: CustomerFormProps) {
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

    // Unified view states & logic
    const isUnifiedView = !!activities || !!sales || !!contracts

    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        )
    }

    const toggleTopic = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        )
    }

    // Communication toggle
    const [commEnabled, setCommEnabled] = useState<boolean>(customer?.communication_enabled !== false)
    const [commLoading, setCommLoading] = useState(false)

    const handleCommToggle = async (checked: boolean) => {
        if (!customer?.id) return
        setCommLoading(true)
        setCommEnabled(checked)
        const res = await toggleCommunication(customer.id, checked)
        setCommLoading(false)
        if (res.error) {
            toast.error(res.error)
            setCommEnabled(!checked) // revert
        } else {
            toast.success(checked ? 'İletişim açıldı' : 'İletişim kapatıldı')
        }
    }

    // Filter Logic
    const filteredActivities = (activities || []).filter(a => {
        // Type Filter
        if (selectedTypes.length > 0) {
            if (!selectedTypes.includes(a.type)) return false
        }

        // Topic Filter
        if (selectedTopics.length > 0) {
            const topic = a.topic || 'General'
            if (!selectedTopics.includes(topic)) return false
        }

        return true
    })

    const ACTIVITY_TYPES = [
        { id: 'Call', label: 'Telefon' },
        { id: 'Meeting', label: 'Toplantı' },
        { id: 'Site Visit', label: 'Ziyaret' },
        { id: 'Email', label: 'Email' },
        { id: 'Whatsapp', label: 'Whatsapp' },
    ]

    const ACTIVITY_TOPICS = [
        { id: 'General', label: 'Genel' },
        { id: 'Sales', label: 'Satış Görüşmesi' },
        { id: 'Negotiation', label: 'Pazarlık / Teklif' },
        { id: 'Contract', label: 'Sözleşme' },
        { id: 'Support', label: 'Destek' },
        { id: 'After Sales', label: 'Satış Sonrası' },
        { id: 'Collection', label: 'Tahsilat' },
    ]

    useEffect(() => {
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
                    if (isUnifiedView) {
                        router.refresh()
                    } else {
                        router.back()
                    }
                }
            }
        } finally {
            setIsPending(false)
        }
    }

    const inputClass = "h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
    const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wide"

    const renderFormFields = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kişisel Bilgiler */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="col-span-2 space-y-1.5">
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

            {/* Kaynak & Pazarlama */}
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

            {/* Satış Temsilcisi & Portal */}
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

            {/* Adres Bilgileri */}
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



        </div>
    )

    const renderProfileField = () => (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
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
    )

    const renderSidebar = () => (
        <div className="space-y-6">
            {/* İletişim Açık Toggle */}
            <Card className={cn("border transition-colors shadow-sm", commEnabled ? "border-slate-100 bg-white" : "border-red-200 bg-red-50/10")}>
                <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {commEnabled ? (
                                <Phone className="h-4 w-4 text-green-600 animate-pulse shrink-0" />
                            ) : (
                                <PhoneOff className="h-4 w-4 text-red-500 shrink-0" />
                            )}
                            <span className={cn("text-xs font-bold uppercase tracking-wider", commEnabled ? "text-slate-700" : "text-red-600")}>
                                İletişim {commEnabled ? 'Açık' : 'Kapalı'}
                            </span>
                        </div>
                        <Switch
                            checked={commEnabled}
                            onCheckedChange={handleCommToggle}
                            disabled={commLoading}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-400"
                        />
                    </div>
                    {!commEnabled && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-start gap-1.5">
                            <PhoneOff className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>Bu müşteriye tüm kanallardan iletişim kapatılmıştır. Arama, WhatsApp, SMS gönderilmeyecektir.</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Smart Match Widget */}
            {customer?.id && <AiMatchWidget customerId={customer.id} />}

            {/* Aktif Satışlar / Leadler */}
            {sales && sales.length > 0 && (
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base font-bold text-slate-800">Aktif Satışlar / Leadler</CardTitle>
                        <Badge variant="outline" className="font-bold">{sales.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sales.map((sale: any) => (
                            <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="min-w-0 flex-1 pr-2">
                                    <div className="font-semibold text-sm truncate">
                                        {(sale.project?.name || sale.unit?.block) ? `${sale.project?.name || ''} - ${sale.unit?.block || ''} / ${sale.unit?.unit_number || ''}` : 'Belirsiz / Genel Talep'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                        Satış Temsilcisi: {sale.profiles?.full_name || 'Atanmamış'}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-medium text-sm">
                                        {sale.final_price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: sale.currency || 'TRY' }).format(sale.final_price) : '-'}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] h-5 mt-1 font-bold uppercase">
                                        {sale.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Sözleşmeler */}
            {contracts && contracts.length > 0 && (
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base font-bold text-slate-800">Sözleşmeler</CardTitle>
                        <Badge variant="outline" className="font-bold">{contracts.length}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contracts.map((contract: any) => (
                            <div key={contract.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="min-w-0 flex-1 pr-2">
                                    <div className="font-semibold text-sm truncate">{contract.contract_number}</div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {contract.project?.name} - {contract.unit?.block} / {contract.unit?.unit_number}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-medium text-sm">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] h-5 mt-1 font-bold uppercase">
                                        {contract.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Aktivite Filtreleri */}
            <Card className="overflow-hidden bg-white border-slate-100 shadow-sm">
                <button
                    type="button"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base font-bold text-slate-800">Aktivite Filtreleri</CardTitle>
                    </div>
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isFiltersOpen && (
                    <CardContent className="space-y-4 pt-0">
                        <div className="h-px bg-slate-100 -mx-4 mb-4" />

                        {/* Types */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aktivite Tipi</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {ACTIVITY_TYPES.map(type => (
                                    <div key={type.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`type-${type.id}`}
                                            checked={selectedTypes.includes(type.id)}
                                            onCheckedChange={() => toggleType(type.id)}
                                        />
                                        <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer whitespace-nowrap">
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Topics */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Konular</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {ACTIVITY_TOPICS.map(topic => (
                                    <div key={topic.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`topic-${topic.id}`}
                                            checked={selectedTopics.includes(topic.id)}
                                            onCheckedChange={() => toggleTopic(topic.id)}
                                        />
                                        <Label htmlFor={`topic-${topic.id}`} className="text-sm font-normal cursor-pointer whitespace-nowrap">
                                            {topic.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Zaman Tüneli */}
            {customer && <ActivityTimeline activities={filteredActivities} customer={customer} profiles={profiles} />}
        </div>
    )

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* ═══════ STICKY HEADER ═══════ */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        {isUnifiedView ? (
                            <BackButton href="/crm" variant="outline" size="sm" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-800">
                                        {isCreateMode ? 'Yeni Müşteri Kaydı' : customer?.full_name}
                                    </h1>
                                    {isUnifiedView && (
                                        <Badge className={(contracts || []).length > 0 ? 'bg-blue-600' : customer?.customer_demands?.length ? 'bg-green-600' : ''} variant={(contracts || []).length > 0 || customer?.customer_demands?.length ? 'default' : 'secondary'}>
                                            {(contracts || []).length > 0 ? t('badges.customer') : customer?.customer_demands?.length ? t('badges.lead') : t('badges.contact')}
                                        </Badge>
                                    )}
                                </div>
                                {!isCreateMode && customer?.customer_number && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                        {customer.customer_number}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                {isUnifiedView ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Left column (2/3 width) - Edit Form Fields with Tabs */}
                        <div className="xl:col-span-2">
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="bg-slate-100/80 p-1 rounded-xl mb-4 max-w-[280px] grid grid-cols-2">
                                    <TabsTrigger value="details" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Müşteri Bilgileri
                                    </TabsTrigger>
                                    <TabsTrigger value="profile" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Profil
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="space-y-6">
                                    {renderFormFields()}
                                </TabsContent>
                                <TabsContent value="profile" className="space-y-6">
                                    {renderProfileField()}
                                </TabsContent>
                            </Tabs>
                        </div>
                        {/* Right column (1/3 width) - Sidebar Widgets */}
                        <div className="xl:col-span-1 space-y-6">
                            {renderSidebar()}
                        </div>
                    </div>
                ) : (
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="bg-slate-100/80 p-1 rounded-xl mb-4 max-w-[280px] grid grid-cols-2">
                            <TabsTrigger value="details" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Müşteri Bilgileri
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Profil
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="space-y-6">
                            {/* ═══════ ROW 1: Kişisel + Kaynak + Satış (3 sütun yan yana) ═══════ */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* Kişisel Bilgiler */}
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
                                        <div className="col-span-2 space-y-1.5">
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

                                {/* Kaynak & Pazarlama */}
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

                                {/* Satış Temsilcisi & Portal */}
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

                            {/* Adres Bilgileri */}
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
                        </TabsContent>
                        <TabsContent value="profile" className="space-y-6">
                            {renderProfileField()}
                        </TabsContent>
                    </Tabs>
                )}

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
