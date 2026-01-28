'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Home, Info, Loader2 } from 'lucide-react'
import { addCommissionUnitRule, deleteCommissionUnitRule } from '@/app/broker/actions'
import { toast } from 'sonner'

interface UnitRule {
    id: string
    property_type: string
    commission_value: number
}

const PROPERTY_TYPES = [
    '1+1', '1.5+1', '2+1', '2.5+1', '3+1', '3.5+1', '4+1', '4.5+1',
    '5+1', '6+1', 'Villa', 'Penthouse', 'Dublex', 'Ofis', 'Dükkan', 'Arazi'
]

export default function UnitRuleManager({ modelId, initialRules, modelType, currency }: { modelId: string, initialRules: UnitRule[], modelType: string, currency: string }) {
    const [rules, setRules] = useState<UnitRule[]>(initialRules)
    const [loading, setLoading] = useState(false)
    const [newRule, setNewRule] = useState({
        property_type: '',
        commission_value: 0
    })

    const isPercentage = modelType.includes('%')

    async function handleAddRule() {
        if (!newRule.property_type || !newRule.commission_value) {
            toast.error('Lütfen ünite tipi ve oran giriniz.')
            return
        }

        if (isPercentage && newRule.commission_value > 100) {
            toast.error('Yüzdelik oran 100\'den büyük olamaz.')
            return
        }

        if (newRule.commission_value < 0) {
            toast.error('Değer negatif olamaz.')
            return
        }

        setLoading(true)
        const result = await addCommissionUnitRule({
            model_id: modelId,
            ...newRule
        })

        if (result.success) {
            toast.success('Kural eklendi.')
            window.location.reload()
        } else {
            toast.error(result.error || 'Bir hata oluştu.')
        }
        setLoading(false)
    }

    async function handleDeleteRule(ruleId: string) {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return

        const result = await deleteCommissionUnitRule(ruleId, modelId)
        if (result.success) {
            toast.success('Kural silindi.')
            window.location.reload()
        } else {
            toast.error(result.error || 'Silinemedi.')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    Ünite Bazlı Komisyon Kuralları
                </CardTitle>
                <CardDescription>Ünite tiplerine göre özel komisyon oranları belirleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                    <div className="space-y-2 col-span-1">
                        <Label>Ünite Tipi</Label>
                        <Select onValueChange={(val) => setNewRule({ ...newRule, property_type: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                            <SelectContent>
                                {PROPERTY_TYPES.map(type => (
                                    <SelectItem key={type} value={type} disabled={rules.some(r => r.property_type === type)}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label>Oran/Değer ({isPercentage ? '%' : currency})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={newRule.commission_value}
                            onChange={(e) => setNewRule({ ...newRule, commission_value: parseFloat(e.target.value) })}
                        />
                    </div>
                    <Button onClick={handleAddRule} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Ekle
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-2 text-left">Ünite Tipi</th>
                                <th className="px-4 py-2 text-left">Komisyon {isPercentage ? 'Oranı' : 'Tutarı'}</th>
                                <th className="px-4 py-2 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rules.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                        Henüz bir kural tanımlanmadı.
                                    </td>
                                </tr>
                            ) : (
                                rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2 font-medium">{rule.property_type}</td>
                                        <td className="px-4 py-2 font-bold text-blue-600">
                                            {isPercentage ? `%${rule.commission_value}` : `${rule.commission_value.toLocaleString('tr-TR')} ${currency}`}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 h-8 w-8"
                                                onClick={() => handleDeleteRule(rule.id)}
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
                    <p>Burada tanımlanan kurallar, "Standart Oran" yerine geçer. Eğer satılan ünite tipi listede yoksa standart oran uygulanır.</p>
                </div>
            </CardContent>
        </Card>
    )
}
