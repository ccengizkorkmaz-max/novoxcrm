'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Ruler } from 'lucide-react'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { RoomAreasInput } from '@/components/room-areas-input'
import { toast } from 'sonner'
import { updateUnit } from '@/app/(dashboard)/inventory/[id]/actions'

const UNIT_CATEGORIES = [
    "Daire", "Depo", "Dükkan", "Ofis", "Villa",
    "Dubleks Daire", "Bahçe Dubleks Daire", "Çatı Dubleks Daire",
    "Roof Daire", "Loft Daire", "Penthouse", "Ticari Alan"
]

const UNIT_FEATURES = [
    "Balkon", "Teras", "Ebeveyn Banyosu", "Giyinme Odası",
    "Akıllı Ev Sistemi", "Yerden Isıtma", "Ankastre Set", "Klima"
]

export function UnitEditForm({ unit, disabled = false }: { unit: any; disabled?: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(unit.features || [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        // Handled Checkbox issues by appending features manually
        formData.delete('features') // Remove any partial/wrong data
        selectedFeatures.forEach(feature => {
            formData.append('features', feature)
        })

        const result = await updateUnit(formData)
        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
            return
        }

        toast.success("Değişiklikler başarıyla kaydedildi")
        router.refresh()
    }

    const toggleFeature = (feature: string, checked: boolean) => {
        if (checked) {
            setSelectedFeatures(prev => [...prev, feature])
        } else {
            setSelectedFeatures(prev => prev.filter(f => f !== feature))
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="hidden" name="id" value={unit.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Image & Status */}
                <div className="col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm">Görsel / Kat Planı</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <FormImageUpload name="image_url" defaultValue={unit.image_url} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm">Durum & Fiyat</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <div className="space-y-2">
                                <Label>Durum</Label>
                                <select name="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.status || 'For Sale'} key={unit.status} disabled={disabled}>
                                    <option value="For Sale">Satılık</option>
                                    <option value="Stock">Satılık (Stok)</option>
                                    <option value="Reserved">Rezerve (Opsiyonlu)</option>
                                    <option value="Sold">Satıldı</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Liste Fiyatı</Label>
                                <div className="flex gap-2">
                                    <Input name="price" type="number" defaultValue={unit.price} className="flex-1" disabled={disabled} />
                                    <select name="currency" className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.currency} disabled={disabled}>
                                        <option value="TRY">TRY</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>KDV Oranı (%)</Label>
                                <Input name="kdv_rate" type="number" defaultValue={unit.kdv_rate} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max. İskonto Oranı (%)</Label>
                                <Input name="max_discount_rate" type="number" step="0.1" defaultValue={unit.max_discount_rate} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-base flex items-center gap-2"><Home className="w-4 h-4" /> Temel Özellikler</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Kapı No (Daire No)</Label>
                                <Input name="unit_number" defaultValue={unit.unit_number} />
                            </div>
                            <div className="space-y-2">
                                <Label>Ünite Türü</Label>
                                <select name="unit_category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.unit_category}>
                                    <option value="">Seçiniz</option>
                                    {UNIT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Oda Tipi</Label>
                                <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.type}>
                                    <option value="1+1">1+1</option>
                                    <option value="2+1">2+1</option>
                                    <option value="3+1">3+1</option>
                                    <option value="4+1">4+1</option>
                                    <option value="Villa">Villa</option>
                                    <option value="Commercial">Ticari</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kat</Label>
                                <Input name="floor" type="number" defaultValue={unit.floor} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cephe</Label>
                                <Input name="direction" defaultValue={unit.direction} placeholder="Kuzey, Güney..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Manzara</Label>
                                <Input name="view" defaultValue={unit.view} placeholder="Deniz, Doğa, Şehir..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Blok</Label>
                                <Input name="block" defaultValue={unit.block} placeholder="A Blok, B Blok..." />
                            </div>

                            {/* New Fields */}
                            <div className="space-y-2">
                                <Label>Balkon Sayısı</Label>
                                <Input name="balcony_count" type="number" defaultValue={unit.balcony_count ?? 0} />
                            </div>
                            <div className="space-y-2">
                                <Label>Banyo Sayısı</Label>
                                <Input name="bathroom_count" type="number" defaultValue={unit.bathroom_count ?? 1} />
                            </div>
                            <div className="space-y-2">
                                <Label>Otopark</Label>
                                <select name="parking_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.parking_type}>
                                    <option value="">Seçiniz...</option>
                                    <option value="Kapalı Otopark">🅿️ Var, Kapalı</option>
                                    <option value="Açık Otopark">🅿️ Var, Açık</option>
                                    <option value="Yok">❌ Yok</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Isıtma</Label>
                                <select name="heating_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.heating_type}>
                                    <option value="">Seçiniz...</option>
                                    <option value="Kombi">🔥 Kombi</option>
                                    <option value="Kombi Yerden Isıtma">🔥 Kombi Yerden</option>
                                    <option value="Merkezi Sistem">🏢 Merkezi</option>
                                    <option value="Merkezi Sistem Yerden Isıtma">🏢 Merkezi Yerden</option>
                                    <option value="Klima">❄️ Klima</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mutfak Tipi</Label>
                                <select name="kitchen_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.kitchen_type}>
                                    <option value="">Seçiniz...</option>
                                    <option value="Kapalı Mutfak">🚪 Kapalı</option>
                                    <option value="Açık Mutfak">🍳 Açık</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ankastre Mutfak</Label>
                                <select name="has_builtin_kitchen" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.has_builtin_kitchen?.toString() || 'false'}>
                                    <option value="false">❌ Yok</option>
                                    <option value="true">✅ Var</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Ebeveyn Banyosu</Label>
                                <select name="has_master_bathroom" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={unit.has_master_bathroom?.toString() || 'false'}>
                                    <option value="false">❌ Yok</option>
                                    <option value="true">✅ Var</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-base flex items-center gap-2"><Ruler className="w-4 h-4" /> Metraj Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Brüt m²</Label>
                                <Input name="area_gross" type="number" step="0.01" defaultValue={unit.area_gross} />
                            </div>
                            <div className="space-y-2">
                                <Label>Net m²</Label>
                                <Input name="area_net" type="number" step="0.01" defaultValue={unit.area_net} />
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-base">Özellikler & Açıklama</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {UNIT_FEATURES.map((item) => {
                                    const isChecked = selectedFeatures.includes(item)
                                    return (
                                        <div key={item} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`feature-${item}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => toggleFeature(item, checked as boolean)}
                                            />
                                            <Label htmlFor={`feature-${item}`} className="text-sm font-normal cursor-pointer">
                                                {item}
                                            </Label>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Room Areas */}
                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-sm font-semibold">Oda Alanları</Label>
                                <RoomAreasInput defaultValue={unit.room_areas || []} />
                            </div>

                            <div className="space-y-2">
                                <Label>Açıklama / Notlar</Label>
                                <Textarea name="description" defaultValue={unit.description} rows={4} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end mt-6 mb-10">
                <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700" disabled={loading || disabled}>
                    {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </form>
    )
}
