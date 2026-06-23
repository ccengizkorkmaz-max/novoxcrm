'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Activity, Clock, Users, Calendar, AlertCircle, Loader2,
    CheckCircle2, TrendingUp, XCircle, Info, Sparkles,
    Settings, Play, Smartphone, HelpCircle, ArrowRight
} from 'lucide-react'
import { getWorkflowDiagnosticInfo } from '../actions'

interface WorkflowDiagnosticDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workflowId: string
    workflowName: string
}

const EXECUTION_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Aktif Aramada', color: 'text-blue-400 border-blue-500/20', bg: 'bg-blue-500/5' },
    waiting: { label: 'Bekliyor', color: 'text-amber-400 border-amber-500/20', bg: 'bg-amber-500/5' },
    paused: { label: 'Duraklatıldı', color: 'text-slate-400 border-slate-500/20', bg: 'bg-slate-500/5' },
    completed: { label: 'Tamamlandı (Akış)', color: 'text-emerald-400 border-emerald-500/20', bg: 'bg-emerald-500/5' },
    stopped: { label: 'Durduruldu', color: 'text-rose-400 border-rose-500/20', bg: 'bg-rose-500/5' },
    converted: { label: 'Dönüştürüldü', color: 'text-violet-400 border-violet-500/20', bg: 'bg-violet-500/5' },
    opted_out: { label: 'İletişim Reddi', color: 'text-red-400 border-red-500/20', bg: 'bg-red-500/5' }
}

const STEP_TYPE_INFO: Record<string, { label: string; icon: any; color: string }> = {
    ai_call: { label: 'AI Telefon Araması', icon: Play, color: 'text-purple-400 bg-purple-500/10' },
    whatsapp: { label: 'WhatsApp Mesajı', icon: Smartphone, color: 'text-emerald-400 bg-emerald-500/10' },
    sms: { label: 'SMS Mesajı', icon: Smartphone, color: 'text-sky-400 bg-sky-500/10' },
    wait: { label: 'Bekleme Süresi', icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
    status_update: { label: 'Aday Durum Güncellemesi', icon: Settings, color: 'text-slate-400 bg-slate-500/10' },
    notify: { label: 'Bildirim Gönderimi', icon: Sparkles, color: 'text-rose-400 bg-rose-500/10' }
}

const DAYS_MAP = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export function WorkflowDiagnosticDialog({ open, onOpenChange, workflowId, workflowName }: WorkflowDiagnosticDialogProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!open) {
            setData(null)
            setError(null)
            return
        }

        async function fetchDetails() {
            setLoading(true)
            try {
                const res = await getWorkflowDiagnosticInfo(workflowId)
                if (res.error) {
                    setError(res.error)
                } else {
                    setData(res)
                }
            } catch (err: any) {
                setError(err.message || 'Veriler yüklenemedi.')
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [open, workflowId])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <Info className="h-5 w-5 text-blue-500" />
                        <span>Workflow Tanı ve Analiz Raporu</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground truncate">
                        {workflowName}
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="text-sm text-muted-foreground">Kampanya istatistikleri ve segment verileri canli hesaplaniyor...</span>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {data && !loading && (
                    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
                        <TabsList className="grid grid-cols-4 w-full bg-muted/50 rounded-xl p-1 gap-1">
                            <TabsTrigger value="overview" className="text-xs py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                Genel & Kota
                            </TabsTrigger>
                            <TabsTrigger value="segment" className="text-xs py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                Segment & Adaylar
                            </TabsTrigger>
                            <TabsTrigger value="schedule" className="text-xs py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                Zamanlama
                            </TabsTrigger>
                            <TabsTrigger value="steps" className="text-xs py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                Akış Adımları
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 min-h-0">
                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="h-full m-0 space-y-4">
                                <ScrollArea className="h-[48vh] pr-2">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Card className="border-slate-100 bg-slate-50/50 dark:bg-slate-900/50">
                                                <CardContent className="p-4 space-y-1">
                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Durum</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${data.workflow.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                        <span className="text-sm font-semibold">{data.workflow.is_active ? 'Kampanya Aktif' : 'Kampanya Pasif'}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-slate-100 bg-slate-50/50 dark:bg-slate-900/50">
                                                <CardContent className="p-4 space-y-1">
                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Çalışma Saatleri</span>
                                                    <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                        {data.workflow.working_hours_start?.substring(0, 5) || '09:00'} - {data.workflow.working_hours_end?.substring(0, 5) || '19:00'}
                                                        <span className="text-[10px] text-muted-foreground font-normal">({data.workflow.timezone})</span>
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card className="border-slate-100">
                                            <CardContent className="p-4 space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Günlük Dağıtım Kotası</h3>
                                                <div className="grid grid-cols-3 gap-4 pt-1">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-muted-foreground">Günlük Limit</p>
                                                        <p className="text-xl font-bold">{data.workflow.max_leads_per_day || 50}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-muted-foreground">Bugün Başlatılan</p>
                                                        <p className="text-xl font-bold text-blue-500">{data.stats.todayStartedCount}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-muted-foreground">Kalan Kota</p>
                                                        <p className="text-xl font-bold text-emerald-500">{data.stats.quotaLeftToday}</p>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden mt-2">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, Math.round((data.stats.todayStartedCount / (data.workflow.max_leads_per_day || 50)) * 100))}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground italic">
                                                    * Kota sıfırlaması Türkiye Saati ile her gece 00:00'da gerçekleşir.
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-slate-100">
                                            <CardContent className="p-4 space-y-2">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Çalışma Günleri</h3>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {DAYS_MAP.map((day, idx) => {
                                                        const isWorking = data.workflow.working_days?.includes(idx + 1)
                                                        return (
                                                            <Badge
                                                                key={idx}
                                                                variant="outline"
                                                                className={`text-xs px-2.5 py-0.5 font-medium border ${
                                                                    isWorking
                                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                                        : 'bg-muted border-slate-200 text-muted-foreground'
                                                                }`}
                                                            >
                                                                {day}
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* SEGMENT TAB */}
                            <TabsContent value="segment" className="h-full m-0 space-y-4">
                                <ScrollArea className="h-[48vh] pr-2">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <Card className="border-slate-100 bg-slate-50/50 dark:bg-slate-900/50">
                                                <CardContent className="p-4 space-y-0.5">
                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Segment Toplamı</span>
                                                    <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-100">{data.stats.totalSegmentCount}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-slate-100 bg-slate-50/50 dark:bg-slate-900/50">
                                                <CardContent className="p-4 space-y-0.5">
                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Akışa Alınan</span>
                                                    <p className="text-xl font-bold mt-1 text-blue-500">{data.stats.executedCount}</p>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-slate-100 bg-slate-50/50 dark:bg-slate-900/50">
                                                <CardContent className="p-4 space-y-0.5">
                                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Sırada Bekleyen (Kalan)</span>
                                                    <p className="text-xl font-bold mt-1 text-emerald-500">{data.stats.unexecutedCount}</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card className="border-slate-100">
                                            <CardContent className="p-4 space-y-2">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kuyruk Durum Kırılımları</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                                    {Object.entries(data.stats.statusCounts).map(([status, count]) => {
                                                        const conf = EXECUTION_STATUS_LABELS[status] || { label: status, color: 'text-muted-foreground', bg: 'bg-muted' }
                                                        return (
                                                            <div key={status} className={`p-2.5 rounded-lg border flex items-center justify-between ${conf.bg} border-white/5`}>
                                                                <span className="text-xs text-muted-foreground">{conf.label}</span>
                                                                <span className={`text-sm font-bold ${conf.color}`}>{count as number}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-slate-100 bg-slate-50/20 dark:bg-slate-900/10">
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex items-center justify-between border-b pb-2 mb-2">
                                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        Segment Filtre Detayı
                                                    </h3>
                                                    <Badge variant="outline" className="text-[10px] uppercase bg-blue-500/15 border-blue-500/25 text-blue-500 font-bold">
                                                        {data.segment.filters.source || 'sales'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs font-medium">Segment Adı: <strong className="text-foreground">{data.segment.name}</strong></p>
                                                <ScrollArea className="max-h-[120px] rounded-lg border bg-muted/40 p-2.5 font-mono text-[10px] text-muted-foreground">
                                                    {JSON.stringify(data.segment.filters, null, 2)}
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* SCHEDULE TAB */}
                            <TabsContent value="schedule" className="h-full m-0 space-y-4">
                                <ScrollArea className="h-[48vh] pr-2">
                                    <div className="space-y-4">
                                        <Card className="border-slate-100">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b">
                                                    <Calendar className="h-4 w-4 text-blue-500" />
                                                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Yarınki Otomasyon Zamanlaması</h3>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Gelecek Gün (Yarın) Çalışma Takvimi</span>
                                                        <Badge variant="outline" className={`font-semibold ${data.schedule.isTomorrowWorkingDay ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                                            {data.schedule.isTomorrowWorkingDay ? 'Çalışma Günü' : 'Çalışma Günü Değil'}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Yerel Zaman Dilimi</span>
                                                        <span className="font-semibold">{data.schedule.timezone}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Şu Anki Yerel Zaman</span>
                                                        <span className="font-semibold text-blue-500">{data.schedule.currentDateLocal} {data.schedule.currentTimeLocal}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 text-xs leading-relaxed text-muted-foreground">
                                                    <div className="flex items-center gap-1.5 font-semibold text-blue-500">
                                                        <Info className="h-4 w-4" />
                                                        Kampanya Çalışma Mantığı
                                                    </div>
                                                    <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                                                        <li>Her gece <strong>00:01 TRT</strong> (Türkiye Saati) itibarıyla sistem günlük kontrolü (`outreach-daily` cron) tetikler.</li>
                                                        <li>Günün çalışma günü olması koşuluyla, segmentten sırada bekleyen sıradaki <strong>{data.workflow.max_leads_per_day || 50} lead</strong> kuyruğa eklenir.</li>
                                                        <li>Lead'lerin ilk adımı 00:01'de kuyruğa girse bile, kampanya saatleri (**{data.workflow.working_hours_start?.substring(0, 5)} - {data.workflow.working_hours_end?.substring(0, 5)}**) dışındaki saatlerde arama veya mesaj tetiklenmez.</li>
                                                        <li>Sabah saat <strong>08:00 TRT</strong>'de başlayan dakikalık kontrol (`outreach` cron) bu lead'leri otomatik olarak kampanyanın ilk saati olan <strong>{data.workflow.working_hours_start?.substring(0, 5)}</strong>'a erteleyecektir.</li>
                                                        <li>Saat <strong>{data.workflow.working_hours_start?.substring(0, 5)} TRT</strong> olduğunda ilk aramalar veya mesajlar otomatik olarak gönderilmeye başlar.</li>
                                                    </ul>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* STEPS TAB */}
                            <TabsContent value="steps" className="h-full m-0 space-y-4">
                                <ScrollArea className="h-[48vh] pr-2">
                                    <div className="space-y-4 pr-1">
                                        <Card className="border-slate-100">
                                            <CardContent className="p-4 space-y-3">
                                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sıralı Aday Takip Akışı</h3>
                                                
                                                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6 pt-2">
                                                    {data.steps.map((step: any, index: number) => {
                                                        const conf = STEP_TYPE_INFO[step.action_type] || { label: step.action_type, icon: HelpCircle, color: 'text-slate-400 bg-slate-500/10' }
                                                        const StepIcon = conf.icon
                                                        return (
                                                            <div key={step.id} className="relative">
                                                                {/* Bullet dot with icon */}
                                                                <span className={`absolute -left-[37px] top-0.5 flex items-center justify-center rounded-full h-6 w-6 border border-slate-100 dark:border-slate-800 ${conf.color}`}>
                                                                    <StepIcon className="h-3.5 w-3.5" />
                                                                </span>

                                                                {/* Step Info */}
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-blue-500 uppercase">Adım {step.step_order}</span>
                                                                        <h4 className="text-sm font-semibold">{step.name || conf.label}</h4>
                                                                    </div>

                                                                    <div className="bg-muted/40 rounded-xl p-2.5 text-xs text-muted-foreground mt-1.5 space-y-1">
                                                                        {step.action_type === 'ai_call' && (
                                                                            <>
                                                                                <p>Çağrı Tipi: <strong className="text-foreground">Yapay Zeka Araması</strong></p>
                                                                                <p>Maksimum Süre: <strong className="text-foreground">{step.config.max_duration_seconds || 120} saniye</strong></p>
                                                                                {step.config.retry?.enabled && (
                                                                                    <p>Meşgul/Cevapsız Durumu: <strong className="text-foreground">{step.config.retry.max_attempts} kez tekrar denenecek ({step.config.retry.interval_minutes}dk arayla)</strong></p>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                        {step.action_type === 'whatsapp' && (
                                                                            <>
                                                                                <p>Kanal: <strong className="text-foreground">WhatsApp Template</strong></p>
                                                                                <p>Şablon Adı: <strong className="text-foreground">{step.config.template_name || '—'}</strong></p>
                                                                            </>
                                                                        )}
                                                                        {step.action_type === 'wait' && (
                                                                            <>
                                                                                <p>Kanal: <strong className="text-foreground">Zaman Gecikmesi (Bekleme)</strong></p>
                                                                                <p>Süre: <strong className="text-foreground">{step.config.duration_value} {step.config.duration_unit === 'hours' ? 'saat' : step.config.duration_unit === 'days' ? 'gün' : step.config.duration_unit}</strong></p>
                                                                            </>
                                                                        )}
                                                                        {step.action_type === 'sms' && (
                                                                            <>
                                                                                <p>Kanal: <strong className="text-foreground">Toplu SMS</strong></p>
                                                                                <p>Mesaj İçeriği: <strong className="text-foreground">{step.config.message || '—'}</strong></p>
                                                                            </>
                                                                        )}
                                                                        {step.action_type === 'status_update' && (
                                                                            <>
                                                                                <p>Kanal: <strong className="text-foreground">Aday Kartı Durum Değişimi</strong></p>
                                                                                <p>Yeni Durum: <strong className="text-foreground">{step.config.status || '—'}</strong></p>
                                                                            </>
                                                                        )}
                                                                        {step.action_type === 'notify' && (
                                                                            <>
                                                                                <p>Kanal: <strong className="text-foreground">Temsilci Bildirimi</strong></p>
                                                                                <p>Başlık: <strong className="text-foreground">{step.config.title || '—'}</strong></p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    )
}
