'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Sparkles, Home, Target, ChevronRight, Loader2, MessageSquare } from 'lucide-react'
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
        <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-transparent backdrop-blur-sm overflow-hidden border border-indigo-100/20">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Target className="h-5 w-5 text-indigo-600" />
                            Akıllı Mülk Eşleşmesi
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Müşteri taleplerine en uygun daireleri AI ile bulun.
                        </CardDescription>
                    </div>
                    {!result && !loading && (
                        <Button
                            onClick={findMatches}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2 rounded-full px-4"
                        >
                            <Sparkles className="h-4 w-4" />
                            AI Analiz Et
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                            <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse">Talep ve Stoklar Eşleştiriliyor...</p>
                    </div>
                )}

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Score Header */}
                            <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-white">
                                <div className="h-12 w-12 rounded-full border-4 border-indigo-100 flex items-center justify-center bg-indigo-50">
                                    <span className="text-lg font-bold text-indigo-600">{result.match_score}%</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Genel Uyum Skoru</h4>
                                    <p className="text-xs text-slate-500">Müşteri profili ile ürün portföyü arasındaki uyum.</p>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="grid grid-cols-1 gap-3">
                                {result.recommendations.map((match, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group flex flex-col p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-md relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Home className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{match.project_name} - No: {match.unit_number}</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                %{match.score} Uyum
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 italic leading-relaxed pl-8">
                                            "{match.reason}"
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Sales Pitch */}
                            <div className="bg-indigo-900 text-white p-4 rounded-2xl flex gap-3 items-center shadow-lg">
                                <MessageSquare className="h-5 w-5 text-indigo-300 shrink-0" />
                                <div className="text-xs">
                                    <span className="font-bold text-indigo-200 block mb-0.5 uppercase tracking-wider">Satış Tüyo:</span>
                                    {result.sales_pitch}
                                </div>
                            </div>

                            <Button
                                onClick={() => setResult(null)}
                                variant="ghost"
                                size="sm"
                                className="w-full text-[10px] text-slate-400 hover:text-indigo-600"
                            >
                                Tekrar Analiz Et
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
