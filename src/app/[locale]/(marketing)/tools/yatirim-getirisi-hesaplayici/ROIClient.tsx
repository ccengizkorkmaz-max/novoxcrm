'use client'

import { useState } from 'react'
import { Calculator, TrendingUp } from 'lucide-react'

export default function ROIClient() {
    const [alisFiyati, setAlisFiyati] = useState('')
    const [satisFiyati, setSatisFiyati] = useState('')
    const [aylikKira, setAylikKira] = useState('')
    const [yil, setYil] = useState('5')
    const [yillikGider, setYillikGider] = useState('')

    const alis = parseFloat(alisFiyati.replace(/\./g, '').replace(',', '.')) || 0
    const satis = parseFloat(satisFiyati.replace(/\./g, '').replace(',', '.')) || 0
    const kira = parseFloat(aylikKira.replace(/\./g, '').replace(',', '.')) || 0
    const sure = parseFloat(yil) || 1
    const gider = parseFloat(yillikGider.replace(/\./g, '').replace(',', '.')) || 0

    const toplamKiraGeliri = kira * 12 * sure
    const toplamGider = gider * sure
    const netKiraGeliri = toplamKiraGeliri - toplamGider
    const degerArtisi = satis > 0 ? satis - alis : 0
    const toplamGetiri = netKiraGeliri + degerArtisi
    const roi = alis > 0 ? (toplamGetiri / alis) * 100 : 0
    const yillikROI = sure > 0 ? roi / sure : 0
    const kiraGetirisi = alis > 0 ? ((kira * 12) / alis) * 100 : 0
    const geriDonus = kira > 0 ? alis / (kira * 12) : 0

    const formatTL = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const handleChange = (setter: (v: string) => void) => (val: string) => {
        const clean = val.replace(/[^\d]/g, '')
        if (!clean) { setter(''); return }
        setter(parseInt(clean).toLocaleString('tr-TR'))
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Calculator className="text-blue-400" size={24} /> Yatırım Bilgileri
                </h2>
                <div className="space-y-5">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Alış Fiyatı (TL)</label>
                        <input type="text" value={alisFiyati} onChange={e => handleChange(setAlisFiyati)(e.target.value)} placeholder="3.000.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Beklenen Satış Fiyatı (TL) <span className="text-slate-600">— opsiyonel</span></label>
                        <input type="text" value={satisFiyati} onChange={e => handleChange(setSatisFiyati)(e.target.value)} placeholder="4.500.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Aylık Kira Geliri (TL)</label>
                        <input type="text" value={aylikKira} onChange={e => handleChange(setAylikKira)(e.target.value)} placeholder="15.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Yatırım Süresi (Yıl)</label>
                        <div className="flex gap-2">
                            {['1', '3', '5', '10', '15'].map(y => (
                                <button key={y} onClick={() => setYil(y)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${yil === y ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>{y} Yıl</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Yıllık Gider (TL) <span className="text-slate-600">— aidat, vergi, bakım</span></label>
                        <input type="text" value={yillikGider} onChange={e => handleChange(setYillikGider)(e.target.value)} placeholder="24.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="text-blue-400" size={24} /> Yatırım Getirisi</h2>
                {alis > 0 ? (
                    <div className="space-y-4">
                        <div className="text-center py-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                            <p className="text-sm text-blue-300 mb-1">Toplam ROI ({sure} Yıl)</p>
                            <p className={`text-5xl font-black ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>%{roi.toFixed(1)}</p>
                            <p className="text-sm text-slate-400 mt-1">Yıllık: %{yillikROI.toFixed(1)}</p>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400">Kira Getirisi (Yıllık)</span>
                            <span className="text-white font-bold">%{kiraGetirisi.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800">
                            <span className="text-slate-400">Toplam Kira Geliri ({sure} yıl)</span>
                            <span className="text-emerald-400 font-bold">{formatTL(toplamKiraGeliri)} ₺</span>
                        </div>
                        {toplamGider > 0 && (
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Toplam Gider</span>
                                <span className="text-orange-400 font-bold">-{formatTL(toplamGider)} ₺</span>
                            </div>
                        )}
                        {degerArtisi !== 0 && (
                            <div className="flex justify-between items-center py-3 border-b border-slate-800">
                                <span className="text-slate-400">Değer Artışı</span>
                                <span className={`font-bold ${degerArtisi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{degerArtisi >= 0 ? '+' : ''}{formatTL(degerArtisi)} ₺</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 px-4">
                            <span className="text-blue-300 font-semibold">Toplam Net Getiri</span>
                            <span className={`font-black text-2xl ${toplamGetiri >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatTL(toplamGetiri)} ₺</span>
                        </div>
                        {geriDonus > 0 && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                                <span className="text-slate-400 text-sm">Yatırım Geri Dönüş Süresi</span>
                                <span className="text-white font-bold">{geriDonus.toFixed(1)} Yıl</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <TrendingUp className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">Alış fiyatı girerek hesaplamayı başlatın</p>
                    </div>
                )}
            </div>
        </div>
    )
}
