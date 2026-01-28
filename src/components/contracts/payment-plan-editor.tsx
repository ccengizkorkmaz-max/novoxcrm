'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'

interface PaymentPlanItem {
    payment_type: 'DownPayment' | 'Installment' | 'Balloon' | 'DeliveryPayment' | 'Other'
    due_date: string
    amount: number
    currency: string
    notes?: string
}

interface PaymentPlanEditorProps {
    totalAmount: number
    currency: string
    templates?: any[]
    onChange: (plan: PaymentPlanItem[]) => void
}

export function PaymentPlanEditor({ totalAmount, currency, templates = [], onChange }: PaymentPlanEditorProps) {
    const [plan, setPlan] = useState<PaymentPlanItem[]>([])

    // Generator State
    const [templateId, setTemplateId] = useState('manual')
    const [installments, setInstallments] = useState(12)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [downPayment, setDownPayment] = useState(0)
    const [applyInterest, setApplyInterest] = useState(false)
    const [interestRate, setInterestRate] = useState(1.5)

    // Multi-Balloon State
    const [balloons, setBalloons] = useState<{ id: string, amount: number, month: number }[]>([])

    const lastSentPlan = useRef<string>('')

    // Calculate remaining
    // Calculate remaining (relative to the original totalAmount)
    const currentTotal = plan.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const currentInterest = applyInterest ? plan.reduce((sum, item) => {
        // Find the difference if price was adjusted, or just track interest specifically.
        // For simplicity, we just use the calculated interest from the utility result if available.
        // But since the plan state might be modified manually, we'll calculate based on the delta from totalAmount.
        return sum; // Placeholder for now, improved below in totals
    }, 0) : 0;

    // We'll track the actual calculated totals from the generator
    const [totals, setTotals] = useState({ interest: 0, grandTotal: totalAmount });

    const remaining = totals.grandTotal - currentTotal

    useEffect(() => {
        const sortedPlan = [...plan].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        const planStr = JSON.stringify(sortedPlan)

        if (planStr !== lastSentPlan.current) {
            lastSentPlan.current = planStr
            onChange(sortedPlan)
        }
    }, [plan, onChange])

    const applyTemplate = (tid: string) => {
        setTemplateId(tid)
        if (tid === 'manual') {
            setDownPayment(0)
            setInstallments(12)
            setBalloons([])
            return
        }

        const template = templates.find(t => t.id === tid)
        if (!template) return

        const result = calculatePaymentSchedule({
            principal: totalAmount,
            downPaymentAmount: (totalAmount * (template.down_payment_rate || 0)) / 100,
            monthlyInterestRate: applyInterest ? interestRate : 0,
            installmentCount: template.installment_count || 12,
            startDate,
            currency,
            interimPayments: template.interim_payment_structure?.map((b: any) => ({
                month: b.month,
                amount: (totalAmount * b.rate) / 100
            })) || []
        });

        setPlan(result.items as any)
        setTotals({ interest: result.totalInterest, grandTotal: result.grandTotal })
        setInstallments(template.installment_count || 12)
        setDownPayment((totalAmount * (template.down_payment_rate || 0)) / 100)
    }

    const generatePlan = () => {
        const result = calculatePaymentSchedule({
            principal: totalAmount,
            downPaymentAmount: downPayment,
            monthlyInterestRate: applyInterest ? interestRate : 0,
            installmentCount: installments,
            startDate,
            currency,
            interimPayments: balloons.map(b => ({ month: b.month, amount: b.amount }))
        });

        setPlan(result.items as any)
        setTotals({ interest: result.totalInterest, grandTotal: result.grandTotal })
    }

    const addBalloonRow = () => {
        setBalloons([...balloons, { id: Math.random().toString(), amount: 0, month: 6 }])
    }

    const removeBalloonRow = (id: string) => {
        setBalloons(balloons.filter(b => b.id !== id))
    }

    const updateBalloonRow = (id: string, field: 'amount' | 'month', value: number) => {
        if (field === 'amount') {
            const otherBalloonsTotal = balloons.reduce((sum, b) => b.id === id ? sum : sum + (Number(b.amount) || 0), 0)
            const planTotal = plan.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            const maxAllowed = totalAmount - (otherBalloonsTotal + planTotal)
            value = Math.min(value, Math.max(0, maxAllowed))
        }
        setBalloons(balloons.map(b => b.id === id ? { ...b, [field]: value } : b))
    }

    const addRow = () => {
        setPlan([...plan, {
            payment_type: 'Installment',
            due_date: startDate,
            amount: 0,
            currency: currency
        }])
    }

    const removeRow = (index: number) => {
        const newPlan = [...plan]
        newPlan.splice(index, 1)
        setPlan(newPlan)
    }

    const updateRow = (index: number, field: keyof PaymentPlanItem, value: any) => {
        const newPlan = [...plan]

        if (field === 'amount' && typeof value === 'number') {
            // Calculate sum of other rows
            const otherRowsTotal = plan.reduce((sum, item, i) =>
                i === index ? sum : sum + (Number(item.amount) || 0), 0
            )
            const maxAllowed = totalAmount - otherRowsTotal
            value = Math.min(value, Math.max(0, maxAllowed))
        }

        newPlan[index] = { ...newPlan[index], [field]: value }
        setPlan(newPlan)
    }

    return (
        <div className="space-y-6 border rounded-lg p-4 bg-slate-50">
            <div className="space-y-4 border-b pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Ödeme Şablonu</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={templateId}
                            onChange={(e) => applyTemplate(e.target.value)}
                        >
                            <option value="manual">Manuel / Serbest</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-500">Başlangıç Tarihi</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 border rounded-md bg-white space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm font-semibold">Vade Farkı Uygula</Label>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Sözleşme tutarına aylık faiz ekler</span>
                        </div>
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 accent-blue-600"
                            checked={applyInterest}
                            onChange={e => setApplyInterest(e.target.checked)}
                        />
                    </div>
                    {applyInterest && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-xs font-bold uppercase text-slate-500">Aylık Faiz Oranı (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={interestRate}
                                onChange={e => setInterestRate(Number(e.target.value))}
                                className="border-blue-200 focus:border-blue-500 bg-blue-50/30"
                            />
                        </div>
                    )}
                </div>

                {templateId === 'manual' && (
                    <div className="space-y-4 p-4 border rounded-md bg-slate-100/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Peşinat Tutarı</Label>
                                <Input
                                    type="number"
                                    value={downPayment}
                                    onChange={(e) => setDownPayment(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Taksit Sayısı</Label>
                                <Input
                                    type="number"
                                    value={installments}
                                    onChange={(e) => setInstallments(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase text-slate-500">Ara Ödemeler</Label>
                                <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={addBalloonRow}>
                                    <Plus className="h-3 w-3 mr-1" /> Ara Ödeme Ekle
                                </Button>
                            </div>

                            {balloons.length === 0 && (
                                <p className="text-[10px] text-muted-foreground italic text-center py-2">Henüz ara ödeme eklenmedi</p>
                            )}

                            {balloons.map((b) => (
                                <div key={b.id} className="grid grid-cols-3 gap-2 items-end">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Tutar</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={b.amount}
                                            onChange={(e) => updateBalloonRow(b.id, 'amount', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Ay (Vade)</Label>
                                        <Input
                                            type="number"
                                            className="h-8 text-xs"
                                            value={b.month}
                                            onChange={(e) => updateBalloonRow(b.id, 'month', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex justify-end pb-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeBalloonRow(b.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={generatePlan} variant="default" className="shadow-sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {templateId === 'manual' ? 'Plan Oluştur' : 'Şablonu Uygula'}
                    </Button>
                </div>
            </div>

            {applyInterest && plan.length > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in zoom-in-95 duration-500">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-blue-600">Vade Farkı Tutarı</Label>
                        <p className="text-lg font-black text-blue-700">{totals.interest.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Ödenecek Toplam (Faiz Dahil)</Label>
                        <p className="text-lg font-black text-slate-900">{totals.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            )}

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tip</TableHead>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Tutar ({currency})</TableHead>
                            <TableHead>Not</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plan
                            .map((item, originalIdx) => ({ item, originalIdx }))
                            .sort((a, b) => new Date(a.item.due_date).getTime() - new Date(b.item.due_date).getTime())
                            .map(({ item, originalIdx }) => (
                                <TableRow key={originalIdx}>
                                    <TableCell>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                            value={item.payment_type}
                                            onChange={(e) => updateRow(originalIdx, 'payment_type', e.target.value)}
                                        >
                                            <option value="DownPayment">Peşinat</option>
                                            <option value="Installment">Taksit</option>
                                            <option value="Balloon">Ara Ödeme</option>
                                            <option value="DeliveryPayment">Teslim Ödemesi</option>
                                            <option value="Other">Diğer</option>
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            value={item.due_date}
                                            onChange={(e) => updateRow(originalIdx, 'due_date', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateRow(originalIdx, 'amount', Number(e.target.value))}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={item.notes || ''}
                                            onChange={(e) => updateRow(originalIdx, 'notes', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeRow(originalIdx)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-between items-center pt-2">
                <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" /> Satır Ekle
                </Button>
                <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">Kalan Tutar</div>
                    <div className={`text-lg font-bold ${Math.abs(remaining) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                        {remaining.toLocaleString('tr-TR', { style: 'currency', currency })}
                    </div>
                </div>
            </div>
        </div>
    )
}
