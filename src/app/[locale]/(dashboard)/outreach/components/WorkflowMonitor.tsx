'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity, Phone, Users, Clock, CheckCircle2, XCircle,
    RefreshCw, ArrowLeft, Loader2, PhoneOff, PhoneIncoming,
    Timer, TrendingUp, AlertTriangle
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

    const fetchData = useCallback(async () => {
        try {
            const result = await getWorkflowMonitor(workflowId)
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
    }, [workflowId])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 15000)
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

    const { workflow, executions, logs, stats, totalCount, todayCount } = data

    // Build a map: execution_id → latest log
    const logMap = new Map<string, any>()
    logs.forEach((log: any) => {
        if (!logMap.has(log.execution_id)) logMap.set(log.execution_id, log)
    })

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {workflow?.is_active ? '🟢 Aktif' : '⏸️ Duraklatıldı'} · Günlük max: {workflow?.max_leads_per_day || 50} · 15 sn'de bir yenilenir
                    </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}
                    className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Toplam', value: totalCount, color: 'text-slate-300', bg: 'from-slate-500/10' },
                    { label: 'Bugün', value: todayCount, color: 'text-blue-400', bg: 'from-blue-500/10' },
                    { label: 'Tamamlanan', value: stats.completed + stats.converted, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
                    { label: 'Dönüşüm', value: stats.converted, color: 'text-violet-400', bg: 'from-violet-500/10' },
                    { label: 'Bekleyen', value: stats.active + stats.waiting, color: 'text-amber-400', bg: 'from-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className={`p-3 bg-gradient-to-b ${stat.bg} to-transparent border-white/5`}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </Card>
                ))}
            </div>

            {/* Execution Table */}
            <Card className="overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            Arama Listesi
                        </h3>
                        <Badge variant="outline" className="text-[10px]">
                            {executions.length} / {totalCount} gösteriliyor
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
                                            <Phone className="h-6 w-6 opacity-30" />
                                            <p>Henüz arama başlatılmadı</p>
                                            <p className="text-[10px]">Workflow aktifleştirildiğinde aramalar burada görünecek</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                executions.map((exec: any) => {
                                    const log = logMap.get(exec.id)
                                    const statusConf = STATUS_CONFIG[exec.status] || STATUS_CONFIG.active
                                    const outcomeConf = log?.call_outcome ? CALL_OUTCOME_CONFIG[log.call_outcome] : null
                                    const StatusIcon = statusConf.icon

                                    return (
                                        <tr key={exec.id} className="border-t border-white/5 hover:bg-muted/20 transition-colors">
                                            <td className="p-2.5 font-medium">
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
                                                        {log.template_name.replace('novo_kampanya_', '').replace('_v2', '')}
                                                    </span>
                                                ) : log?.channel === 'ai_call' ? (
                                                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded">AI Arama</span>
                                                ) : '—'}
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <Badge variant="outline" className={`text-[10px] gap-1 ${statusConf.color}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusConf.label}
                                                </Badge>
                                            </td>
                                            <td className="p-2.5 text-center">
                                                {outcomeConf ? (
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
                                                {log?.call_summary || '—'}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
