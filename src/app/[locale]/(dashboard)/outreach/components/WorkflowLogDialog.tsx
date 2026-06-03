'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, MessageSquare, Mail, CheckCircle2, XCircle, Clock, ArrowRight, Loader2, Users, Zap } from 'lucide-react'
import { getWorkflowLog } from '../actions'

const statusColors: Record<string, string> = {
    active: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    waiting: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    converted: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    stopped: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    failed: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const statusLabels: Record<string, string> = {
    active: 'Aktif',
    waiting: 'Bekliyor',
    completed: 'Tamamlandi',
    converted: 'Donusum',
    stopped: 'Durduruldu',
    failed: 'Basarisiz',
}

const channelIcons: Record<string, any> = {
    ai_call: Phone,
    whatsapp: MessageSquare,
    sms: Mail,
}

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(start: string, end: string) {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    if (mins > 0) return `${mins}dk ${secs}sn`
    return `${secs}sn`
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
        if (data) return // Already loaded
        setLoading(true)
        try {
            const result = await getWorkflowLog(workflowId)
            setData(result)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    // Load when opened
    if (open && !data && !loading) {
        loadLog()
    }

    // Reset on close
    const handleOpenChange = (v: boolean) => {
        if (!v) setData(null)
        onOpenChange(v)
    }

    // Group executions by date
    const groupedByDate: Record<string, any[]> = {}
    if (data?.executions) {
        for (const exec of data.executions) {
            const date = formatDate(exec.created_at)
            if (!groupedByDate[date]) groupedByDate[date] = []
            groupedByDate[date].push(exec)
        }
    }

    // Step logs map: execution_id -> logs[]
    const stepLogMap: Record<string, any[]> = {}
    if (data?.stepLogs) {
        for (const log of data.stepLogs) {
            if (!stepLogMap[log.execution_id]) stepLogMap[log.execution_id] = []
            stepLogMap[log.execution_id].push(log)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-violet-400" />
                        {workflowName} - Gunluk
                    </DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {data && !('error' in data) && (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
                            {Object.entries(data.stats).map(([key, val]) => (
                                <div key={key} className="text-center p-2 rounded-lg bg-muted/50">
                                    <p className="text-lg font-bold">{val as number}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{statusLabels[key] || key}</p>
                                </div>
                            ))}
                        </div>

                        {/* Execution List */}
                        <ScrollArea className="h-[55vh] pr-2">
                            {Object.entries(groupedByDate).map(([date, execs]) => (
                                <div key={date} className="mb-4">
                                    <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1.5 mb-2 border-b">
                                        <span className="text-xs font-semibold text-muted-foreground">{date}</span>
                                        <Badge variant="outline" className="ml-2 text-[10px]">{execs.length} islem</Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        {execs.map((exec: any) => {
                                            const logs = stepLogMap[exec.id] || []
                                            const custName = exec.customers?.full_name || 'Bilinmiyor'
                                            return (
                                                <div key={exec.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                                                    {/* Status dot */}
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                                        exec.status === 'active' ? 'bg-blue-400' :
                                                        exec.status === 'completed' ? 'bg-emerald-400' :
                                                        exec.status === 'converted' ? 'bg-violet-400' :
                                                        exec.status === 'stopped' ? 'bg-slate-400' :
                                                        exec.status === 'failed' ? 'bg-red-400' :
                                                        'bg-amber-400'
                                                    }`} />
                                                    
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium truncate">{custName}</span>
                                                            <Badge variant="outline" className={`text-[9px] shrink-0 ${statusColors[exec.status] || ''}`}>
                                                                {statusLabels[exec.status] || exec.status}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Adim {exec.current_step_order}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Time info */}
                                                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                                            <span className="flex items-center gap-0.5">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                {formatTime(exec.created_at)}
                                                            </span>
                                                            {exec.completed_at && (
                                                                <>
                                                                    <ArrowRight className="h-2.5 w-2.5" />
                                                                    <span>{formatTime(exec.completed_at)}</span>
                                                                    <span className="text-muted-foreground/60">
                                                                        ({formatDuration(exec.created_at, exec.completed_at)})
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Step logs (collapsed, shown on hover/focus) */}
                                                        {logs.length > 0 && (
                                                            <div className="mt-1 space-y-0.5 max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-300">
                                                                {logs.slice(0, 5).map((log: any) => {
                                                                    const ChIcon = channelIcons[log.channel] || Zap
                                                                    return (
                                                                        <div key={log.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground pl-1">
                                                                            <ChIcon className="h-2.5 w-2.5" />
                                                                            <span>{log.channel}</span>
                                                                            {log.status === 'sent' || log.status === 'success' ? (
                                                                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                                                            ) : log.status === 'failed' ? (
                                                                                <XCircle className="h-2.5 w-2.5 text-red-400" />
                                                                            ) : null}
                                                                            <span>{log.template_name || log.status}</span>
                                                                            {log.executed_at && <span>{formatTime(log.executed_at)}</span>}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {Object.keys(groupedByDate).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Users className="h-8 w-8 mb-2 opacity-30" />
                                    <p className="text-sm">Henuz islem kaydi yok</p>
                                </div>
                            )}
                        </ScrollArea>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
