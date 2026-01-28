"use client"
import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { ArrowLeft, Plus, Trash2, Calculator as CalcIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'

type InterimPayment = {
    id: string;
    month: number;
    amount: number;
}

export default function PaymentPlanCalculator() {
    const [price, setPrice] = useState(5000000)
    const [currency, setCurrency] = useState('₺')
    const [downPayment, setDownPayment] = useState(1250000)
    const [installments, setInstallments] = useState(24)
    const [interimPayments, setInterimPayments] = useState<InterimPayment[]>([])
    const [applyInterest, setApplyInterest] = useState(false)
    const [interestRate, setInterestRate] = useState(1.5)

    const addInterimPayment = () => {
        setInterimPayments([...interimPayments, { id: Math.random().toString(), month: 6, amount: 500000 }])
    }

    const removeInterimPayment = (id: string) => {
        setInterimPayments(interimPayments.filter(p => p.id !== id))
    }

    const updateInterimPayment = (id: string, field: keyof InterimPayment, value: number) => {
        setInterimPayments(interimPayments.map(p => p.id === id ? { ...p, [field]: value } : p))
    }

    const schedule = useMemo(() => {
        const result = calculatePaymentSchedule({
            principal: price,
            downPaymentAmount: downPayment,
            monthlyInterestRate: applyInterest ? interestRate : 0,
            installmentCount: installments,
            startDate: new Date().toISOString().split('T')[0],
            currency: currency,
            interimPayments: interimPayments.map(p => ({ month: p.month, amount: p.amount }))
        });

        return {
            items: result.items.map((item, idx) => ({
                month: idx, // The utility doesn't return month number indices in the same way, but we can derive it or just use the descriptions
                type: item.payment_type === 'DownPayment' ? 'Peşinat' :
                    item.payment_type === 'Balloon' ? 'Ara Ödeme' : 'Taksit',
                amount: item.amount,
                description: item.description
            })),
            monthlyAmount: result.items.find(i => i.payment_type === 'Installment')?.amount || 0,
            totalPrice: result.grandTotal,
            totalInterest: result.totalInterest
        };
    }, [price, downPayment, installments, interimPayments, applyInterest, interestRate, currency]);

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 text-slate-200">
            <div className="container mx-auto max-w-6xl">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Müşteri Ödeme Planı Sihirbazı</h1>
                    <p className="text-xl text-slate-400">Esnek ara ödeme ve vade farkı seçenekleriyle profesyonel teklifler oluşturun.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Panel: Inputs */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-slate-900 border-slate-800 text-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalcIcon className="text-blue-500" /> Ana Parametreler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Satış Fiyatı</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                className="bg-slate-950 border-slate-800"
                                                value={price}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                            />
                                            <Select value={currency} onValueChange={setCurrency}>
                                                <SelectTrigger className="w-24 bg-slate-950 border-slate-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                    <SelectItem value="₺">₺ TL</SelectItem>
                                                    <SelectItem value="$">$ USD</SelectItem>
                                                    <SelectItem value="€">€ EUR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Peşinat Tutarı</Label>
                                        <Input
                                            type="number"
                                            className="bg-slate-950 border-slate-800"
                                            value={downPayment}
                                            onChange={(e) => setDownPayment(Number(e.target.value))}
                                        />
                                        <p className="text-xs text-slate-500">Satışın %{((downPayment / price) * 100).toFixed(1)}'i</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Vade (Taksit Sayısı)</Label>
                                        <Input
                                            type="number"
                                            className="bg-slate-950 border-slate-800"
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-blue-400 font-bold">Vade Farkı Uygula</Label>
                                            <Switch
                                                checked={applyInterest}
                                                onCheckedChange={setApplyInterest}
                                            />
                                        </div>
                                        {applyInterest && (
                                            <div className="space-y-2">
                                                <Label className="text-xs">Aylık Faiz Oranı (%)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    className="bg-slate-950 border-slate-800 border-blue-500/30"
                                                    value={interestRate}
                                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                                />
                                                <p className="text-[10px] text-blue-400 font-medium italic">Vade farkı aylık bazda hesaplanır.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interim Payments */}
                        <Card className="bg-slate-900 border-slate-800 text-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Ara Ödemeler</CardTitle>
                                    <CardDescription className="text-slate-500 italic">Belirli aylarda yapılacak toplu ödemeler.</CardDescription>
                                </div>
                                <Button onClick={addInterimPayment} size="sm" className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700">
                                    <Plus className="h-4 w-4 mr-1" /> Ekle
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {interimPayments.length === 0 ? (
                                    <div className="text-center py-6 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                                        Henüz ara ödeme eklenmedi.
                                    </div>
                                ) : (
                                    interimPayments.map((p) => (
                                        <div key={p.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-xs text-slate-500">Ay</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-950 border-slate-800"
                                                    value={p.month}
                                                    onChange={(e) => updateInterimPayment(p.id, 'month', Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="flex-[2] space-y-2">
                                                <Label className="text-xs text-slate-500">Tutar ({currency})</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-950 border-slate-800"
                                                    value={p.amount}
                                                    onChange={(e) => updateInterimPayment(p.id, 'amount', Number(e.target.value))}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                onClick={() => removeInterimPayment(p.id)}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Table Results */}
                        <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden">
                            <CardHeader>
                                <CardTitle>Ödeme Takvimi</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[500px] overflow-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-800 z-10">
                                            <tr>
                                                <th className="p-4 text-xs font-bold text-slate-400">Vade</th>
                                                <th className="p-4 text-xs font-bold text-slate-400">Ödeme Tipi</th>
                                                <th className="p-4 text-xs font-bold text-slate-400">Tutar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {schedule.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 text-sm font-medium">
                                                        {item.description}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                            item.type === 'Peşinat' ? "bg-blue-500/20 text-blue-400" :
                                                                item.type === 'Ara Ödeme' ? "bg-purple-500/20 text-purple-400" :
                                                                    "bg-slate-800 text-slate-400"
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold">
                                                        {item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {currency}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Summary */}
                    <div className="space-y-6">
                        <Card className="bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-500/20 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-white/80">Plan Özeti</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Aylık Taksit</p>
                                    <p className="text-4xl font-black">{schedule.monthlyAmount.toLocaleString('tr-TR')} {currency}</p>
                                </div>

                                <div className="h-px bg-blue-500/50" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-blue-200 uppercase">Toplam Peşinat</p>
                                        <p className="font-bold">{downPayment.toLocaleString('tr-TR')} {currency}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-200 uppercase">Toplam Vade</p>
                                        <p className="font-bold">{installments} Ay</p>
                                    </div>
                                    {applyInterest && (
                                        <div>
                                            <p className="text-[10px] text-blue-200 uppercase">Vade Farkı</p>
                                            <p className="font-bold text-emerald-300">+{schedule.totalInterest.toLocaleString('tr-TR')} {currency}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] text-blue-200 uppercase">Ara Ödemeler</p>
                                        <p className="font-bold">{interimPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('tr-TR')} {currency}</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-blue-700/50 rounded-2xl border border-blue-400/20">
                                    <p className="text-xs text-blue-200 mb-1">TOPLAM ÖDEME</p>
                                    <p className="text-2xl font-black">{schedule.totalPrice.toLocaleString('tr-TR')} {currency}</p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <LeadCaptureModal
                                    title="Ödeme Planını Teklif Olarak Kaydet"
                                    description="Bu hesaplamayı müşteri kaydıyla eşleştirmek ve PDF teklif mektubu oluşturmak için profesyonel panele geçin."
                                    resourceName="Calculator_Pro_Lead"
                                >
                                    <Button className="w-full bg-white text-blue-900 hover:bg-slate-100 font-black h-12 rounded-xl">
                                        PROFESYONEL TEKLİF AL
                                    </Button>
                                </LeadCaptureModal>
                                <p className="text-[10px] text-blue-200 text-center px-4 italic">
                                    Not: Bu hesaplama bilgilendirme amaçlıdır. Nihai satış şartları sözleşme esnasında belirlenir.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}


