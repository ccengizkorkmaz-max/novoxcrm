'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Loader2, Info, BadgePercent, CreditCard, Layers } from 'lucide-react'
import { createCommissionModel } from '@/app/broker/actions'
import { toast } from 'sonner'

interface Project {
    id: string
    name: string
}

export default function CommissionModelForm({ projects, tenantId }: { projects: Project[], tenantId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('Flat %')

    async function handleSubmit(formData: FormData) {
        setLoading(true)

        const data = {
            tenant_id: tenantId,
            project_id: formData.get('project_id') as string,
            name: formData.get('name') as string,
            type: formData.get('type') as string, // Flat %, Unit Based %, Project Based %, Tiered
            value: Number(formData.get('value')),
            currency: formData.get('currency') as string || 'TRY',
            payable_stage: formData.get('payable_stage') as string,
            payment_terms: formData.get('payment_terms') as string || 'Net', // Net/Brut
            start_date: formData.get('start_date') ? formData.get('start_date') as string : null,
            end_date: formData.get('end_date') ? formData.get('end_date') as string : null,
        }

        if (!data.name || !data.value) {
            toast.error('Lütfen zorunlu alanları doldurun.')
            setLoading(false)
            return
        }

        if (data.value < 0) {
            toast.error('Değer negatif olamaz.')
            setLoading(false)
            return
        }

        const isPercentage = data.type.includes('%') || data.type === 'Tiered'
        if (isPercentage && data.value > 100) {
            toast.error('Yüzdelik oran 100\'den büyük olamaz. Sabit tutar girmek istiyorsanız "Sabit Tutar" veya "Ünite Bazlı Tutar" seçeneğini kullanın.')
            setLoading(false)
            return
        }

        const result = await createCommissionModel(data)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Komisyon modeli başarıyla oluşturuldu.')
            router.push('/admin/broker-leads/commission-settings')
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Yeni Komisyon Modeli</h1>
                <p className="text-muted-foreground">Proje veya birim bazlı komisyon kuralları tanımlayın.</p>
            </div>

            <form action={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-600" />
                                Model Tanımı
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Model Adı *</Label>
                                <Input id="name" name="name" placeholder="Örn: Kademeli Satış Modeli v1" required />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="project_id">Geçerli Proje</Label>
                                    <Select name="project_id">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tüm Projeler" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Projeler</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Model Türü</Label>
                                    <Select name="type" defaultValue={type} onValueChange={setType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Flat %">Sabit Oran (%)</SelectItem>
                                            <SelectItem value="Flat Amount">Sabit Tutar (TL/Döviz)</SelectItem>
                                            <SelectItem value="Tiered">Kademeli (Tiered %)</SelectItem>
                                            <SelectItem value="Unit Based %">Ünite Bazlı Oran (%)</SelectItem>
                                            <SelectItem value="Unit Based Amount">Ünite Bazlı Tutar (TL/Döviz)</SelectItem>
                                            <SelectItem value="Project Based %">Proje Bazlı Oran (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-md flex gap-3 text-sm text-slate-600 border border-slate-200">
                                <Info className="h-5 w-5 text-blue-500 shrink-0" />
                                <div>
                                    {type === 'Flat %' && "Her satıştan sabit bir yüzde oranında komisyon hesaplanır."}
                                    {type === 'Flat Amount' && "Her satıştan sabit bir parasal tutar (Örn: 10.000 TL) komisyon hesaplanır."}
                                    {type === 'Tiered' && "Belirlediğiniz satış hedeflerine ulaşıldıkça komisyon oranı değişir. Kademeleri (tiers) kayıttan sonra 'Detaylar' sayfasından ekleyebilirsiniz."}
                                    {type === 'Unit Based %' && "Ünite tipine (1+1, 2+1 vb.) göre özelleştirilmiş yüzdelik komisyon oranları uygulanır."}
                                    {type === 'Unit Based Amount' && "Ünite tipine (1+1, 2+1 vb.) göre özelleştirilmiş sabit komisyon tutarları uygulanır."}
                                    {type === 'Project Based %' && "Tüm projeyi kapsayan özel bir komisyon oranıdır."}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600" />
                                Değer ve Koşullar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="value">
                                        {type === 'Tiered' ? 'Başlangıç (Base) Oranı *' : 'Standart Oran / Değer *'}
                                    </Label>
                                    <div className="relative">
                                        <Input id="value" name="value" type="number" step="0.01" placeholder="0.00" required />
                                        <div className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">
                                            {type.includes('%') || type === 'Tiered' ? '%' : ''}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        {type === 'Tiered' ? "Herhangi bir kademeye girilmediğinde kullanılacak varsayılan oran." : "Satış başı uygulanacak değer."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Para Birimi</Label>
                                    <Select name="currency" defaultValue="TRY">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TRY">TRY</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="payable_stage">Ödeme Sahnesi</Label>
                                    <Select name="payable_stage" defaultValue="Contract Signed">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Contract Signed">Sözleşme İmzalandığında</SelectItem>
                                            <SelectItem value="Payment Received">Ödeme Alındığında</SelectItem>
                                            <SelectItem value="Delivery">Teslimatta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Select name="payment_terms" defaultValue="Net">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Net">Net</SelectItem>
                                            <SelectItem value="Brut">Brüt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                                    <Input id="start_date" name="start_date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">Bitiş Tarihi</Label>
                                    <Input id="end_date" name="end_date" type="date" />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Bu tarihten sonra model otomatik olarak "Süresi Bitenler" listesine alınır.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Vazgeç</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold px-8" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Modeli Kaydet"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
