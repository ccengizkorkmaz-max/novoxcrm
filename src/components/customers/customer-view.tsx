'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Filter, MapPin } from 'lucide-react'
import { ActivityTimeline } from '@/components/activities/activity-timeline'
import { AiMatchWidget } from './AiMatchWidget'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslations } from 'next-intl'
import { updateCustomer } from '@/app/[locale]/(dashboard)/crm/actions'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CustomerViewProps {
    customer: any
    activities: any[]
    contracts?: any[]
    profiles?: any[]
    sales?: any[]
}

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

export function CustomerView({ customer, activities, contracts = [], profiles = [], sales = [] }: CustomerViewProps) {
    const t = useTranslations('Customers')
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
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

    // Filter Logic
    const filteredActivities = activities.filter(a => {
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            {t('table.edit')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg w-[95vw] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>{t('editCustomer')}</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                            const res = await updateCustomer(formData)
                            if (res?.error) {
                                toast.error(res.error)
                            } else {
                                toast.success(t('createModal.updateSuccess') || 'Müşteri bilgileri başarıyla güncellendi.')
                                setIsEditDialogOpen(false)
                            }
                        }} className="space-y-4 py-4">
                            <input type="hidden" name="id" value={customer.id} />

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('form.fullName')}</Label>
                                    <Input name="full_name" defaultValue={customer.full_name} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.phone')}</Label>
                                        <Input name="phone" defaultValue={customer.phone} required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.email')}</Label>
                                        <Input name="email" type="email" defaultValue={customer.email} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.source')}</Label>
                                    <Input name="source" defaultValue={customer.source} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>{t('form.address')}</Label>
                                    <Textarea name="address" defaultValue={customer.address} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.city')}</Label>
                                        <Input name="city" defaultValue={customer.city} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.district')}</Label>
                                        <Input name="district" defaultValue={customer.district} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>{t('form.postalCode')}</Label>
                                        <Input name="postal_code" defaultValue={customer.postal_code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>{t('form.country')}</Label>
                                        <Input name="country" defaultValue={customer.country || 'Türkiye'} />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">{t('createModal.update')}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">{customer.full_name}</h1>
                    <Badge className={contracts.length > 0 ? 'bg-blue-600' : customer.customer_demands?.length ? 'bg-green-600' : ''} variant={contracts.length > 0 || customer.customer_demands?.length ? 'default' : 'secondary'}>
                        {contracts.length > 0 ? t('badges.customer') : customer.customer_demands?.length ? t('badges.lead') : t('badges.contact')}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{customer.email || '-'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="space-y-0.5">
                                    <span className="block font-medium">{customer.address || '-'}</span>
                                    {(customer.district || customer.city) && (
                                        <span className="text-xs text-muted-foreground">
                                            {[customer.district, customer.city].filter(Boolean).join(' / ')}
                                        </span>
                                    )}
                                    {customer.postal_code && (
                                        <span className="text-xs text-muted-foreground block uppercase">
                                            {customer.postal_code}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold block mb-1">Kaynak</span>
                                <span className="text-muted-foreground">{customer.source || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Smart Match Widget */}
                    <AiMatchWidget customerId={customer.id} />

                    {/* Filters Card */}
                    <Card className="overflow-hidden">
                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <CardTitle className="text-base">Aktivite Filtreleri</CardTitle>
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

                    {/* Portal Access Card */}
                    <Card className="border-blue-100 bg-blue-50/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-blue-700">
                                <ShieldCheck className="h-4 w-4" />
                                <CardTitle className="text-base font-bold">Portal Erişimi</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="portal_user" className="text-xs">Kullanıcı Adı</Label>
                                <Input
                                    id="portal_user"
                                    placeholder="Kullanıcı adı..."
                                    defaultValue={customer.portal_username || ''}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portal_pass" className="text-xs">Şifre</Label>
                                <Input
                                    id="portal_pass"
                                    type="password"
                                    placeholder="Şifre belirleyin..."
                                    defaultValue={customer.portal_password || ''}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <Button
                                className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
                                onClick={async () => {
                                    const user = (document.getElementById('portal_user') as HTMLInputElement).value
                                    const pass = (document.getElementById('portal_pass') as HTMLInputElement).value
                                    if (!user || !pass) return toast.warning('Lütfen bilgileri eksiksiz girin.')

                                    const { syncPortalAccess } = await import('@/lib/actions/customer-portal')
                                    const res = await syncPortalAccess(customer.id, user, pass)
                                    if (res.success) toast.success('Portal erişimi güncellendi!')
                                    else toast.error('Hata: ' + res.error)
                                }}
                            >
                                Kaydet & Yetkilendir
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Demands */}
                    {customer.customer_demands && customer.customer_demands.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Talep Özeti</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                {customer.customer_demands.map((d: any) => (
                                    <div key={d.id} className="grid gap-1 border-b pb-2 last:border-0 last:pb-0">
                                        <div>Bütçe: {d.min_price} - {d.max_price}</div>
                                        <div>Oda: {d.room_count}</div>
                                        <div>Konum: {d.location_preference}</div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Contracts Section */}
                    {contracts && contracts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Sözleşmeler</span>
                                    <Badge variant="outline">{contracts.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {contracts.map((contract: any) => (
                                        <div key={contract.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold text-sm">{contract.contract_number}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {contract.project?.name} - {contract.unit?.block} / {contract.unit?.unit_number}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-sm">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: contract.currency || 'TRY' }).format(contract.total_amount)}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] h-5 mt-1">
                                                    {contract.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Active Sales / Leads Section */}
                    {sales && sales.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    <span>Aktif Satışlar / Leadler</span>
                                    <Badge variant="outline">{sales.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {sales.map((sale: any) => (
                                        <div key={sale.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {(sale.project?.name || sale.unit?.block) ? `${sale.project?.name || ''} - ${sale.unit?.block || ''} / ${sale.unit?.unit_number || ''}` : 'Belirsiz / Genel Talep'}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Satış Temsilcisi: {sale.profiles?.full_name || 'Atanmamış'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-sm">
                                                    {sale.final_price ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: sale.currency || 'TRY' }).format(sale.final_price) : '-'}
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] h-5 mt-1">
                                                    {sale.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <ActivityTimeline activities={filteredActivities} customer={customer} profiles={profiles} />
                </div>
            </div>
        </div>
    )
}
