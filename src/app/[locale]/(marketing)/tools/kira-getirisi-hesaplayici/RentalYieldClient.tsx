'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { Calculator, TrendingUp, Clock, Percent } from 'lucide-react'

export default function RentalYieldCalculator() {
    const [price, setPrice] = useState<number>(3000000)
    const [monthlyRent, setMonthlyRent] = useState<number>(15000)

    const annualRent = monthlyRent * 12
    const yieldPercentage = price > 0 ? (annualRent / price) * 100 : 0
    const amortizationYears = annualRent > 0 ? price / annualRent : 0
    const amortizationMonths = Math.round((amortizationYears % 1) * 12)

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <section className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 mb-6">
                        <Calculator size={14} className="mr-1.5" /> Ücretsiz Araç
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Kira Getirisi ve Amortisman Hesaplayıcı</h1>
                    <p className="text-lg text-slate-400">
                        Gayrimenkul yatırımınızın yıllık getirisini (ROI) ve kendini amorti etme süresini saniyeler içinde hesaplayın.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <Card className="bg-slate-900 border-slate-800 text-white">
                        <CardHeader>
                            <CardTitle className="text-xl text-white">Yatırım Değerleri</CardTitle>
                            <CardDescription className="text-slate-400">Evinizin güncel değerini ve tahmini kira bedelini girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-slate-300">Gayrimenkul Değeri (TL)</Label>
                                <Input 
                                    id="price" 
                                    type="number" 
                                    value={price} 
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="bg-slate-950 border-slate-800 text-white h-12 text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rent" className="text-slate-300">Aylık Kira Getirisi (TL)</Label>
                                <Input 
                                    id="rent" 
                                    type="number" 
                                    value={monthlyRent} 
                                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                    className="bg-slate-950 border-slate-800 text-white h-12 text-lg"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    <div className="space-y-4">
                        <Card className="bg-emerald-950/30 border-emerald-500/30 text-white h-full">
                            <CardHeader>
                                <CardTitle className="text-xl text-white">Hesaplama Sonuçları</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="text-slate-400 text-sm mb-1 flex items-center"><Percent size={14} className="mr-1" /> Yıllık Getiri Oranı (ROI)</div>
                                    <div className="text-4xl font-bold text-emerald-400">%{yieldPercentage.toFixed(2)}</div>
                                </div>
                                <div className="border-t border-emerald-500/20 pt-4">
                                    <div className="text-slate-400 text-sm mb-1 flex items-center"><Clock size={14} className="mr-1" /> Amortisman Süresi</div>
                                    <div className="text-3xl font-bold text-emerald-300">
                                        {Math.floor(amortizationYears)} Yıl {amortizationMonths > 0 && `${amortizationMonths} Ay`}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Bu gayrimenkul, kendini kira geliriyle bu sürede amorti eder.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Lead Gen CTA */}
                <div className="mt-16 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border border-blue-500/30 rounded-3xl p-10 text-center">
                    <TrendingUp className="mx-auto text-blue-400 mb-6" size={48} />
                    <h2 className="text-3xl font-bold text-white mb-4">Portföyünüzün Tamamını Otomatik Analiz Edin</h2>
                    <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
                        Hesaplamalarla vakit kaybetmeyin. Gayrimenkul CRM sistemimiz portföyünüzdeki tüm mülklerin getirisini otomatik hesaplar ve size yatırım fırsatları sunar.
                    </p>
                    <LeadCaptureModal title="Ücretsiz CRM Demoları" description="Tüm portföyünüzün amortismanını otomatik hesaplayan CRM'i keşfedin." resourceName="Kira_Getirisi_Calculator">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 h-14 rounded-full text-lg shadow-lg shadow-blue-500/25">
                            CRM'i Ücretsiz Deneyin
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>
        </div>
    )
}
