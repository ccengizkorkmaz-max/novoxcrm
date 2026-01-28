'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, User, Phone, Mail, Globe, Wallet, Calendar, MessageSquare, Loader2 } from 'lucide-react'
import { submitBrokerLead } from '../../../../actions'

interface Project {
    id: string
    name: string
}

interface Unit {
    id: string
    unit_number: string
    block?: string | null
    floor?: number | null
    type?: string | null
    area_gross?: number | null
    price?: number | null
    currency?: string | null
}

interface NewLeadFormProps {
    projects: Project[]
    initialProjectId?: string
    initialUnit?: Unit | null
}

export default function NewLeadForm({
    projects,
    initialProjectId,
    initialUnit
}: NewLeadFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await submitBrokerLead(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/broker/leads?success=true')
        }
    }

    const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
        if (!price) return 'Fiyat Sorunuz'
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency || 'TRY',
            maximumFractionDigits: 0
        }).format(price)
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Yeni Müşteri Kaydı</h1>
                <p className="text-slate-500 text-sm italic">Müşteri bilgilerini girerek koruma altına alabilirsiniz.</p>
            </div>

            <form action={handleSubmit}>
                {/* Carry unit_id as hidden if it comes from the initial state */}
                {initialUnit && <input type="hidden" name="unit_id" value={initialUnit.id} />}

                <div className="grid gap-6">
                    {/* Kişisel Bilgiler */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                            <CardTitle className="text-md font-bold flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Kişisel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Ad Soyad *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input id="full_name" name="full_name" className="pl-9 rounded-xl" placeholder="Ad Soyad" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input id="phone" name="phone" className="pl-9 rounded-xl" placeholder="5xx xxx xx xx" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta (Opsiyonel)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input id="email" name="email" type="email" className="pl-9 rounded-xl" placeholder="örnek@mail.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nationality">Uyruk (Opsiyonel)</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input id="nationality" name="nationality" className="pl-9 rounded-xl" placeholder="Türkiye, İngiltere vb." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proje & Ünite Seçimi */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                            <CardTitle className="text-md font-bold flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                Proje & Ünite Bilgisi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="project_id">İlgilenilen Proje</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-10" />
                                    <Select
                                        name="project_id"
                                        defaultValue={selectedProjectId}
                                        onValueChange={setSelectedProjectId}
                                    >
                                        <SelectTrigger className="pl-9 rounded-xl">
                                            <SelectValue placeholder="Proje Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {initialUnit && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Seçili Ünite</Label>
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="min-w-[40px] px-2 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm whitespace-nowrap">
                                                {initialUnit.unit_number}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {initialUnit.block && `${initialUnit.block} Blok, `} {initialUnit.floor && `${initialUnit.floor}. Kat, `} {initialUnit.type}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {initialUnit.area_gross ? `${initialUnit.area_gross} m² Brüt` : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-blue-700">
                                                {formatPrice(initialUnit.price, initialUnit.currency)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic mt-1">* Bu talep doğrudan yukarıdaki ünite ile ilişkilendirilecektir.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Bütçe Aralığı</Label>
                                <div className="flex items-center gap-2">
                                    <Input name="budget_min" type="number" className="rounded-xl" placeholder="Min" />
                                    <span className="text-slate-400">-</span>
                                    <Input name="budget_max" type="number" className="rounded-xl" placeholder="Max" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purpose">Alım Amacı</Label>
                                <Select name="purpose">
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Residence">Oturum</SelectItem>
                                        <SelectItem value="Investment">Yatırım</SelectItem>
                                        <SelectItem value="Other">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="property_type">Mülk Tipi</Label>
                                <Select name="property_type" defaultValue={initialUnit?.type || undefined}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1+1">1+1</SelectItem>
                                        <SelectItem value="2+1">2+1</SelectItem>
                                        <SelectItem value="3+1">3+1</SelectItem>
                                        <SelectItem value="Duplex">Dubleks</SelectItem>
                                        <SelectItem value="Villa">Villa</SelectItem>
                                        <SelectItem value="Commercial">Ticari</SelectItem>
                                        <SelectItem value="Land">Arsa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ziyaret & Notlar */}
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                            <CardTitle className="text-md font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                Randevu & Notlar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="preferred_visit_date">Tercih Edilen Ziyaret Tarihi</Label>
                                    <Input id="preferred_visit_date" name="preferred_visit_date" type="datetime-local" className="rounded-xl" />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <Checkbox id="credit_interest" name="credit_interest" value="true" />
                                    <label
                                        htmlFor="credit_interest"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Kredi kullanımı ile ilgileniyor
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Ek Notlar</Label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Textarea id="notes" name="notes" className="pl-9 rounded-xl min-h-[100px]" placeholder="Müşteri hakkında eklemek istediğiniz detaylar..." />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 italic">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kaydı Oluştur ve Gönder"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
