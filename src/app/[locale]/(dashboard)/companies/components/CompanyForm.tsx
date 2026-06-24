'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Building2, ArrowLeft, Save, Trash2, Plus, Phone, Mail, Users, Loader2
} from 'lucide-react'
import AddressManager from '@/components/shared/AddressManager'
import { Combobox } from '@/components/ui/combobox'
import {
    createCompany, updateCompany, getCompanyContacts
} from '../company-actions'
import { Link } from '@/i18n/routing'

interface Company {
    id: string
    name: string
    tax_number: string | null
    tax_office: string | null
    trade_registry_no: string | null
    sector: string | null
    website: string | null
    phone: string | null
    email: string | null
    status: string
    notes: string | null
    created_at: string
}

interface CompanyFormProps {
    company?: Company | null
}

const emptyForm = {
    name: '', tax_number: '', tax_office: '', trade_registry_no: '',
    sector: '', website: '', phone: '', email: '', notes: ''
}

export default function CompanyForm({ company }: CompanyFormProps) {
    const router = useRouter()
    const isCreateMode = !company
    const [isPending, startTransition] = useTransition()

    // Form states
    const [form, setForm] = useState(emptyForm)

    // Contacts management states
    const [contacts, setContacts] = useState<any[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)

    // Load form data
    useEffect(() => {
        if (company) {
            setForm({
                name: company.name || '',
                tax_number: company.tax_number || '',
                tax_office: company.tax_office || '',
                trade_registry_no: company.trade_registry_no || '',
                sector: company.sector || '',
                website: company.website || '',
                phone: company.phone || '',
                email: company.email || '',
                notes: company.notes || ''
            })
            loadContacts()
        }
    }, [company])

    const loadContacts = async () => {
        if (isCreateMode) return
        setLoadingContacts(true)
        const res = await getCompanyContacts(company!.id)
        setLoadingContacts(false)
        if (res.contacts) {
            setContacts(res.contacts)
        }
    }

    const handleSave = () => {
        if (!form.name.trim()) {
            toast.error('Lütfen firma adını giriniz.')
            return
        }
        startTransition(async () => {
            if (company) {
                const res = await updateCompany(company.id, {
                    name: form.name,
                    tax_number: form.tax_number || null,
                    tax_office: form.tax_office || null,
                    trade_registry_no: form.trade_registry_no || null,
                    sector: form.sector || null,
                    website: form.website || null,
                    phone: form.phone || null,
                    email: form.email || null,
                    notes: form.notes || null,
                })
                if (res.success) {
                    toast.success('Firma başarıyla güncellendi.')
                    router.push('/companies')
                    router.refresh()
                } else {
                    toast.error('Hata: ' + res.error)
                }
            } else {
                const res = await createCompany({
                    name: form.name,
                    tax_number: form.tax_number || undefined,
                    tax_office: form.tax_office || undefined,
                    trade_registry_no: form.trade_registry_no || undefined,
                    sector: form.sector || undefined,
                    website: form.website || undefined,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    notes: form.notes || undefined,
                })
                if (res.success) {
                    toast.success('Firma başarıyla oluşturuldu.')
                    if (res.companyId) {
                        router.push(`/companies/${res.companyId}`)
                    } else {
                        router.push('/companies')
                    }
                    router.refresh()
                } else {
                    toast.error('Hata: ' + res.error)
                }
            }
        })
    }

    const f = (key: keyof typeof form) => ({
        value: form[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }))
    })

    const inputClass = "h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
    const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-wide"

    return (
        <div className="max-w-[1600px] mx-auto">
            {/* sticky header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-6">
                <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/companies')}
                            className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {isCreateMode ? 'Yeni Firma Kaydı' : company?.name}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSave}
                            disabled={isPending || !form.name.trim()}
                            className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold rounded-xl shadow-lg shadow-blue-200/60 text-sm px-6"
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    <span>{isCreateMode ? 'Firmayı Kaydet' : 'Güncelle'}</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* main form grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* left/middle: general details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="p-0 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Firma Detayları</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <div className="space-y-1.5">
                                <Label className={labelClass}>Firma Adı *</Label>
                                <Input placeholder="ABC Holding A.Ş." {...f('name')} className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Vergi No</Label>
                                    <Input placeholder="1234567890" {...f('tax_number')} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Vergi Dairesi</Label>
                                    <Input placeholder="Beyoğlu VD" {...f('tax_office')} className={inputClass} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Ticaret Sicil No</Label>
                                    <Input placeholder="Sicil No..." {...f('trade_registry_no')} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Sektör</Label>
                                    <Input placeholder="Gayrimenkul, İnşaat vb." {...f('sector')} className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className={labelClass}>Web Sitesi</Label>
                                <Input placeholder="https://www.abc.com" {...f('website')} className={inputClass} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>Telefon</Label>
                                    <Input placeholder="0212 XXX XX XX" {...f('phone')} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={labelClass}>E-posta</Label>
                                    <Input type="email" placeholder="info@abc.com" {...f('email')} className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className={labelClass}>Özel Notlar</Label>
                                <Textarea rows={3} placeholder="Firma hakkında ek notlar..." {...f('notes')} className="bg-white border-slate-200 rounded-xl text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Manager (Only when editing) */}
                    {!isCreateMode && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <AddressManager addresses={[]} ownerId={company.id} ownerType="company" />
                        </div>
                    )}
                </div>

                {/* right sidebar: associated contacts */}
                <div className="space-y-6">
                    {!isCreateMode ? (
                        <Card className="rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="p-0 mb-4">
                                <div className="flex items-center gap-2.5 text-slate-700">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                    <h2 className="text-sm font-black uppercase tracking-wider">Bağlı Kişiler (Temsilciler)</h2>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                {/* current contacts list */}
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {loadingContacts ? (
                                        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Kişiler yükleniyor...
                                        </div>
                                    ) : contacts.length === 0 ? (
                                        <p className="text-xs text-muted-foreground italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">
                                            Bu firmaya henüz bağlı bir kişi bulunmuyor.
                                        </p>
                                    ) : (
                                        contacts.map(contact => (
                                            <div key={contact.id} className="flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl transition-all">
                                                <div className="min-w-0 pr-2">
                                                    <Link
                                                        href={`/customers/${contact.id}`}
                                                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs truncate block"
                                                    >
                                                        {contact.full_name}
                                                    </Link>
                                                    {(contact.phone || contact.email) && (
                                                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                            {[contact.phone, contact.email].filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-2xl border border-slate-100 p-6 bg-slate-50/50 border-dashed text-center">
                            <CardContent className="p-0 py-6 text-slate-400 text-xs">
                                <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <span>Firmaya ait temsilci ekleme, adres yönetimi ve diğer ilişkiler firma kaydedildikten sonra aktif olacaktır.</span>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
