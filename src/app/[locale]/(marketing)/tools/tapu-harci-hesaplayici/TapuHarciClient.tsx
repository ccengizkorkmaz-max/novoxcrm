"use client"

import { useState } from "react"
import { Calculator, Info, ChevronDown, ChevronUp } from "lucide-react"

export default function TapuHarciClient() {
    const [propertyValue, setPropertyValue] = useState("")
    const [buyerPays, setBuyerPays] = useState(50)
    const [isFirstHome, setIsFirstHome] = useState(false)
    const [isForeign, setIsForeign] = useState(false)
    const [propertySize, setPropertySize] = useState("under150")
    const [showDetails, setShowDetails] = useState(false)

    const value = parseFloat(propertyValue.replace(/\./g, "").replace(",", ".")) || 0

    // Tapu harcı: %4 (alıcı + satıcı toplam)
    const totalTapuHarci = value * 0.04
    const buyerShare = totalTapuHarci * (buyerPays / 100)
    const sellerShare = totalTapuHarci * ((100 - buyerPays) / 100)

    // Döner sermaye: ~1.000-3.000 TL (2026 tahmini)
    const donerSermaye = 2850

    // KDV hesaplama
    let kdvRate = 0.20
    if (isForeign) kdvRate = 0
    else if (isFirstHome && propertySize === "under150") kdvRate = 0.01

    const kdvAmount = value * kdvRate

    // Toplam maliyet (alıcı)
    const totalBuyerCost = buyerShare + donerSermaye + kdvAmount

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n)
    const formatNumber = (n: string) => {
        const cleaned = n.replace(/\D/g, "")
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Calculator Card */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Calculator className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Hesaplama Aracı</h2>
                        <p className="text-sm text-slate-500">2026 güncel oranlarıyla</p>
                    </div>
                </div>

                {/* Property Value Input */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Gayrimenkul Değeri (TL)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">₺</span>
                        <input
                            type="text"
                            value={propertyValue}
                            onChange={(e) => setPropertyValue(formatNumber(e.target.value))}
                            placeholder="3.500.000"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tapu Harcı Paylaşımı</label>
                        <div className="flex gap-2">
                            {[{ label: "Eşit (%50-%50)", val: 50 }, { label: "Alıcı Öder (%100)", val: 100 }, { label: "Satıcı Öder", val: 0 }].map(opt => (
                                <button key={opt.val} onClick={() => setBuyerPays(opt.val)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${buyerPays === opt.val ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Konut Büyüklüğü</label>
                        <div className="flex gap-2">
                            {[{ label: "150 m² altı", val: "under150" }, { label: "150 m² üstü", val: "over150" }].map(opt => (
                                <button key={opt.val} onClick={() => setPropertySize(opt.val)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${propertySize === opt.val ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={isFirstHome} onChange={(e) => setIsFirstHome(e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">İlk konut alımı</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={isForeign} onChange={(e) => setIsForeign(e.target.checked)}
                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Yabancı uyruklu alıcı</span>
                    </label>
                </div>

                {/* Results */}
                {value > 0 && (
                    <div className="border-t border-slate-800 pt-8 space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                                <div className="text-sm text-blue-300 mb-1">Tapu Harcı (Toplam)</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(totalTapuHarci)}</div>
                                <div className="text-xs text-blue-400 mt-1">Gayrimenkul değerinin %4&apos;ü</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <div className="text-sm text-emerald-300 mb-1">Alıcı Payı</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(buyerShare)}</div>
                                <div className="text-xs text-emerald-400 mt-1">%{buyerPays} pay</div>
                            </div>
                            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                                <div className="text-sm text-purple-300 mb-1">Satıcı Payı</div>
                                <div className="text-2xl font-bold text-white">{formatCurrency(sellerShare)}</div>
                                <div className="text-xs text-purple-400 mt-1">%{100 - buyerPays} pay</div>
                            </div>
                        </div>

                        {/* Detail Breakdown */}
                        <button onClick={() => setShowDetails(!showDetails)}
                            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-3">
                            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {showDetails ? "Detayları Gizle" : "Tüm Maliyetleri Göster"}
                        </button>

                        {showDetails && (
                            <div className="bg-slate-800/50 rounded-2xl p-6 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Tapu Harcı (Alıcı)</span>
                                    <span className="text-white font-medium">{formatCurrency(buyerShare)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">KDV (%{(kdvRate * 100).toFixed(0)})</span>
                                    <span className="text-white font-medium">{formatCurrency(kdvAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Döner Sermaye</span>
                                    <span className="text-white font-medium">{formatCurrency(donerSermaye)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-4 flex justify-between text-lg font-bold">
                                    <span className="text-white">Alıcı Toplam Maliyet</span>
                                    <span className="text-blue-400">{formatCurrency(totalBuyerCost)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="mt-12 space-y-8">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-start gap-3">
                        <Info className="text-blue-400 shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Tapu Harcı Nedir?</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Tapu harcı, gayrimenkul alım-satım işlemlerinde devlete ödenen yasal bir vergidir.
                                Toplam oran, satış bedelinin %4&apos;üdür ve yasal olarak alıcı-satıcı arasında eşit paylaşılır.
                                Ancak uygulamada bu oran müzakere edilebilir. 2026 yılı itibarıyla bu oranlar günceldir.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <div className="flex items-start gap-3">
                        <Info className="text-emerald-400 shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">KDV Oranları 2026</h3>
                            <ul className="text-slate-400 space-y-2">
                                <li>• <strong className="text-slate-300">%1 KDV:</strong> 150 m² altı, ilk konut alımı</li>
                                <li>• <strong className="text-slate-300">%20 KDV:</strong> 150 m² üzeri veya ikinci konut</li>
                                <li>• <strong className="text-slate-300">%0 KDV:</strong> Yabancı uyruklu alıcılar (döviz şartı)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
