'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Square, CheckCircle2, Clock, ArrowRight, Loader2, Zap, AlertCircle, History } from 'lucide-react'
import { getWorkflowLog } from '../actions'

function formatDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const hours = Math.floor(ms / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}sa ${mins}dk`
    return `${mins}dk`
}

function isToday(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    return d.toDateString() === today.toDateString()
}

function isYesterday(iso: string) {
    const d = new Date(iso)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return d.toDateString() === yesterday.toDateString()
}

function getRelativeDate(iso: string) {
    if (isToday(iso)) return 'Bugün'
    if (isYesterday(iso)) return 'Dün'
    return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long' })
}

const statusConfig = {
    running: { label: 'Devam Ediyor', icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-400 animate-pulse' },
    completed: { label: 'Tamamlandı', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
    stopped: { label: 'Durduruldu', icon: Square, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', dot: 'bg-red-400' },
    mixed: { label: 'Kısmi', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
}

export function WorkflowLogDialog({ open, onOpenChange, workflowId, workflowName }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    workflowId: string
    workflowName: string
}) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)

    const loadLog = async () => {
        if (data) return
        setLoading(true)
        try {
            const result = await getWorkflowLog(workflowId)
            setData(result)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    if (open && !data && !loading) {
        loadLog()
    }

    const handleOpenChange = (v: boolean) => {
        if (!v) setData(null)
        onOpenChange(v)
    }

    const runs = data?.runs || []

    // Bugün çalıştırılmış mı?
    const todayRun = runs.find((r: any) => isToday(r.startedAt))

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <History className="h-4 w-4 text-violet-400" />
                        {workflowName}
                        <span className="text-muted-foreground font-normal">— Çalıştırma Geçmişi</span>
                    </DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {data && !('error' in data) && (
                    <>
                        {/* Bugün uyarısı */}
                        {todayRun && (
                            <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${
                                todayRun.status === 'running'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {todayRun.status === 'running'
                                    ? `Bu akış şu an çalışıyor (${todayRun.totalLeads} lead)`
                                    : `Bu akış bugün zaten çalıştırıldı — ${formatTime(todayRun.startedAt)}'de ${todayRun.totalLeads} lead`
                                }
                            </div>
                        )}

                        <ScrollArea className="h-[50vh] pr-1">
                            <div className="space-y-2">
                                {runs.map((run: any, i: number) => {
                                    const cfg = statusConfig[run.status as keyof typeof statusConfig] || statusConfig.completed
                                    const StatusIcon = cfg.icon
                                    return (
                                        <div key={i} className={`rounded-lg border p-3 ${cfg.bg} transition-colors`}>
                                            {/* Header: Tarih + Durum */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                                                    <span className="font-semibold text-sm">{getRelativeDate(run.startedAt)}</span>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                                                    <StatusIcon className="h-2.5 w-2.5" />
                                                    {cfg.label}
                                                </Badge>
                                            </div>

                                            {/* Zaman bilgisi */}
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>Başladı: {formatTime(run.startedAt)}</span>
                                                {run.lastActivityAt && (
                                                    <>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span>Bitti: {formatTime(run.lastActivityAt)}</span>
                                                        <span className="text-muted-foreground/50">
                                                            ({formatDuration(run.startedAt, run.lastActivityAt)})
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Lead sayıları */}
                                            <div className="flex items-center gap-3 mt-2 text-[11px]">
                                                <span className="text-muted-foreground">{run.totalLeads} lead</span>
                                                {run.completed > 0 && <span className="text-emerald-400">✓ {run.completed} tamamlandı</span>}
                                                {run.converted > 0 && <span className="text-violet-400">⚡ {run.converted} dönüşüm</span>}
                                                {run.stopped > 0 && <span className="text-red-400">■ {run.stopped} durduruldu</span>}
                                                {run.failed > 0 && <span className="text-red-400">✗ {run.failed} başarısız</span>}
                                                {run.active > 0 && <span className="text-blue-400">▶ {run.active} aktif</span>}
                                                {run.waiting > 0 && <span className="text-amber-400">⏳ {run.waiting} bekliyor</span>}
                                            </div>
                                        </div>
                                    )
                                })}

                                {runs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <History className="h-8 w-8 mb-2 opacity-30" />
                                        <p className="text-sm">Henüz çalıştırma kaydı yok</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
