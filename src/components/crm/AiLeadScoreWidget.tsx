'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, RefreshCw, Lightbulb, Clock, TrendingUp } from 'lucide-react'

interface AiScoreData {
    score: number
    label: string
    signals: { icon: string; text: string }[]
    suggestion: string
    bestCallTime: string | null
    confidence: number
}

export function AiLeadScoreWidget({
    customerId,
    initialScore,
    initialData,
    lastUpdated
}: {
    customerId: string
    initialScore: number | null
    initialData: AiScoreData | null
    lastUpdated: string | null
}) {
    const [score, setScore] = useState(initialScore)
    const [data, setData] = useState<AiScoreData | null>(initialData)
    const [loading, setLoading] = useState(false)
    const [updated, setUpdated] = useState(lastUpdated)

    const getScoreColor = (s: number) => {
        if (s >= 80) return { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-400', ring: 'ring-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
        if (s >= 60) return { bg: 'from-amber-500 to-orange-500', text: 'text-amber-400', ring: 'ring-amber-500/20', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
        if (s >= 40) return { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-400', ring: 'ring-blue-500/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
        if (s >= 20) return { bg: 'from-slate-500 to-gray-500', text: 'text-slate-400', ring: 'ring-slate-500/20', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
        return { bg: 'from-red-500 to-rose-500', text: 'text-red-400', ring: 'ring-red-500/20', badge: 'bg-red-500/20 text-red-300 border-red-500/30' }
    }

    const refreshScore = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/lead-score/${customerId}`, { method: 'POST' })
            if (res.ok) {
                const result = await res.json()
                setScore(result.score)
                setData(result)
                setUpdated(new Date().toISOString())
            }
        } catch (e) {
            console.error('Score refresh failed:', e)
        } finally {
            setLoading(false)
        }
    }

    if (score === null || score === undefined) {
        return (
            <Card className="border-dashed border-2 border-violet-500/20">
                <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Brain className="h-4 w-4" />
                        <span className="text-xs">AI Satın Alma Skoru henüz hesaplanmadı</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={refreshScore}
                        disabled={loading}
                        className="text-xs h-7"
                    >
                        {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        <span className="ml-1">{loading ? 'Hesaplanıyor...' : 'Hesapla'}</span>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const colors = getScoreColor(score)

    return (
        <Card className={`ring-2 ${colors.ring} overflow-hidden`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Score Circle */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}>
                            <span className="text-xl font-black text-white">{score}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <Brain className={`h-3.5 w-3.5 ${colors.text}`} />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">AI Satın Alma Skoru</h3>
                            <Badge className={`text-[9px] ${colors.badge}`}>
                                {data?.label || 'N/A'}
                            </Badge>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={refreshScore}
                                disabled={loading}
                                className="h-5 w-5 p-0 ml-auto"
                            >
                                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
                            </Button>
                        </div>

                        {/* Signals */}
                        {data?.signals && data.signals.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {data.signals.slice(0, 4).map((s, i) => (
                                    <span key={i} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                        {s.icon} {s.text}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Suggestion */}
                        {data?.suggestion && (
                            <div className="flex items-start gap-1.5 text-[10px]">
                                <Lightbulb className={`h-3 w-3 mt-0.5 ${colors.text} flex-shrink-0`} />
                                <span className="font-medium">{data.suggestion}</span>
                            </div>
                        )}

                        {/* Best call time */}
                        {data?.bestCallTime && (
                            <div className="flex items-center gap-1.5 text-[10px] mt-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Önerilen arama: {data.bestCallTime}</span>
                            </div>
                        )}

                        {/* Last updated */}
                        {updated && (
                            <p className="text-[9px] text-muted-foreground/50 mt-1.5">
                                Son güncelleme: {new Date(updated).toLocaleDateString('tr-TR')} {new Date(updated).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                {data?.confidence ? ` • Güven: %${data.confidence}` : ''}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
