'use client'
import { useState } from 'react'
import { Calculator, Stamp } from 'lucide-react'

export default function DamgaVergisiClient() {
    const [sozlesmeBedeli, setSozlesmeBedeli] = useState('')
    const [sozlesmeTuru, setSozlesmeTuru] = useState<'satis' | 'kira' | 'diger'>('satis')

    const bedel = parseFloat(sozlesmeBedeli.replace(/\./g, '').replace(',', '.')) || 0

    // 2026 damga vergisi oranları
    const oranlar = {
        satis: { oran: 0.00948, label: '‰9,48 (Binde 9,48)', aciklama: 'Gayrimenkul satış sözleşmeleri' },
        kira: { oran: 0.00189, label: '‰1,89 (Binde 1,89)', aciklama: 'Kira sözleşmeleri' },
        diger: { oran: 0.00948, label: '‰9,48 (Binde 9,48)', aciklama: 'Diğer sözleşmeler (taahhüt, ihale)' },
    }

    const secili = oranlar[sozlesmeTuru]
    const damgaVergisi = bedel * secili.oran
    const noterlime = Math.min(bedel * 0.001 + 200, 30000)

    const formatTL = (v: number) => v.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    const handleChange = (val: string) => {
        const clean = val.replace(/[^\d]/g, '')
        if (!clean) { setSozlesmeBedeli(''); return }
        setSozlesmeBedeli(parseInt(clean).toLocaleString('tr-TR'))
    }

    return (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Stamp className="text-rose-400" size={24} /> Sözleşme Bilgileri</h2>
                <div className="space-y-5">
                    <div>
                        <label className="text-sm text-slate-400 mb-2 block">Sözleşme Bedeli (TL)</label>
                        <input type="text" value={sozlesmeBedeli} onChange={e => handleChange(e.target.value)} placeholder="5.000.000" className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-3 block">Sözleşme Türü</label>
                        <div className="space-y-2">
                            {([['satis', 'Gayrimenkul Satış Sözleşmesi', '‰9,48'], ['kira', 'Kira Sözleşmesi', '‰1,89'], ['diger', 'Diğer (Taahhüt, İhale)', '‰9,48']] as const).map(([key, label, rate]) => (
                                <button key={key} onClick={() => setSozlesmeTuru(key)} className={`w-full text-left p-4 rounded-xl transition-all ${sozlesmeTuru === key ? 'bg-rose-600/20 border border-rose-500/30 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                    <span className="font-semibold">{label}</span>
                                    <span className="text-xs ml-2 opacity-60">{rate}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-rose-900/20 to-slate-900 border border-rose-500/20">
                <h2 className="text-xl font-bold text-white mb-6">Sonuç</h2>
                {bedel > 0 ? (
                    <div className="space-y-4">
                        <div className="text-center py-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
                            <p className="text-sm text-rose-300 mb-1">Damga Vergisi</p>
                            <p className="text-5xl font-black text-rose-400">{formatTL(damgaVergisi)} ₺</p>
                            <p className="text-xs text-slate-500 mt-2">{secili.label}</p>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Sözleşme Bedeli</span><span className="text-white font-bold">{formatTL(bedel)} ₺</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Sözleşme Türü</span><span className="text-white font-bold">{secili.aciklama}</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Damga Vergisi Oranı</span><span className="text-rose-400 font-bold">{secili.label}</span></div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-800"><span className="text-slate-400">Tahmini Noterlik Ücreti</span><span className="text-white font-bold">{formatTL(noterlime)} ₺</span></div>
                        <div className="flex justify-between items-center py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 mt-2">
                            <span className="text-rose-300 font-semibold">Toplam Maliyet</span>
                            <span className="text-rose-400 font-black text-2xl">{formatTL(damgaVergisi + noterlime)} ₺</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12"><Stamp className="h-12 w-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500">Sözleşme bedelini girerek hesaplamayı başlatın</p></div>
                )}
            </div>
        </div>
    )
}
