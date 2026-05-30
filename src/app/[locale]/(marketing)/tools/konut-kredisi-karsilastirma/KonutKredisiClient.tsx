"use client"

import { useState, useMemo } from "react"
import { TrendingUp, Info } from "lucide-react"

const banks = [
    { name: "Ziraat Bankası", rate: 2.49, maxTerm: 120, minDown: 20 },
    { name: "Ziraat Katılım", rate: 2.59, maxTerm: 120, minDown: 20 },
    { name: "Vakıf Katılım", rate: 2.63, maxTerm: 120, minDown: 20 },
    { name: "QNB", rate: 2.78, maxTerm: 120, minDown: 20 },
    { name: "TEB", rate: 2.96, maxTerm: 120, minDown: 25 },
    { name: "Garanti BBVA", rate: 2.99, maxTerm: 120, minDown: 20 },
    { name: "Akbank", rate: 2.99, maxTerm: 120, minDown: 25 },
    { name: "ING", rate: 3.19, maxTerm: 120, minDown: 20 },
    { name: "ICBC Turkey", rate: 3.83, maxTerm: 120, minDown: 20 },
]

export default function KonutKredisiClient() {
    const [propertyValue, setPropertyValue] = useState("")
    const [downPayment, setDownPayment] = useState("30")
    const [term, setTerm] = useState("120")

    const value = parseFloat(propertyValue.replace(/\./g, "").replace(",", ".")) || 0
    const downPct = parseInt(downPayment) || 30
    const termMonths = parseInt(term) || 120

    const loanAmount = value * (1 - downPct / 100)

    const results = useMemo(() => {
        if (loanAmount <= 0) return []
        return banks
            .filter(b => termMonths <= b.maxTerm && downPct >= b.minDown)
            .map(bank => {
                const monthlyRate = bank.rate / 100
                const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
                const totalPayment = payment * termMonths
                const totalInterest = totalPayment - loanAmount
                return { ...bank, monthlyPayment: payment, totalPayment, totalInterest }
            })
            .sort((a, b) => a.monthlyPayment - b.monthlyPayment)
    }, [loanAmount, termMonths, downPct])

    const formatCurrency = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n)
    const formatNumber = (n: string) => {
        const cleaned = n.replace(/\D/g, "")
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-3xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                        <TrendingUp className="text-amber-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Konut Kredisi Karşılaştırma</h2>
                        <p className="text-sm text-slate-500">10 bankanın güncel faiz oranları</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Konut Değeri (TL)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₺</span>
                            <input type="text" value={propertyValue} onChange={(e) => setPropertyValue(formatNumber(e.target.value))}
                                placeholder="3.500.000"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-white placeholder-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Peşinat (%{downPct})</label>
                        <input type="range" min="20" max="80" step="5" value={downPayment} onChange={(e) => setDownPayment(e.target.value)}
                            className="w-full accent-amber-500 mt-3" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1"><span>%20</span><span className="text-amber-400 font-medium">{formatCurrency(value * downPct / 100)}</span><span>%80</span></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Vade ({termMonths} ay)</label>
                        <input type="range" min="12" max="120" step="12" value={term} onChange={(e) => setTerm(e.target.value)}
                            className="w-full accent-amber-500 mt-3" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1"><span>12 ay</span><span className="text-amber-400 font-medium">{(termMonths / 12).toFixed(0)} yıl</span><span>120 ay</span></div>
                    </div>
                </div>

                {loanAmount > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300 flex items-center gap-3">
                        <Info size={18} className="shrink-0" />
                        <span>Kredi tutarı: <strong>{formatCurrency(loanAmount)}</strong> | Peşinat: {formatCurrency(value - loanAmount)} | Vade: {termMonths} ay ({(termMonths / 12).toFixed(0)} yıl)</span>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">#</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Banka</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Faiz</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Aylık Taksit</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Toplam Faiz</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Toplam Ödeme</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((bank, i) => (
                                    <tr key={bank.name} className={`border-b border-slate-800/50 ${i === 0 ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'} transition-colors`}>
                                        <td className="py-3 px-4">
                                            {i === 0 ? <span className="text-emerald-400 font-bold">🏆</span> : <span className="text-slate-500">{i + 1}</span>}
                                        </td>
                                        <td className="py-3 px-4 text-white font-medium">{bank.name}</td>
                                        <td className="py-3 px-4 text-right text-amber-400">%{bank.rate.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-white font-semibold">{formatCurrency(bank.monthlyPayment)}</td>
                                        <td className="py-3 px-4 text-right text-red-400">{formatCurrency(bank.totalInterest)}</td>
                                        <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(bank.totalPayment)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-start gap-3">
                    <Info className="text-amber-400 shrink-0 mt-1" size={20} />
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Konut Kredisi Hakkında</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Konut kredisi faiz oranları bankaların güncel kampanyalarına göre değişiklik gösterebilir. Bu hesaplama tahmini niteliktedir ve kesin kredi teklifini ilgili bankadan almanızı öneririz. Hesaplamalar BSMV ve dosya masrafı dahil değildir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
