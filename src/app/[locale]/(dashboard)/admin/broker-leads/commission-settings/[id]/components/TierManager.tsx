'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Layers, Info, Loader2, AlertTriangle } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { addCommissionTier, deleteCommissionTier } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"

interface Tier {
    id: string
    min_units: number
    max_units: number | null
    commission_value: number
}

export default function TierManager({ modelId, initialTiers, isTiered, modelType, currency }: { modelId: string, initialTiers: Tier[], isTiered: boolean, modelType: string, currency: string }) {
    const router = useRouter()
    const [tiers, setTiers] = useState<Tier[]>(initialTiers)
    const [loading, setLoading] = useState(false)
    const [tierToDelete, setTierToDelete] = useState<Tier | null>(null)
    const [newTier, setNewTier] = useState({
        min_units: 0,
        max_units: null as number | null,
        commission_value: 0
    })
    const t = useTranslations('CommissionSettings')

    const isPercentage = modelType.includes('%') || modelType === 'Tiered' // Tiered implies % usually

    async function handleAddTier() {
        if (isPercentage && newTier.commission_value > 100) {
            toast.error(t('form.errors.percentage'))
            return
        }
        if (newTier.commission_value < 0) {
            toast.error(t('form.errors.negative'))
            return
        }

        setLoading(true)
        try {
            const result = await addCommissionTier({
                model_id: modelId,
                ...newTier
            })

            if (result.success) {
                toast.success(t('tiers.successAdd'))
                router.refresh()
                // Keep local state or let server refresh
            } else {
                toast.error(result.error || 'Bir hata oluştu.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteConfirm() {
        if (!tierToDelete) return

        setLoading(true)
        try {
            const result = await deleteCommissionTier(tierToDelete.id, modelId)
            if (result.success) {
                toast.success(t('tiers.successDelete'))
                router.refresh()
                setTierToDelete(null)
            } else {
                toast.error(result.error || t('tiers.errorDelete'))
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isTiered) {
        return (
            <Card className="bg-slate-50 border-dashed border-2 rounded-2xl overflow-hidden">
                <CardContent className="py-20 text-center">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Layers className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">{t('tiers.notTiered')}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900 leading-none">
                    <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                        <Layers className="h-5 w-5" />
                    </div>
                    {t('tiers.title')}
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium ml-13">{t('tiers.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-2 col-span-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('tiers.minSales')}</Label>
                        <Input
                            type="number"
                            value={newTier.min_units}
                            onChange={(e) => setNewTier({ ...newTier, min_units: e.target.value ? parseInt(e.target.value) : 0 })}
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-purple-500 font-bold"
                        />
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('tiers.maxSales')}</Label>
                        <Input
                            type="number"
                            placeholder="∞"
                            value={newTier.max_units || ''}
                            onChange={(e) => setNewTier({ ...newTier, max_units: e.target.value ? parseInt(e.target.value) : null })}
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-purple-500 font-bold"
                        />
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('rateValue')} ({isPercentage ? '%' : currency})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={newTier.commission_value}
                            onChange={(e) => setNewTier({ ...newTier, commission_value: e.target.value ? parseFloat(e.target.value) : 0 })}
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-purple-500 font-black text-purple-600"
                        />
                    </div>
                    <Button onClick={handleAddTier} disabled={loading} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-100">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                        {t('tiers.add')}
                    </Button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('tiers.table.min')}</th>
                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('tiers.table.max')}</th>
                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">{isPercentage ? t('tiers.table.commissionRate') : t('tiers.table.commissionAmount')}</th>
                                <th className="px-6 py-4 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('tiers.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tiers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 bg-slate-50/20">
                                        <div className="flex flex-col items-center gap-2">
                                            <Layers className="h-10 w-10 text-slate-200 mb-2" />
                                            <span className="font-bold tracking-tight italic">{t('tiers.table.empty')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tiers.map((tier) => (
                                    <tr key={tier.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-700">{tier.min_units}</td>
                                        <td className="px-6 py-4 font-bold text-slate-500">{tier.max_units || '∞'}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-none font-black px-3 py-1 rounded-lg">
                                                {isPercentage ? `%${tier.commission_value}` : `${tier.commission_value.toLocaleString('tr-TR')} ${currency}`}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-300 h-9 w-9 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => setTierToDelete(tier)}
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

                <div className="flex gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-blue-700 font-medium">
                    <Info className="h-5 w-5 shrink-0 text-blue-400" />
                    <p className="leading-relaxed">{t('tiers.info')}</p>
                </div>
            </CardContent>

            {/* Delete Confirmation */}
            <AlertDialog open={!!tierToDelete} onOpenChange={(open) => !open && setTierToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t('tiers.deleteConfirmTitle') || 'Kademeyi Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {t('tiers.confirmDelete') || 'Bu komisyon kademesini silmek istediğinize emin misiniz?'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t('cancel') || 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="w-full sm:w-1/2 h-12 rounded-xl bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 text-white font-bold active:scale-95 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t('deleting') || 'Siliniyor...'}</span>
                                </div>
                            ) : (
                                t('deleteConfirmAction') || 'Evet, Sil'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
