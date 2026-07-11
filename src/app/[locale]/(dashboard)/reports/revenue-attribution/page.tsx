import { createClient } from '@/lib/supabase/server'
import { getRevenueAttribution } from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Bot, TrendingUp, Clock, Phone, MessageSquare, Users, ArrowRight } from 'lucide-react'

function formatCurrency(amount: number, currency = 'TRY') {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ₺`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ₺`
    return `${amount.toLocaleString('tr-TR')} ₺`
}

export default async function RevenueAttributionPage({
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

    const data = await getRevenueAttribution(profile.tenant_id)

    const channelLabels: Record<string, string> = {
        ai_call: '🤖 AI Arama (Maya)',
        whatsapp: '💬 WhatsApp',
        sms: '📱 SMS',
        direct: '🏢 Doğrudan Satış'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
                        <DollarSign className="h-6 w-6 text-amber-400" />
                    </div>
                    Revenue Attribution
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Son 6 ayda {data.totalSales} satış analiz edildi — Maya katkı oranı: %{data.mayaContributionRate}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Toplam Gelir</p>
                        <p className="text-2xl font-black mt-1">{formatCurrency(data.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{data.totalSales} satış</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-600/5 border-violet-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Maya Katkılı Gelir</p>
                        <p className="text-2xl font-black mt-1 text-violet-400">{formatCurrency(data.mayaContributedRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{data.mayaContributedCount} satış (%{data.mayaContributionRate})</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ort. Kapanış Süresi</p>
                        <p className="text-2xl font-black mt-1">{data.avgDaysToClose} gün</p>
                        <p className="text-xs text-muted-foreground">Lead → Satış</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Ort. Dokunma Sayısı</p>
                        <p className="text-2xl font-black mt-1">{data.avgTouchesBeforeSale}</p>
                        <p className="text-xs text-muted-foreground">Satış öncesi etkileşim</p>
                    </CardContent>
                </Card>
            </div>

            {/* Channel Breakdown */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" /> Kanal Bazlı Gelir Dağılımı
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.channelBreakdown.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Henüz yeterli veri yok</p>
                    ) : (
                        <div className="space-y-3">
                            {data.channelBreakdown.map(ch => {
                                const pct = data.totalRevenue > 0 ? Math.round((ch.revenue / data.totalRevenue) * 100) : 0
                                return (
                                    <div key={ch.channel}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{channelLabels[ch.channel] || ch.channel}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground">{ch.count} satış</span>
                                                <span className="text-sm font-bold">{formatCurrency(ch.revenue)}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            %{pct} toplam gelir · Ort. {ch.avgTouches} dokunma
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Monthly Trend */}
            {data.monthlyTrend.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-400" /> Aylık Gelir Trendi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            {data.monthlyTrend.map(m => (
                                <div key={m.month} className="text-center p-3 rounded-lg bg-muted/30 border">
                                    <p className="text-[10px] font-bold text-muted-foreground">{m.month}</p>
                                    <p className="text-lg font-black mt-1">{formatCurrency(m.revenue)}</p>
                                    <p className="text-[9px] text-muted-foreground">{m.sales} satış</p>
                                    {m.mayaRevenue > 0 && (
                                        <Badge variant="outline" className="mt-1 text-[8px] text-violet-400 border-violet-500/30">
                                            🤖 {formatCurrency(m.mayaRevenue)}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sales Journey Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" /> Satış Yolculukları
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="py-2 px-2 font-semibold">Müşteri</th>
                                    <th className="py-2 px-2 font-semibold">Proje</th>
                                    <th className="py-2 px-2 font-semibold text-right">Tutar</th>
                                    <th className="py-2 px-2 font-semibold text-center">Maya</th>
                                    <th className="py-2 px-2 font-semibold text-center">WA</th>
                                    <th className="py-2 px-2 font-semibold text-center">Dokunma</th>
                                    <th className="py-2 px-2 font-semibold text-center">Gün</th>
                                    <th className="py-2 px-2 font-semibold">Kaynak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.journeys.map(j => (
                                    <tr key={j.saleId} className="border-b border-border/30 hover:bg-muted/30">
                                        <td className="py-2 px-2 font-medium">{j.customerName}</td>
                                        <td className="py-2 px-2 text-muted-foreground">{j.projectName}</td>
                                        <td className="py-2 px-2 text-right font-bold">{formatCurrency(j.finalPrice)}</td>
                                        <td className="py-2 px-2 text-center">
                                            {j.mayaCalls > 0 ? (
                                                <Badge className="bg-violet-500/20 text-violet-400 text-[9px]">
                                                    <Phone className="h-2.5 w-2.5 mr-0.5" />{j.mayaCalls}
                                                </Badge>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                            {j.whatsappMessages > 0 ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">
                                                    <MessageSquare className="h-2.5 w-2.5 mr-0.5" />{j.whatsappMessages}
                                                </Badge>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="py-2 px-2 text-center font-mono">{j.outreachTouches}</td>
                                        <td className="py-2 px-2 text-center font-mono">{j.daysToClose}g</td>
                                        <td className="py-2 px-2">
                                            <Badge variant="outline" className="text-[9px]">{j.leadSource}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {data.journeys.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                            Henüz satış verisi bulunamadı
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
