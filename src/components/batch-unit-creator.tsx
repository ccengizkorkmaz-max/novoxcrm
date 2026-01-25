'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { RoomAreasInput } from "@/components/room-areas-input"

import { useRouter } from 'next/navigation'

interface BatchUnitCreatorProps {
    projectId: string
    action: (formData: FormData) => Promise<any>
}

const UNIT_CATEGORIES = [
    "Daire", "Depo", "Dükkan", "Ofis", "Villa",
    "Dubleks Daire", "Bahçe Dubleks Daire", "Çatı Dubleks Daire",
    "Roof Daire", "Loft Daire", "Penthouse", "Ticari Alan"
]

export function BatchUnitCreator({ projectId, action }: BatchUnitCreatorProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [roomAreas, setRoomAreas] = useState<any[]>([])
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        // Manually append room_areas if not present or empty
        if (roomAreas.length > 0) {
            formData.set('room_areas', JSON.stringify(roomAreas))
        }

        console.log('BatchUnitCreator room_areas (manual):', formData.get('room_areas'))

        const result = await action(formData)
        setLoading(false)

        if (result?.error) {
            console.error('Batch Create Error:', result.error)
            setError(result.error)
            return
        }

        setOpen(false)
        router.refresh()
        // Ensure we stay on the units tab and refresh logic works
        router.push(`/projects/${projectId}?tab=units`)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Ünite Ekle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Toplu Ünite Oluşturma</DialogTitle>
                    <DialogDescription>
                        Birden fazla üniteyi hızlıca sisteme ekleyin.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="project_id" value={projectId} />

                    <div className="py-4 space-y-6">
                        {/* Temel Bilgiler */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Temel Bilgiler</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit_category">Ünite Türü</Label>
                                    <select
                                        id="unit_category"
                                        name="unit_category"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {UNIT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Oda Tipi</Label>
                                    <select
                                        id="type"
                                        name="type"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="1+1">1+1</option>
                                        <option value="2+1">2+1</option>
                                        <option value="3+1">3+1</option>
                                        <option value="4+1">4+1</option>
                                        <option value="Villa">Villa</option>
                                        <option value="Commercial">Ticari</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="count">Adet</Label>
                                    <Input id="count" name="count" type="number" defaultValue="10" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="area_gross">Brüt Alan (m²)</Label>
                                    <Input id="area_gross" name="area_gross" type="number" step="0.01" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Liste Fiyatı</Label>
                                    <div className="flex gap-2">
                                        <Input id="price" name="price" type="number" required className="flex-1" />
                                        <select name="currency" className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="TRY">
                                            <option value="TRY">TRY</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_discount_rate">Max. İskonto (%)</Label>
                                    <Input id="max_discount_rate" name="max_discount_rate" type="number" step="0.1" defaultValue="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="block">Blok</Label>
                                    <Input id="block" name="block" defaultValue="A" placeholder="Örn: A" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_number">Başlangıç Numarası</Label>
                                    <Input id="start_number" name="start_number" type="number" defaultValue="1" />
                                </div>
                            </div>
                        </div>

                        {/* Özellikler */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-t pt-4">Ünite Özellikleri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parking_type">Otopark</Label>
                                    <select id="parking_type" name="parking_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="">Seçiniz...</option>
                                        <option value="Kapalı Otopark">🅿️ Var, Kapalı</option>
                                        <option value="Açık Otopark">🅿️ Var, Açık</option>
                                        <option value="Yok">❌ Yok</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="heating_type">Isıtma</Label>
                                    <select id="heating_type" name="heating_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="">Seçiniz...</option>
                                        <option value="Kombi">🔥 Kombi</option>
                                        <option value="Kombi Yerden Isıtma">🔥 Kombi Yerden</option>
                                        <option value="Merkezi Sistem">🏢 Merkezi</option>
                                        <option value="Merkezi Sistem Yerden Isıtma">🏢 Merkezi Yerden</option>
                                        <option value="Klima">❄️ Klima</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="direction">Cephe</Label>
                                    <select id="direction" name="direction" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="">Seçiniz...</option>
                                        <option value="Kuzey">⬆️ Kuzey</option>
                                        <option value="Güney">⬇️ Güney</option>
                                        <option value="Doğu">➡️ Doğu</option>
                                        <option value="Batı">⬅️ Batı</option>
                                        <option value="Kuzey Batı">↖️ Kuzey Batı</option>
                                        <option value="Kuzey Doğu">↗️ Kuzey Doğu</option>
                                        <option value="Güney Doğu">↘️ Güney Doğu</option>
                                        <option value="Güney Batı">↙️ Güney Batı</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kitchen_type">Mutfak Tipi</Label>
                                    <select id="kitchen_type" name="kitchen_type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="">Seçiniz...</option>
                                        <option value="Kapalı Mutfak">🚪 Kapalı</option>
                                        <option value="Açık Mutfak">🍳 Açık</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="has_builtin_kitchen">Ankastre Mutfak</Label>
                                    <select id="has_builtin_kitchen" name="has_builtin_kitchen" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="false">❌ Yok</option>
                                        <option value="true">✅ Var</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="has_master_bathroom">Ebeveyn Banyosu</Label>
                                    <select id="has_master_bathroom" name="has_master_bathroom" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm border-s-muted-foreground/20">
                                        <option value="false">❌ Yok</option>
                                        <option value="true">✅ Var</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Room Areas */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-t pt-4">Oda Dağılımı</h3>
                            <RoomAreasInput onValueChange={setRoomAreas} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Oluşturuluyor...' : 'Üniteleri Oluştur'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
