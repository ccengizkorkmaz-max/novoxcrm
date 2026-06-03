'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { OctagonX, Phone, MessageSquare, Mail, Zap, Plus, Play, Pause, Trash2,
    BarChart3, Clock, Users, XCircle, PhoneOff,
    ArrowRight, Settings2, Eye, Bot, FileText, Target
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleWorkflow, deleteWorkflow, launchWorkflow, stopWorkflow, deleteTrigger } from '../actions'
import { WorkflowBuilder } from './WorkflowBuilder'
import { ScriptManager } from './ScriptManager'
import { SegmentManager } from './SegmentManager'
import { CallResultsPanel } from './CallResultsPanel'
import { TriggerManager } from './TriggerManager'
import { WorkflowMonitor } from './WorkflowMonitor'
import { SystemHealthPanel } from './SystemHealthPanel'

interface OutreachDashboardProps {
    workflows: any[]
    segments: any[]
    scripts: any[]
    activeCount: number
    recentLogs: any[]
    projects: any[]
    profiles: any[]
    userId: string
    tenantId: string
    detailedLogs: any[]
    triggers: any[]
}

const channelIcons: Record<string, any> = {
    ai_call: Phone,
    whatsapp: MessageSquare,
    sms: Mail,
    wait: Clock,
    status_update: Settings2,
    notify: Zap,
}

const channelColors: Record<string, string> = {
    ai_call: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    whatsapp: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sms: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    wait: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    status_update: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    notify: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

const statusColors: Record<string, string> = {
    sent: 'bg-blue-500/15 text-blue-400',
    delivered: 'bg-cyan-500/15 text-cyan-400',
    answered: 'bg-emerald-500/15 text-emerald-400',
    converted: 'bg-green-500/15 text-green-400',
    no_answer: 'bg-amber-500/15 text-amber-400',
    busy: 'bg-orange-500/15 text-orange-400',
    failed: 'bg-red-500/15 text-red-400',
    skipped: 'bg-slate-500/15 text-slate-400',
    pending: 'bg-slate-500/15 text-slate-400',
}

export function OutreachDashboard({
    workflows, segments, scripts, activeCount, recentLogs,
    projects, profiles, userId, tenantId, detailedLogs, triggers
}: OutreachDashboardProps) {
    const [showBuilder, setShowBuilder] = useState(false)
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null)
    const [showScripts, setShowScripts] = useState(false)
    const [showSegments, setShowSegments] = useState(false)
    const [showTriggers, setShowTriggers] = useState(false)
    const [localWorkflows, setLocalWorkflows] = useState(workflows)
    const router = useRouter()
    const [localSegments, setLocalSegments] = useState(segments)
    const [monitoringWorkflow, setMonitoringWorkflow] = useState<{ id: string; name: string } | null>(null)

    // Prop değiştiğinde local state'i güncelle (router.refresh sonrası)
    useEffect(() => { setLocalWorkflows(workflows) }, [workflows])
    useEffect(() => { setLocalSegments(segments) }, [segments])

    const [launching, setLaunching] = useState<string | null>(null)
    const [stopping, setStopping] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        title: string
        description: string
        confirmLabel: string
        confirmClass?: string
        onConfirm: () => Promise<void>
    }>({ open: false, title: '', description: '', confirmLabel: '', onConfirm: async () => {} })



    const handleToggle = async (id: string, current: boolean) => {
        const result = await toggleWorkflow(id, !current)
        if (result.success) {
            setLocalWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !current } : w))
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const linkedTriggers = triggers.filter(t => t.workflow_id === id)
        const hasTriggers = linkedTriggers.length > 0

        setConfirmDialog({
            open: true,
            title: 'Workflow Silinsin mi?',
            description: hasTriggers
                ? `"${name}" workflow'u ve tüm adımları kalıcı olarak silinecek.\n\n⚡ Bu workflow'a bağlı ${linkedTriggers.length} tetikleyici de silinecektir. Bu işlem geri alınamaz.`
                : `"${name}" workflow'u ve tüm adımları kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
            confirmLabel: hasTriggers ? 'Tetikleyiciyle Birlikte Sil' : 'Evet, Sil',
            confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
            onConfirm: async () => {
                // Önce bağlı tetikleyicileri sil
                if (hasTriggers) {
                    for (const t of linkedTriggers) {
                        await deleteTrigger(t.id)
                    }
                }
                const result = await deleteWorkflow(id)
                if (result.success) {
                    setLocalWorkflows(prev => prev.filter(w => w.id !== id))
                    toast.success(hasTriggers
                        ? `Workflow ve ${linkedTriggers.length} tetikleyici silindi`
                        : 'Workflow silindi'
                    )
                } else {
                    toast.error('Silinemedi: ' + (result.error || 'Bilinmeyen hata'))
                }
            }
        })
    }

    const handleLaunch = async (id: string, name: string) => {
        setLaunching(id)
        try {
            const result = await launchWorkflow(id)
            if ('error' in result) {
                toast.error(result.error as string)
            } else {
                toast.success(`${result.started} lead için outreach başlatıldı! (${result.skipped || 0} atlandı)`)
                // Automatically switch to live monitor so the user can track progress
                setMonitoringWorkflow({ id, name })
            }
        } catch (err: any) {
            toast.error(`Hata: ${err.message}`)
        }
        setLaunching(null)
    }

    const handleStop = async (id: string, name: string) => {
        setConfirmDialog({
            open: true,
            title: 'Akışı Durdur',
            description: `"${name}" akışındaki tüm aktif ve bekleyen gönderimleri iptal edilecek.`,
            confirmLabel: '🛑 Evet, Durdur',
            confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
            onConfirm: async () => {
                setStopping(id)
                try {
                    const result = await stopWorkflow(id)
                    if ('error' in result) {
                        toast.error('Durdurulamadı: ' + result.error)
                    } else {
                        toast.success(`Akış durduruldu! ${result.stopped || 0} işlem iptal edildi.`)
                    }
                } catch (err: any) {
                    toast.error('Hata: ' + err.message)
                }
                setStopping(null)
            }
        })
    }

    if (showBuilder) {
        return (
            <WorkflowBuilder
                segments={segments}
                scripts={scripts}
                projects={projects}
                profiles={profiles}
                tenantId={tenantId}
                editingWorkflow={editingWorkflow}
                onClose={() => { setShowBuilder(false); setEditingWorkflow(null); router.refresh() }}
            />
        )
    }

    if (showScripts) {
        return (
            <ScriptManager
                scripts={scripts}
                tenantId={tenantId}
                onClose={() => setShowScripts(false)}
            />
        )
    }

    if (showSegments) {
        return (
            <SegmentManager
                segments={localSegments}
                projects={projects}
                profiles={profiles}
                tenantId={tenantId}
                onClose={() => setShowSegments(false)}
                onSegmentsChange={setLocalSegments}
            />
        )
    }

    if (showTriggers) {
        return (
            <TriggerManager
                workflows={localWorkflows}
                tenantId={tenantId}
                onClose={() => setShowTriggers(false)}
            />
        )
    }

    if (monitoringWorkflow) {
        return (
            <WorkflowMonitor
                workflowId={monitoringWorkflow.id}
                workflowName={monitoringWorkflow.name}
                onClose={() => setMonitoringWorkflow(null)}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={o => setConfirmDialog(d => ({ ...d, open: o }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            className={confirmDialog.confirmClass}
                            onClick={async () => { await confirmDialog.onConfirm() }}
                        >
                            {confirmDialog.confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:pr-36">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
                            <Phone className="h-6 w-6 text-violet-400" />
                        </div>
                        Outreach Otomasyon
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI telefon, WhatsApp ve SMS ile otomatik lead takibi
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={() => setShowSegments(true)}
                        className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 flex-1 sm:flex-initial">
                        <Target className="h-4 w-4" />
                        Segmentler ({localSegments.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowScripts(true)}
                        className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 flex-1 sm:flex-initial">
                        <Bot className="h-4 w-4" />
                        AI Script&apos;ler
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowTriggers(true)}
                        className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 flex-1 sm:flex-initial">
                        <Zap className="h-4 w-4" />
                        Tetikleyiciler
                    </Button>
                    <Button size="sm" onClick={() => setShowBuilder(true)}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Yeni Workflow
                    </Button>
                </div>
            </div>


            {/* System Health Panel */}
            <SystemHealthPanel />

            {/* Tabs: Workflows & Activity */}
            <Tabs defaultValue="workflows" className="space-y-4">
                <TabsList className="flex flex-wrap md:flex-nowrap h-auto p-1 bg-muted/50 border rounded-xl gap-1 w-full md:w-max">
                    <TabsTrigger value="workflows" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-2 flex-1 md:flex-initial py-1.5 text-xs">
                        <Settings2 className="h-3.5 w-3.5" />
                        Workflow&apos;lar
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-2 flex-1 md:flex-initial py-1.5 text-xs">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Son Aktivite
                    </TabsTrigger>
                    <TabsTrigger value="triggers" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white gap-2 flex-1 md:flex-initial py-1.5 text-xs">
                        <Zap className="h-3.5 w-3.5" />
                        Tetikleyiciler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="workflows" className="space-y-3">
                    {localWorkflows.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/30 p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-violet-500/10">
                                    <Zap className="h-8 w-8 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Henüz workflow oluşturulmamış</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        İlk outreach workflow&apos;unuzu oluşturarak soğuyan lead&apos;leri otomatik takip edin.
                                    </p>
                                </div>
                                <Button onClick={() => setShowBuilder(true)}
                                    className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600">
                                    <Plus className="h-4 w-4" />
                                    İlk Workflow&apos;u Oluştur
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        localWorkflows.map(w => (
                            <WorkflowCard
                                key={w.id}
                                workflow={w}
                                hasTrigger={triggers.some(t => t.workflow_id === w.id && t.is_active)}
                                onToggle={() => handleToggle(w.id, w.is_active)}
                                onEdit={() => { setEditingWorkflow(w); setShowBuilder(true) }}
                                onDelete={() => handleDelete(w.id, w.name)}
                                onLaunch={() => handleLaunch(w.id, w.name)}
                                onStop={() => handleStop(w.id, w.name)}
                                onMonitor={() => setMonitoringWorkflow({ id: w.id, name: w.name })}
                                isLaunching={launching === w.id}
                                isStopping={stopping === w.id}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-2">
                    <CallResultsPanel initialLogs={detailedLogs} />
                </TabsContent>

                <TabsContent value="triggers" className="space-y-3">
                    <TriggerManager 
                        workflows={localWorkflows} 
                        tenantId={tenantId} 
                        onClose={() => {}} // No back button needed in tab
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────



function WorkflowCard({ workflow, hasTrigger, onToggle, onEdit, onDelete, onLaunch, onStop, onMonitor, isLaunching, isStopping }: {
    workflow: any; hasTrigger: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; onLaunch: () => void; onStop: () => void; onMonitor: () => void; isLaunching: boolean; isStopping: boolean
}) {
    return (
        <Card className="hover:bg-muted/50 transition-colors">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-violet-500/15' : 'bg-muted'}`}>
                            <Zap className={`h-5 w-5 ${workflow.is_active ? 'text-violet-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{workflow.name}</h3>
                                <Badge variant="outline" className={`text-[10px] ${workflow.is_active ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                    {workflow.is_active ? 'Aktif' : 'Pasif'}
                                </Badge>
                                {hasTrigger && (
                                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1">
                                        <Zap className="h-2.5 w-2.5" />
                                        Otomatik
                                    </Badge>
                                )}
                            </div>
                            {workflow.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{workflow.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {workflow.outreach_segments?.name && (
                                    <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {workflow.outreach_segments.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {workflow.working_hours_start?.substring(0, 5)} - {workflow.working_hours_end?.substring(0, 5)}
                                </span>
                                {workflow.is_auto_detect && (
                                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                        Otomatik ({workflow.auto_detect_days} gün)
                                    </Badge>
                                )}
                            </div>
                            {/* Execution Stats */}
                            {workflow._exec_stats?.total > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center gap-3 text-xs">
                                        {workflow._exec_stats.active > 0 ? (
                                            <span className="flex items-center gap-1.5 text-amber-400">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                                                </span>
                                                {workflow._exec_stats.active} devam ediyor
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">⏸ Beklemede</span>
                                        )}
                                        <span className="text-emerald-400">{workflow._exec_stats.completed} tamamlandı</span>
                                        {workflow._exec_stats.failed > 0 && (
                                            <span className="text-red-400">{workflow._exec_stats.failed} başarısız</span>
                                        )}
                                        <span className="text-muted-foreground">/ {workflow._exec_stats.total} toplam</span>
                                        {workflow._exec_stats.last_run && (
                                            <span className="text-muted-foreground ml-auto">
                                                Son: {getTimeAgo(workflow._exec_stats.last_run)}
                                            </span>
                                        )}
                                    </div>
                                    {workflow._exec_stats.total > 0 && (
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                                style={{ width: `${Math.round((workflow._exec_stats.completed / workflow._exec_stats.total) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Auto-Tuning Simülasyon Bilgi Kartı */}
                            {workflow.computed_params && (
                                <div className="mt-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <BarChart3 className="h-3 w-3 text-blue-400" />
                                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">Akış Simülasyonu</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Süre</span>
                                            <p className="font-medium">~{workflow.computed_params.estimated_completion_minutes}dk</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Aramalar</span>
                                            <p className="font-medium">{workflow.computed_params.estimated_total_calls}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">WA Mesaj</span>
                                            <p className="font-medium">{workflow.computed_params.estimated_wa_messages}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Maliyet</span>
                                            <p className="font-medium">${workflow.computed_params.estimated_cost_usd}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                        <span>🎯 {workflow.computed_params.segment_size} kişi</span>
                                        <span>📞 {workflow.computed_params.max_concurrent_lines} hat</span>
                                        <span>📦 batch: {workflow.computed_params.optimal_batch_size}</span>
                                    </div>
                                    {workflow.computed_params.warnings?.length > 0 && (
                                        <div className="mt-1.5 space-y-0.5">
                                            {workflow.computed_params.warnings.map((w: string, i: number) => (
                                                <p key={i} className="text-[10px] text-amber-400">⚠️ {w}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Switch checked={workflow.is_active} onCheckedChange={onToggle} />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={onLaunch}
                        disabled={!workflow.is_active || isLaunching || isStopping}
                        className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <Play className="h-3 w-3" />
                        {isLaunching ? 'Başlatılıyor...' : 'Başlat'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onStop}
                        disabled={isStopping}
                        className="gap-1.5 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10">
                        <OctagonX className="h-3 w-3" />
                        {isStopping ? 'Durduruluyor...' : 'Durdur'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit}
                        className="gap-1.5 text-xs">
                        <Eye className="h-3 w-3" />
                        Düzenle
                    </Button>
                    <Button variant="outline" size="sm" onClick={onMonitor}
                        className="gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                        <BarChart3 className="h-3 w-3" />
                        Canlı Takip
                    </Button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={onDelete}
                        className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}

function ActivityLogRow({ log }: { log: any }) {
    const Icon = channelIcons[log.channel] || Zap
    const colorClass = channelColors[log.channel] || channelColors.notify
    const statusClass = statusColors[log.status] || statusColors.pending
    const customerName = log.outreach_executions?.customers?.full_name || 'Bilinmiyor'
    const stepName = log.outreach_steps?.name || log.channel

    const timeAgo = getTimeAgo(log.executed_at)

    return (
        <Card className="bg-muted/30 p-3">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg border ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{customerName}</span>
                        <Badge variant="outline" className={`text-[10px] border-none ${statusClass}`}>
                            {log.status}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {stepName}
                        {log.call_duration_seconds ? ` • ${log.call_duration_seconds}sn` : ''}
                        {log.message_content ? ` • ${log.message_content.substring(0, 60)}...` : ''}
                    </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
            </div>
        </Card>
    )
}

function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins}dk`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}sa`
    const days = Math.floor(hours / 24)
    return `${days}g`
}
