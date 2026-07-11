import { createClient } from '@/lib/supabase/server'
import { analyzeSuccessPatterns } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, TrendingUp, Clock, CheckCircle, XCircle, Sparkles, Lightbulb } from 'lucide-react'
import { ApplyPromptButton } from './ApplyPromptButton'

export default async function SelfLearningPage({
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

    const data = await analyzeSuccessPatterns(profile.tenant_id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                        <Brain className="h-6 w-6 text-purple-400" />
                    </div>
                    Self-Learning Script Engine
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Son 30 günde {data.totalCalls} arama transkripti analiz edildi — Başarı oranı: %{data.successRate}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Toplam Arama</p>
                        <p className="text-2xl font-black mt-1">{data.totalCalls}</p>
                        <p className="text-xs text-muted-foreground">transkript analizi</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Başarılı</p>
                        <p className="text-2xl font-black mt-1 text-emerald-400">{data.successfulCalls}</p>
                        <p className="text-xs text-muted-foreground">randevu/ilgi</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Başarısız</p>
                        <p className="text-2xl font-black mt-1 text-red-400">{data.failedCalls}</p>
                        <p className="text-xs text-muted-foreground">red/cevapsız</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ort. Süre (Başarılı)</p>
                        <p className="text-2xl font-black mt-1">{data.avgSuccessfulDuration}sn</p>
                        <p className="text-xs text-muted-foreground">vs {data.avgFailedDuration}sn (başarısız)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Improvements */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-400" /> Keşfedilen İyileştirmeler
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.improvements.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Henüz yeterli veri yok</p>
                    ) : (
                        <div className="space-y-2">
                            {data.improvements.map((imp, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border">
                                    <span className="text-sm flex-shrink-0 mt-0.5">
                                        {imp.startsWith('✅') ? '✅' : imp.startsWith('💡') ? '💡' : '⚠️'}
                                    </span>
                                    <p className="text-xs">{imp.replace(/^[✅💡⚠️]\s*/, '')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Success Patterns */}
            {data.patterns.successful.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-400" /> Başarılı Arama Kalıpları
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.patterns.successful.slice(0, 8).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
                                            {p.frequency}x
                                        </Badge>
                                        <span className="text-xs font-mono">"{p.pattern}"</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Prompt Comparison */}
            {data.suggestedPrompt && (
                <Card className="border-purple-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" /> Prompt İyileştirme Önerisi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                                    Mevcut Prompt
                                </p>
                                <div className="p-3 rounded-lg bg-muted/30 border text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {data.currentPrompt || 'Prompt bulunamadı'}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-2 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> Önerilen Prompt
                                </p>
                                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                    {data.suggestedPrompt}
                                </div>
                            </div>
                        </div>

                        <ApplyPromptButton
                            tenantId={profile.tenant_id}
                            newPrompt={data.suggestedPrompt}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
