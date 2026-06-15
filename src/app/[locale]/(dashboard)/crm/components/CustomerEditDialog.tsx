'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
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
import { Info, Plus, User, Loader2, Phone, Mail, MapPin, Shield, Megaphone, UserCheck } from 'lucide-react'
import CustomerDemands from './CustomerDemands'
import CustomerProfileTab from './CustomerProfileTab'
import InlineProfileFields from './InlineProfileFields'
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
}

interface CustomerEditDialogProps {
    customer: Customer | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

const HEARD_FROM_OPTIONS = [
    'Reklam Panoları',
    'Referans',
    'TV Reklamları',
    'Sponsorluk',
    'Fuar',
    'Dijital Reklam',
    'Sosyal Medya',
    'Gazete / Dergi',
    'Arkadaş / Tanıdık',
    'Diğer'
]

export function CustomerEditDialog({ customer, isOpen, onOpenChange }: CustomerEditDialogProps) {
    const t = useTranslations('Customers')
    const isCreateMode = !customer
    const [isPending, startTransition] = useTransition()

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
            setShowNewSource(false)
            setNewSourceLabel('')

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

    // Section header component
    const SectionHeader = ({ icon: Icon, title, color = 'blue' }: { icon: any; title: string; color?: string }) => (
        <div className="flex items-center gap-2 mb-3">
            <div className={cn(
                "h-6 w-6 rounded-lg flex items-center justify-center",
                color === 'blue' && "bg-blue-100 text-blue-600",
                color === 'emerald' && "bg-emerald-100 text-emerald-600",
                color === 'purple' && "bg-purple-100 text-purple-600",
                color === 'amber' && "bg-amber-100 text-amber-600",
            )}>
                <Icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
        </div>
    )

    // Labeled input helper
    const FormField = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
        <div className={cn("space-y-1.5", className)}>
            <Label className="text-[11px] font-bold text-slate-500 ml-0.5">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
        </div>
    )

    const inputClass = "h-10 bg-slate-50/80 border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1100px] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92dvh] rounded-none sm:rounded-2xl flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                {/* Header */}
                <DialogHeader className="px-6 py-4 shrink-0 border-b bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50">
                    <DialogTitle className="flex items-center gap-3 text-lg">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200/50">
                            <User className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {!isCreateMode && customer.customer_number && (
                                <span className="text-[11px] font-black px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                                    {customer.customer_number}
                                </span>
                            )}
                            <span className="font-bold truncate">
                                {isCreateMode ? t('createModal.title') : customer?.full_name || t('editCustomer')}
                            </span>
                        </div>
                        {/* Meta info tooltip */}
                        {!isCreateMode && meta && (
                            <div className="relative shrink-0">
                                <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all"
                                    onMouseEnter={() => setShowMeta(true)}
                                    onMouseLeave={() => setShowMeta(false)}
                                    onClick={() => setShowMeta(!showMeta)}
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                                {showMeta && (
                                    <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt Bilgileri</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-2.5 bg-slate-50 rounded-lg">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Oluşturan</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">{meta.creator?.full_name || '—'}</p>
                                            </div>
                                            <div className="p-2.5 bg-slate-50 rounded-lg">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Oluşturma Tarihi</p>
                                                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                                    {meta.created_at ? new Date(meta.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </p>
                                            </div>
                                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                                <p className="text-[9px] font-bold text-blue-400 uppercase">Değiştiren</p>
                                                <p className="text-xs font-semibold text-blue-700 mt-0.5">{meta.updater?.full_name || '—'}</p>
                                            </div>
                                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                                <p className="text-[9px] font-bold text-blue-400 uppercase">Değiştirme Tarihi</p>
                                                <p className="text-xs font-semibold text-blue-700 mt-0.5">
                                                    {meta.updated_at ? new Date(meta.updated_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-6 py-2 shrink-0 border-b bg-white">
                        <TabsList className={cn(
                            "grid w-full max-w-md bg-slate-100/80 p-1 rounded-xl",
                            isCreateMode ? 'grid-cols-2' : 'grid-cols-3'
                        )}>
                            <TabsTrigger value="details" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                {t('tabs.details')}
                            </TabsTrigger>
                            {!isCreateMode && (
                                <TabsTrigger value="demands" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    {t('tabs.demands')}
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="profile" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Profil
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Details Tab — TWO COLUMN LAYOUT */}
                    <TabsContent value="details" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                        <form action={async (formData) => {
                            if (isCreateMode) {
                                const res = await createCustomer(formData)
                                if (res?.error) toast.error(res.error)
                                else {
                                    toast.success(t('messages.created') || 'Müşteri oluşturuldu')
                                    onOpenChange(false)
                                    window.location.reload()
                                }
                            } else {
                                const res = await updateCustomer(formData)
                                if (res?.error) toast.error(res.error)
                                else {
                                    toast.success(t('messages.updated') || 'Müşteri güncellendi')
                                    onOpenChange(false)
                                }
                            }
                        }} className="flex flex-col flex-1 min-h-0">
                            {!isCreateMode && <input type="hidden" name="id" value={customer.id} />}
                            <input type="hidden" name="gender" value={gender} />
                            <input type="hidden" name="heard_from" value={heardFrom} />
                            <input type="hidden" name="source" value={selectedSource} />

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {/* === TWO COLUMN GRID === */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* ========== LEFT COLUMN ========== */}
                                    <div className="space-y-5">
                                        {/* Kişisel Bilgiler */}
                                        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                            <SectionHeader icon={User} title="Kişisel Bilgiler" color="blue" />
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField label={t('form.fullName')} required>
                                                        <Input name="full_name" defaultValue={customer?.full_name || ''} required className={inputClass} placeholder="Ad Soyad" />
                                                    </FormField>
                                                    <FormField label={t('form.email')}>
                                                        <Input name="email" type="email" defaultValue={customer?.email || ''} className={inputClass} placeholder="ornek@email.com" />
                                                    </FormField>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField label={t('form.phone')} required>
                                                        <Input name="phone" defaultValue={customer?.phone || ''} required className={inputClass} placeholder="05XX XXX XX XX" />
                                                    </FormField>
                                                    <FormField label="Cinsiyet">
                                                        <div className="flex gap-1.5">
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
                                                                        "flex-1 h-10 rounded-xl text-xs font-bold border transition-all",
                                                                        gender === opt.value
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                                                            : "bg-slate-50/80 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                                                                    )}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </FormField>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Adres Bilgileri */}
                                        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                            <SectionHeader icon={MapPin} title="Adres Bilgileri" color="emerald" />
                                            <div className="space-y-3">
                                                <FormField label={t('form.address')}>
                                                    <Textarea name="address" defaultValue={customer?.address || ''} className="bg-slate-50/80 border-slate-200 rounded-xl resize-none min-h-[56px] text-sm focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="Açık adres..." />
                                                </FormField>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField label={t('form.city')}>
                                                        <Input name="city" defaultValue={customer?.city || ''} className={inputClass} placeholder="İstanbul" />
                                                    </FormField>
                                                    <FormField label={t('form.district')}>
                                                        <Input name="district" defaultValue={customer?.district || ''} className={inputClass} placeholder="Beşiktaş" />
                                                    </FormField>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField label={t('form.postalCode')}>
                                                        <Input name="postal_code" defaultValue={customer?.postal_code || ''} className={inputClass} placeholder="34000" />
                                                    </FormField>
                                                    <FormField label={t('form.country')}>
                                                        <Input name="country" defaultValue={customer?.country || 'Türkiye'} className={inputClass} />
                                                    </FormField>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ========== RIGHT COLUMN ========== */}
                                    <div className="space-y-5">
                                        {/* Kaynak & Pazarlama */}
                                        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                            <SectionHeader icon={Megaphone} title="Kaynak & Pazarlama" color="purple" />
                                            <div className="space-y-3">
                                                {/* Source — dynamic dropdown */}
                                                <FormField label="Kaynak">
                                                    {showNewSource ? (
                                                        <div className="flex gap-1.5">
                                                            <Input
                                                                value={newSourceLabel}
                                                                onChange={(e) => setNewSourceLabel(e.target.value)}
                                                                placeholder="Yeni kaynak adı..."
                                                                className={cn(inputClass, "flex-1")}
                                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                                                                autoFocus
                                                            />
                                                            <Button type="button" size="sm" className="h-10 px-3 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleAddSource}>
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button type="button" size="sm" variant="ghost" className="h-10 px-3 rounded-xl text-xs text-slate-400" onClick={() => setShowNewSource(false)}>
                                                                İptal
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1.5">
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
                                                                className="h-10 w-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all shrink-0"
                                                                title="Yeni kaynak ekle"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </FormField>

                                                {/* Heard From */}
                                                <FormField label="Bizi Nereden Duydunuz?">
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
                                                </FormField>

                                                {/* Referral name — conditional */}
                                                {(heardFrom === 'Referans' || heardFrom === 'Arkadaş / Tanıdık') && (
                                                    <FormField label="Referans Kişi">
                                                        <Input
                                                            name="referral_name"
                                                            defaultValue={customer?.referral_name || ''}
                                                            placeholder="Referans olan kişinin adı..."
                                                            className="h-10 bg-amber-50/80 border-amber-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-100 transition-all"
                                                        />
                                                    </FormField>
                                                )}
                                                {heardFrom !== 'Referans' && heardFrom !== 'Arkadaş / Tanıdık' && (
                                                    <input type="hidden" name="referral_name" value={customer?.referral_name || ''} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Satış Temsilcisi */}
                                        {salesReps.length > 0 && (
                                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                                <SectionHeader icon={UserCheck} title="Satış Temsilcisi" color="amber" />
                                                <FormField label="Atanan Temsilci">
                                                    <Select name="assigned_rep" defaultValue="">
                                                        <SelectTrigger className={inputClass}>
                                                            <SelectValue placeholder="Temsilci seçin (opsiyonel)..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            {salesReps.map(rep => (
                                                                <SelectItem key={rep.id} value={rep.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        <span>{rep.full_name}</span>
                                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{rep.role}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormField>
                                            </div>
                                        )}

                                        {/* Portal Erişimi */}
                                        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                            <SectionHeader icon={Shield} title="Portal Erişimi" color="blue" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField label={t('form.username')}>
                                                    <Input name="portal_username" defaultValue={customer?.portal_username || ''} placeholder={t('form.username')} className={inputClass} />
                                                </FormField>
                                                <FormField label={t('form.password')}>
                                                    <Input name="portal_password" type="password" defaultValue={customer?.portal_password || ''} placeholder="••••••••" className={inputClass} />
                                                </FormField>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter className="px-6 py-4 border-t bg-gradient-to-r from-slate-50/80 to-blue-50/30 shrink-0">
                                <div className="flex items-center justify-between w-full gap-3">
                                    <Button type="button" variant="ghost" className="text-sm text-slate-400 hover:text-slate-600" onClick={() => onOpenChange(false)}>
                                        İptal
                                    </Button>
                                    <Button type="submit" className="h-11 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-100 transition-all text-sm px-10">
                                        {isCreateMode ? (t('createModal.submit') || 'Kaydet') : t('createModal.update')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* Demands & Profile Tabs */}
                    {!isCreateMode && customer && (
                        <>
                            <TabsContent value="demands" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                                <CustomerDemands
                                    customerId={customer.id}
                                    demand={Array.isArray(customer.customer_demands) ? customer.customer_demands[0] : customer.customer_demands}
                                    onClose={() => onOpenChange(false)}
                                />
                            </TabsContent>
                            <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                                <CustomerProfileTab
                                    customerId={customer.id}
                                    initialTags={customer.tags || []}
                                    initialProfileData={customer.profile_data || {}}
                                    onClose={() => onOpenChange(false)}
                                />
                            </TabsContent>
                        </>
                    )}
                    {isCreateMode && (
                        <TabsContent value="profile" forceMount={true} className="flex-1 min-h-0 data-[state=inactive]:hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                <InlineProfileFields />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
