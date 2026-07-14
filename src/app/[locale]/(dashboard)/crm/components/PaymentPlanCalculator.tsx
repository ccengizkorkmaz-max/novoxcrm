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
    onConfirm?: (plan: any[], totals: { interest: number, grandTotal: number }, currency: string) => void
    confirmButtonText?: string
    disablePriceEdit?: boolean
    children?: React.ReactNode
    rightHeader?: React.ReactNode
    isWide?: boolean
}

interface InterimPayment {
    month: number
    amount: number
}

export default function PaymentPlanCalculator({ 
    saleId, 
    totalAmount = 0, 
    initialCurrency = 'TRY', 
    onClose, 
    templates = [], 
    onSaveSuccess, 
    onConfirm, 
    confirmButtonText,
    disablePriceEdit = false,
    children,
    rightHeader,
    isWide = false
}: Props) {

    const [price, setPrice] = useState(totalAmount)
    const [currency, setCurrency] = useState(initialCurrency)
    const [downPaymentRate, setDownPaymentRate] = useState<number | string>(25)
    const [months, setMonths] = useState<number | string>(12)
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

    useEffect(() => {
        setPrice(totalAmount)
    }, [totalAmount])

    useEffect(() => {
        setCurrency(initialCurrency)
    }, [initialCurrency])

    const [interims, setInterims] = useState<InterimPayment[]>([])
    const [applyInterest, setApplyInterest] = useState(false)
    const [interestRate, setInterestRate] = useState<number | string>(1.5)
    const [plan, setPlan] = useState<any[]>([])
    const [totals, setTotals] = useState({ interest: 0, grandTotal: 0 })
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false)
    const [displayPrice, setDisplayPrice] = useState('')
    const [localeStr, setLocaleStr] = useState('tr-TR')
    const [installmentStartRule, setInstallmentStartRule] = useState<'None' | 'NextMonth15th'>('NextMonth15th')

    useEffect(() => {
        loadPlan()
    }, [saleId])

    const loadPlan = async () => {
        setLoading(true)
        try {
            const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
            const supabase = createBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tenants(country, installment_start_rule)')
                    .eq('id', user.id)
                    .single()
                
                const country = (profile as any)?.tenants?.country || 'Türkiye'
                const rule = (profile as any)?.tenants?.installment_start_rule || 'NextMonth15th'
                
                const locale = country === 'USA' ? 'en-US' : country === 'UK' ? 'en-GB' : country === 'Germany' ? 'de-DE' : 'tr-TR'
                setLocaleStr(locale)
                setInstallmentStartRule(rule)
            }

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

    useEffect(() => {
        setDisplayPrice(new Intl.NumberFormat(localeStr, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price))
    }, [price, localeStr])

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        if (val === '') {
            setPrice(0)
            setDisplayPrice('')
            return
        }
        const num = Number(val)
        setPrice(num)
        setDisplayPrice(new Intl.NumberFormat(localeStr, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num))
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
        if (tmpl.down_payment_rate) setDownPaymentRate(Number(tmpl.down_payment_rate) || 0)
        if (tmpl.installment_count) setMonths(Number(tmpl.installment_count) || 0)
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
            downPaymentAmount: price * (Number(downPaymentRate) / 100),
            monthlyInterestRate: applyInterest ? Number(interestRate) : 0,
            installmentCount: Number(months),
            startDate,
            currency,
            interimPayments: interims,
            installmentStartRule
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

        if (onConfirm) {
            onConfirm(plan, totals, currency)
            return
        }

        try {
            const result = await createPaymentPlan(saleId, plan, totals.grandTotal || price, currency)
            if (result?.error) {
                toast.error(`Kaydetme hatası: ${result.error}`)
                return
            }
            toast.success('Ödeme planı ve satış tutarı (vade farkı dahil) kaydedildi!')
            if (onSaveSuccess) onSaveSuccess()
        } catch (e: any) {
            console.error(e)
            toast.error('Beklenmedik bir hata oluştu')
        }
    }


    if (isWide) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch min-h-0">
                {/* Left Column: Inputs & Setup */}
                <div className="lg:col-span-5 flex flex-col h-full min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-4">
                        {children}
                        
                        {templates?.length ? (
                            <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                                <Label className="text-[10px] font-bold text-blue-400 mb-2 block uppercase tracking-widest text-center">Şablon Kullanarak Hızlan</Label>
                                <select
                                    className="flex h-10 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                                    onChange={e => applyTemplate(e.target.value)}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Bir şablon seçin...</option>
                                    {templates.map((t: any) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-2 gap-x-3 gap-y-4 border p-4 rounded-xl bg-white shadow-sm border-slate-200">
                            {/* Row 1: Price and Currency */}
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Satış Bedeli ve Para Birimi</Label>
                                <div className="flex gap-1.5">
                                    <Input
                                        type="text"
                                        value={displayPrice}
                                        onChange={handlePriceChange}
                                        placeholder="0,00"
                                        disabled={disablePriceEdit}
                                        className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 flex-1 disabled:opacity-75 disabled:bg-slate-50"
                                    />
                                    <select
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        disabled={disablePriceEdit}
                                        className="flex h-10 w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-75 disabled:bg-slate-50"
                                    >
                                        <option value="TRY">TRY</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Down Payment and Installments */}
                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peşinat (%)</Label>
                                <Input
                                    type="number"
                                    value={downPaymentRate}
                                    onChange={e => setDownPaymentRate(e.target.value)}
                                    className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                                />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taksit (Ay)</Label>
                                <Input
                                    type="number"
                                    value={months}
                                    onChange={e => setMonths(e.target.value)}
                                    className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                                />
                            </div>

                            {/* Date Row */}
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                                />
                            </div>
                            <div className="col-span-2 space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                                    <div className="flex flex-col gap-0.5">
                                        <Label className="text-xs font-bold text-slate-700">Vade Farkı Uygula</Label>
                                        <span className="text-[9px] text-slate-400 font-medium leading-none uppercase tracking-tighter">İşlem tutarına aylık faiz ekler</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={applyInterest}
                                        onChange={e => setApplyInterest(e.target.checked)}
                                    />
                                </div>

                                {applyInterest && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Aylık Faiz Oranı (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={interestRate}
                                            onChange={e => setInterestRate(e.target.value)}
                                            className="h-10 border-blue-200 focus:border-blue-500 bg-blue-50/30 text-sm font-bold text-blue-700"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2 space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ara Ödemeler (Opsiyonel)</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={addInterim}
                                        type="button"
                                        className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-widest"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Ekle
                                    </Button>
                                </div>
                                {interims.length > 0 && (
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                        {interims.map((int, idx) => (
                                            <div key={idx} className="flex gap-2 items-end bg-slate-50/50 p-2 rounded-lg border border-slate-100 animate-in slide-in-from-left-2 duration-200">
                                                <div className="grid gap-1 flex-1">
                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Ay</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="6"
                                                        value={int.month?.toString() || ""}
                                                        onChange={e => updateInterim(idx, 'month', Number(e.target.value) || 0)}
                                                        className="h-8 text-xs border-slate-200"
                                                    />
                                                </div>
                                                <div className="grid gap-1 flex-[2]">
                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Tutar</Label>
                                                    <Input
                                                        type="number"
                                                        value={int.amount?.toString() || ""}
                                                        onChange={e => updateInterim(idx, 'amount', Number(e.target.value) || 0)}
                                                        className="h-8 text-xs border-slate-200 font-semibold"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeInterim(idx)}
                                                    className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2">
                                <Button
                                    onClick={calculatePlan}
                                    className="w-full h-11 transition-all hover:scale-[0.98] active:scale-95 shadow-md shadow-slate-900/5 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                                    disabled={calculating}
                                    type="button"
                                >
                                    {calculating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hesaplanıyor...</>
                                    ) : (
                                        'Planı Hesapla / Güncelle'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Plan Table & Totals & Submit */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-0 pl-4 border-l border-slate-100 pb-2">
                    {rightHeader}
                    
                    {applyInterest && plan.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100/50 backdrop-blur-sm animate-in zoom-in-95 duration-500 flex-shrink-0 mb-4">
                            <div className="space-y-0.5">
                                <Label className="text-[9px] uppercase font-black text-blue-500 tracking-tighter">Vade Farkı Toplamı</Label>
                                <p className="text-lg font-black text-blue-700 leading-none">{totals.interest.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="space-y-0.5 text-right">
                                <Label className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">Genel Toplam (Faiz Dahil)</Label>
                                <p className="text-lg font-black text-slate-900 leading-none">{totals.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    )}
                    
                    {loading ? (
                        <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl flex-1 flex flex-col items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
                            <span className="text-sm text-slate-400 font-medium">Yükleniyor...</span>
                        </div>
                    ) : plan.length ? (
                        <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 mb-4">
                            <div className="overflow-y-auto flex-1">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest pl-4">Açıklama</TableHead>
                                            <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-center">Tarih</TableHead>
                                            <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-center">Ödeme Türü</TableHead>
                                            <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-right pr-4">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plan.map((item, i) => (
                                            <TableRow key={i} className="group border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="py-2.5 pl-4 text-xs font-medium text-slate-600 truncate max-w-[120px]">{item.description}</TableCell>
                                                <TableCell className="py-2.5 text-xs font-mono text-slate-500 text-center">{new Date(item.due_date).toLocaleDateString('tr-TR')}</TableCell>
                                                <TableCell className="py-2.5 text-center px-2">
                                                    <select
                                                        value={item.payment_mode || 'Cash'}
                                                        onChange={(e) => {
                                                            const newPlan = [...plan];
                                                            newPlan[i] = { ...newPlan[i], payment_mode: e.target.value };
                                                            setPlan(newPlan);
                                                        }}
                                                        className="bg-transparent border-none text-[11px] font-bold text-slate-600 uppercase focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5"
                                                    >
                                                        <option value="Cash">Nakit/Havale</option>
                                                        <option value="Check">Çek</option>
                                                        <option value="Note">Senet</option>
                                                    </select>
                                                </TableCell>
                                                <TableCell className="py-2.5 pr-4 text-xs font-bold text-slate-900 text-right">{Number(item.amount).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6 text-slate-400 border border-dashed rounded-xl bg-slate-50/50 flex-1 flex flex-col items-center justify-center min-h-[200px] mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <Plus className="h-5 w-5 text-slate-300" />
                            </div>
                            <p className="text-xs font-medium leading-relaxed">Henüz bir ödeme planı hesaplanmamış.<br />Soldaki formu doldurup "Planı Hesapla" butonuna basın.</p>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 bg-white flex-shrink-0 mt-auto">
                        {onClose && (
                            <Button variant="ghost" onClick={onClose} className="text-slate-500 font-bold text-xs uppercase tracking-widest h-11 px-6">Kapat</Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={plan.length === 0 || loading}
                            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex-1"
                        >
                            {confirmButtonText || 'Planı Kesinleştir ve Kaydet'}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
            {templates?.length && (
                <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                    <Label className="text-[10px] font-bold text-blue-400 mb-2 block uppercase tracking-widest text-center">Şablon Kullanarak Hızlan</Label>
                    <select
                        className="flex h-10 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 cursor-pointer"
                        onChange={e => applyTemplate(e.target.value)}
                        defaultValue=""
                    >
                        <option value="" disabled>Bir şablon seçin...</option>
                        {templates.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 border p-4 rounded-xl bg-white shadow-sm border-slate-200">
                {/* Row 1: Price and Currency */}
                <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Satış Bedeli ve Para Birimi</Label>
                    <div className="flex gap-1.5">
                        <Input
                            type="text"
                            value={displayPrice}
                            onChange={handlePriceChange}
                            placeholder="0,00"
                            disabled={disablePriceEdit}
                            className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500/10 flex-1 disabled:opacity-75 disabled:bg-slate-50"
                        />
                        <select
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                            disabled={disablePriceEdit}
                            className="flex h-10 w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 disabled:opacity-75 disabled:bg-slate-50"
                        >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>

                {/* Row 2: Down Payment and Installments */}
                <div className="col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peşinat (%)</Label>
                    <Input
                        type="number"
                        value={downPaymentRate}
                        onChange={e => setDownPaymentRate(e.target.value)}
                        className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                    />
                </div>
                <div className="col-span-1 space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taksit (Ay)</Label>
                    <Input
                        type="number"
                        value={months}
                        onChange={e => setMonths(e.target.value)}
                        className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                    />
                </div>

                {/* Date Row */}
                <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Başlangıç Tarihi</Label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="h-10 text-sm font-semibold border-slate-200 focus:border-blue-500"
                    />
                </div>
                <div className="col-span-2 space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                        <div className="flex flex-col gap-0.5">
                            <Label className="text-xs font-bold text-slate-700">Vade Farkı Uygula</Label>
                            <span className="text-[9px] text-slate-400 font-medium leading-none uppercase tracking-tighter">İşlem tutarına aylık faiz ekler</span>
                        </div>
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            checked={applyInterest}
                            onChange={e => setApplyInterest(e.target.checked)}
                        />
                    </div>

                    {applyInterest && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Aylık Faiz Oranı (%)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={interestRate}
                                onChange={e => setInterestRate(e.target.value)}
                                className="h-10 border-blue-200 focus:border-blue-500 bg-blue-50/30 text-sm font-bold text-blue-700"
                            />
                        </div>
                    )}
                </div>

                <div className="col-span-2 space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ara Ödemeler (Opsiyonel)</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={addInterim}
                            type="button"
                            className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-widest"
                        >
                            <Plus className="h-3 w-3 mr-1" /> Ekle
                        </Button>
                    </div>
                    {interims.length > 0 && (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {interims.map((int, idx) => (
                                <div key={idx} className="flex gap-2 items-end bg-slate-50/50 p-2 rounded-lg border border-slate-100 animate-in slide-in-from-left-2 duration-200">
                                    <div className="grid gap-1 flex-1">
                                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Ay</Label>
                                        <Input
                                            type="number"
                                            placeholder="6"
                                            value={int.month?.toString() || ""}
                                            onChange={e => updateInterim(idx, 'month', Number(e.target.value) || 0)}
                                            className="h-8 text-xs border-slate-200"
                                        />
                                    </div>
                                    <div className="grid gap-1 flex-[2]">
                                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Tutar</Label>
                                        <Input
                                            type="number"
                                            value={int.amount?.toString() || ""}
                                            onChange={e => updateInterim(idx, 'amount', Number(e.target.value) || 0)}
                                            className="h-8 text-xs border-slate-200 font-semibold"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeInterim(idx)}
                                        className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-2">
                    <Button
                        onClick={calculatePlan}
                        className="w-full h-11 transition-all hover:scale-[0.98] active:scale-95 shadow-md shadow-slate-900/5 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                        disabled={calculating}
                        type="button"
                    >
                        {calculating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hesaplanıyor...</>
                        ) : (
                            'Yeniden Hesapla / Plan Oluştur'
                        )}
                    </Button>
                </div>
            </div>

            {applyInterest && plan.length > 0 && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100/50 backdrop-blur-sm animate-in zoom-in-95 duration-500">
                    <div className="space-y-0.5">
                        <Label className="text-[9px] uppercase font-black text-blue-500 tracking-tighter">Vade Farkı Toplamı</Label>
                        <p className="text-lg font-black text-blue-700 leading-none">{totals.interest.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <Label className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">Genel Toplam (Faiz Dahil)</Label>
                        <p className="text-lg font-black text-slate-900 leading-none">{totals.grandTotal.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            )}
            {loading ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
                    <span className="text-sm text-slate-400 font-medium">Yükleniyor...</span>
                </div>
            ) : plan.length ? (
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="max-h-[250px] overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest pl-4">Açıklama</TableHead>
                                    <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-center">Tarih</TableHead>
                                    <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-center">Ödeme Türü</TableHead>
                                    <TableHead className="text-[10px] h-9 font-bold text-slate-400 uppercase tracking-widest text-right pr-4">Tutar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plan.map((item, i) => (
                                    <TableRow key={i} className="group border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-2.5 pl-4 text-xs font-medium text-slate-600 truncate max-w-[120px]">{item.description}</TableCell>
                                        <TableCell className="py-2.5 text-xs font-mono text-slate-500 text-center">{new Date(item.due_date).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell className="py-2.5 text-center px-2">
                                            <select
                                                value={item.payment_mode || 'Cash'}
                                                onChange={(e) => {
                                                    const newPlan = [...plan];
                                                    newPlan[i] = { ...newPlan[i], payment_mode: e.target.value };
                                                    setPlan(newPlan);
                                                }}
                                                className="bg-transparent border-none text-[11px] font-bold text-slate-600 uppercase focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5"
                                            >
                                                <option value="Cash">Nakit/Havale</option>
                                                <option value="Check">Çek</option>
                                                <option value="Note">Senet</option>
                                            </select>
                                        </TableCell>
                                        <TableCell className="py-2.5 pr-4 text-xs font-bold text-slate-900 text-right">{Number(item.amount).toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 })}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 px-6 text-slate-400 border border-dashed rounded-xl bg-slate-50/50">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-5 w-5 text-slate-300" />
                    </div>
                    <p className="text-xs font-medium leading-relaxed">Henüz bir ödeme planı oluşturulmamış.<br />Yukardaki formu kullanarak hesaplayabilirsiniz.</p>
                </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
                {onClose && (
                    <Button variant="ghost" onClick={onClose} className="text-slate-500 font-bold text-xs uppercase tracking-widest h-10 px-6">Kapat</Button>
                )}
                <Button
                    onClick={handleSave}
                    disabled={plan.length === 0 || loading}
                    className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {confirmButtonText || 'Planı Kesinleştir ve Kaydet'}
                </Button>
            </div>
        </div>
    )
}
