'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Home, Target, Loader2, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Match {
    unit_id: string
    project_name: string
    unit_number: string
    reason: string
    score: number
}

interface MatchResult {
    match_score: number
    recommendations: Match[]
    sales_pitch: string
}

export function AiMatchWidget({ customerId }: { customerId: string }) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<MatchResult | null>(null)

    const findMatches = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId })
            })
            if (!res.ok) throw new Error('Eşleşme bulunamadı')
            const data = await res.json()
            setResult(data)
            toast.success('AI Eşleşmeleri Hazır!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-xl border border-indigo-100/50 bg-gradient-to-br from-indigo-50/50 to-transparent p-3">
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Akıllı Mülk Eşleşmesi</span>
                </div>
                {!result && !loading && (
                    <Button
                        onClick={findMatches}
                        size="sm"
                        className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-1 rounded-full px-2.5"
                    >
                        <Sparkles className="h-3 w-3" />
                        AI Analiz
                    </Button>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-4 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span className="text-[10px] text-slate-500 animate-pulse">Eşleştiriliyor...</span>
                </div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        {/* Score */}
                        <div className="flex items-center gap-2 bg-white/60 p-2 rounded-lg border border-white">
                            <div className="h-8 w-8 rounded-full border-2 border-indigo-100 flex items-center justify-center bg-indigo-50 shrink-0">
                                <span className="text-xs font-bold text-indigo-600">{result.match_score}%</span>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-800">Genel Uyum</h4>
                                <p className="text-[9px] text-slate-400">Profil-portföy uyumu</p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        {result.recommendations.map((match, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 hover:border-indigo-200 transition-all"
                            >
                                <Home className="h-3 w-3 text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-700 block truncate">{match.project_name} - {match.unit_number}</span>
                                    <span className="text-[9px] text-slate-400 block truncate italic">{match.reason}</span>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                    %{match.score}
                                </span>
                            </motion.div>
                        ))}

                        {/* Sales Pitch */}
                        <div className="bg-indigo-900 text-white p-2 rounded-lg flex gap-2 items-start">
                            <MessageSquare className="h-3 w-3 text-indigo-300 shrink-0 mt-0.5" />
                            <div className="text-[9px] leading-relaxed">
                                <span className="font-bold text-indigo-200 uppercase tracking-wider">Tüyo: </span>
                                {result.sales_pitch}
                            </div>
                        </div>

                        <button
                            onClick={() => setResult(null)}
                            className="w-full text-[9px] text-slate-400 hover:text-indigo-600 transition-colors py-0.5"
                        >
                            Tekrar Analiz Et
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!result && !loading && (
                <p className="text-[9px] text-slate-400">Müşteri taleplerine uygun daireleri AI ile bulun.</p>
            )}
        </div>
    )
}
