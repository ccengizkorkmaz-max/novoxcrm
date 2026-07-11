import { createClient } from '@/lib/supabase/server'
import { getCallTimingAnalysis } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, Calendar, Star, AlertTriangle } from 'lucide-react'

export default async function CallTimingPage({
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

    const data = await getCallTimingAnalysis(profile.tenant_id, 30)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                        <Clock className="h-6 w-6 text-amber-400" />
                    </div>
                    Arama Zamanı Analizi
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Son 30 günde yapılan {data.totalCalls} arama analiz edildi
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Golden Hours */}
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                            <Star className="h-4 w-4" />
                            Altın Saatler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.goldenHours.length > 0 ? data.goldenHours.map(h => (
                                <Badge key={h} className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm font-bold">
                                    {h}
                                </Badge>
                            )) : (
                                <span className="text-xs text-muted-foreground">Yeterli veri yok</span>
                            )}
                        </div>
                        <p className="text-[10px] text-amber-500/70 mt-2">En yüksek cevaplama oranı</p>
                    </CardContent>
                </Card>

                {/* Avoid Hours */}
                <Card className="border-red-500/30 bg-red-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            Kaçınılacak Saatler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.avoidHours.length > 0 ? data.avoidHours.map(h => (
                                <Badge key={h} className="bg-red-500/20 text-red-300 border-red-500/30 text-sm font-bold">
                                    {h}
                                </Badge>
                            )) : (
                                <span className="text-xs text-muted-foreground">Yeterli veri yok</span>
                            )}
                        </div>
                        <p className="text-[10px] text-red-500/70 mt-2">En düşük cevaplama oranı</p>
                    </CardContent>
                </Card>

                {/* Best Day */}
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                            <Calendar className="h-4 w-4" />
                            En İyi Gün
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-emerald-300">
                            {data.bestDay || 'N/A'}
                        </p>
                        <p className="text-[10px] text-emerald-500/70 mt-1">
                            Cevaplama oranı: %{data.bestDayRate}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Hourly Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-400" />
                        Saat Bazlı Cevaplama Oranı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-48">
                        {data.hourly.map(h => {
                            const barHeight = h.total > 0 ? Math.max((h.answerRate / 100) * 100, 5) : 3
                            const isGolden = data.goldenHours.includes(h.label)
                            const isAvoid = data.avoidHours.includes(h.label)
                            return (
                                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    {/* Rate label */}
                                    <span className="text-[9px] font-bold text-muted-foreground">
                                        {h.total > 0 ? `%${h.answerRate}` : ''}
                                    </span>
                                    {/* Bar */}
                                    <div
                                        className={`w-full rounded-t-md transition-all ${
                                            isGolden ? 'bg-amber-500' :
                                            isAvoid ? 'bg-red-500/60' :
                                            h.total === 0 ? 'bg-slate-700' :
                                            'bg-blue-500/60'
                                        }`}
                                        style={{ height: `${barHeight}%` }}
                                    />
                                    {/* Hour label */}
                                    <span className={`text-[9px] font-bold ${
                                        isGolden ? 'text-amber-400' :
                                        isAvoid ? 'text-red-400' :
                                        'text-muted-foreground'
                                    }`}>
                                        {h.label.slice(0, 2)}
                                    </span>
                                    {/* Count */}
                                    <span className="text-[8px] text-muted-foreground">
                                        {h.total}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                            Altın Saat
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" />
                            Normal
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-red-500/60" />
                            Düşük Performans
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        Gün Bazlı Performans
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {data.daily
                        .filter(d => d.day >= 1 && d.day <= 5)
                        .sort((a, b) => a.day - b.day)
                        .map(d => {
                            const isBest = d.label === data.bestDay
                            return (
                                <div key={d.day} className="flex items-center gap-3">
                                    <span className={`text-xs font-bold w-20 ${isBest ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                        {d.label}
                                    </span>
                                    <div className="flex-1 bg-muted/30 rounded-full h-5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full flex items-center px-2 transition-all ${
                                                isBest ? 'bg-emerald-500' :
                                                d.answerRate >= 60 ? 'bg-blue-500/60' :
                                                d.answerRate >= 40 ? 'bg-amber-500/60' :
                                                'bg-red-500/40'
                                            }`}
                                            style={{ width: `${Math.max(d.answerRate, 5)}%` }}
                                        >
                                            <span className="text-[9px] font-bold text-white">
                                                %{d.answerRate}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground w-16 text-right">
                                        {d.total} arama
                                    </span>
                                    {isBest && (
                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">
                                            En İyi
                                        </Badge>
                                    )}
                                </div>
                            )
                        })}
                </CardContent>
            </Card>
        </div>
    )
}
