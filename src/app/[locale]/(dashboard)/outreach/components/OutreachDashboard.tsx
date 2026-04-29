'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Phone, MessageSquare, Mail, Zap, Plus, Play, Pause, Trash2,
    BarChart3, Clock, Users, CheckCircle2, XCircle, PhoneOff,
    ArrowRight, Settings2, Eye, Bot, FileText, Target
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleWorkflow, deleteWorkflow, launchWorkflow } from '../actions'
import { WorkflowBuilder } from './WorkflowBuilder'
import { ScriptManager } from './ScriptManager'
import { SegmentManager } from './SegmentManager'
import { CallResultsPanel } from './CallResultsPanel'

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
    projects, profiles, userId, tenantId, detailedLogs
}: OutreachDashboardProps) {
    const [showBuilder, setShowBuilder] = useState(false)
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null)
    const [showScripts, setShowScripts] = useState(false)
    const [showSegments, setShowSegments] = useState(false)
    const [localWorkflows, setLocalWorkflows] = useState(workflows)
    const [localSegments, setLocalSegments] = useState(segments)
    const [launching, setLaunching] = useState<string | null>(null)

    // Stats from recent logs
    const totalCalls = recentLogs.filter(l => l.channel === 'ai_call').length
    const totalWhatsApp = recentLogs.filter(l => l.channel === 'whatsapp').length
    const totalSms = recentLogs.filter(l => l.channel === 'sms').length
    const totalConverted = recentLogs.filter(l => l.status === 'converted').length

    const handleToggle = async (id: string, current: boolean) => {
        const result = await toggleWorkflow(id, !current)
        if (result.success) {
            setLocalWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !current } : w))
        }
    }

    const handleDelete = async (id: string) => {
        toast('Bu workflow silinsin mi?', {
            action: {
                label: 'Sil',
                onClick: async () => {
                    const result = await deleteWorkflow(id)
                    if (result.success) {
                        setLocalWorkflows(prev => prev.filter(w => w.id !== id))
                        toast.success('Workflow silindi')
                    } else {
                        toast.error('Silinemedi: ' + (result.error || 'Bilinmeyen hata'))
                    }
                },
            },
            cancel: { label: 'İptal', onClick: () => {} },
        })
    }

    const handleLaunch = async (id: string) => {
        setLaunching(id)
        try {
            const result = await launchWorkflow(id)
            if ('error' in result) {
                toast.error(result.error as string)
            } else {
                toast.success(`${result.started} lead için outreach başlatıldı! (${result.skipped || 0} atlandı)`)
            }
        } catch (err: any) {
            toast.error(`Hata: ${err.message}`)
        }
        setLaunching(null)
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
                onClose={() => { setShowBuilder(false); setEditingWorkflow(null) }}
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
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
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSegments(true)}
                        className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <Target className="h-4 w-4" />
                        Segmentler ({localSegments.length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowScripts(true)}
                        className="gap-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                        <Bot className="h-4 w-4" />
                        AI Script&apos;ler
                    </Button>
                    <Button size="sm" onClick={() => setShowBuilder(true)}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
                        <Plus className="h-4 w-4" />
                        Yeni Workflow
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Zap} label="Aktif Outreach"
                    value={activeCount} color="violet"
                />
                <StatCard
                    icon={Phone} label="AI Arama"
                    value={totalCalls} color="purple"
                />
                <StatCard
                    icon={MessageSquare} label="WhatsApp"
                    value={totalWhatsApp} color="emerald"
                />
                <StatCard
                    icon={CheckCircle2} label="Dönüşüm"
                    value={totalConverted} color="green"
                />
            </div>

            {/* Tabs: Workflows & Activity */}
            <Tabs defaultValue="workflows" className="space-y-4">
                <TabsList className="bg-muted/50 border">
                    <TabsTrigger value="workflows" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-2">
                        <Settings2 className="h-3.5 w-3.5" />
                        Workflow&apos;lar
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Son Aktivite
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
                                onToggle={() => handleToggle(w.id, w.is_active)}
                                onEdit={() => { setEditingWorkflow(w); setShowBuilder(true) }}
                                onDelete={() => handleDelete(w.id)}
                                onLaunch={() => handleLaunch(w.id)}
                                isLaunching={launching === w.id}
                            />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-2">
                    <CallResultsPanel initialLogs={detailedLogs} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        violet: 'from-violet-500/15 to-violet-600/5 border-violet-500/20 text-violet-400',
        purple: 'from-purple-500/15 to-purple-600/5 border-purple-500/20 text-purple-400',
        emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        green: 'from-green-500/15 to-green-600/5 border-green-500/20 text-green-400',
        blue: 'from-blue-500/15 to-blue-600/5 border-blue-500/20 text-blue-400',
    }
    return (
        <Card className={`bg-gradient-to-br ${colors[color]} border p-4`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className="h-8 w-8 opacity-40" />
            </div>
        </Card>
    )
}

function WorkflowCard({ workflow, onToggle, onEdit, onDelete, onLaunch, isLaunching }: {
    workflow: any; onToggle: () => void; onEdit: () => void; onDelete: () => void; onLaunch: () => void; isLaunching: boolean
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
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Switch checked={workflow.is_active} onCheckedChange={onToggle} />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={onLaunch}
                        disabled={!workflow.is_active || isLaunching}
                        className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <Play className="h-3 w-3" />
                        {isLaunching ? 'Başlatılıyor...' : 'Başlat'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit}
                        className="gap-1.5 text-xs">
                        <Eye className="h-3 w-3" />
                        Düzenle
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
