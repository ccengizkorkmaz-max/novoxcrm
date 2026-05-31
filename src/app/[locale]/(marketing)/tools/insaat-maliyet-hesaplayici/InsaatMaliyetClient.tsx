'use client'
import { useState } from 'react'
import { Calculator, Building } from 'lucide-react'

export default function InsaatMaliyetClient() {
    const [alan, setAlan] = useState('')
    const [katSayisi, setKatSayisi] = useState('5')
    const [yapTipi, setYapTipi] = useState<'standart' | 'orta' | 'luks'>('orta')
    const [arsaMaliyet, setArsaMaliyet] = useState('')

    const m2 = parseFloat(alan.replace(/\./g, '').replace(',', '.')) || 0
    const kat = parseFloat(katSayisi) || 1
    const arsa = parseFloat(arsaMaliyet.replace(/\./g, '').replace(',', '.')) || 0

    const birimMaliyetler = { standart: 18000, orta: 28000, luks: 45000 }
    const birimMaliyet = birimMaliyetler[yapTipi]
    const toplamInsaatAlani = m2 * kat
    const kabaInsaat = toplamInsaatAlani * birimMaliyet * 0.45
    const inceInsaat = toplamInsaatAlani * birimMaliyet * 0.30
    const mekanik = toplamInsaatAlani * birimMaliyet * 0.15
    const cevreDuzenleme = toplamInsaatAlani * birimMaliyet * 0.10
    const toplamInsaat = kabaInsaat + inceInsaat + mekanik + cevreDuzenleme
    const genel = toplamInsaat + arsa
    const daireBasi = kat > 0 ? genel / (kat * 2) : 0 // Varsayılan kat başına 2 daire

    const formatTL = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const handleChange = (setter: (v: string) => void) => (val: string) => {
        const clean = val.replace(/[^\d]/g, '')
        if (!clean) { setter(''); return }
        setter(parseInt(clean).toLocaleString('tr-TR'))
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Building className="text-orange-400" size={24} /> Proje Bilgileri</h2>
                <div className="space-y-5">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Kat Başına İnşaat Alanı (m²)</label>
                        <input type="text" value={alan} onChange={e => { const clean = e.target.value.replace(/[^\d.,]/g, ''); setAlan(clean) }} placeholder="500" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Kat Sayısı</label>
                        <div className="flex gap-2">
                            {['3', '5', '8', '10', '15', '20'].map(k => (
                                <button key={k} onClick={() => setKatSayisi(k)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${katSayisi === k ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>{k}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Yapı Tipi</label>
                        <div className="flex gap-2">
                            {([['standart', 'Standart', '18.000 ₺/m²'], ['orta', 'Orta Üst', '28.000 ₺/m²'], ['luks', 'Lüks', '45.000 ₺/m²']] as const).map(([key, label, price]) => (
                                <button key={key} onClick={() => setYapTipi(key)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${yapTipi === key ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}>
                                    {label}<br /><span className="text-xs font-normal opacity-70">{price}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Arsa Maliyeti (TL) <span className="text-slate-600">— opsiyonel</span></label>
                        <input type="text" value={arsaMaliyet} onChange={e => handleChange(setArsaMaliyet)(e.target.value)} placeholder="10.000.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-900/20 to-slate-900 border border-orange-500/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Calculator className="text-orange-400" size={24} /> Maliyet Tahmini</h2>
                {m2 > 0 ? (
                    <div className="space-y-4">
                        <div className="text-center py-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
                            <p className="text-sm text-orange-300 mb-1">Toplam Proje Maliyeti</p>
                            <p className="text-4xl font-black text-orange-400">{formatTL(genel)} ₺</p>
                            <p className="text-xs text-slate-500 mt-2">{formatTL(toplamInsaatAlani)} m² toplam inşaat alanı</p>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Kaba İnşaat (%45)</span><span className="text-white font-bold">{formatTL(kabaInsaat)} ₺</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">İnce İşler (%30)</span><span className="text-white font-bold">{formatTL(inceInsaat)} ₺</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Mekanik & Elektrik (%15)</span><span className="text-white font-bold">{formatTL(mekanik)} ₺</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Çevre Düzenleme (%10)</span><span className="text-white font-bold">{formatTL(cevreDuzenleme)} ₺</span></div>
                        {arsa > 0 && <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Arsa Maliyeti</span><span className="text-white font-bold">{formatTL(arsa)} ₺</span></div>}
                        <div className="flex justify-between items-center py-3 px-4 rounded-2xl bg-slate-800/50 border border-slate-700">
                            <span className="text-slate-400 text-sm">Tahmini Daire Başı Maliyet</span>
                            <span className="text-orange-400 font-bold">{formatTL(daireBasi)} ₺</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12"><Building className="h-12 w-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">İnşaat alanını girerek hesaplamayı başlatın</p></div>
                )}
            </div>
        </div>
    )
}
