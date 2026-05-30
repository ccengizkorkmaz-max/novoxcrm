'use client'

import React, { useState, useEffect } from 'react'
import { getOutreachCostReportData } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import { BackButton } from "@/components/back-button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    DollarSign,
    Phone,
    MessageCircle,
    Users,
    TrendingUp,
    Clock,
    Printer,
    RefreshCw,
    AlertCircle,
    Calendar,
    HelpCircle,
    Activity,
    Info,
    Percent,
    Sparkles
} from 'lucide-react'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip as RechartsTooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'

export default function OutreachCostReportPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all')

    const loadData = async (workflowId: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const res = await getOutreachCostReportData(workflowId)
            if ('error' in res) {
                toast.error('Yetkisiz erişim veya veri hatası!')
            } else {
                setData(res)
                if (isRefresh) {
                    toast.success('Maliyet verileri güncellendi!')
                }
            }
        } catch (error) {
            console.error('Error loading report:', error)
            toast.error('Maliyet raporu yüklenirken hata oluştu!')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadData(selectedWorkflow)
    }, [selectedWorkflow])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Outreach maliyet analizleri hesaplanıyor...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold">Veri Bulunamadı</h3>
                <p className="text-muted-foreground">Kampanyaya ait maliyet kayıtları yüklenemedi.</p>
            </div>
        )
    }

    // Pie chart distribution data
    const pieData = [
        { name: 'AI Sesli Arama', value: data.totalCallCost, color: '#6366f1' },
        { name: 'WhatsApp Takip', value: data.totalWhatsAppCost, color: '#10b981' }
    ].filter(item => item.value > 0)

    // Format currencies
    const formatUSD = (val: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(val)
    }

    const formatTRY = (val: number) => {
        // Assume static 34.0 exchange rate for representation
        const tryVal = val * 34.0
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(tryVal)
    }

    const reachRate = data.totalUniqueCustomers > 0 
        ? (data.totalUniqueReached / data.totalUniqueCustomers) * 100 
        : 0

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <BackButton variant="ghost" size="icon" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Outreach Maliyet Analizi</h1>
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20 gap-1.5 py-0.5">
                                <Sparkles className="h-3 w-3 text-purple-400" /> Finansal Rapor
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {data.campaignName} — Harcama ve Erişim Maliyeti Raporu
                        </p>
                    </div>
                </div>

                {/* Dropdown Selector + Print Actions */}
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <div className="w-[280px]">
                        <Select
                            value={selectedWorkflow}
                            onValueChange={(val) => setSelectedWorkflow(val)}
                        >
                            <SelectTrigger className="w-full bg-card/50 backdrop-blur-sm border-border/40 text-xs font-semibold h-9 rounded-lg">
                                <SelectValue placeholder="Rapor Filtresi Seçin" />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 border-border/45">
                                <SelectItem value="all" className="text-xs font-semibold cursor-pointer">🌐 Tüm Kampanyalar (Toplam)</SelectItem>
                                <SelectItem value="manual" className="text-xs font-semibold cursor-pointer">📞 Tekil Aramalar (Manuel AI)</SelectItem>
                                {data.workflows?.map((w: any) => (
                                    <SelectItem key={w.id} value={w.id} className="text-xs font-semibold cursor-pointer">
                                        🚀 {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadData(selectedWorkflow, true)}
                        disabled={refreshing}
                        className="h-9 gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Güncelleniyor...' : 'Yenile'}
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
                    >
                        <Printer className="h-4 w-4" />
                        PDF / Yazdır
                    </Button>
                </div>
            </div>

            {/* Quick Summary Banner (TRY representation) */}
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 backdrop-blur-md">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" /> Rapor Harcama Özeti ({data.campaignName})
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-xl">
                        Yapay Zeka Sesli Arama platform maliyetleri ve Meta WhatsApp Cloud API mesajlaşma harcamalarının canlı döviz ve sabit tarife üzerinden hesaplanmış detayları.
                    </p>
                </div>
                <div className="flex items-baseline gap-4 md:text-right">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tahmini TRY Karşılığı (1 USD = 34 TRY)</div>
                        <div className="text-3xl font-black text-indigo-400 tracking-tight">{formatTRY(data.totalCost)}</div>
                    </div>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Spend */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-indigo-500 group-hover:scale-110 transition-all">
                        <DollarSign className="h-20 w-20" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Toplam Harcama
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight text-foreground">{formatUSD(data.totalCost)}</div>
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center justify-between">AI Arama: <strong className="text-indigo-400">{formatUSD(data.totalCallCost)}</strong></span>
                            <span className="flex items-center justify-between">WhatsApp: <strong className="text-emerald-400">{formatUSD(data.totalWhatsAppCost)}</strong></span>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Per Call */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-amber-500 group-hover:scale-110 transition-all">
                        <Phone className="h-20 w-20" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Arama Başına Maliyet
                        </CardTitle>
                        <Phone className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight text-foreground">{formatUSD(data.avgCostPerCallAttempt)}</div>
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center justify-between">Bağlanan Arama: <strong className="text-amber-500">{formatUSD(data.avgCostPerAnsweredCall)}</strong></span>
                            <span className="flex items-center justify-between">Ort. Görüşme Süresi: <strong className="text-amber-500">{Math.round(data.avgCallDurationSeconds)} sn</strong></span>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Per Unique Reach */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-teal-500 group-hover:scale-110 transition-all">
                        <Users className="h-20 w-20" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Erişim Başına Maliyet
                        </CardTitle>
                        <Users className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight text-foreground">{formatUSD(data.costPerUniqueReach)}</div>
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center justify-between">Hedef Başına Ort: <strong className="text-teal-400">{formatUSD(data.costPerTargetCustomer)}</strong></span>
                            <span className="flex items-center justify-between">Temas Edilen Tekil: <strong className="text-teal-400">{data.totalUniqueReached.toLocaleString('tr-TR')} Müşteri</strong></span>
                        </div>
                    </CardContent>
                </Card>

                {/* Campaign Segment Status */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-500 group-hover:scale-110 transition-all">
                        <Percent className="h-20 w-20" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Segment Erişim Oranı
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tight text-emerald-500">%{reachRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-muted-foreground font-semibold">
                            <span className="flex items-center justify-between">Toplam Ulaşılan: <strong className="text-emerald-400">{data.totalUniqueReached} / {data.totalUniqueCustomers}</strong></span>
                            <span className="flex items-center justify-between">Dönüşüm Sağlanan: <strong className="text-emerald-400">{data.statusCounts.converted || 0} Aday</strong></span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Channel Spend Pie Chart */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl md:col-span-1 flex flex-col justify-between">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Kanal Harcama Dağılımı</CardTitle>
                        <CardDescription>AI Sesli Arama ve WhatsApp bütçe kırılımları</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center items-center h-64 relative pb-4">
                        {pieData.length === 0 ? (
                            <div className="text-center text-xs text-muted-foreground">Harcama verisi bulunamadı.</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle"
                                            formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                                        />
                                        <RechartsTooltip 
                                            formatter={(value: any) => [formatUSD(value), 'Harcama']}
                                            contentStyle={{ background: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-[41%] text-center">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Toplam</span>
                                    <div className="text-lg font-black tracking-tight">{formatUSD(data.totalCost)}</div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Spend Trend Stacked Area Chart */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Günlük Harcama Trendi</CardTitle>
                        <CardDescription>Zaman bazında günlük harcama seyri (USD)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                        {data.dailySpend.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Erişim trend verisi bulunamadı.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.dailySpend}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCall" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(str) => {
                                            if (!str) return '';
                                            const d = new Date(str + 'T00:00:00');
                                            return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                                        }}
                                    />
                                    <YAxis 
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={10}
                                        tickLine={false}
                                        tickFormatter={(val) => `$${val}`}
                                    />
                                    <RechartsTooltip 
                                        formatter={(value: any) => [formatUSD(value), '']}
                                        labelFormatter={(label) => {
                                            const d = new Date(label + 'T00:00:00');
                                            return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                                        }}
                                        contentStyle={{ background: 'rgba(30, 30, 40, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        name="AI Arama Harcaması"
                                        dataKey="callCost" 
                                        stackId="1"
                                        stroke="#6366f1" 
                                        fillOpacity={1} 
                                        fill="url(#colorCall)" 
                                    />
                                    {selectedWorkflow !== 'manual' && (
                                        <Area 
                                            type="monotone" 
                                            name="WhatsApp Harcaması"
                                            dataKey="whatsappCost" 
                                            stackId="1"
                                            stroke="#10b981" 
                                            fillOpacity={1} 
                                            fill="url(#colorWhatsapp)" 
                                        />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Spend Details & Info */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Details Table */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl md:col-span-2 overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">Günlük Detaylı Maliyet Dökümü</CardTitle>
                        <CardDescription>Gün bazında işlem adetleri ve kanal harcamaları</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-96 scrollbar-thin">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-semibold">
                                        <th className="p-3">Tarih</th>
                                        <th className="p-3 text-right">Arama Adedi</th>
                                        <th className="p-3 text-right">Arama Maliyeti (USD)</th>
                                        <th className="p-3 text-right">WhatsApp Adedi</th>
                                        <th className="p-3 text-right">WhatsApp Maliyeti (USD)</th>
                                        <th className="p-3 text-right font-bold text-foreground">Toplam Günlük Maliyet</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.dailySpend.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">Aktif harcama kaydı bulunamadı.</td>
                                        </tr>
                                    ) : (
                                        data.dailySpend.map((row: any) => (
                                            <tr key={row.date} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                                                <td className="p-3 font-mono">
                                                    {new Date(row.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-right tabular-nums">{row.callCount.toLocaleString('tr-TR')}</td>
                                                <td className="p-3 text-right tabular-nums">{formatUSD(row.callCost)}</td>
                                                <td className="p-3 text-right tabular-nums">{row.whatsappCount.toLocaleString('tr-TR')}</td>
                                                <td className="p-3 text-right tabular-nums">{formatUSD(row.whatsappCost)}</td>
                                                <td className="p-3 text-right font-bold tabular-nums text-indigo-400">{formatUSD(row.totalCost)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Calculation Methodology Information Panel */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Info className="h-5 w-5 text-indigo-500" /> Rapor Parametreleri
                        </CardTitle>
                        <CardDescription>Maliyet hesaplama ve veri kaynakları</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
                        <div className="space-y-2">
                            <h4 className="font-bold text-indigo-200">1. AI Telefon Arama Maliyetleri</h4>
                            <p>
                                Vapi webhook entegrasyonu üzerinden dönen gerçek çağrı maliyetleri (`cost_amount`) baz alınır.
                            </p>
                            <p className="bg-muted/50 p-2.5 rounded-lg border border-border/20 text-muted-foreground">
                                💡 <strong>Geriye Dönük Null Düzeltmeleri:</strong><br />
                                Eski kayıtlardaki Vapi maliyet eksiklikleri için:
                                <br />• Konuşulan süre varsa: <code className="text-indigo-400">süre * $0.15/dk</code>
                                <br />• Sadece özet varsa (ortalama 60sn): <code className="text-indigo-400">$0.15</code>
                                <br />• Sadece ses kaydı varsa (ortalama 30sn): <code className="text-indigo-400">$0.075</code>
                                <br />• Cevapsız/Ulaşılamayan arama kurulumu: <code className="text-indigo-400">sabit $0.01</code>
                            </p>
                        </div>
                        {selectedWorkflow === 'manual' ? (
                            <div className="space-y-2">
                                <h4 className="font-bold text-indigo-200">2. Tekil Arama Maliyetleri</h4>
                                <p>
                                    CRM kartlarından doğrudan başlatılan manuel AI aramalarıdır. Veriler, müşteri zaman tüneline (`activities`) işlenen arama süreleri üzerinden analiz edilerek platform ve şebeke maliyeti formülüyle tahmin edilir.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h4 className="font-bold text-indigo-200">2. WhatsApp Mesajlaşma Maliyeti</h4>
                                <p>
                                    Meta Cloud API şablon ve oturum maliyetleri veritabanında anlık tutulmadığı için, Meta standart tarifesinden mesaj başına <strong className="text-emerald-400">$0.03</strong> flat maliyet uygulanır.
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <h4 className="font-bold text-indigo-200">3. Erişim Başına Maliyet</h4>
                            <p>
                                Toplam harcamanın, kampanya boyunca aranan veya WhatsApp takip mesajı gönderilen **tekil müşteri** sayısına bölünmesiyle elde edilir. Mükerrer aramalar bu hesaba katılmaz.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
