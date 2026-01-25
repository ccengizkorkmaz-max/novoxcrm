'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createPaymentPlan, getPaymentPlan } from '../actions'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
    const [plan, setPlan] = useState<any[]>([])
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
        const down = price * (downPaymentRate / 100);
        let remaining = price - down;
        let totalInterim = 0;
        interims.forEach(p => { if (p.amount > 0) totalInterim += p.amount });
        remaining -= totalInterim;
        if (remaining < 0) {
            toast.error('Hata: Peşinat ve ara ödemeler toplam tutarı aşıyor!');
            setCalculating(false);
            return;
        }
        const monthly = remaining / months;
        const newPlan: any[] = [];
        newPlan.push({ description: 'Peşinat', payment_type: 'Down Payment', amount: down, due_date: startDate });
        let cur = new Date(startDate);
        for (let i = 1; i <= months; i++) {
            cur.setMonth(cur.getMonth() + 1);
            const d = cur.toISOString().split('T')[0];
            newPlan.push({ description: `${i}. Taksit`, payment_type: 'Installment', amount: monthly, due_date: d });
            const mids = interims.filter(p => p.month === i && p.amount > 0);
            mids.forEach(mi => {
                newPlan.push({ description: `Ara Ödeme (${i}. Ay)`, payment_type: 'Interim Payment', amount: mi.amount, due_date: d });
            });
        }
        setPlan(newPlan);
        setCalculating(false);
    }

    const handleSave = async () => {
        if (!plan.length) return
        await createPaymentPlan(saleId, plan, price, currency)
        toast.success('Ödeme planı ve satış tutarı kaydedildi!')
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
                    <Button onClick={calculatePlan} className="w-full transition-transform hover:scale-95 active:scale-95" variant="secondary" disabled={calculating} type="button">{calculating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hesaplanıyor...</>) : 'Yeniden Hesapla / Oluştur'}</Button>
                </div>
            </div>
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
