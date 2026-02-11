'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Brain, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AiAction {
    title: string
    description: string
    type: 'warning' | 'info' | 'success'
}

interface AiInsights {
    briefing: string
    actions: AiAction[]
}

export function AiInsightWidget() {
    const [insights, setInsights] = useState<AiInsights | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInsights = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/ai/insights')
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to fetch insights')
            }
            const data = await res.json()
            setInsights(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInsights()
    }, [])

    if (error) return null // Hide if AI is disabled or error

    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain className="h-24 w-24 text-purple-600 -rotate-12" />
            </div>

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        AI Satış Co-Pilot
                    </CardTitle>
                    <button
                        onClick={fetchInsights}
                        disabled={loading}
                        className="text-muted-foreground hover:text-indigo-600 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <CardDescription className="text-xs font-medium text-slate-500">
                    Verileriniz analiz edildi, bugünkü yol haritanız hazır.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        <p className="text-xs font-medium text-slate-400 animate-pulse">Veriler taranıyor, strateji oluşturuluyor...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-xl bg-white/60 border border-white/50 text-sm font-medium text-slate-700 leading-relaxed shadow-sm"
                        >
                            "{insights?.briefing}"
                        </motion.div>

                        <div className="grid grid-cols-1 gap-3">
                            <AnimatePresence>
                                {insights?.actions.map((action, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] border border-white/40 shadow-sm ${action.type === 'warning' ? 'bg-amber-50/80' :
                                                action.type === 'success' ? 'bg-emerald-50/80' :
                                                    'bg-blue-50/80'
                                            }`}
                                    >
                                        <div className={`mt-0.5 p-1 rounded-full ${action.type === 'warning' ? 'text-amber-600' :
                                                action.type === 'success' ? 'text-emerald-600' :
                                                    'text-blue-600'
                                            }`}>
                                            {action.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                                                action.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                                                    <TrendingUp className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">{action.title}</h4>
                                            <p className="text-xs text-slate-600 mt-0.5 leading-normal">{action.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <span className="text-[10px] text-slate-400 italic">Gemini 2.0 tarafından güçlendirildi.</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
