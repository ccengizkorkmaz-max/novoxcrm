'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Home, Info, Loader2, AlertTriangle } from 'lucide-react'
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
import { addCommissionUnitRule, deleteCommissionUnitRule } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

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
    const router = useRouter()
    const [rules, setRules] = useState<UnitRule[]>(initialRules)
    const [loading, setLoading] = useState(false)
    const [ruleToDelete, setRuleToDelete] = useState<UnitRule | null>(null)
    const [newRule, setNewRule] = useState({
        property_type: '',
        commission_value: 0
    })
    const t = useTranslations('CommissionSettings')

    const isPercentage = modelType.includes('%')

    async function handleAddRule() {
        if (!newRule.property_type || !newRule.commission_value) {
            toast.error(t('unitRules.errors.required'))
            return
        }

        if (isPercentage && newRule.commission_value > 100) {
            toast.error(t('form.errors.percentage'))
            return
        }

        if (newRule.commission_value < 0) {
            toast.error(t('form.errors.negative'))
            return
        }

        setLoading(true)
        try {
            const result = await addCommissionUnitRule({
                model_id: modelId,
                ...newRule
            })

            if (result.success) {
                toast.success(t('unitRules.successAdd'))
                router.refresh()
            } else {
                toast.error(result.error || 'Bir hata oluştu.')
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteConfirm() {
        if (!ruleToDelete) return

        setLoading(true)
        try {
            const result = await deleteCommissionUnitRule(ruleToDelete.id, modelId)
            if (result.success) {
                toast.success(t('unitRules.successDelete'))
                router.refresh()
                setRuleToDelete(null)
            } else {
                toast.error(result.error || t('unitRules.errorDelete'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900 leading-none">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <Home className="h-5 w-5" />
                    </div>
                    {t('unitRules.title')}
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium ml-13">{t('unitRules.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-2 col-span-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('unitRules.unitType')}</Label>
                        <Select onValueChange={(val) => setNewRule({ ...newRule, property_type: val })}>
                            <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl focus:ring-blue-500 font-bold">
                                <SelectValue placeholder={t('form.select')} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                {PROPERTY_TYPES.map(type => (
                                    <SelectItem key={type} value={type} disabled={rules.some(r => r.property_type === type)} className="rounded-lg">
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 col-span-1">
                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('unitRules.rateValue')} ({isPercentage ? '%' : currency})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={newRule.commission_value}
                            onChange={(e) => setNewRule({ ...newRule, commission_value: parseFloat(e.target.value) })}
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-blue-500 font-black text-blue-600"
                        />
                    </div>
                    <Button onClick={handleAddRule} disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-100">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                        {t('unitRules.add')}
                    </Button>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('unitRules.table.type')}</th>
                                <th className="px-6 py-4 text-left font-black text-[10px] text-slate-400 uppercase tracking-widest">{isPercentage ? t('unitRules.table.commissionRate') : t('unitRules.table.commissionAmount')}</th>
                                <th className="px-6 py-4 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">{t('unitRules.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rules.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 bg-slate-50/20">
                                        <div className="flex flex-col items-center gap-2">
                                            <Home className="h-10 w-10 text-slate-200 mb-2" />
                                            <span className="font-bold tracking-tight italic">{t('unitRules.table.empty')}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-700">{rule.property_type}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-black px-3 py-1 rounded-lg">
                                                {isPercentage ? `%${rule.commission_value}` : `${rule.commission_value.toLocaleString('tr-TR')} ${currency}`}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-slate-300 h-9 w-9 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => setRuleToDelete(rule)}
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
                    <p className="leading-relaxed">{t('unitRules.info')}</p>
                </div>
            </CardContent>

            {/* Delete Confirmation */}
            <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t('unitRules.deleteConfirmTitle') || 'Kuralı Sil'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {t('unitRules.confirmDelete') || 'Bu komisyon kuralını silmek istediğinize emin misiniz?'}
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
