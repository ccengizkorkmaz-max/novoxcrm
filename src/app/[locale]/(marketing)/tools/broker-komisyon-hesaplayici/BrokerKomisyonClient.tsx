'use client'

import { useState } from 'react'
import { Calculator, Info } from 'lucide-react'

export default function BrokerKomisyonClient() {
    const [satisBedeli, setSatisBedeli] = useState('')
    const [komisyonOrani, setKomisyonOrani] = useState('3')
    const [kdvDahil, setKdvDahil] = useState(true)

    const bedel = parseFloat(satisBedeli.replace(/\./g, '').replace(',', '.')) || 0
    const oran = parseFloat(komisyonOrani) || 0
    const komisyon = bedel * (oran / 100)
    const kdv = kdvDahil ? komisyon * 0.20 : 0
    const toplam = komisyon + kdv
    const stopaj = komisyon * 0.20

    const formatTL = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const handleBedelChange = (val: string) => {
        const clean = val.replace(/[^\d]/g, '')
        if (!clean) { setSatisBedeli(''); return }
        setSatisBedeli(parseInt(clean).toLocaleString('tr-TR'))
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Input */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Calculator className="text-emerald-400" size={24} /> Hesaplama Bilgileri
                </h2>

                <div className="space-y-5">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Satış Bedeli (TL)</label>
                        <input
                            type="text"
                            value={satisBedeli}
                            onChange={e => handleBedelChange(e.target.value)}
                            placeholder="5.000.000"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Komisyon Oranı (%)</label>
                        <div className="flex gap-2">
                            {['1', '2', '3', '4', '5'].map(o => (
                                <button
                                    key={o}
                                    onClick={() => setKomisyonOrani(o)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                        komisyonOrani === o
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                                    }`}
                                >
                                    %{o}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={komisyonOrani}
                            onChange={e => setKomisyonOrani(e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            placeholder="Özel oran girin"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={kdvDahil}
                            onChange={e => setKdvDahil(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 accent-emerald-500"
                        />
                        <span className="text-sm text-slate-300">KDV dahil hesapla (%20)</span>
                    </label>
                </div>
            </div>

            {/* Result */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20">
                <h2 className="text-xl font-bold text-white mb-6">Sonuç</h2>

                {bedel > 0 ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400">Satış Bedeli</span>
                            <span className="text-white font-bold">{formatTL(bedel)} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400">Komisyon Oranı</span>
                            <span className="text-white font-bold">%{oran}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400">Komisyon Tutarı</span>
                            <span className="text-emerald-400 font-bold text-lg">{formatTL(komisyon)} ₺</span>
                        </div>
                        {kdvDahil && (
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">KDV (%20)</span>
                                <span className="text-white font-bold">{formatTL(kdv)} ₺</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400 flex items-center gap-1">Stopaj (%20) <Info size={14} className="text-slate-600" /></span>
                            <span className="text-orange-400 font-bold">{formatTL(stopaj)} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 mt-2">
                            <span className="text-emerald-300 font-semibold">Toplam (KDV Dahil)</span>
                            <span className="text-emerald-400 font-black text-2xl">{formatTL(toplam)} ₺</span>
                        </div>
                        <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <span className="text-slate-400 text-sm">Broker Net Gelir (Stopaj Sonrası)</span>
                            <span className="text-white font-bold">{formatTL(komisyon - stopaj)} ₺</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Calculator className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">Satış bedeli girerek hesaplamayı başlatın</p>
                    </div>
                )}
            </div>
        </div>
    )
}
