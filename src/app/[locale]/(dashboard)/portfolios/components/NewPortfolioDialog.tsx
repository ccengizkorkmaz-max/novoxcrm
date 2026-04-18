'use client'

import { useState } from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createPortfolio } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Building2, Home, TreePine, Store, Landmark, MapPin, User, Banknote, FileText, Sparkles } from 'lucide-react'

interface NewPortfolioDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewPortfolioDialog({ open, onOpenChange }: NewPortfolioDialogProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('basic')
    const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({})
    const [heatingType, setHeatingType] = useState('central')

    const AMENITIES = [
        { key: 'balcony', label: 'Balkon', emoji: '🏗️' },
        { key: 'elevator', label: 'Asansör', emoji: '🛗' },
        { key: 'parking_indoor', label: 'Kapalı Otopark', emoji: '🅿️' },
        { key: 'parking_outdoor', label: 'Açık Otopark', emoji: '🚗' },
        { key: 'security', label: 'Güvenlik', emoji: '🔒' },
        { key: 'pool', label: 'Yüzme Havuzu', emoji: '🏊' },
        { key: 'gym', label: 'Spor Salonu', emoji: '🏋️' },
        { key: 'generator', label: 'Jeneratör', emoji: '⚡' },
        { key: 'terrace', label: 'Teras', emoji: '☀️' },
        { key: 'garden', label: 'Bahçe', emoji: '🌳' },
        { key: 'sea_view', label: 'Deniz Manzarası', emoji: '🌊' },
        { key: 'city_view', label: 'Şehir Manzarası', emoji: '🏙️' },
        { key: 'furnished', label: 'Eşyalı', emoji: '🪑' },
        { key: 'air_conditioning', label: 'Klima', emoji: '❄️' },
        { key: 'fireplace', label: 'Şömine', emoji: '🔥' },
        { key: 'storage', label: 'Depo / Kiler', emoji: '📦' },
        { key: 'smart_home', label: 'Akıllı Ev', emoji: '🤖' },
        { key: 'fiber_internet', label: 'Fiber İnternet', emoji: '🌐' },
        { key: 'satellite', label: 'Uydu / Kablo TV', emoji: '📡' },
        { key: 'disabled_access', label: 'Engelli Erişimi', emoji: '♿' },
    ]

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)
            // Inject features as JSON
            const features = { ...selectedFeatures, heating: heatingType }
            formData.set('features', JSON.stringify(features))
            await createPortfolio(formData)
            toast.success('Portföy başarıyla oluşturuldu!')
            onOpenChange(false)
            setSelectedFeatures({})
            setHeatingType('central')
            setActiveTab('basic')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Portföy oluşturulamadı')
        } finally {
            setLoading(false)
        }
    }

    const propertyTypes = [
        { value: 'apartment', label: 'Daire', icon: Building2 },
        { value: 'villa', label: 'Villa', icon: Home },
        { value: 'land', label: 'Arsa', icon: TreePine },
        { value: 'commercial', label: 'Ticari', icon: Store },
        { value: 'office', label: 'Ofis', icon: Landmark },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                        Yeni Portföy Ekle
                    </DialogTitle>
                    <DialogDescription>
                        Gayrimenkul portföyüne yeni bir mülk kaydı oluşturun.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                            <TabsTrigger value="basic" className="text-xs gap-1.5">
                                <Home className="h-3.5 w-3.5" /> Temel
                            </TabsTrigger>
                            <TabsTrigger value="location" className="text-xs gap-1.5">
                                <MapPin className="h-3.5 w-3.5" /> Konum
                            </TabsTrigger>
                            <TabsTrigger value="features" className="text-xs gap-1.5">
                                <Sparkles className="h-3.5 w-3.5" /> Özellikler
                            </TabsTrigger>
                            <TabsTrigger value="owner" className="text-xs gap-1.5">
                                <User className="h-3.5 w-3.5" /> Ev Sahibi
                            </TabsTrigger>
                            <TabsTrigger value="details" className="text-xs gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> Detay
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: TEMEL BİLGİLER */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="text-xs font-bold">Portföy Başlığı *</Label>
                                <Input id="title" name="title" required placeholder="Örn: Beşiktaş'ta Deniz Manzaralı 3+1" className="h-10" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">İlan Türü</Label>
                                    <select name="listing_type" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="sale">Satılık</option>
                                        <option value="rent">Kiralık</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Mülk Tipi</Label>
                                    <select name="property_type" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        {propertyTypes.map(pt => (
                                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="room_count" className="text-xs font-bold">Oda Sayısı</Label>
                                    <Input id="room_count" name="room_count" placeholder="3+1" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="area_gross" className="text-xs font-bold">Brüt m²</Label>
                                    <Input id="area_gross" name="area_gross" type="number" placeholder="120" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="area_net" className="text-xs font-bold">Net m²</Label>
                                    <Input id="area_net" name="area_net" type="number" placeholder="100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="floor_number" className="text-xs font-bold">Bulunduğu Kat</Label>
                                    <Input id="floor_number" name="floor_number" type="number" placeholder="5" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="total_floors" className="text-xs font-bold">Toplam Kat</Label>
                                    <Input id="total_floors" name="total_floors" type="number" placeholder="10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="building_age" className="text-xs font-bold">Bina Yaşı</Label>
                                    <Input id="building_age" name="building_age" type="number" placeholder="5" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="price" className="text-xs font-bold">Fiyat</Label>
                                    <Input id="price" name="price" type="number" placeholder="3500000" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency" className="text-xs font-bold">Para Birimi</Label>
                                    <select name="currency" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="TRY">₺ TRY</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                    </select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 2: KONUM */}
                        <TabsContent value="location" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city" className="text-xs font-bold">İl</Label>
                                    <Input id="city" name="city" placeholder="İstanbul" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="district" className="text-xs font-bold">İlçe</Label>
                                    <Input id="district" name="district" placeholder="Beşiktaş" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="neighborhood" className="text-xs font-bold">Mahalle</Label>
                                <Input id="neighborhood" name="neighborhood" placeholder="Levent Mah." />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address" className="text-xs font-bold">Adres</Label>
                                <Input id="address" name="address" placeholder="Tam adres bilgisi (opsiyonel)" />
                            </div>
                            <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center text-sm text-muted-foreground border border-dashed">
                                <MapPin className="h-5 w-5 mr-2" />
                                Harita entegrasyonu yakında eklenecek
                            </div>
                        </TabsContent>

                        {/* TAB 3: ÖZELLİKLER (AMENITIES) */}
                        <TabsContent value="features" className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Isıtma Türü</Label>
                                <select
                                    value={heatingType}
                                    onChange={(e) => setHeatingType(e.target.value)}
                                    className="h-10 px-3 rounded-lg border text-sm bg-white w-full"
                                >
                                    <option value="central">Merkezi Sistem</option>
                                    <option value="combi">Kombi (Bireysel)</option>
                                    <option value="floor">Yerden Isıtma</option>
                                    <option value="stove">Soba</option>
                                    <option value="ac">Klima (Isıtma/Soğutma)</option>
                                    <option value="none">Isıtma Yok</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Mülk Özellikleri</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AMENITIES.map((a) => (
                                        <label
                                            key={a.key}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                                selectedFeatures[a.key]
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                                                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!!selectedFeatures[a.key]}
                                                onChange={(e) => setSelectedFeatures(prev => ({ ...prev, [a.key]: e.target.checked }))}
                                                className="sr-only"
                                            />
                                            <span className="text-base">{a.emoji}</span>
                                            <span className="text-xs">{a.label}</span>
                                            {selectedFeatures[a.key] && <span className="ml-auto text-emerald-600">✓</span>}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 4: EV SAHİBİ */}
                        <TabsContent value="owner" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="owner_name" className="text-xs font-bold">Ev Sahibi Adı</Label>
                                <Input id="owner_name" name="owner_name" placeholder="Ad Soyad" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="owner_phone" className="text-xs font-bold">Ev Sahibi Telefon</Label>
                                <Input id="owner_phone" name="owner_phone" placeholder="+90 5XX XXX XX XX" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="authorization_type" className="text-xs font-bold">Yetki Türü</Label>
                                    <select name="authorization_type" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="exclusive">Münhasır (Exclusive)</option>
                                        <option value="open">Açık Yetki</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="authorization_start" className="text-xs font-bold">Yetki Başlangıç</Label>
                                    <Input id="authorization_start" name="authorization_start" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="authorization_end" className="text-xs font-bold">Yetki Bitiş</Label>
                                    <Input id="authorization_end" name="authorization_end" type="date" />
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB 4: DETAY / AÇIKLAMA */}
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-xs font-bold">İlan Açıklaması</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={6}
                                    placeholder="Mülk hakkında detaylı açıklama yazın..."
                                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                            İptal
                        </Button>
                        <div className="flex gap-2">
                            {activeTab !== 'basic' && (
                                <Button type="button" variant="outline" onClick={() => {
                                    const tabs = ['basic', 'location', 'features', 'owner', 'details']
                                    const idx = tabs.indexOf(activeTab)
                                    if (idx > 0) setActiveTab(tabs[idx - 1])
                                }}>
                                    Geri
                                </Button>
                            )}
                            {activeTab !== 'details' ? (
                                <Button type="button" onClick={() => {
                                    const tabs = ['basic', 'location', 'features', 'owner', 'details']
                                    const idx = tabs.indexOf(activeTab)
                                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1])
                                }}>
                                    İleri
                                </Button>
                            ) : (
                                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
                                    {loading ? 'Kaydediliyor...' : 'Portföyü Kaydet'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
