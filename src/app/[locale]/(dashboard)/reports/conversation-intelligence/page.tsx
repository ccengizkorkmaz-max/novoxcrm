import { createClient } from '@/lib/supabase/server'
import { analyzeConversations } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, TrendingDown, Minus, MessageSquare, AlertTriangle, Lightbulb } from 'lucide-react'

export default async function ConversationIntelligencePage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Yetkilendirme hatası</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Tenant bulunamadı</div>

    const data = await analyzeConversations(profile.tenant_id, 7)

    const TrendIcon = ({ trend }: { trend?: string }) => {
        if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-400" />
        if (trend === 'down') return <TrendingDown className="h-3 w-3 text-emerald-400" />
        return <Minus className="h-3 w-3 text-muted-foreground" />
    }

    const trendLabel = (trend?: string) => {
        if (trend === 'up') return 'Artıyor'
        if (trend === 'down') return 'Azalıyor'
        return 'Stabil'
    }

    const sentimentEmoji = (sentiment?: string) => {
        if (sentiment === 'positive') return '😊'
        if (sentiment === 'negative') return '😟'
        return '😐'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
                        <Brain className="h-6 w-6 text-violet-400" />
                    </div>
                    Konuşma Zekası
                </h1>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-muted-foreground">
                        Son 7 günde {data.totalCalls} aramadan {data.analyzedCalls} transkript analiz edildi
                    </p>
                    {data.cached && (
                        <Badge variant="outline" className="text-[9px] text-muted-foreground">Cache</Badge>
                    )}
                </div>
            </div>

            {data.analyzedCalls === 0 ? (
                <Card className="border-dashed border-2 p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Brain className="h-12 w-12 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Henüz analiz edilecek transkript bulunmuyor.</p>
                        <p className="text-xs text-muted-foreground">AI aramalar yaptıkça bu sayfa otomatik olarak dolacaktır.</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Tone Analysis Summary */}
                    {data.tonAnalysis && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="border-violet-500/20">
                                <CardContent className="pt-4 pb-3 text-center">
                                    <p className="text-3xl">{sentimentEmoji(data.tonAnalysis.overallSentiment)}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">Genel Ton</p>
                                    <p className="text-xs font-bold mt-0.5 capitalize">{data.tonAnalysis.overallSentiment}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-blue-500/20">
                                <CardContent className="pt-4 pb-3 text-center">
                                    <p className="text-3xl font-black text-blue-400">%{data.tonAnalysis.averageEngagement}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">İlgi Seviyesi</p>
                                </CardContent>
                            </Card>
                            <Card className="border-emerald-500/20">
                                <CardContent className="pt-4 pb-3 text-center">
                                    <p className="text-3xl font-black text-emerald-400">%{data.tonAnalysis.politenessScore}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">Kibarlık Skoru</p>
                                </CardContent>
                            </Card>
                            <Card className={`${data.tonAnalysis.imperativeViolations > 0 ? 'border-red-500/30' : 'border-emerald-500/20'}`}>
                                <CardContent className="pt-4 pb-3 text-center">
                                    <p className={`text-3xl font-black ${data.tonAnalysis.imperativeViolations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {data.tonAnalysis.imperativeViolations}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">Emir Kipi İhlali</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Questions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-400" />
                                    En Sık Sorulan Sorular
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(data.topQuestions || []).map((q: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-muted-foreground w-5">{i + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium">{q.question}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-blue-500/60"
                                                        style={{ width: `${q.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold w-8">%{q.percentage}</span>
                                                <TrendIcon trend={q.trend} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!data.topQuestions || data.topQuestions.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">Veri yok</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Objections */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    İtiraz Trendleri
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(data.objections || []).map((o: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs font-black text-muted-foreground w-5">{i + 1}.</span>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium">{o.objection}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${o.trend === 'up' ? 'bg-red-500/60' : 'bg-amber-500/40'}`}
                                                        style={{ width: `${o.percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold w-8">%{o.percentage}</span>
                                                <TrendIcon trend={o.trend} />
                                                <span className={`text-[9px] font-bold ${o.trend === 'up' ? 'text-red-400' : o.trend === 'down' ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                                    {trendLabel(o.trend)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!data.objections || data.objections.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4">Veri yok</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Suggestions */}
                    <Card className="border-violet-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-violet-400" />
                                AI Script Önerileri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(data.aiSuggestions || []).map((s: any, i: number) => {
                                const colors: Record<string, string> = {
                                    warning: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
                                    important: 'border-red-500/30 bg-red-500/5 text-red-300',
                                    tip: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
                                    error: 'border-red-500/30 bg-red-500/5 text-red-300'
                                }
                                const color = colors[s.type] || colors.tip
                                return (
                                    <div key={i} className={`p-3 rounded-lg border ${color}`}>
                                        <div className="flex items-start gap-2">
                                            <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs font-medium">{s.text}</p>
                                        </div>
                                        {s.priority && (
                                            <Badge variant="outline" className="mt-2 text-[9px]">
                                                {s.priority === 'high' ? '🔴 Yüksek' : s.priority === 'medium' ? '🟡 Orta' : '🟢 Düşük'}
                                            </Badge>
                                        )}
                                    </div>
                                )
                            })}
                            {(!data.aiSuggestions || data.aiSuggestions.length === 0) && (
                                <p className="text-xs text-muted-foreground text-center py-4">Öneri yok</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
