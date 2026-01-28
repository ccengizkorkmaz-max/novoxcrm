'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Layers, Info, Loader2 } from 'lucide-react'
import { addCommissionTier, deleteCommissionTier } from '@/app/broker/actions'
import { toast } from 'sonner'

interface Tier {
    id: string
    min_units: number
    max_units: number | null
    commission_value: number
}

export default function TierManager({ modelId, initialTiers, isTiered, modelType, currency }: { modelId: string, initialTiers: Tier[], isTiered: boolean, modelType: string, currency: string }) {
    const [tiers, setTiers] = useState<Tier[]>(initialTiers)
    const [loading, setLoading] = useState(false)
    const [newTier, setNewTier] = useState({
        min_units: 0,
        max_units: null as number | null,
        commission_value: 0
    })

    const isPercentage = modelType.includes('%') || modelType === 'Tiered' // Tiered implies % usually

    async function handleAddTier() {
        if (isPercentage && newTier.commission_value > 100) {
            toast.error('Yüzdelik oran 100\'den büyük olamaz.')
            return
        }
        if (newTier.commission_value < 0) {
            toast.error('Değer negatif olamaz.')
            return
        }

        setLoading(true)
        const result = await addCommissionTier({
            model_id: modelId,
            ...newTier
        })

        if (result.success) {
            toast.success('Kademe eklendi.')
            // Refresh would happen via revalidatePath but local update for UX
            window.location.reload()
        } else {
            toast.error(result.error || 'Bir hata oluştu.')
        }
        setLoading(false)
    }

    async function handleDeleteTier(tierId: string) {
        if (!confirm('Bu kademeyi silmek istediğinize emin misiniz?')) return

        const result = await deleteCommissionTier(tierId, modelId)
        if (result.success) {
            toast.success('Kademe silindi.')
            window.location.reload()
        } else {
            toast.error(result.error || 'Silinemedi.')
        }
    }

    if (!isTiered) {
        return (
            <Card className="bg-slate-50 border-dashed">
                <CardContent className="py-12 text-center">
                    <Layers className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">Bu model kademeli (tiered) bir yapı kullanmıyor.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-purple-600" />
                    Komisyon Kademeleri (Tiers)
                </CardTitle>
                <CardDescription>Satış adetlerine göre otomatik uygulanacak oranları belirleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                    <div className="space-y-2 col-span-1">
                        <Label>Min. Satış</Label>
                        <Input
                            type="number"
                            value={newTier.min_units}
                            onChange={(e) => setNewTier({ ...newTier, min_units: e.target.value ? parseInt(e.target.value) : 0 })}
                        />
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label>Max. Satış (Opsiyonel)</Label>
                        <Input
                            type="number"
                            placeholder="∞"
                            value={newTier.max_units || ''}
                            onChange={(e) => setNewTier({ ...newTier, max_units: e.target.value ? parseInt(e.target.value) : null })}
                        />
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label>Oran/Değer ({isPercentage ? '%' : currency})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={newTier.commission_value}
                            onChange={(e) => setNewTier({ ...newTier, commission_value: e.target.value ? parseFloat(e.target.value) : 0 })}
                        />
                    </div>
                    <Button onClick={handleAddTier} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Ekle
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-2 text-left">Min Satış</th>
                                <th className="px-4 py-2 text-left">Max Satış</th>
                                <th className="px-4 py-2 text-left">Komisyon {isPercentage ? 'Oranı' : 'Tutarı'}</th>
                                <th className="px-4 py-2 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tiers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                                        Henüz bir kademe tanımlanmadı.
                                    </td>
                                </tr>
                            ) : (
                                tiers.map((tier) => (
                                    <tr key={tier.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2 font-medium">{tier.min_units}</td>
                                        <td className="px-4 py-2">{tier.max_units || '∞'}</td>
                                        <td className="px-4 py-2 font-bold text-purple-600">
                                            {isPercentage ? `%${tier.commission_value}` : `${tier.commission_value.toLocaleString('tr-TR')} ${currency}`}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 h-8 w-8"
                                                onClick={() => handleDeleteTier(tier.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex gap-2 p-3 bg-blue-50 rounded-md border border-blue-100 text-xs text-blue-800">
                    <Info className="h-4 w-4 shrink-0" />
                    <p>Sistem, satış yapıldığında broker'ın ilgili projedeki toplam başarılı satış adedini kontrol ederek en uygun kademeyi otomatik seçer.</p>
                </div>
            </CardContent>
        </Card>
    )
}
