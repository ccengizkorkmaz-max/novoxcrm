'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createPaymentPlan, getPaymentPlan } from '../actions'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'

interface Props {
    saleId: string
    totalAmount?: number
    initialCurrency?: string
    onClose?: () => void
    templates?: any[]
    onSaveSuccess?: () => void
}

interface InterimPayment {
    month: number
    amount: number
}

export default function PaymentPlanCalculator({ saleId, totalAmount = 0, initialCurrency = 'TRY', onClose, templates = [], onSaveSuccess }: Props) {

    const [price, setPrice] = useState(totalAmount)
    const [currency, setCurrency] = useState(initialCurrency)
    const [downPaymentRate, setDownPaymentRate] = useState(25)
    const [months, setMonths] = useState(12)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

    const [interims, setInterims] = useState<InterimPayment[]>([])
    const [applyInterest, setApplyInterest] = useState(false)
    const [interestRate, setInterestRate] = useState(1.5)
    const [plan, setPlan] = useState<any[]>([])
    const [totals, setTotals] = useState({ interest: 0, grandTotal: 0 })
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false)

    useEffect(() => {
        loadPlan()
    }, [saleId])

    const loadPlan = async () => {
        setLoading(true)
        try {
            const existingPlan = await getPaymentPlan(saleId)
            if (existingPlan && existingPlan.payment_items) {
                setPlan(existingPlan.payment_items)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const addInterim = () => setInterims([...interims, { month: 6, amount: 0 }])
    const removeInterim = (i: number) => {
        const arr = [...interims]
        arr.splice(i, 1)
        setInterims(arr)
    }
    const updateInterim = (i: number, field: keyof InterimPayment, value: number) => {
        const arr = [...interims]
        arr[i] = { ...arr[i], [field]: value }
        setInterims(arr)
    }

    const applyTemplate = (id: string) => {
        const tmpl = templates?.find(t => t.id === id)
        if (!tmpl) return
        if (tmpl.down_payment_rate) setDownPaymentRate(Number(tmpl.down_payment_rate))
        if (tmpl.installment_count) setMonths(Number(tmpl.installment_count))
        if (Array.isArray(tmpl.interim_payment_structure)) {
            const newInts = tmpl.interim_payment_structure.map((i: any) => ({
                month: i.month,
                amount: Math.round(price * (i.rate / 100))
            }))
            setInterims(newInts)
        } else {
            setInterims([])
        }
    }

    const calculatePlan = async () => {
        setCalculating(true);

        const result = calculatePaymentSchedule({
            principal: price,
            downPaymentAmount: price * (downPaymentRate / 100),
            monthlyInterestRate: applyInterest ? interestRate : 0,
            installmentCount: months,
            startDate,
            currency,
            interimPayments: interims
        });

        if (result.principalAfterDown - interims.reduce((s, i) => s + i.amount, 0) < -0.01) {
            toast.error('Hata: Peşinat ve ara ödemeler toplam tutarı aşıyor!');
            setCalculating(false);
            return;
        }

        setPlan(result.items);
        setTotals({ interest: result.totalInterest, grandTotal: result.grandTotal });
        setCalculating(false);
    }

    const handleSave = async () => {
        if (!plan.length) return
        await createPaymentPlan(saleId, plan, totals.grandTotal || price, currency)
        toast.success('Ödeme planı ve satış tutarı (vade farkı dahil) kaydedildi!')
        if (onSaveSuccess) onSaveSuccess()
    }


    return (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
            {templates?.length && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                    <Label className="text-blue-900 mb-2 block">Şablon Kullan</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={e => applyTemplate(e.target.value)} defaultValue="">
                        <option value="" disabled>Seçiniz...</option>
                        {templates.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="grid grid-cols-1 gap-4 border p-4 rounded-md bg-muted/20">
                <div className="space-y-2">
                    <Label>Satış Bedeli</Label>
                    <div className="flex gap-2">
                        <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="flex-1" />
                        <select value={currency} onChange={e => setCurrency(e.target.value)} className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Peşinat Oranı (%)</Label>
                    <Input type="number" value={downPaymentRate} onChange={e => setDownPaymentRate(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>Taksit Sayısı (Ay)</Label>
                    <Input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-4 border-t pt-4 mt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm font-semibold">Vade Farkı Uygula</Label>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">İşlem tutarına aylık faiz ekler</span>
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
                            <Label>Aylık Faiz Oranı (%)</Label>
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
                <div className="col-span-2 space-y-2 border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                        <Label>Ara Ödemeler (Opsiyonel)</Label>
                        <Button variant="outline" size="sm" onClick={addInterim} type="button"><Plus className="h-4 w-4 mr-1" /> Ekle</Button>
                    </div>
                    {interims.map((int, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                            <div className="grid gap-1 flex-1">
                                <Label className="text-xs">Ay</Label>
                                <Input type="number" placeholder="Örn: 6" value={int.month} onChange={e => updateInterim(idx, 'month', Number(e.target.value))} />
                            </div>
                            <div className="grid gap-1 flex-1">
                                <Label className="text-xs">Tutar</Label>
                                <Input type="number" value={int.amount} onChange={e => updateInterim(idx, 'amount', Number(e.target.value))} />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeInterim(idx)} className="mb-0.5"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    ))}
                </div>
                <div className="col-span-2">
                    <Button onClick={calculatePlan} className="w-full transition-transform hover:scale-95 active:scale-95 shadow-md shadow-blue-900/10" variant="secondary" disabled={calculating} type="button">{calculating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hesaplanıyor...</>) : 'Yeniden Hesapla / Plan Oluştur'}</Button>
                </div>
            </div>

            {applyInterest && plan.length > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 backdrop-blur-sm animate-in zoom-in-95 duration-500">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-blue-600">Vade Farkı Toplamı</Label>
                        <p className="text-lg font-black text-blue-700">{totals.interest.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Genel Toplam (Faiz Dahil)</Label>
                        <p className="text-lg font-black text-slate-900">{totals.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            )}
            {loading ? (
                <div className="text-center py-4">Yükleniyor...</div>
            ) : plan.length ? (
                <div className="border rounded-md max-h-[300px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Tarih</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plan.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>{item.description}</TableCell>
                                    <TableCell>{new Date(item.due_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="text-right">{Number(item.amount).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">Henüz bir ödeme planı oluşturulmamış. Yukardaki formdan hesaplayabilirsiniz.</div>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Kapat</Button>
                <Button onClick={handleSave} disabled={plan.length === 0 || loading}>Planı Kaydet</Button>
            </div>
        </div>
    )
}
