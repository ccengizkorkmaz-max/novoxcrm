'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity, Phone, Users, Clock, CheckCircle2, XCircle,
    RefreshCw, ArrowLeft, Loader2, PhoneOff, PhoneIncoming,
    Timer, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight,
    MessageSquare
} from 'lucide-react'
import { getWorkflowMonitor } from '../actions'

interface WorkflowMonitorProps {
    workflowId: string
    workflowName: string
    onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: 'Aktif', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Activity },
    waiting: { label: 'Bekliyor', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Clock },
    completed: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
    converted: { label: 'Dönüştü', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', icon: TrendingUp },
    failed: { label: 'Başarısız', color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: XCircle },
    stopped: { label: 'Tamamlandı (Akış Bitti)', color: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/30', icon: CheckCircle2 },
}

const CALL_OUTCOME_CONFIG: Record<string, { label: string; emoji: string }> = {
    answered: { label: 'Görüşüldü', emoji: '✅' },
    converted: { label: 'İlgilendi', emoji: '🔥' },
    no_answer: { label: 'Cevapsız', emoji: '📵' },
    busy: { label: 'Meşgul', emoji: '🔄' },
    hung_up: { label: 'Kapattı', emoji: '📞' },
    success: { label: 'Başarılı', emoji: '🎯' },
}

export function WorkflowMonitor({ workflowId, workflowName, onClose }: WorkflowMonitorProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(async (p?: number) => {
        try {
            const result = await getWorkflowMonitor(workflowId, p ?? page)
            if (result.error) {
                setError(result.error)
                console.error('[Monitor] Error:', result.error)
            } else {
                setData(result)
                setError(null)
            }
        } catch (err: any) {
            setError(err.message)
            console.error('[Monitor] Fetch error:', err)
        }
        setLoading(false)
        setRefreshing(false)
    }, [workflowId, page])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [fetchData])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-60 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Yükleniyor...
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Geri
                </Button>
                <Card className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Monitor yüklenemedi: {error}</p>
                    <Button size="sm" className="mt-3" onClick={handleRefresh}>Tekrar Dene</Button>
                </Card>
            </div>
        )
    }

    if (!data) return null

    const { workflow, executions, logs, stats, channels, totalCount, todayCount, totalPages, pageSize, cronHealth } = data

    // Build a map: execution_id → best log (prefer completed logs with actual results)
    const logMap = new Map<string, any>()
    logs.forEach((log: any) => {
        const existing = logMap.get(log.execution_id)
        if (!existing) {
            logMap.set(log.execution_id, log)
        } else {
            // Prefer logs with actual call results over pending 'sent' logs
            const existingHasResults = existing.call_outcome || existing.call_summary || existing.call_duration_seconds
            const newHasResults = log.call_outcome || log.call_summary || log.call_duration_seconds
            if (newHasResults && !existingHasResults) {
                logMap.set(log.execution_id, log)
            }
        }
    })

    // Determine which channels this workflow uses
    const hasCall = channels?.includes('ai_call')
    const hasWhatsApp = channels?.includes('whatsapp')
    const hasSms = channels?.includes('sms')

    // Build dynamic stat cards based on workflow channels
    const statCards: { label: string; value: number; color: string; bg: string }[] = [
        { label: 'Tekil Müşteri', value: totalCount, color: 'text-slate-300', bg: 'from-slate-500/10' },
    ]

    if (hasCall) {
        statCards.push(
            { label: 'Gerçek Arama', value: stats.totalRealCalls || 0, color: 'text-blue-400', bg: 'from-blue-500/10' },
            { label: 'Aranan Kişi', value: stats.uniqueCalledCustomers || 0, color: 'text-violet-400', bg: 'from-violet-500/10' },
            { label: 'Konuşulan', value: stats.spokeCustomers || 0, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
        )
    }

    if (hasWhatsApp) {
        statCards.push(
            { label: 'WA Gönderildi', value: stats.waTotalSent || 0, color: 'text-green-400', bg: 'from-green-500/10' },
            { label: 'WA Kişi', value: stats.waUniqueSent || 0, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
        )
        if ((stats.waTotalFailed || 0) > 0) {
            statCards.push(
                { label: 'WA Başarısız', value: stats.waTotalFailed || 0, color: 'text-red-400', bg: 'from-red-500/10' },
            )
        }
    }

    if (hasSms) {
        statCards.push(
            { label: 'SMS Gönderildi', value: stats.smsTotalSent || 0, color: 'text-sky-400', bg: 'from-sky-500/10' },
            { label: 'SMS Kişi', value: stats.smsUniqueSent || 0, color: 'text-cyan-400', bg: 'from-cyan-500/10' },
        )
        if ((stats.smsTotalFailed || 0) > 0) {
            statCards.push(
                { label: 'SMS Başarısız', value: stats.smsTotalFailed || 0, color: 'text-red-400', bg: 'from-red-500/10' },
            )
        }
    }

    statCards.push(
        { label: 'Tamamlanan', value: stats.completedCalled || 0, color: 'text-slate-400', bg: 'from-slate-500/10' },
        { label: 'Dönüşüm (İlgilendi)', value: stats.converted || 0, color: 'text-rose-400', bg: 'from-rose-500/10' },
    )

    if (hasCall) {
        statCards.push(
            { label: 'Aktif Çağrı', value: stats.activeCallsCount || 0, color: (stats.activeCallsCount || 0) > 0 ? 'text-emerald-400 animate-pulse font-bold' : 'text-slate-500', bg: (stats.activeCallsCount || 0) > 0 ? 'from-emerald-500/20' : 'from-slate-500/5' },
        )
    }

    // Build dynamic breakdown items
    const breakdownItems: { label: string; value: number; sub: string; color: string; bg: string }[] = []
    if (hasCall) {
        breakdownItems.push(
            { label: 'Arama Bekleyen', value: stats.firstCallPending || 0, sub: 'Henüz hiç aranmadı', color: 'text-amber-500', bg: 'bg-amber-500/5' },
            { label: 'Tekrar Arama Bekleyen', value: stats.secondCallPending || 0, sub: 'Açmayanların 30dk bekleyenleri', color: 'text-orange-500', bg: 'bg-orange-500/5' },
        )
    }
    if (hasCall || hasWhatsApp) {
        breakdownItems.push(
            { label: 'Bekleme Süresinde', value: stats.inWaitStep || 0, sub: 'Adımlar arası bekleme', color: 'text-blue-500', bg: 'bg-blue-500/5' },
        )
    }
    if (hasWhatsApp) {
        breakdownItems.push(
            { label: 'WhatsApp Sırasında', value: stats.whatsappPending || 0, sub: 'WP gönderim bekleyenler', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
        )
    }
    if (hasSms) {
        breakdownItems.push(
            { label: 'SMS Sırasında', value: stats.smsTotalSent || 0, sub: 'SMS gönderilmiş', color: 'text-sky-500', bg: 'bg-sky-500/5' },
        )
    }
    breakdownItems.push(
        { label: 'Tamamlanan', value: stats.completedCalled || 0, sub: 'Akışını tamamlamış', color: 'text-slate-400', bg: 'bg-slate-500/5' },
    )

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 md:pr-36">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
                            <Activity className="h-5 w-5 text-blue-400" />
                        </div>
                        Canlı Takip — {workflowName}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                            {workflow?.is_active ? '🟢 Aktif' : '⏸️ Duraklatıldı'} · Günlük max: {workflow?.max_leads_per_day || 50} · 5 sn'de bir yenilenir
                            {channels?.length > 0 && (
                                <span className="ml-2">
                                    · Kanallar: {channels.map((c: string) => c === 'ai_call' ? '📞 Arama' : c === 'whatsapp' ? '💬 WhatsApp' : c === 'sms' ? '📱 SMS' : c).join(', ')}
                                </span>
                            )}
                        </p>
                        {/* Cron Health Indicator */}
                        {cronHealth && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                                cronHealth.status === 'ok' 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : cronHealth.status === 'warning'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}>
                                <span className={`relative flex h-2 w-2`}>
                                    {cronHealth.status === 'ok' && (
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    )}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                        cronHealth.status === 'ok' ? 'bg-emerald-400'
                                        : cronHealth.status === 'warning' ? 'bg-amber-400'
                                        : 'bg-red-400'
                                    }`} />
                                </span>
                                <span>Cron: {cronHealth.message}</span>
                            </div>
                        )}
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}
                    className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Simulation Info Bar */}
            {workflow?.computed_params && (
                <Card className="p-3 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/15">
                    <div className="flex items-center gap-6 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">📊 Simülasyon</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Tahmini: <strong className="text-foreground">~{workflow.computed_params.estimated_completion_minutes}dk</strong></span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>Aramalar: <strong className="text-foreground">{workflow.computed_params.estimated_total_calls}</strong></span>
                        </div>
                        {workflow.computed_params.estimated_wa_messages > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span>WA: <strong className="text-foreground">{workflow.computed_params.estimated_wa_messages}</strong></span>
                            </div>
                        )}
                        <div className="text-muted-foreground">
                            Maliyet: <strong className="text-foreground">${workflow.computed_params.estimated_cost_usd}</strong>
                        </div>
                        <div className="text-muted-foreground">
                            Batch: <strong className="text-foreground">{workflow.computed_params.optimal_batch_size}</strong>
                        </div>
                        {workflow.computed_params.warnings?.map((w: string, i: number) => (
                            <span key={i} className="text-amber-400 text-[10px]">⚠️ {w}</span>
                        ))}
                    </div>
                </Card>
            )}

            {/* Dynamic Stats Cards */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(statCards.length, 6)} gap-3`}>
                {statCards.map((stat, i) => (
                    <Card key={i} className={`p-3 bg-gradient-to-b ${stat.bg} to-transparent border-white/5 border`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <div className="flex items-center justify-between mt-1">
                            <p className={`text-2xl font-bold ${stat.color}`}>{typeof stat.value === 'number' ? stat.value.toLocaleString('tr-TR') : stat.value}</p>
                            {stat.label === 'Aktif Çağrı' && (stats.activeCallsCount || 0) > 0 && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Dynamic Breakdowns */}
            <Card className="p-3 bg-muted/10 border-white/5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    Müşteri Durum Kırılımı (Toplam: {totalCount.toLocaleString('tr-TR')})
                </h3>
                <div className={`grid grid-cols-2 md:grid-cols-${Math.min(breakdownItems.length, 5)} gap-3`}>
                    {breakdownItems.map((step, i) => (
                        <div key={i} className={`p-2.5 rounded-lg border border-white/5 ${step.bg}`}>
                            <p className="text-[10px] text-muted-foreground font-medium">{step.label}</p>
                            <p className={`text-xl font-bold mt-0.5 ${step.color}`}>{step.value.toLocaleString('tr-TR')}</p>
                            <p className="text-[9px] text-muted-foreground/75 mt-0.5">{step.sub}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Execution Table */}
            <Card className="overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            {hasCall ? 'Arama Listesi' : hasWhatsApp ? 'Mesaj Listesi' : hasSms ? 'SMS Listesi' : 'Müşteri Listesi'}
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                            {((page - 1) * (pageSize || 50)) + 1}–{Math.min(page * (pageSize || 50), totalCount)} / {totalCount}
                        </Badge>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/20 sticky top-0">
                            <tr>
                                <th className="text-left p-2.5 font-medium text-muted-foreground">Müşteri</th>
                                <th className="text-left p-2.5 font-medium text-muted-foreground">Telefon</th>
                                <th className="text-center p-2.5 font-medium text-muted-foreground">Adım</th>
                                <th className="text-left p-2.5 font-medium text-muted-foreground">Şablon</th>
                                <th className="text-center p-2.5 font-medium text-muted-foreground">Durum</th>
                                <th className="text-center p-2.5 font-medium text-muted-foreground">Sonuç</th>
                                <th className="text-center p-2.5 font-medium text-muted-foreground">Süre</th>
                                <th className="text-left p-2.5 font-medium text-muted-foreground">Özet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {executions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            {hasCall ? <Phone className="h-6 w-6 opacity-30" /> : hasWhatsApp ? <MessageSquare className="h-6 w-6 opacity-30" /> : <Phone className="h-6 w-6 opacity-30" />}
                                            <p>{hasCall ? 'Henüz arama başlatılmadı' : 'Henüz mesaj gönderilmedi'}</p>
                                            <p className="text-[10px]">Workflow aktifleştirildiğinde işlemler burada görünecek</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                executions.map((exec: any) => {
                                    const log = logMap.get(exec.id)
                                    const isCallActive = log?.channel === 'ai_call' && log?.status === 'sent' && !log?.completed_at;
                                    
                                    // Smart status label based on actual execution state
                                    let statusConf: { label: string; color: string; icon: any }
                                    if (isCallActive) {
                                        statusConf = { label: 'Arama Yapılıyor...', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500 animate-pulse', icon: PhoneIncoming }
                                    } else if (exec.status === 'active') {
                                        // Smarter "active" labels
                                        if (exec.current_retry_count > 0 && log?.channel === 'ai_call') {
                                            statusConf = { label: `Tekrar Aranacak (${exec.current_retry_count}.)`, color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', icon: Timer }
                                        } else if (exec.current_step_order > 1 && channels?.includes('whatsapp')) {
                                            statusConf = { label: 'WA Gönderilecek', color: 'text-green-400 bg-green-500/10 border-green-500/30', icon: MessageSquare }
                                        } else if (log?.call_outcome && exec.current_step_order === 1) {
                                            statusConf = { label: 'Sonraki Adım Bekliyor', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: Clock }
                                        } else {
                                            statusConf = { label: 'Arama Bekliyor', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Activity }
                                        }
                                    } else {
                                        statusConf = STATUS_CONFIG[exec.status] || STATUS_CONFIG.active
                                    }
                                    
                                    // Outcome: prefer call_outcome, fallback to log status, then execution status
                                    let outcomeConf = log?.call_outcome ? CALL_OUTCOME_CONFIG[log.call_outcome] : null
                                    if (!outcomeConf && log?.status === 'failed') {
                                        outcomeConf = CALL_OUTCOME_CONFIG['failed'] || { label: 'Başarısız', emoji: '❌' }
                                    } else if (!outcomeConf && log?.status === 'sent' && log?.completed_at) {
                                        outcomeConf = { label: 'Gönderildi', emoji: '📤' }
                                    } else if (!outcomeConf && log?.channel === 'whatsapp' && log?.status === 'sent') {
                                        outcomeConf = { label: 'WA Gönderildi', emoji: '✅' }
                                    } else if (!outcomeConf && exec.status === 'completed') {
                                        outcomeConf = { label: 'Tamamlandı', emoji: '✅' }
                                    } else if (!outcomeConf && exec.status === 'stopped') {
                                        outcomeConf = { label: 'Tamamlandı', emoji: '✅' }
                                    }
                                    const StatusIcon = statusConf.icon

                                    return (
                                        <tr 
                                            key={exec.id} 
                                            className={`border-t border-white/5 hover:bg-muted/20 transition-colors ${
                                                isCallActive 
                                                    ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500 font-semibold' 
                                                    : ''
                                            }`}
                                        >
                                            <td className="p-2.5 font-medium flex items-center gap-1.5">
                                                {isCallActive && (
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                )}
                                                {exec.customers?.full_name || 'İsimsiz'}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground font-mono">
                                                {exec.customers?.phone
                                                    ? exec.customers.phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 *** $5')
                                                    : '—'}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {exec.current_step_order}. adım
                                                </Badge>
                                            </td>
                                            <td className="p-2.5 text-left text-muted-foreground">
                                                {log?.template_name ? (
                                                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
                                                        {log.template_name.replace('novo_campaign_', '').replace('novo_kampanya_', '').replace('_v2', '')}
                                                    </span>
                                                ) : log?.channel === 'ai_call' ? (
                                                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">📞 AI Arama</span>
                                                ) : log?.channel === 'whatsapp' ? (
                                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">💬 WhatsApp</span>
                                                ) : log?.channel === 'sms' ? (
                                                    <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded">📱 SMS</span>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground/50">⏳ Bekliyor</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <Badge variant="outline" className={`text-[10px] gap-1 ${statusConf.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusConf.label}
                                                </Badge>
                                            </td>
                                            <td className="p-2.5 text-center">
                                                {isCallActive ? (
                                                    <span className="text-xs text-emerald-400 animate-pulse font-medium">Bağlandı, Konuşuluyor...</span>
                                                ) : outcomeConf ? (
                                                    <span className="text-xs">
                                                        {outcomeConf.emoji} {outcomeConf.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="p-2.5 text-center text-muted-foreground">
                                                {log?.call_duration_seconds
                                                    ? `${Math.floor(log.call_duration_seconds / 60)}:${String(log.call_duration_seconds % 60).padStart(2, '0')}`
                                                    : '—'}
                                            </td>
                                            <td className="p-2.5 max-w-[200px] truncate text-muted-foreground">
                                                {isCallActive ? (
                                                    <span className="text-xs text-emerald-400/80 animate-pulse italic">Müşteri ile bağlantı kuruldu, görüşme devam ediyor...</span>
                                                ) : (log?.call_summary || '—')}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {(totalPages || 1) > 1 && (
                    <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Sayfa {page} / {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => { const p = page - 1; setPage(p); fetchData(p) }}
                                className="h-7 text-xs gap-1"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                Önceki
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= (totalPages || 1)}
                                onClick={() => { const p = page + 1; setPage(p); fetchData(p) }}
                                className="h-7 text-xs gap-1"
                            >
                                Sonraki
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
