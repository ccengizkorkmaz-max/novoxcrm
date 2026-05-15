"use client"

import { useState } from "react"
import { Calculator, Info } from "lucide-react"

export default function SerefiyeClient() {
    const [basePrice, setBasePrice] = useState("")
    const [floor, setFloor] = useState("5")
    const [totalFloors, setTotalFloors] = useState("15")
    const [direction, setDirection] = useState("south")
    const [hasView, setHasView] = useState(false)
    const [isCorner, setIsCorner] = useState(false)

    const value = parseFloat(basePrice.replace(/\./g, "").replace(",", ".")) || 0
    const floorNum = parseInt(floor) || 1
    const totalFloorsNum = parseInt(totalFloors) || 10

    // Şerefiye hesaplama
    const floorMultiplier = floorNum <= 2 ? -0.03 : (floorNum - 2) * 0.015
    const directionMultipliers: Record<string, number> = {
        south: 0.05, east: 0.03, west: 0.01, north: -0.02
    }
    const dirMultiplier = directionMultipliers[direction] || 0
    const viewBonus = hasView ? 0.08 : 0
    const cornerBonus = isCorner ? 0.03 : 0

    const totalMultiplier = floorMultiplier + dirMultiplier + viewBonus + cornerBonus
    const serefiyeAmount = value * totalMultiplier
    const finalPrice = value + serefiyeAmount

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n)
    const formatNumber = (n: string) => {
        const cleaned = n.replace(/\D/g, "")
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }
    const formatPercent = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                        <Calculator className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Şerefiye Hesaplama</h2>
                        <p className="text-sm text-slate-500">Kat, cephe ve manzara faktörleriyle</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Baz Daire Fiyatı (TL)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₺</span>
                        <input type="text" value={basePrice} onChange={(e) => setBasePrice(formatNumber(e.target.value))}
                            placeholder="2.500.000"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white placeholder-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Dairenin Katı</label>
                        <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} min="1" max="50"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Toplam Kat Sayısı</label>
                        <input type="number" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} min="1" max="50"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none" />
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cephe Yönü</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[{ label: "Güney", val: "south" }, { label: "Doğu", val: "east" }, { label: "Batı", val: "west" }, { label: "Kuzey", val: "north" }].map(opt => (
                            <button key={opt.val} onClick={() => setDirection(opt.val)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${direction === opt.val ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-6 mb-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={hasView} onChange={(e) => setHasView(e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Manzara var</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={isCorner} onChange={(e) => setIsCorner(e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Köşe daire</span>
                    </label>
                </div>

                {value > 0 && (
                    <div className="border-t border-slate-800 pt-8 space-y-6">
                        <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${totalMultiplier >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                            <Info size={18} className="shrink-0" />
                            <span>Toplam şerefiye etkisi: <strong>{formatPercent(totalMultiplier)}</strong> ({totalMultiplier >= 0 ? 'fiyat artışı' : 'fiyat düşüşü'})</span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
                                <div className="text-sm text-slate-400 mb-1">Baz Fiyat</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(value)}</div>
                            </div>
                            <div className={`p-6 rounded-2xl text-center ${totalMultiplier >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                <div className={`text-sm mb-1 ${totalMultiplier >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Şerefiye</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(serefiyeAmount)}</div>
                                <div className={`text-xs mt-1 ${totalMultiplier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatPercent(totalMultiplier)}</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                                <div className="text-sm text-purple-300 mb-1">Nihai Fiyat</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(finalPrice)}</div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-6 space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-slate-400">Kat etkisi ({floorNum}. kat)</span><span className="text-white font-medium">{formatPercent(floorMultiplier)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-slate-400">Cephe etkisi ({direction === 'south' ? 'Güney' : direction === 'east' ? 'Doğu' : direction === 'west' ? 'Batı' : 'Kuzey'})</span><span className="text-white font-medium">{formatPercent(dirMultiplier)}</span></div>
                            {hasView && <div className="flex justify-between text-sm"><span className="text-slate-400">Manzara primi</span><span className="text-emerald-400 font-medium">+8.0%</span></div>}
                            {isCorner && <div className="flex justify-between text-sm"><span className="text-slate-400">Köşe daire primi</span><span className="text-emerald-400 font-medium">+3.0%</span></div>}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-12 space-y-8">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-start gap-3">
                        <Info className="text-purple-400 shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Şerefiye Nedir?</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Şerefiye, bir konut projesinde dairelerin kat, cephe, manzara ve konum gibi özelliklerine göre baz fiyattan farklılaştırılması uygulamasıdır. Yüksek katlarda güney cepheli, manzaralı daireler genellikle daha yüksek fiyatlandırılırken, düşük katlarda kuzey cepheli daireler baz fiyatın altında kalabilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
