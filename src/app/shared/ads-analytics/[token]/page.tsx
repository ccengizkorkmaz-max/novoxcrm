'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, Lock, Loader2 } from 'lucide-react'
import MetaAdsDashboard from '@/components/reports/MetaAutomationDashboard'

export default function SharedAdsAnalyticsPage() {
    const params = useParams()
    const token = params.token as string

    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState<any>(null)

    const fetchReportData = async (pwd = password, start = '', end = '', preset = 'last_30d') => {
        try {
            const dataRes = await fetch('/api/shared-report/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: pwd, startDate: start, endDate: end, datePreset: preset }),
            })
            const reportData = await dataRes.json()
            if (!dataRes.ok) {
                setError(reportData.error || 'Veri alınamadı')
                return null
            }
            return reportData
        } catch {
            setError('Bağlantı hatası')
            return null
        }
    }

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
            const reportData = await fetchReportData(password)
            if (reportData) {
                setData(reportData)
            }
        } catch {
            setError('Bağlantı hatası')
        }
        setLoading(false)
    }

    const handleFilterChange = async (start: string, end: string, preset: string) => {
        setLoading(true)
        const updatedData = await fetchReportData(password, start, end, preset)
        if (updatedData) {
            setData(updatedData)
        }
        setLoading(false)
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldCheck className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ads Analytics Raporu</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Bu rapor şifre ile korunmaktadır.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Erişim şifresini girin..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200/50 dark:border-red-900/20">{error}</p>
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
            {loading && (
                <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-200 dark:border-slate-800">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-xs font-bold">Veriler Güncelleniyor...</span>
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto">
                <MetaAdsDashboard 
                    initialData={data} 
                    locale="tr" 
                    isSharedView={true} 
                    onFilterChange={handleFilterChange} 
                />
            </div>
        </div>
    )
}
