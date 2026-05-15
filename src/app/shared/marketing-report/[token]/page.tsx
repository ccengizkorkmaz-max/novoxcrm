'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Lock, Loader2, Target, Megaphone, Building2, PieChart } from 'lucide-react'

export default function SharedMarketingReportPage() {
    const params = useParams()
    const token = params.token as string

    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState<any>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // First verify
            const verifyRes = await fetch('/api/shared-report/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
                setError(verifyData.error || 'Doğrulama başarısız')
                setLoading(false)
                return
            }

            // Then fetch data
            const dataRes = await fetch('/api/shared-report/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const reportData = await dataRes.json()
            if (!dataRes.ok) {
                setError(reportData.error || 'Veri alınamadı')
                setLoading(false)
                return
            }

            setData(reportData)
        } catch {
            setError('Bağlantı hatası')
        }
        setLoading(false)
    }

    const getChannelColor = (ch: string) => {
        if (ch.includes('Facebook')) return 'bg-blue-600 text-white'
        if (ch.includes('Instagram')) return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        if (ch.includes('Web')) return 'bg-emerald-600 text-white'
        if (ch.includes('E-Posta')) return 'bg-amber-600 text-white'
        if (ch.includes('WhatsApp')) return 'bg-green-600 text-white'
        return 'bg-slate-600 text-white'
    }

    const getStatusColor = (status: string) => {
        if (status.includes('Satıldı') || status.includes('Kazanıldı')) return 'bg-green-100 text-green-700'
        if (status === 'Aday') return 'bg-blue-50 text-blue-600'
        if (status.includes('Teklif')) return 'bg-purple-100 text-purple-700'
        if (status.includes('Kaybedildi') || status.includes('İptal')) return 'bg-red-50 text-red-600'
        if (status.includes('Sözleşme') || status.includes('Opsiyonlu')) return 'bg-emerald-100 text-emerald-700'
        return 'bg-slate-100 text-slate-700'
    }

    // Password Form
    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl border p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">Pazarlama Raporu</h1>
                            <p className="text-sm text-slate-500">Bu rapor şifre ile korunmaktadır.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Erişim şifresini girin..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
                            )}
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                Raporu Görüntüle
                            </button>
                        </form>

                        <p className="text-[10px] text-center text-slate-400">
                            Bu rapor yalnızca yetkili kişilerle paylaşılmıştır.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Report View
    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Pazarlama Performans Analizi</h1>
                    <p className="text-sm text-slate-500 mt-1">Dijital kanallardan gelen lead&apos;lerin kanal, proje ve kampanya bazlı analizi</p>
                    <div className="mt-4 flex gap-4">
                        <div className="px-4 py-2 bg-blue-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-blue-700">{data.totalMarketingLeads?.toLocaleString('tr-TR')}</div>
                            <div className="text-[10px] text-blue-500 font-bold uppercase">Toplam Lead</div>
                        </div>
                        <div className="px-4 py-2 bg-purple-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-purple-700">{data.channelData?.length}</div>
                            <div className="text-[10px] text-purple-500 font-bold uppercase">Aktif Kanal</div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-700">{data.formData?.length}</div>
                            <div className="text-[10px] text-emerald-500 font-bold uppercase">Kampanya</div>
                        </div>
                    </div>
                </div>

                {/* Channel Summary */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                        <h2 className="font-semibold">Kanal Bazlı Performans</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium text-slate-500">Kanal</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bugün</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bu Hafta</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bu Ay</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.channelData?.map((ch: any, i: number) => (
                                    <tr key={i} className="border-b hover:bg-slate-50/50">
                                        <td className="p-3"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getChannelColor(ch.name)}`}>{ch.name}</span></td>
                                        <td className="text-center p-3 font-semibold">{ch.today > 0 ? <span className="text-blue-600">+{ch.today}</span> : '0'}</td>
                                        <td className="text-center p-3 font-semibold">{ch.thisWeek > 0 ? <span className="text-blue-600">+{ch.thisWeek}</span> : '0'}</td>
                                        <td className="text-center p-3 font-semibold">{ch.thisMonth > 0 ? <span className="text-blue-600">+{ch.thisMonth}</span> : '0'}</td>
                                        <td className="text-center p-3 font-bold text-lg">{ch.total.toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Project Summary */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-semibold">Proje Bazlı Lead Dağılımı</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium text-slate-500">Proje</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bugün</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bu Hafta</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Bu Ay</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Toplam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.projectData?.map((p: any, i: number) => (
                                    <tr key={i} className="border-b hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold">{p.name}</td>
                                        <td className="text-center p-3 font-semibold">{p.today > 0 ? <span className="text-emerald-600">+{p.today}</span> : '0'}</td>
                                        <td className="text-center p-3 font-semibold">{p.thisWeek > 0 ? <span className="text-emerald-600">+{p.thisWeek}</span> : '0'}</td>
                                        <td className="text-center p-3 font-semibold">{p.thisMonth > 0 ? <span className="text-emerald-600">+{p.thisMonth}</span> : '0'}</td>
                                        <td className="text-center p-3 font-bold text-lg">{p.total.toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Campaign Detail */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold">Kampanya Detay Analizi</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="text-left p-3 font-medium text-slate-500">Kanal</th>
                                    <th className="text-left p-3 font-medium text-slate-500">Proje</th>
                                    <th className="text-left p-3 font-medium text-slate-500">Kampanya</th>
                                    <th className="text-center p-3 font-medium text-slate-500">Toplam</th>
                                    <th className="text-left p-3 font-medium text-slate-500">Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.formData?.slice(0, 50).map((f: any, i: number) => (
                                    <tr key={i} className="border-b hover:bg-slate-50/50">
                                        <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getChannelColor(f.channel)}`}>{f.channel}</span></td>
                                        <td className="p-3 font-medium text-sm">{f.project || '—'}</td>
                                        <td className="p-3 text-xs text-slate-500">{f.campaign || '—'}</td>
                                        <td className="text-center p-3 font-bold">{f.total}</td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(f.statuses || {}).map(([status, count]: [string, any], si: number) => (
                                                    <span key={si} className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(status)}`}>
                                                        {status}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 py-4">
                    Bu rapor şifre korumalı olarak paylaşılmıştır. Yetkisiz dağıtımı yasaktır.
                </p>
            </div>
        </div>
    )
}
