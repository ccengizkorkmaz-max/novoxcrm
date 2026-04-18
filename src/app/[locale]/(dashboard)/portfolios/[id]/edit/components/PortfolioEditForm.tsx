'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import {
    updatePortfolio, uploadPortfolioImage, deletePortfolioImage, setCoverImage
} from '../../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Save, Home, MapPin, User, FileText, Image as ImageIcon,
    Upload, Trash2, Star, X, Loader2
} from 'lucide-react'

interface Props {
    portfolio: any
    agents: any[]
    userRole: string
}

export function PortfolioEditForm({ portfolio, agents, userRole }: Props) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [images, setImages] = useState<any[]>(
        portfolio.portfolio_images?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    )
    const p = portfolio

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            const formData = new FormData(e.currentTarget)
            await updatePortfolio(p.id, formData)
            toast.success('Portföy güncellendi!')
            router.push(`/portfolios/${p.id}`)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Güncelleme başarısız')
        } finally {
            setSaving(false)
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`${file.name} 10MB'dan büyük`)
                    continue
                }

                const reader = new FileReader()
                await new Promise<void>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64 = reader.result as string
                            const isCover = images.length === 0 && i === 0
                            const newImage = await uploadPortfolioImage(p.id, base64, file.name, isCover)
                            setImages(prev => [...prev, newImage])
                            toast.success(`${file.name} yüklendi`)
                            resolve()
                        } catch (err: any) {
                            toast.error(`${file.name}: ${err.message}`)
                            resolve()
                        }
                    }
                    reader.onerror = () => reject(reader.error)
                    reader.readAsDataURL(file)
                })
            }
            router.refresh()
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleDeleteImage(imageId: string) {
        if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return
        try {
            await deletePortfolioImage(imageId, p.id)
            setImages(prev => prev.filter(img => img.id !== imageId))
            toast.success('Görsel silindi')
        } catch {
            toast.error('Silme başarısız')
        }
    }

    async function handleSetCover(imageId: string) {
        try {
            await setCoverImage(imageId, p.id)
            setImages(prev => prev.map(img => ({ ...img, is_cover: img.id === imageId })))
            toast.success('Kapak görseli güncellendi')
        } catch {
            toast.error('Güncelleme başarısız')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href={`/portfolios/${p.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Portföy Düzenle</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.title}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                        <TabsTrigger value="basic" className="text-xs gap-1.5">
                            <Home className="h-3.5 w-3.5" /> Temel
                        </TabsTrigger>
                        <TabsTrigger value="location" className="text-xs gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> Konum
                        </TabsTrigger>
                        <TabsTrigger value="owner" className="text-xs gap-1.5">
                            <User className="h-3.5 w-3.5" /> Ev Sahibi
                        </TabsTrigger>
                        <TabsTrigger value="images" className="text-xs gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5" /> Görseller
                            {images.length > 0 && (
                                <Badge className="ml-1 h-4 px-1 text-[9px] bg-blue-100 text-blue-700 border-none">{images.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="details" className="text-xs gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Detay
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: TEMEL */}
                    <TabsContent value="basic">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50">
                                <CardTitle className="text-sm font-bold">Temel Bilgiler</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Portföy Başlığı *</Label>
                                    <Input name="title" required defaultValue={p.title} className="h-10" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">İlan Türü</Label>
                                        <select name="listing_type" defaultValue={p.listing_type} className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                            <option value="sale">Satılık</option>
                                            <option value="rent">Kiralık</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Mülk Tipi</Label>
                                        <select name="property_type" defaultValue={p.property_type} className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                            <option value="apartment">Daire</option>
                                            <option value="villa">Villa</option>
                                            <option value="land">Arsa</option>
                                            <option value="commercial">Ticari</option>
                                            <option value="office">Ofis</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Oda Sayısı</Label>
                                        <Input name="room_count" defaultValue={p.room_count || ''} placeholder="3+1" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Brüt m²</Label>
                                        <Input name="area_gross" type="number" defaultValue={p.area_gross || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Net m²</Label>
                                        <Input name="area_net" type="number" defaultValue={p.area_net || ''} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Bulunduğu Kat</Label>
                                        <Input name="floor_number" type="number" defaultValue={p.floor_number ?? ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Toplam Kat</Label>
                                        <Input name="total_floors" type="number" defaultValue={p.total_floors ?? ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Bina Yaşı</Label>
                                        <Input name="building_age" type="number" defaultValue={p.building_age ?? ''} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Fiyat</Label>
                                        <Input name="price" type="number" defaultValue={p.price || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Para Birimi</Label>
                                        <select name="currency" defaultValue={p.currency} className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                            <option value="TRY">₺ TRY</option>
                                            <option value="USD">$ USD</option>
                                            <option value="EUR">€ EUR</option>
                                            <option value="GBP">£ GBP</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="price_negotiable" value="true" defaultChecked={p.price_negotiable} className="rounded" />
                                    <Label className="text-xs">Fiyat Pazarlığa Açık</Label>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 2: KONUM */}
                    <TabsContent value="location">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50">
                                <CardTitle className="text-sm font-bold">Konum Bilgileri</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">İl</Label>
                                        <Input name="city" defaultValue={p.city || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">İlçe</Label>
                                        <Input name="district" defaultValue={p.district || ''} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Mahalle</Label>
                                    <Input name="neighborhood" defaultValue={p.neighborhood || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Adres</Label>
                                    <Input name="address" defaultValue={p.address || ''} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 3: EV SAHİBİ */}
                    <TabsContent value="owner">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50">
                                <CardTitle className="text-sm font-bold">Ev Sahibi & Yetkilendirme</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Ev Sahibi Adı</Label>
                                        <Input name="owner_name" defaultValue={p.owner_name || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Telefon</Label>
                                        <Input name="owner_phone" defaultValue={p.owner_phone || ''} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">E-posta</Label>
                                    <Input name="owner_email" type="email" defaultValue={p.owner_email || ''} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Yetki Türü</Label>
                                        <select name="authorization_type" defaultValue={p.authorization_type} className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                            <option value="exclusive">Münhasır</option>
                                            <option value="open">Açık Yetki</option>
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Yetki Başlangıç</Label>
                                        <Input name="authorization_start" type="date" defaultValue={p.authorization_start || ''} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-bold">Yetki Bitiş</Label>
                                        <Input name="authorization_end" type="date" defaultValue={p.authorization_end || ''} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: GÖRSELLER */}
                    <TabsContent value="images">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50">
                                <CardTitle className="text-sm font-bold flex items-center justify-between">
                                    <span>Portföy Görselleri</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs gap-1.5"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                        {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {images.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {images.map((img: any) => (
                                            <div key={img.id} className="relative group rounded-xl overflow-hidden border shadow-sm aspect-[4/3]">
                                                <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
                                                {img.is_cover && (
                                                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white border-none text-[9px] gap-1">
                                                        <Star className="h-2.5 w-2.5" /> Kapak
                                                    </Badge>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                    {!img.is_cover && (
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="text-[10px] h-7 gap-1"
                                                            onClick={() => handleSetCover(img.id)}
                                                        >
                                                            <Star className="h-3 w-3" /> Kapak Yap
                                                        </Button>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="text-[10px] h-7 gap-1"
                                                        onClick={() => handleDeleteImage(img.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Sil
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-500">Görsel yüklemek için tıklayın</p>
                                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — Maks. 10MB</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 5: DETAY */}
                    <TabsContent value="details">
                        <Card className="border shadow-sm">
                            <CardHeader className="pb-3 bg-slate-50">
                                <CardTitle className="text-sm font-bold">Açıklama & Notlar</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">İlan Açıklaması (Herkese Açık)</Label>
                                    <textarea
                                        name="description"
                                        rows={6}
                                        defaultValue={p.description || ''}
                                        className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                        placeholder="Mülk hakkında detaylı açıklama..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Dahili Notlar (Sadece Ekibe Görünür)</Label>
                                    <textarea
                                        name="internal_notes"
                                        rows={4}
                                        defaultValue={p.internal_notes || ''}
                                        className="w-full px-3 py-2 rounded-lg border text-sm resize-none bg-amber-50"
                                        placeholder="Ev sahibi pazarlığa açık, anahtar ofiste vb..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Bar */}
                <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t mt-6 -mx-3 px-6 py-4 flex items-center justify-between">
                    <Link href={`/portfolios/${p.id}`}>
                        <Button type="button" variant="ghost">İptal</Button>
                    </Link>
                    <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
