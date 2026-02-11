'use client'

import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calculator as CalcIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'

interface CalculatorModalProps {
    unit: {
        price: number
        currency: string
        unit_number: string
    }
}

export default function CalculatorModal({ unit }: CalculatorModalProps) {
    const [open, setOpen] = useState(false)
    const [downPaymentRate, setDownPaymentRate] = useState(25)
    const [installments, setInstallments] = useState(24)

    const schedule = useMemo(() => {
        const result = calculatePaymentSchedule({
            principal: unit.price,
            downPaymentAmount: unit.price * (downPaymentRate / 100),
            monthlyInterestRate: 0, // No interest for public simple calc
            installmentCount: installments,
            startDate: new Date().toISOString().split('T')[0],
            currency: unit.currency,
            interimPayments: []
        });

        const monthly = result.items.find(i => i.payment_type === 'Installment')?.amount || 0;
        return {
            monthly,
            total: result.grandTotal,
            downAmount: unit.price * (downPaymentRate / 100)
        };
    }, [unit.price, downPaymentRate, installments, unit.currency]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                    <CalcIcon className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{unit.unit_number} - Ödeme Planı Simülasyonu</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white text-center space-y-4 shadow-xl">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aylık Taksit</p>
                            <p className="text-4xl font-black">{formatCurrency(schedule.monthly, unit.currency)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-[10px] font-bold text-white/50 uppercase">Peşinat</p>
                                <p className="font-bold text-sm">{formatCurrency(schedule.downAmount, unit.currency)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white/50 uppercase">Toplam Tutar</p>
                                <p className="font-bold text-sm">{formatCurrency(schedule.total, unit.currency)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-bold text-slate-600">Peşinat Oranı (%)</Label>
                                <span className="text-xs font-black text-blue-600">%{downPaymentRate}</span>
                            </div>
                            <input
                                type="range"
                                min="10" max="90" step="5"
                                value={downPaymentRate.toString()}
                                onChange={e => setDownPaymentRate(Number(e.target.value) || 0)}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-bold text-slate-600">Vade (Ay)</Label>
                                <span className="text-xs font-black text-blue-600">{installments} Ay</span>
                            </div>
                            <input
                                type="range"
                                min="6" max="60" step="6"
                                value={installments.toString()}
                                onChange={e => setInstallments(Number(e.target.value) || 0)}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-800 leading-relaxed italic">
                        * Bu hesaplama bilgilendirme amaçlıdır ve vade farkı içermemektedir. Kesin ödeme planı için lütfen iletişime geçin.
                    </div>
                </div>
                <DialogFooter>
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold" onClick={() => setOpen(false)}>
                        Kapat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
