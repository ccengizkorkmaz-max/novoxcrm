"use client"

import { useState } from "react"
import { Home, Info } from "lucide-react"

const taxRates2026 = [
    { min: 0, max: 1_400_000, rate: 0.001 },
    { min: 1_400_001, max: 2_100_000, rate: 0.002 },
    { min: 2_100_001, max: 5_500_000, rate: 0.004 },
    { min: 5_500_001, max: Infinity, rate: 0.006 },
]

export default function EmlakVergisiClient() {
    const [propertyValue, setPropertyValue] = useState("")
    const [propertyType, setPropertyType] = useState("residential")
    const [isMetro, setIsMetro] = useState(true)

    const value = parseFloat(propertyValue.replace(/\./g, "").replace(",", ".")) || 0

    // Emlak vergisi hesaplama (büyükşehir 2x)
    let baseTax = 0
    for (const bracket of taxRates2026) {
        if (value > bracket.min) {
            const taxable = Math.min(value, bracket.max) - bracket.min
            baseTax += taxable * bracket.rate
        }
    }

    const metroMultiplier = isMetro ? 2 : 1
    const typeMultiplier = propertyType === 'commercial' ? 2 : propertyType === 'land' ? 3 : 1
    const annualTax = baseTax * metroMultiplier * typeMultiplier
    const quarterlyTax = annualTax / 2 // Mayıs ve Kasım iki eşit taksit

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n)
    const formatNumber = (n: string) => {
        const cleaned = n.replace(/\D/g, "")
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                        <Home className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Emlak Vergisi Hesaplama</h2>
                        <p className="text-sm text-slate-500">2026 güncel vergi dilimleriyle</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Taşınmaz Değeri (TL)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₺</span>
                        <input type="text" value={propertyValue} onChange={(e) => setPropertyValue(formatNumber(e.target.value))}
                            placeholder="3.500.000"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Taşınmaz Türü</label>
                        <div className="flex gap-2">
                            {[{ label: "Konut", val: "residential" }, { label: "İşyeri", val: "commercial" }, { label: "Arsa", val: "land" }].map(opt => (
                                <button key={opt.val} onClick={() => setPropertyType(opt.val)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${propertyType === opt.val ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Belediye Türü</label>
                        <div className="flex gap-2">
                            {[{ label: "Büyükşehir", val: true }, { label: "Diğer İller", val: false }].map(opt => (
                                <button key={String(opt.val)} onClick={() => setIsMetro(opt.val)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isMetro === opt.val ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {value > 0 && (
                    <div className="border-t border-slate-800 pt-8 space-y-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <div className="text-sm text-emerald-300 mb-1">Yıllık Emlak Vergisi</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(annualTax)}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                                <div className="text-sm text-blue-300 mb-1">1. Taksit (Mayıs)</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(quarterlyTax)}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                                <div className="text-sm text-blue-300 mb-1">2. Taksit (Kasım)</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(quarterlyTax)}</div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-6 space-y-3">
                            <h4 className="text-sm font-semibold text-white mb-2">2026 Vergi Dilimleri (Konut — {isMetro ? 'Büyükşehir' : 'Diğer İller'})</h4>
                            {taxRates2026.map((bracket, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-slate-400">
                                        {bracket.max === Infinity ? `${(bracket.min).toLocaleString('tr-TR')} TL üzeri` : `${(bracket.min).toLocaleString('tr-TR')} - ${bracket.max.toLocaleString('tr-TR')} TL`}
                                    </span>
                                    <span className="text-white font-medium">
                                        ‰{(bracket.rate * 1000).toFixed(0)} {isMetro && <span className="text-emerald-400">(×2 = ‰{(bracket.rate * 2000).toFixed(0)})</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 space-y-8">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-start gap-3">
                        <Info className="text-emerald-400 shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Emlak Vergisi Nedir?</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Emlak vergisi, taşınmaz mülk sahiplerinin her yıl belediyeye ödediği yasal vergidir. Vergi oranı taşınmazın türüne (konut, işyeri, arsa) ve bulunduğu belediyeye (büyükşehir/diğer) göre değişir. Büyükşehir belediyelerinde oranlar 2 kat uygulanır. Ödeme Mayıs ve Kasım aylarında iki eşit taksitle yapılır.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
