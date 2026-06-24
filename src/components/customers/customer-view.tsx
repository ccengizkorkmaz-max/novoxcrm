'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Filter, MapPin, Clock, PhoneOff, Building2, Trash2, Loader2 } from 'lucide-react'
import { ActivityTimeline } from '@/components/activities/activity-timeline'
import { AiMatchWidget } from './AiMatchWidget'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { BackButton } from '@/components/back-button'
import { Switch } from '@/components/ui/switch'
import { toggleCommunication } from '@/app/[locale]/(dashboard)/crm/actions'
import { Combobox } from '@/components/ui/combobox'

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
    const router = useRouter()

    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])

    const [companiesList, setCompaniesList] = useState<{ id: string; name: string }[]>([])
    const [selectedCompanyId, setSelectedCompanyId] = useState('')
    const [loadingCompany, setLoadingCompany] = useState(false)

    const [companyContacts, setCompanyContacts] = useState<any[]>([])
    const [loadingRelated, setLoadingRelated] = useState(false)

    useEffect(() => {
        if (customer.company?.id) {
            setLoadingRelated(true)
            import('@/app/[locale]/(dashboard)/companies/company-actions').then(m => {
                m.getCompanyContacts(customer.company.id).then(res => {
                    if (res.contacts) {
                        setCompanyContacts(res.contacts.filter((c: any) => c.id !== customer.id))
                    }
                    setLoadingRelated(false)
                })
            })
        } else {
            setCompanyContacts([])
        }
    }, [customer.company?.id, customer.id])

    useEffect(() => {
        if (!customer.company) {
            import('@/app/[locale]/(dashboard)/companies/company-actions').then(m => {
                m.getActiveCompanies().then(list => {
                    setCompaniesList(list)
                })
            })
        }
    }, [customer.company])

    const handleAddCompany = async () => {
        if (!selectedCompanyId) return
        setLoadingCompany(true)
        try {
            const { addContactToCompany } = await import('@/app/[locale]/(dashboard)/companies/company-actions')
            const res = await addContactToCompany(selectedCompanyId, customer.id)
            if (res.success) {
                toast.success('Firma başarıyla eklendi.')
                setSelectedCompanyId('')
                router.refresh()
            } else {
                toast.error('Hata: ' + res.error)
            }
        } catch (err: any) {
            toast.error(err.message || 'Firma eklenirken bir hata oluştu')
        } finally {
            setLoadingCompany(false)
        }
    }

    const handleRemoveCompany = async () => {
        setLoadingCompany(true)
        try {
            const { removeContactFromCompany } = await import('@/app/[locale]/(dashboard)/companies/company-actions')
            const res = await removeContactFromCompany(customer.id)
            if (res.success) {
                toast.success('Firma bağlantısı kaldırıldı.')
                router.refresh()
            } else {
                toast.error('Hata: ' + res.error)
            }
        } catch (err: any) {
            toast.error(err.message || 'Firma kaldırılırken bir hata oluştu')
        } finally {
            setLoadingCompany(false)
        }
    }

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
    const [commEnabled, setCommEnabled] = useState<boolean>(customer.communication_enabled !== false)
    const [commLoading, setCommLoading] = useState(false)

    const handleCommToggle = async (checked: boolean) => {
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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <BackButton href="/crm" variant="outline" size="sm" />
                    <h1 className="text-2xl font-bold tracking-tight">{customer.full_name}</h1>
                    <Badge className={(contracts || []).length > 0 ? 'bg-blue-600' : customer.customer_demands?.length ? 'bg-green-600' : ''} variant={(contracts || []).length > 0 || customer.customer_demands?.length ? 'default' : 'secondary'}>
                        {(contracts || []).length > 0 ? t('badges.customer') : customer.customer_demands?.length ? t('badges.lead') : t('badges.contact')}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/crm/${customer.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            {t('table.edit')}
                        </Button>
                    </Link>
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
                            {/* Firma İlişkisi */}
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    İlişkili Firma
                                </Label>
                                {customer.company ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 border border-slate-100 p-2.5 rounded-xl transition-all">
                                            <div className="flex items-center gap-2 text-sm min-w-0">
                                                <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                                                <Link
                                                    href={`/companies/${customer.company.id}`}
                                                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                                                >
                                                    {customer.company.name}
                                                </Link>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                                                onClick={handleRemoveCompany}
                                                disabled={loadingCompany}
                                                title="Firmadan Ayrıl"
                                            >
                                                {loadingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>

                                        {/* İlişkili Kişiler */}
                                        <div className="p-2.5 bg-slate-50/40 rounded-xl border border-slate-100/80 space-y-2">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                                Firmadaki Diğer Kişiler
                                            </span>
                                            {loadingRelated ? (
                                                <div className="text-[10px] text-slate-400 italic">Yükleniyor...</div>
                                            ) : companyContacts.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic">Bu firmaya bağlı başka bir kişi bulunmuyor.</div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {companyContacts.map(c => (
                                                        <Link
                                                            key={c.id}
                                                            href={`/customers/${c.id}`}
                                                            className="inline-flex items-center justify-center h-8 rounded-lg bg-white border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                        >
                                                            {c.full_name} {c.phone ? `(${c.phone})` : ''}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <Combobox
                                                items={companiesList.map(c => ({
                                                    value: c.id,
                                                    label: c.name
                                                }))}
                                                value={selectedCompanyId}
                                                onChange={setSelectedCompanyId}
                                                placeholder="Firma seçin..."
                                                searchPlaceholder="Firma adı ara..."
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleAddCompany}
                                            disabled={!selectedCompanyId || loadingCompany}
                                            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0"
                                        >
                                            {loadingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
                                        </Button>
                                    </div>
                                )}
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
                            <div className="flex items-center gap-2 text-sm text-slate-500 pt-2 border-t border-slate-100">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Kayıt Tarihi: <span className="font-medium text-slate-700">{new Date(customer.created_at).toLocaleDateString('tr-TR')}</span></span>
                            </div>
                            
                            {/* Communication Toggle */}
                            <div className={`flex items-center justify-between pt-3 mt-1 border-t ${commEnabled ? 'border-slate-100' : 'border-red-200'}`}>
                                <div className="flex items-center gap-2">
                                    {commEnabled ? (
                                        <Phone className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <PhoneOff className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`text-sm font-medium ${commEnabled ? 'text-slate-700' : 'text-red-600'}`}>
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
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 flex items-start gap-1.5">
                                    <PhoneOff className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span>Bu müşteriye tüm kanallardan iletişim kapatılmıştır. Arama, WhatsApp, SMS gönderilmeyecektir.</span>
                                </div>
                            )}
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
