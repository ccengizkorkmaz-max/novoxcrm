'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Phone, MessageSquare, Mail, Clock, Settings2, Zap, Plus,
    ArrowLeft, ArrowDown, Trash2, GripVertical, Save, Target, Bot, Bell, Sparkles, Split
} from 'lucide-react'
import { createWorkflow, updateWorkflow, addStep as addStepAction, updateStep, deleteStep } from '../actions'
import { getWhatsAppTemplates } from '../actions'
import { toast } from 'sonner'

const ACTION_TYPES = [
    { value: 'ai_call', label: 'AI Telefon Araması', icon: Phone, color: 'violet' },
    { value: 'whatsapp', label: 'WhatsApp Mesajı', icon: MessageSquare, color: 'emerald' },
    { value: 'sms', label: 'SMS Gönder', icon: Mail, color: 'blue' },
    { value: 'condition', label: 'Eğer/Değilse', icon: Target, color: 'emerald' },
    { value: 'ai_personalize', label: 'AI Kişiselleştir', icon: Sparkles, color: 'purple' },
    { value: 'wait', label: 'Bekle', icon: Clock, color: 'amber' },
    { value: 'status_update', label: 'Durum Güncelle', icon: Settings2, color: 'slate' },
    { value: 'notify', label: 'Bildirim Gönder', icon: Bell, color: 'rose' },
]

const colorMap: Record<string, string> = {
    violet: 'border-violet-500/30 bg-violet-500/10',
    emerald: 'border-emerald-500/30 bg-emerald-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    amber: 'border-amber-500/30 bg-amber-500/10',
    slate: 'border-slate-500/30 bg-slate-500/10',
    rose: 'border-rose-500/30 bg-rose-500/10',
}

interface Step {
    id: string
    step_order: number
    name: string
    action_type: string
    config: any
    on_success: string
    on_failure: string
    next_step_id_on_success?: string
    next_step_id_on_failure?: string
}

export function WorkflowBuilder({ segments, scripts, projects, profiles, tenantId, editingWorkflow, onClose }: {
    segments: any[]; scripts: any[]; projects: any[]; profiles: any[]; tenantId: string; editingWorkflow?: any; onClose: () => void
}) {
    const [name, setName] = useState(editingWorkflow?.name || '')
    const [description, setDescription] = useState(editingWorkflow?.description || '')
    const [segmentId, setSegmentId] = useState(editingWorkflow?.segment_id || '')
    const [hoursStart, setHoursStart] = useState(editingWorkflow?.working_hours_start?.substring(0, 5) || '09:00')
    const [hoursEnd, setHoursEnd] = useState(editingWorkflow?.working_hours_end?.substring(0, 5) || '19:00')
    const [workingDays, setWorkingDays] = useState<number[]>(editingWorkflow?.working_days || [1, 2, 3, 4, 5])
    const [maxPerDay, setMaxPerDay] = useState(editingWorkflow?.max_leads_per_day || 50)
    const [batchSize, setBatchSize] = useState(editingWorkflow?.batch_size || 100)
    const [batchInterval, setBatchInterval] = useState(editingWorkflow?.batch_interval_seconds || 60)
    const [conversionGoal, setConversionGoal] = useState(editingWorkflow?.conversion_goal_status || 'Prospect')
    const [stopOnResponse, setStopOnResponse] = useState(editingWorkflow?.stop_on_customer_response ?? true)
    const [steps, setSteps] = useState<Step[]>((editingWorkflow?.outreach_steps || []).sort((a: any, b: any) => a.step_order - b.step_order))
    const [saving, setSaving] = useState(false)
    const [deletedStepIds, setDeletedStepIds] = useState<string[]>([])

    const addStep = (actionType: string) => {
        const id = `temp-${Date.now()}`
        const order = steps.length + 1
        const type = ACTION_TYPES.find(a => a.value === actionType)
        const defaultConfig = getDefaultConfig(actionType)
        setSteps(prev => [...prev, {
            id, step_order: order,
            name: type?.label || actionType,
            action_type: actionType,
            config: defaultConfig,
            on_success: 'next', on_failure: 'next', on_no_answer: 'next', on_busy: 'retry',
        }])
    }

    const removeStep = (id: string) => {
        // temp adımlar henüz DB'de yok, sadece local'den sil
        if (!id.startsWith('temp-')) {
            setDeletedStepIds(prev => [...prev, id])
        }
        setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, step_order: i + 1 })))
    }

    const updateStepConfig = (id: string, key: string, value: any) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s))
    }

    const updateStepField = (id: string, field: string, value: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleSave = async () => {
        if (!name) return toast.warning('Workflow adı gerekli')
        if (steps.length === 0) return toast.warning('En az 1 adım ekleyin')
        setSaving(true)
        try {
            if (editingWorkflow?.id) {
                // ── Güncelleme modu ──
                const updatePayload: any = {
                    name,
                    description,
                    working_hours_start: hoursStart,
                    working_hours_end: hoursEnd,
                    working_days: workingDays,
                    is_active: editingWorkflow.is_active,
                    is_auto_detect: false,
                    auto_detect_days: 0,
                    max_leads_per_day: maxPerDay,
                    batch_size: batchSize,
                    batch_interval_seconds: batchInterval,
                    stop_on_customer_response: stopOnResponse,
                }
                // segment_id: sadece değer varsa ekle
                if (segmentId) updatePayload.segment_id = segmentId

                const wfResult = await updateWorkflow(editingWorkflow.id, updatePayload)
                if (wfResult.error) {
                    toast.error('Kayıt hatası: ' + wfResult.error)
                    setSaving(false)
                    return
                }

                // Silinen adımları DB'den kaldır
                for (const deletedId of deletedStepIds) {
                    await deleteStep(deletedId)
                }

                // Adımları güncelle / yeni adım ekle
                for (const s of steps) {
                    if (s.id.startsWith('temp-')) {
                        const r = await addStepAction(editingWorkflow.id, {
                            step_order: s.step_order, name: s.name, action_type: s.action_type,
                            config: s.config, on_success: s.on_success, on_failure: s.on_failure,
                        })
                        if (r?.error) toast.error('Adım eklenemedi: ' + r.error)
                    } else {
                        const r = await updateStep(s.id, {
                            step_order: s.step_order, name: s.name, config: s.config,
                            on_success: s.on_success, on_failure: s.on_failure,
                        })
                        if (r?.error) toast.error('Adım güncellenemedi: ' + r.error)
                    }
                }
                toast.success('✅ Workflow güncellendi')
                onClose()
            } else {
                // ── Yeni oluşturma modu ──
                const result = await createWorkflow({
                    name, description, segment_id: segmentId || undefined,
                    working_hours_start: hoursStart, working_hours_end: hoursEnd,
                    working_days: workingDays,
                    is_auto_detect: false, auto_detect_days: 0,
                    max_leads_per_day: maxPerDay,
                    batch_size: batchSize,
                    batch_interval_seconds: batchInterval,
                    conversion_goal_status: conversionGoal,
                    stop_on_customer_response: stopOnResponse,
                    steps: steps.map(s => ({
                        step_order: s.step_order, name: s.name, action_type: s.action_type,
                        config: s.config,
                        on_success: s.on_success, on_failure: s.on_failure,
                        next_step_id_on_success: s.next_step_id_on_success,
                        next_step_id_on_failure: s.next_step_id_on_failure,
                    })),
                })
                if (result.error) toast.error('Hata: ' + result.error)
                else { toast.success('Workflow kaydedildi'); onClose() }
            }
        } catch (e: any) { toast.error('Hata: ' + e.message) }
        setSaving(false)
    }


    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    const toggleDay = (d: number) => {
        setWorkingDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onClose}><ArrowLeft className="h-4 w-4" /></Button>
                <h1 className="text-xl font-bold">
                    {editingWorkflow ? 'Workflow Düzenle' : 'Yeni Workflow Oluştur'}
                </h1>
                <div className="flex-1" />
                <Button onClick={handleSave} disabled={saving}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600">
                    <Save className="h-4 w-4" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Settings */}
                <div className="space-y-4">
                    <Card className="p-4 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-violet-400" /> Genel Ayarlar
                        </h2>
                        <div className="space-y-2">
                            <Label className="text-xs">Workflow Adı *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Soğuyan Lead Takibi" className="h-9" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Açıklama</Label>
                            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kısa açıklama..." rows={2} />
                        </div>
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Yanıt gelirse durdur</Label>
                                <Switch checked={stopOnResponse} onCheckedChange={setStopOnResponse} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Hedef Statü (Bununla sonlandır)</Label>
                                <Select value={conversionGoal} onValueChange={setConversionGoal}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Prospect">Prospect (Fırsat)</SelectItem>
                                        <SelectItem value="Sale">Sale (Satış)</SelectItem>
                                        <SelectItem value="Meeting">Meeting (Randevu)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* Segment Selection */}
                    <Card className="p-4 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-400" /> Hedef Kitle
                        </h2>
                        {segments.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-xs text-muted-foreground">Henüz segment oluşturulmamış.</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Outreach ana ekranından segment oluşturabilirsiniz.</p>
                            </div>
                        ) : (
                            <>
                                <Select value={segmentId} onValueChange={setSegmentId}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Segment seç..." /></SelectTrigger>
                                    <SelectContent>
                                        {segments.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                {/* Selected Segment Summary */}
                                {segmentId && (() => {
                                    const seg = segments.find(s => s.id === segmentId)
                                    const f = seg?.filters || {}
                                    return seg ? (
                                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                                            <p className="text-xs font-medium text-emerald-400">{seg.name}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {f.statuses?.map((s: string) => (
                                                    <Badge key={s} variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/10">{s}</Badge>
                                                ))}
                                                {f.project_id && (
                                                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
                                                        📁 {projects.find(p => p.id === f.project_id)?.name || 'Proje'}
                                                    </Badge>
                                                )}
                                                {f.days_inactive && (
                                                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                                                        ⏰ {f.days_inactive}g hareketsiz
                                                    </Badge>
                                                )}
                                                {f.unassigned && (
                                                    <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400 bg-rose-500/10">
                                                        Atanmamış
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ) : null
                                })()}
                            </>
                        )}
                    </Card>

                    {/* Schedule */}
                    <Card className="p-4 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-400" /> Zamanlama
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            <div><Label className="text-xs">Başlangıç</Label><Input type="time" value={hoursStart} onChange={e => setHoursStart(e.target.value)} className="h-8 text-xs" /></div>
                            <div><Label className="text-xs">Bitiş</Label><Input type="time" value={hoursEnd} onChange={e => setHoursEnd(e.target.value)} className="h-8 text-xs" /></div>
                        </div>
                        <div className="flex gap-1">
                            {dayNames.map((d, i) => (
                                <Button key={i} variant="outline" size="sm"
                                    className={`flex-1 h-7 text-[10px] px-0 ${workingDays.includes(i + 1) ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : ''}`}
                                    onClick={() => toggleDay(i + 1)}>{d}</Button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Günlük max lead</Label>
                            <Input type="number" value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))} className="h-8 w-20 text-xs text-right" />
                        </div>
                        <div className="pt-2 border-t space-y-2">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">İşleme Hızı</p>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Batch boyutu</Label>
                                <Input type="number" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} className="h-8 w-20 text-xs text-right" />
                            </div>
                            <p className="text-[9px] text-muted-foreground">Her cron döngüsünde kaç mesaj gönderilecek</p>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Cron aralığı (sn)</Label>
                                <Input type="number" value={batchInterval} onChange={e => setBatchInterval(Number(e.target.value))} className="h-8 w-20 text-xs text-right" />
                            </div>
                            <p className="text-[9px] text-muted-foreground">Vercel cron çalışma sıklığı (global: 60sn)</p>
                        </div>
                    </Card>
                </div>

                {/* Center & Right: Steps */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="p-4">
                        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-violet-400" /> Adımlar ({steps.length})
                        </h2>

                        {/* Step List */}
                        <div className="space-y-2">
                            {steps.map((step, idx) => {
                                const type = ACTION_TYPES.find(a => a.value === step.action_type)
                                const Icon = type?.icon || Zap
                                const color = type?.color || 'slate'
                                return (
                                    <div key={step.id}>
                                        <Card className={`border ${colorMap[color]} p-3`}>
                                            <div className="flex items-start gap-2">
                                                <div className="flex items-center gap-1 mt-1">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                                                    <Badge variant="outline" className="text-[10px] h-5 w-5 p-0 justify-center">{idx + 1}</Badge>
                                                </div>
                                                <Icon className="h-4 w-4 mt-1.5 shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input value={step.name} onChange={e => updateStepField(step.id, 'name', e.target.value)}
                                                            className="h-7 text-xs font-medium flex-1" />
                                                        <Button variant="ghost" size="sm" onClick={() => removeStep(step.id)}
                                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    {/* Config based on type */}
                                                    <StepConfigEditor step={step} scripts={scripts}
                                                        onConfigChange={(k, v) => updateStepConfig(step.id, k, v)}
                                                        onFieldChange={(f, v) => updateStepField(step.id, f, v)} />

                                                    {/* Branching UI */}
                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-muted/50 mt-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                                                                {step.action_type === 'condition' ? 'Koşul Doğru ise' : 'Başarılı ise'}
                                                            </Label>
                                                            <Select value={step.next_step_id_on_success || 'next'} onValueChange={v => updateStepField(step.id, 'next_step_id_on_success', v)}>
                                                                <SelectTrigger className="h-6 text-[10px] bg-emerald-500/5 border-emerald-500/20"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="next">Sıradaki Adım</SelectItem>
                                                                    <SelectItem value="stop">Durdur</SelectItem>
                                                                    {steps.filter(s => s.id !== step.id).map(s => (
                                                                        <SelectItem key={s.id} value={s.id}>{s.step_order}. {s.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">
                                                                {step.action_type === 'condition' ? 'Koşul Yanlış ise' : 'Başarısız/Cevapsız ise'}
                                                            </Label>
                                                            <Select value={step.next_step_id_on_failure || 'next'} onValueChange={v => updateStepField(step.id, 'next_step_id_on_failure', v)}>
                                                                <SelectTrigger className="h-6 text-[10px] bg-rose-500/5 border-rose-500/20"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="next">Sıradaki Adım</SelectItem>
                                                                    <SelectItem value="stop">Durdur</SelectItem>
                                                                    {steps.filter(s => s.id !== step.id).map(s => (
                                                                        <SelectItem key={s.id} value={s.id}>{s.step_order}. {s.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                        {idx < steps.length - 1 && (
                                            <div className="flex justify-center py-1">
                                                <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Add Step Buttons */}
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Adım Ekle:</p>
                            <div className="flex flex-wrap gap-2">
                                {ACTION_TYPES.map(t => {
                                    const Icon = t.icon
                                    return (
                                        <Button key={t.value} variant="outline" size="sm"
                                            onClick={() => addStep(t.value)}
                                            className={`gap-1.5 text-xs ${colorMap[t.color]} hover:opacity-80`}>
                                            <Icon className="h-3 w-3" /> {t.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StepConfigEditor({ step, scripts, onConfigChange, onFieldChange }: {
    step: Step; scripts: any[];
    onConfigChange: (key: string, value: any) => void;
    onFieldChange: (field: string, value: string) => void
}) {
    const c = step.config

    switch (step.action_type) {
        case 'ai_call':
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-[10px]">AI Script</Label>
                        <Select value={c.script_id || ''} onValueChange={v => onConfigChange('script_id', v)}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Script seç" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Varsayılan</SelectItem>
                                {scripts.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Max süre (sn)</Label>
                        <Input type="number" value={c.max_duration_seconds || 180}
                            onChange={e => onConfigChange('max_duration_seconds', Number(e.target.value))} className="h-7 text-[11px]" />
                    </div>
                    <div className="col-span-2 p-2.5 rounded bg-muted/50 border space-y-2">
                        <div className="flex items-center gap-2">
                            <Switch checked={c.retry?.enabled || false}
                                onCheckedChange={(v: boolean) => onConfigChange('retry', { ...c.retry, enabled: v, interval_minutes: c.retry?.interval_minutes || 15, max_attempts: c.retry?.max_attempts || 3 })} />
                            <span className="text-[11px] font-medium">Cevap yoksa tekrar dene</span>
                        </div>
                        {c.retry?.enabled && (
                            <div className="flex items-center gap-2 pl-1">
                                <Input type="number" value={c.retry?.max_attempts || 3}
                                    onChange={e => onConfigChange('retry', { ...c.retry, max_attempts: Number(e.target.value) })}
                                    className="h-7 w-16 text-xs text-center" />
                                <span className="text-xs text-muted-foreground">kez,</span>
                                <Input type="number" value={c.retry?.interval_minutes || 15}
                                    onChange={e => onConfigChange('retry', { ...c.retry, interval_minutes: Number(e.target.value) })}
                                    className="h-7 w-16 text-xs text-center" />
                                <span className="text-xs text-muted-foreground">dk arayla</span>
                            </div>
                        )}
                    </div>
                </div>
            )
        case 'whatsapp':
            return <WhatsAppStepConfig c={c} onConfigChange={onConfigChange} />
        case 'sms':
            return (
                <div className="space-y-2">
                    <div>
                        <Label className="text-[10px]">Hazır Şablon</Label>
                        <Select value={c.sms_template_key || ''} onValueChange={v => onConfigChange('sms_template_key', v)}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Şablon seç" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="coldLeadReminder">Soğuyan Lead Hatırlatma</SelectItem>
                                <SelectItem value="appointmentOffer">Randevu Teklifi</SelectItem>
                                <SelectItem value="lastChance">Son Fırsat</SelectItem>
                                <SelectItem value="missedCall">Cevapsız Arama</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px]">Veya Özel Mesaj</Label>
                        <Textarea value={c.custom_message || ''} onChange={e => onConfigChange('custom_message', e.target.value)}
                            placeholder="Sayın {customer_name}..." rows={2} className="text-[11px]" />
                    </div>
                </div>
            )
        case 'wait':
            return (
                <div className="flex items-center gap-2">
                    <Input type="number" value={c.duration_value || 1}
                        onChange={e => onConfigChange('duration_value', Number(e.target.value))} className="h-7 w-16 text-[11px]" />
                    <Select value={c.duration_unit || 'hours'} onValueChange={v => onConfigChange('duration_unit', v)}>
                        <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minutes">Dakika</SelectItem>
                            <SelectItem value="hours">Saat</SelectItem>
                            <SelectItem value="days">Gün</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-[11px] text-muted-foreground">bekle</span>
                </div>
            )
        case 'status_update':
            return (
                <div className="space-y-2">
                    <Select value={c.new_status || ''} onValueChange={v => onConfigChange('new_status', v)}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Yeni statü seç" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Prospect">Prospect</SelectItem>
                            <SelectItem value="Lost">Lost (Kaybedildi)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input value={c.add_note || ''} onChange={e => onConfigChange('add_note', e.target.value)}
                        placeholder="Not ekle (opsiyonel)" className="h-7 text-[11px]" />
                </div>
            )
        case 'notify':
            return (
                <Input value={c.notify_message || ''} onChange={e => onConfigChange('notify_message', e.target.value)}
                    placeholder="Bildirim mesajı..." className="h-7 text-[11px]" />
            )
        case 'condition':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Select value={c.field || 'status'} onValueChange={v => onConfigChange('field', v)}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="status">Lead Statüsü</SelectItem>
                                <SelectItem value="source">Kaynak</SelectItem>
                                <SelectItem value="project_id">Proje</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={c.operator || 'eq'} onValueChange={v => onConfigChange('operator', v)}>
                            <SelectTrigger className="h-7 w-20 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="eq">Eşit</SelectItem>
                                <SelectItem value="neq">Değil</SelectItem>
                                <SelectItem value="contains">İçerir</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input value={c.value || ''} onChange={e => onConfigChange('value', e.target.value)}
                            placeholder="Değer..." className="h-7 flex-1 text-[11px]" />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic">Bu koşul sağlanırsa 'Başarılı' yolunu, sağlanmazsa 'Başarısız' yolunu izler.</p>
                </div>
            )
        case 'ai_personalize':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-purple-400 mb-1">
                        <Sparkles className="h-3 w-3" /> Akıllı Mesaj Yazımı
                    </div>
                    <Textarea value={c.instruction || ''} onChange={e => onConfigChange('instruction', e.target.value)}
                        placeholder="Örn: Müşterinin son görüşme notlarına bakarak sıcak bir giriş yap ve ilgilendiği projenin avantajlarını vurgula."
                        rows={2} className="text-[11px]" />
                    <p className="text-[9px] text-muted-foreground mt-1">Bu adımda AI mesajı hazırlar, bir sonraki WhatsApp/SMS adımında {`{{personalized_message}}`} olarak kullanılır.</p>
                </div>
            )
        default:
            return null
    }
}

function WhatsAppStepConfig({ c, onConfigChange }: {
    c: any
    onConfigChange: (key: string, value: any) => void
}) {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getWhatsAppTemplates().then(res => {
            setTemplates(res)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const selected = templates.find(t => t.name === c.template_name)

    return (
        <div className="space-y-2">
            <div>
                <Label className="text-[10px]">WhatsApp Şablonu (Meta Onaylı)</Label>
                <Select value={c.template_name || ''} onValueChange={v => onConfigChange('template_name', v)}>
                    <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue placeholder={loading ? 'Şablonlar yükleniyor...' : 'Şablon seç...'} />
                    </SelectTrigger>
                    <SelectContent>
                        {templates.map(t => (
                            <SelectItem key={t.name} value={t.name}>
                                <span className="font-medium">{t.name}</span>
                                {t.status && <span className="ml-2 text-[9px] text-muted-foreground">({t.status})</span>}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {selected && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">📋 Şablon Önizleme (Salt Okunur)</p>
                        <a
                            href="https://business.facebook.com/latest/whatsapp_manager/message_templates"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        >
                            Düzenlemek için → WhatsApp Yöneticisi ↗
                        </a>
                    </div>
                    {/* WhatsApp bubble */}
                    <div className="rounded-xl rounded-tl-sm bg-[#1a1a1a] border border-white/10 p-3 max-h-48 overflow-y-auto">
                        <pre className="text-[12px] text-white/85 leading-relaxed whitespace-pre-wrap font-sans select-none break-words">{selected.body}</pre>
                    </div>
                    <div className="flex items-center gap-3">
                        {selected.params > 0 && (
                            <span className="text-[9px] text-emerald-400">⚡ {selected.params} parametre — customer_name otomatik doldurulur</span>
                        )}
                        <span className="text-[9px] text-amber-400/60 italic">⚠ Meta onaylı şablon, değiştirilemez</span>
                    </div>
                </div>
            )}
        </div>
    )
}

function getDefaultConfig(type: string): any {
    switch (type) {
        case 'ai_call': return { max_duration_seconds: 180, retry: { enabled: true, interval_minutes: 15, max_attempts: 3 } }
        case 'whatsapp': return { template_name: '', free_text: '' }
        case 'sms': return { sms_template_key: 'coldLeadReminder' }
        case 'wait': return { duration_value: 2, duration_unit: 'hours' }
        case 'condition': return { field: 'status', operator: 'eq', value: '' }
        case 'ai_personalize': return { instruction: '' }
        case 'status_update': return { new_status: '' }
        case 'notify': return { notify_message: 'Outreach tamamlandı: {customer_name}' }
        default: return {}
    }
}
