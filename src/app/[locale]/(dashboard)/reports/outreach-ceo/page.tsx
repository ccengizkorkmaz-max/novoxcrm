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
    Timer
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
    const answeredCount = data.resumptionSpoke || 0
    const hungUpCount = data.resumptionHungUp || 0
    const answeredTotal = answeredCount + hungUpCount
    const answerRate = data.resumptionCalls > 0 ? (answeredTotal / data.resumptionCalls) * 100 : 0
    const conversionRate = data.uniqueCustomers > 0 ? (data.statusCounts.converted / data.uniqueCustomers) * 100 : 0

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
                            Temmuz-Aralık 2025 Dönemi Geri Kazanım AI Kampanyası Operasyonel Analizi
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

            {/* Explanation Alert Box - Explains the discrepancy directly */}
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Info className="h-32 w-32" />
                </div>
                <div className="flex gap-4">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 h-10 w-10 flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                            Yönetici Açıklaması: Veritabanı Kayıtları ve Segment Boyutu Uyuşumu
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
                            <p>
                                <strong>Temmuz-Aralık 2025 Olumsuz & Ulaşılamayanlar</strong> kampanyasında toplam hedef kitle büyüklüğü <strong>3.260 tekil müşteridir</strong> (3.549 orijinal kayıttan 307'si Burak'ın WhatsApp kampanyasındaki çakışmalar nedeniyle dışarıda bırakılmıştır).
                            </p>
                            <p>
                                Sistem veritabanında görünen <strong>{data.totalExecutions}</strong> toplam işlem kaydı (execution), <strong>kampanyanın durdurulup yeniden başlatılmasından (restart)</strong> kaynaklanmaktadır. Yeniden başlatma sırasında <code>stopped</code> statüsündeki kayıtlar sistem tarafından otomatik olarak filtreden çıkarılmadığı için, aynı müşteriler için yeni aktif süreçler (kuyruklar) oluşturulmuş ve bu durum işlem satırı sayısını artırmıştır.
                            </p>
                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                Kampanya fiilen 3.260 tekil müşteriyi hedeflemekte olup, şu ana kadar 1.999 arama denemesi yapılmıştır.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Hedef Segment Boyutu
                        </CardTitle>
                        <Users className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{data.segmentActiveTargets}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {data.segmentOriginalSize} Orijinal • -{data.segmentExcludedOverlaps} Çakışma
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Toplam İşlem Kaydı
                        </CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight">{data.totalExecutions}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                            <span>Restart Kaynaklı Mükerrer Dahil</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Geri Kazanılan Aday
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
                                %{conversionRate.toFixed(1)} Kazanım Oranı
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Arama Kuyruğu Durumu
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

            {/* Campaign Metrics Section */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Real-time Call Performance */}
                <Card className="md:col-span-2 border border-border/40 bg-card/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Resumption Call Performance (Today)</CardTitle>
                        <CardDescription>
                            Session stats since credits were reloaded today at 13:58 TRT
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Yapılan Arama</span>
                                <div className="text-3xl font-black tracking-tight mt-1">{data.resumptionCalls}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Meşgul Sayısı</span>
                                <div className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400 mt-1">{data.resumptionBusy}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                <span className="text-xs text-muted-foreground font-bold uppercase">Cevapsız Sayısı</span>
                                <div className="text-3xl font-black tracking-tight text-red-500 mt-1">{data.resumptionNoAnswer}</div>
                            </div>
                        </div>

                        {/* Custom visual charts representation using simple styled divs */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Çağrı Sonuçları Yüzdesel Dağılımı</h4>
                            <div className="h-6 w-full rounded-full bg-muted flex overflow-hidden">
                                <div
                                    style={{ width: `${(data.resumptionBusy / data.resumptionCalls) * 100}%` }}
                                    className="bg-amber-500 h-full transition-all"
                                    title="Meşgul"
                                />
                                <div
                                    style={{ width: `${(data.resumptionNoAnswer / data.resumptionCalls) * 100}%` }}
                                    className="bg-rose-500 h-full transition-all"
                                    title="Cevapsız"
                                />
                                <div
                                    style={{ width: `${(answeredCount / data.resumptionCalls) * 100}%` }}
                                    className="bg-emerald-500 h-full transition-all"
                                    title="Konuşuldu"
                                />
                                <div
                                    style={{ width: `${(data.resumptionFailed / data.resumptionCalls) * 100}%` }}
                                    className="bg-slate-400 h-full transition-all"
                                    title="Hatalı/Kredi"
                                />
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground justify-center">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-amber-500" />
                                    Meşgul: %{((data.resumptionBusy / data.resumptionCalls) * 100 || 0).toFixed(1)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-rose-500" />
                                    Cevapsız: %{((data.resumptionNoAnswer / data.resumptionCalls) * 100 || 0).toFixed(1)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-emerald-500" />
                                    Konuşulan: %{(answerRate || 0).toFixed(1)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-slate-400" />
                                    Hata/Kredi: %{((data.resumptionFailed / data.resumptionCalls) * 100 || 0).toFixed(1)}
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
                                <h4 className="text-sm font-semibold">AI Telefon Araması (Çiçek)</h4>
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
                                    Açmayanlara teklif detay butonlu şablon gider. 'Evet' diyenler anında satış temsilcisine düşer.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stratejik Kararlar ve Teknik İyileştirmeler */}
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
                            <strong>2. Parametrik Retry Arayüzü:</strong> Workflow adımları içerisine görsel anahtarlar (switch) yerleştirildi. Artık "hattı meşgul olanlar, cevapsızlar ve hemen kapatanlar" için tekrar arama kuralları dinamik olarak panelden yönetilebiliyor.
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
                                <strong>Cevap:</strong> Evet, 'Converted' (Dönüşüm Sağlanan) statüsüne hem telefonla konuşup detaylı bilgi isteyenler hem de WhatsApp takip mesajındaki 'Evet, bilgi istiyorum' butonuna basanlar dahildir.
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
