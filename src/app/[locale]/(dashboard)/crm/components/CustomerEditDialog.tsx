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
import { Info, Plus, User, Loader2 } from 'lucide-react'
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

            // Load source options
            getSourceOptions().then(res => {
                if (res.options) setSourceOptions(res.options)
            })

            // Load sales reps
            getSalesReps().then(res => {
                if (res.reps) setSalesReps(res.reps)
            })

            // Load meta for existing customer
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl w-full sm:w-[95vw] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92dvh] rounded-none sm:rounded-2xl flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-4 sm:p-5 pb-3 shrink-0 border-b bg-gradient-to-r from-slate-50 to-blue-50/30">
                    <DialogTitle className="flex items-center gap-2.5 text-lg">
                        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
                            <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            {!isCreateMode && customer.customer_number && (
                                <span className="text-[11px] font-black px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg">
                                    {customer.customer_number}
                                </span>
                            )}
                            <span className="font-bold">{isCreateMode ? t('createModal.title') : t('editCustomer')}</span>
                        </div>
                        {/* Meta info tooltip */}
                        {!isCreateMode && meta && (
                            <div className="relative">
                                <button
                                    type="button"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all"
                                    onMouseEnter={() => setShowMeta(true)}
                                    onMouseLeave={() => setShowMeta(false)}
                                    onClick={() => setShowMeta(!showMeta)}
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                                {showMeta && (
                                    <div className="absolute right-0 top-10 z-50 w-72 bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kayıt Bilgileri</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400">Oluşturan</p>
                                                <p className="font-semibold text-slate-700">{meta.creator?.full_name || '—'}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400">Oluşturma Tarihi</p>
                                                <p className="font-semibold text-slate-700">
                                                    {meta.created_at ? new Date(meta.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400">Değiştiren</p>
                                                <p className="font-semibold text-slate-700">{meta.updater?.full_name || '—'}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400">Değiştirme Tarihi</p>
                                                <p className="font-semibold text-slate-700">
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
                <Tabs defaultValue="details" className="w-full flex-1 flex flex-col min-h-0">
                    <div className="px-4 sm:px-5 py-2 shrink-0 border-b bg-white">
                        <TabsList className={cn(
                            "grid w-full bg-slate-100/80 p-1 rounded-xl",
                            isCreateMode ? 'grid-cols-2' : 'grid-cols-3'
                        )}>
                            <TabsTrigger value="details" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.details')}</TabsTrigger>
                            {!isCreateMode && <TabsTrigger value="demands" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">{t('tabs.demands')}</TabsTrigger>}
                            <TabsTrigger value="profile" className="rounded-lg font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Profil</TabsTrigger>
                        </TabsList>
                    </div>
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

                            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                                {/* Section: Kişisel Bilgiler */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kişisel Bilgiler</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.fullName')} <span className="text-red-500">*</span></Label>
                                            <Input name="full_name" defaultValue={customer?.full_name || ''} required className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.phone')} <span className="text-red-500">*</span></Label>
                                            <Input name="phone" defaultValue={customer?.phone || ''} required className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.email')}</Label>
                                            <Input name="email" type="email" defaultValue={customer?.email || ''} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-[11px] font-bold text-slate-500">Cinsiyet</Label>
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
                                                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                                        gender === opt.value
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                                            : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Kaynak & Referans */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaynak & Pazarlama</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Source — dynamic dropdown */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">Kaynak</Label>
                                            {showNewSource ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newSourceLabel}
                                                        onChange={(e) => setNewSourceLabel(e.target.value)}
                                                        placeholder="Yeni kaynak adı..."
                                                        className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm flex-1"
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                                                        autoFocus
                                                    />
                                                    <Button type="button" size="sm" className="h-10 px-3 rounded-xl" onClick={handleAddSource}>
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button type="button" size="sm" variant="ghost" className="h-10 px-2 rounded-xl text-xs" onClick={() => setShowNewSource(false)}>
                                                        İptal
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                                                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm flex-1">
                                                            <SelectValue placeholder="Kaynak seçin..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl shadow-xl">
                                                            {sourceOptions.map(opt => (
                                                                <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                                                            ))}
                                                            {/* Fallback: show current value if not in list */}
                                                            {selectedSource && !sourceOptions.find(o => o.label === selectedSource) && (
                                                                <SelectItem value={selectedSource}>{selectedSource}</SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewSource(true)}
                                                        className="h-10 w-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all shrink-0"
                                                        title="Yeni kaynak ekle"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Heard From */}
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">Bizi Nereden Duydunuz?</Label>
                                            <Select value={heardFrom} onValueChange={setHeardFrom}>
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm">
                                                    <SelectValue placeholder="Seçin..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl shadow-xl">
                                                    {HEARD_FROM_OPTIONS.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Referral name — shows when heardFrom is Referans or Arkadaş */}
                                    {(heardFrom === 'Referans' || heardFrom === 'Arkadaş / Tanıdık') && (
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">Referans Kişi</Label>
                                            <Input
                                                name="referral_name"
                                                defaultValue={customer?.referral_name || ''}
                                                placeholder="Referans olan kişinin adını yazın..."
                                                className="h-10 bg-amber-50 border-amber-200 rounded-xl text-sm"
                                            />
                                        </div>
                                    )}
                                    {heardFrom !== 'Referans' && heardFrom !== 'Arkadaş / Tanıdık' && (
                                        <input type="hidden" name="referral_name" value={customer?.referral_name || ''} />
                                    )}

                                    {/* Sales rep assignment */}
                                    {salesReps.length > 0 && (
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">Atanan Satış Temsilcisi</Label>
                                            <Select name="assigned_rep" defaultValue="">
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm">
                                                    <SelectValue placeholder="Temsilci seçin (opsiyonel)..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl shadow-xl">
                                                    {salesReps.map(rep => (
                                                        <SelectItem key={rep.id} value={rep.id}>
                                                            {rep.full_name} <span className="text-slate-400 ml-1 text-[10px]">({rep.role})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Adres */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres Bilgileri</p>
                                    <div className="grid gap-1.5">
                                        <Label className="text-[11px] font-bold text-slate-500">{t('form.address')}</Label>
                                        <Textarea name="address" defaultValue={customer?.address || ''} className="bg-slate-50 border-slate-200 rounded-xl resize-none min-h-[60px] text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.city')}</Label>
                                            <Input name="city" defaultValue={customer?.city || ''} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.district')}</Label>
                                            <Input name="district" defaultValue={customer?.district || ''} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.postalCode')}</Label>
                                            <Input name="postal_code" defaultValue={customer?.postal_code || ''} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.country')}</Label>
                                            <Input name="country" defaultValue={customer?.country || 'Türkiye'} className="h-10 bg-slate-50 border-slate-200 rounded-xl text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Portal */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Portal Erişimi</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.username')}</Label>
                                            <Input name="portal_username" defaultValue={customer?.portal_username || ''} placeholder={t('form.username')} className="h-10 bg-white border-slate-200 rounded-xl text-sm" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[11px] font-bold text-slate-500">{t('form.password')}</Label>
                                            <Input name="portal_password" type="password" defaultValue={customer?.portal_password || ''} placeholder={t('form.password')} className="h-10 bg-white border-slate-200 rounded-xl text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="p-4 sm:p-5 border-t bg-slate-50/80 shrink-0">
                                <Button type="submit" className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-100 transition-all text-sm px-8">
                                    {isCreateMode ? (t('createModal.submit') || 'Kaydet') : t('createModal.update')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
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
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                                <InlineProfileFields />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
