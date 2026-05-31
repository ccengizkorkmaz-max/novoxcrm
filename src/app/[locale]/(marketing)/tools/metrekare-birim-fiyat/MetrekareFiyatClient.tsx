'use client'
import { useState } from 'react'
import { Calculator, ArrowLeftRight } from 'lucide-react'

export default function MetrekareFiyatClient() {
    const [toplamFiyat, setToplamFiyat] = useState('')
    const [metrekare, setMetrekare] = useState('')
    const [mode, setMode] = useState<'fiyattan' | 'birimden'>('fiyattan')
    const [birimFiyat, setBirimFiyat] = useState('')

    const fiyat = parseFloat(toplamFiyat.replace(/\./g, '').replace(',', '.')) || 0
    const m2 = parseFloat(metrekare.replace(/\./g, '').replace(',', '.')) || 0
    const birim = parseFloat(birimFiyat.replace(/\./g, '').replace(',', '.')) || 0

    const hesaplananBirim = m2 > 0 ? fiyat / m2 : 0
    const hesaplananToplam = m2 > 0 ? birim * m2 : 0

    const formatTL = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const handleChange = (setter: (v: string) => void) => (val: string) => {
        const clean = val.replace(/[^\d]/g, '')
        if (!clean) { setter(''); return }
        setter(parseInt(clean).toLocaleString('tr-TR'))
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Calculator className="text-purple-400" size={24} /> Hesaplama</h2>
                    <button onClick={() => setMode(mode === 'fiyattan' ? 'birimden' : 'fiyattan')} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-colors">
                        <ArrowLeftRight size={14} /> {mode === 'fiyattan' ? 'Birim → Toplam' : 'Toplam → Birim'}
                    </button>
                </div>
                <div className="space-y-5">
                    {mode === 'fiyattan' ? (
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Toplam Satış Fiyatı (TL)</label>
                            <input type="text" value={toplamFiyat} onChange={e => handleChange(setToplamFiyat)(e.target.value)} placeholder="3.500.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">m² Birim Fiyatı (TL/m²)</label>
                            <input type="text" value={birimFiyat} onChange={e => handleChange(setBirimFiyat)(e.target.value)} placeholder="35.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                        </div>
                    )}
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Alan (m²)</label>
                        <input type="text" value={metrekare} onChange={e => { const clean = e.target.value.replace(/[^\d.,]/g, ''); setMetrekare(clean) }} placeholder="120" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/20">
                <h2 className="text-xl font-bold text-white mb-6">Sonuç</h2>
                {(mode === 'fiyattan' ? (fiyat > 0 && m2 > 0) : (birim > 0 && m2 > 0)) ? (
                    <div className="space-y-4">
                        {mode === 'fiyattan' ? (
                            <>
                                <div className="text-center py-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                    <p className="text-sm text-purple-300 mb-1">m² Birim Fiyat</p>
                                    <p className="text-5xl font-black text-purple-400">{formatTL(hesaplananBirim)} ₺</p>
                                    <p className="text-xs text-slate-500 mt-2">/ metrekare</p>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Toplam Fiyat</span><span className="text-white font-bold">{formatTL(fiyat)} ₺</span></div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Alan</span><span className="text-white font-bold">{metrekare} m²</span></div>
                            </>
                        ) : (
                            <>
                                <div className="text-center py-6 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                    <p className="text-sm text-purple-300 mb-1">Toplam Fiyat</p>
                                    <p className="text-5xl font-black text-purple-400">{formatTL(hesaplananToplam)} ₺</p>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Birim Fiyat</span><span className="text-white font-bold">{formatTL(birim)} ₺/m²</span></div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Alan</span><span className="text-white font-bold">{metrekare} m²</span></div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12"><Calculator className="h-12 w-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">Değerleri girerek hesaplamayı başlatın</p></div>
                )}
            </div>
        </div>
    )
}
