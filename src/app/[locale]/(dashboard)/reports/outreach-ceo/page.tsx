'use client'

import React, { useState, useEffect } from 'react'
import { getOutreachCeoReportData } from '../actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
    BarChart3,
    Phone,
    Users,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    Info,
    RefreshCw,
    Printer,
    HelpCircle,
    Zap,
    TrendingUp,
    Timer,
    PhoneOff,
    PhoneIncoming,
    Calendar
} from 'lucide-react'

export default function OutreachCeoReportPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const res = await getOutreachCeoReportData()
            if ('error' in res) {
                toast.error('Yetkisiz erişim veya veri hatası!')
            } else {
                setData(res)
                if (isRefresh) {
                    toast.success('Rapor verileri güncellendi!')
                }
            }
        } catch (error) {
            console.error('Error loading report:', error)
            toast.error('Rapor yüklenirken hata oluştu!')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">CEO Raporu ve gerçek zamanlı analizler yükleniyor...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold">Veri Bulunamadı</h3>
                <p className="text-muted-foreground">Kampanyaya ait veritabanı kayıtları yüklenemedi.</p>
            </div>
        )
    }

    // Calculations
    const spokeCount = data.resumptionSpoke || 0
    const hungUpCount = data.resumptionHungUp || 0
    const totalAnswered = spokeCount + hungUpCount
    const spokeRate = data.resumptionCalls > 0 ? (spokeCount / data.resumptionCalls) * 100 : 0
    const hungUpRate = data.resumptionCalls > 0 ? (hungUpCount / data.resumptionCalls) * 100 : 0
    const conversionRate = data.uniqueCustomers > 0 ? (data.statusCounts.converted / data.uniqueCustomers) * 100 : 0
    const busyRate = data.resumptionCalls > 0 ? (data.resumptionBusy / data.resumptionCalls) * 100 : 0
    const noAnswerRate = data.resumptionCalls > 0 ? (data.resumptionNoAnswer / data.resumptionCalls) * 100 : 0

    // Date distribution for chart
    const dateDist = data.callDateDistribution || {}
    const sortedDates = Object.entries(dateDist).sort(([a], [b]) => a.localeCompare(b))
    const maxDateCount = Math.max(...Object.values(dateDist).map(v => v as number), 1)

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/10">
                        <BarChart3 className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Outreach CEO Yönetici Raporu</h1>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 gap-1.5 py-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live / Canlı
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Temmuz-Aralık 2025 Dönemi Geri Kazanım AI Kampanyası — Tüm Zamanlar Raporu
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="h-9 gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Güncelleniyor...' : 'Verileri Yenile'}
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.print()}
                        className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 print:hidden"
                    >
                        <Printer className="h-4 w-4" />
                        PDF / Yazdır
                    </Button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Hedef Segment
                        </CardTitle>
                        <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{data.uniqueCustomers.toLocaleString('tr-TR')}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Tekil Müşteri
                            </span>
                            {data.duplicateExecutions > 0 && (
                                <span className="text-[10px] text-amber-500 font-medium">
                                    ({data.duplicateExecutions} mükerrer kayıt filtrelendi)
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Toplam AI Arama
                        </CardTitle>
                        <Phone className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{data.resumptionCalls.toLocaleString('tr-TR')}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Tüm zamanlar toplamı
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Geri Kazanılan
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight text-emerald-500">
                            {data.statusCounts.converted}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-bold">
                                %{conversionRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Kazanım Oranı
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Arama Kuyruğu
                        </CardTitle>
                        <Timer className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">
                            {data.firstCallPending + data.retryPending}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span>{data.firstCallPending} İlk Arama • {data.retryPending} Yeniden Arama</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Call Performance + Workflow Rules */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Call Performance */}
                <Card className="md:col-span-2 border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Arama Sonuçları — Tüm Kampanya</CardTitle>
                        <CardDescription>
                            Toplam {data.resumptionCalls.toLocaleString('tr-TR')} arama denemesinin sonuç dağılımı
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Main Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                                <PhoneIncoming className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
                                <span className="text-xs text-muted-foreground font-bold uppercase">Konuşulan</span>
                                <div className="text-3xl font-black tracking-tight text-emerald-500 mt-1">{spokeCount}</div>
                                <span className="text-[10px] text-emerald-500/70 font-semibold">%{spokeRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                                <PhoneOff className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
                                <span className="text-xs text-muted-foreground font-bold uppercase">Meşgul</span>
                                <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-1">{data.resumptionBusy.toLocaleString('tr-TR')}</div>
                                <span className="text-[10px] text-amber-500/70 font-semibold">%{busyRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
                                <Phone className="h-5 w-5 text-rose-500 mx-auto mb-1.5" />
                                <span className="text-xs text-muted-foreground font-bold uppercase">Cevapsız</span>
                                <div className="text-3xl font-black tracking-tight text-rose-500 mt-1">{data.resumptionNoAnswer.toLocaleString('tr-TR')}</div>
                                <span className="text-[10px] text-rose-500/70 font-semibold">%{noAnswerRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            </div>
                        </div>

                        {/* Additional metrics row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10 text-center">
                                <span className="text-xs text-muted-foreground font-bold">Açıp Kısa Kapatan</span>
                                <div className="text-xl font-black mt-0.5 text-orange-500">{hungUpCount}</div>
                                <span className="text-[10px] text-orange-500/70 font-semibold">%{hungUpRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                                <span className="text-xs text-muted-foreground font-bold">WhatsApp Gönderilen</span>
                                <div className="text-xl font-black mt-0.5 text-emerald-500">{data.resumptionWhatsapp}</div>
                            </div>
                        </div>

                        {/* Visual bar chart */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Çağrı Sonuçları Dağılımı</h4>
                            <div className="h-6 w-full rounded-full bg-muted flex overflow-hidden">
                                {spokeCount > 0 && (
                                    <div
                                        style={{ width: `${spokeRate}%` }}
                                        className="bg-emerald-500 h-full transition-all"
                                        title={`Konuşulan: ${spokeCount}`}
                                    />
                                )}
                                {hungUpCount > 0 && (
                                    <div
                                        style={{ width: `${hungUpRate}%` }}
                                        className="bg-orange-500 h-full transition-all"
                                        title={`Açıp Kapatan: ${hungUpCount}`}
                                    />
                                )}
                                {data.resumptionBusy > 0 && (
                                    <div
                                        style={{ width: `${busyRate}%` }}
                                        className="bg-amber-500 h-full transition-all"
                                        title={`Meşgul: ${data.resumptionBusy}`}
                                    />
                                )}
                                {data.resumptionNoAnswer > 0 && (
                                    <div
                                        style={{ width: `${noAnswerRate}%` }}
                                        className="bg-rose-500 h-full transition-all"
                                        title={`Cevapsız: ${data.resumptionNoAnswer}`}
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground justify-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-emerald-500" />
                                    Konuşulan: %{spokeRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-orange-500" />
                                    Açıp Kapatan: %{hungUpRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-amber-500" />
                                    Meşgul: %{busyRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-rose-500" />
                                    Cevapsız: %{noAnswerRate.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Omnichannel Flow Rules */}
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Planlanan Akış Kuralları</CardTitle>
                        <CardDescription>Omnichannel kampanya workflow adımları</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <span className="text-sm font-bold text-indigo-500">1</span>
                            <div>
                                <h4 className="text-sm font-semibold">AI Telefon Araması (Maya)</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Yatırım fırsatları tanıtılır. Cevapsız veya meşgul durumunda 30 dk ara ile 1 kez daha denenir.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                            <span className="text-sm font-bold text-purple-500">2</span>
                            <div>
                                <h4 className="text-sm font-semibold">2 Saat Bekleme</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Aramadan hemen sonra müşteriye dinlenme süresi verilir.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <span className="text-sm font-bold text-emerald-500">3</span>
                            <div>
                                <h4 className="text-sm font-semibold">WhatsApp Butonlu Takip</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Açmayanlara teklif detay butonlu şablon gider. &apos;Evet&apos; diyenler anında satış temsilcisine düşer.
                                </p>
                            </div>
                        </div>

                        {/* Execution Status Summary */}
                        <div className="mt-4 pt-4 border-t space-y-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Müşteri Durum Dağılımı</h4>
                            <div className="space-y-1.5">
                                {Object.entries(data.statusCounts)
                                    .filter(([, v]) => (v as number) > 0)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([status, count]) => {
                                        const colors: Record<string, string> = {
                                            active: 'bg-blue-500',
                                            completed: 'bg-slate-400',
                                            stopped: 'bg-red-400',
                                            converted: 'bg-emerald-500',
                                            waiting: 'bg-amber-500'
                                        }
                                        const labels: Record<string, string> = {
                                            active: 'Aktif',
                                            completed: 'Tamamlandı',
                                            stopped: 'Durduruldu',
                                            converted: 'Dönüştü',
                                            waiting: 'Bekliyor'
                                        }
                                        return (
                                            <div key={status} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${colors[status] || 'bg-slate-400'}`} />
                                                    <span className="text-muted-foreground">{labels[status] || status}</span>
                                                </div>
                                                <span className="font-bold tabular-nums">{(count as number).toLocaleString('tr-TR')}</span>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Call Distribution */}
            {sortedDates.length > 0 && (
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-500" /> Günlük Arama Dağılımı
                        </CardTitle>
                        <CardDescription>Kampanya boyunca günlük yapılan arama sayıları</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sortedDates.map(([date, count]) => (
                                <div key={date} className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">
                                        {new Date(date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all flex items-center justify-end pr-2"
                                            style={{ width: `${((count as number) / maxDateCount) * 100}%`, minWidth: '40px' }}
                                        >
                                            <span className="text-[10px] font-bold text-white">
                                                {(count as number).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stratejik Kararlar ve SSS */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-indigo-500" /> Yapılan Stratejik İyileştirmeler
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            <strong>1. Kapatma Süresi Filtresi (Hemen Kapananlar):</strong> Telefonu açıp robot olduğunu duyduktan hemen sonra 10 saniye içinde kapatan kişilerin 2. kez aranarak rahatsız edilmesini engellemek için filtre geliştirildi.
                        </p>
                        <p>
                            <strong>2. Parametrik Retry Arayüzü:</strong> Workflow adımları içerisine görsel anahtarlar (switch) yerleştirildi. Artık &quot;hattı meşgul olanlar, cevapsızlar ve hemen kapatanlar&quot; için tekrar arama kuralları dinamik olarak panelden yönetilebiliyor.
                        </p>
                        <p>
                            <strong>3. Bütçe ve Kredi Durumu:</strong> ElevenLabs ses sentezleme bütçe limiti kaldırıldı, 300.000 yeni kredi yüklenerek tüm çağrıların sıfır gecikmeyle yapılması sağlandı.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-indigo-500" /> Sıkça Sorulan Sorular (SSS)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <div>
                            <h4 className="font-bold text-indigo-950 dark:text-indigo-200">Soru: Nitelikli/İlgilenenler sayısına WhatsApp mesajı evet diyenler dahil mi?</h4>
                            <p className="mt-1">
                                <strong>Cevap:</strong> Evet, &apos;Converted&apos; (Dönüşüm Sağlanan) statüsüne hem telefonla konuşup detaylı bilgi isteyenler hem de WhatsApp takip mesajındaki &apos;Evet, bilgi istiyorum&apos; butonuna basanlar dahildir.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-950 dark:text-indigo-200">Soru: Konuşulan sayısı nasıl hesaplanıyor?</h4>
                            <p className="mt-1">
                                <strong>Cevap:</strong> Vapi AI tarafından &apos;answered&apos; veya &apos;converted&apos; olarak işaretlenen aramalar konuşulan olarak sayılır. Telefonu açıp hızlıca kapatan kişiler &apos;Açıp Kapatan&apos; kategorisinde gösterilir.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-950 dark:text-indigo-200">Soru: WhatsApp takip mesajları ne zaman gönderilir?</h4>
                            <p className="mt-1">
                                <strong>Cevap:</strong> AI telefonu aradıktan sonra 2 saatlik bekleme süresi bittiğinde, müşterilere otomatik olarak Meta Cloud API aracılığıyla takip mesajı gönderilir.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
