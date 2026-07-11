'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Rocket, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { generateSegmentSuggestions } from '../segment-suggestions-actions'
import { toast } from 'sonner'

export function AiSuggestionsPanel({ tenantId }: { tenantId: string }) {
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)

    useEffect(() => {
        loadSuggestions()
    }, [tenantId])

    const loadSuggestions = async () => {
        setLoading(true)
        try {
            const data = await generateSegmentSuggestions(tenantId)
            setSuggestions(data)
        } catch {
            console.error('Failed to load suggestions')
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <Card className="p-4 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    AI önerileri yükleniyor...
                </div>
            </Card>
        )
    }

    if (suggestions.length === 0) return null

    const priorityColors: Record<string, string> = {
        high: 'bg-red-500/15 text-red-400 border-red-500/30',
        medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        low: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    }

    const priorityLabels: Record<string, string> = {
        high: 'Acil',
        medium: 'Orta',
        low: 'Düşük'
    }

    return (
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5 overflow-hidden">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">🤖 AI Önerileri</h3>
                        <p className="text-[10px] text-muted-foreground">{suggestions.length} aksiyon gerektiren segment tespit edildi</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadSuggestions() }}
                        className="h-6 text-[10px] px-2 text-muted-foreground">
                        Yenile
                    </Button>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 space-y-2.5">
                    {suggestions.map(s => (
                        <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border hover:border-purple-500/30 transition-colors">
                            <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold">{s.title}</h4>
                                    <Badge variant="outline" className={`text-[8px] ${priorityColors[s.priority]}`}>
                                        {priorityLabels[s.priority]}
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="text-[9px] text-muted-foreground">
                                        📊 Tahmini etki: <strong className="text-foreground">{s.estimatedImpact}</strong>
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                        💡 Öneri: <strong className="text-foreground">{s.suggestedAction}</strong>
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => toast.info('Kampanya oluşturma özelliği yakında aktif olacak')}
                                className="h-7 text-[10px] gap-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex-shrink-0"
                            >
                                <Rocket className="h-3 w-3" /> Başlat
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
