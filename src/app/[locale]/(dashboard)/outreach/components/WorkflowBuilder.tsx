'use client'

import { useState } from 'react'
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
    ArrowLeft, ArrowDown, Trash2, GripVertical, Save, Target, Bot, Bell
} from 'lucide-react'
import { createWorkflow, createSegment } from '../actions'

const ACTION_TYPES = [
    { value: 'ai_call', label: 'AI Telefon Araması', icon: Phone, color: 'violet' },
    { value: 'whatsapp', label: 'WhatsApp Mesajı', icon: MessageSquare, color: 'emerald' },
    { value: 'sms', label: 'SMS Gönder', icon: Mail, color: 'blue' },
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
    on_no_answer: string
    on_busy: string
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
    const [autoDetect, setAutoDetect] = useState(editingWorkflow?.is_auto_detect || false)
    const [autoDetectDays, setAutoDetectDays] = useState(editingWorkflow?.auto_detect_days || 3)
    const [maxPerDay, setMaxPerDay] = useState(editingWorkflow?.max_leads_per_day || 50)
    const [steps, setSteps] = useState<Step[]>(editingWorkflow?.outreach_steps || [])
    const [saving, setSaving] = useState(false)
    const [showSegmentForm, setShowSegmentForm] = useState(false)
    const [segName, setSegName] = useState('')
    const [segStatuses, setSegStatuses] = useState<string[]>(['Lead', 'Prospect'])
    const [segProjectId, setSegProjectId] = useState('')
    const [segAssignedTo, setSegAssignedTo] = useState('any')
    const [segDateFrom, setSegDateFrom] = useState('')
    const [segDateTo, setSegDateTo] = useState('')
    const [segDaysInactive, setSegDaysInactive] = useState('')

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
        setSteps(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, step_order: i + 1 })))
    }

    const updateStepConfig = (id: string, key: string, value: any) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s))
    }

    const updateStepField = (id: string, field: string, value: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleSave = async () => {
        if (!name) return alert('Workflow adı gerekli')
        if (steps.length === 0) return alert('En az 1 adım ekleyin')
        setSaving(true)
        try {
            const result = await createWorkflow({
                name, description, segment_id: segmentId || undefined,
                working_hours_start: hoursStart, working_hours_end: hoursEnd,
                working_days: workingDays,
                is_auto_detect: autoDetect, auto_detect_days: autoDetectDays,
                max_leads_per_day: maxPerDay,
                steps: steps.map(s => ({
                    step_order: s.step_order, name: s.name, action_type: s.action_type,
                    config: s.config, on_success: s.on_success, on_failure: s.on_failure,
                    on_no_answer: s.on_no_answer, on_busy: s.on_busy,
                })),
            })
            if (result.error) alert('Hata: ' + result.error)
            else onClose()
        } catch (e: any) { alert('Hata: ' + e.message) }
        setSaving(false)
    }

    const handleCreateSegment = async () => {
        if (!segName) return
        const filters: any = { statuses: segStatuses }
        if (segProjectId && segProjectId !== 'all') filters.project_id = segProjectId
        if (segAssignedTo === 'unassigned') filters.unassigned = true
        else if (segAssignedTo && segAssignedTo !== 'any') filters.assigned_to = segAssignedTo
        if (segDateFrom) filters.date_from = segDateFrom
        if (segDateTo) filters.date_to = segDateTo
        if (segDaysInactive) filters.days_inactive = Number(segDaysInactive)

        const result = await createSegment({
            name: segName,
            filters,
        })
        if (result.data) {
            setSegmentId(result.data.id)
            segments.push(result.data)
            setShowSegmentForm(false)
        }
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
                    </Card>

                    {/* Segment Selection */}
                    <Card className="p-4 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-400" /> Hedef Kitle
                        </h2>
                        <Select value={segmentId} onValueChange={setSegmentId}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Segment seç..." /></SelectTrigger>
                            <SelectContent>
                                {segments.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => setShowSegmentForm(!showSegmentForm)} className="w-full gap-1 text-xs">
                            <Plus className="h-3 w-3" /> Yeni Segment
                        </Button>
                        {showSegmentForm && (
                            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                                <Input value={segName} onChange={e => setSegName(e.target.value)} placeholder="Segment adı" className="h-8 text-xs" />
                                <div className="flex flex-wrap gap-1">
                                    {['Lead', 'Prospect', 'Potential', 'Lost'].map(s => (
                                        <Badge key={s} variant="outline"
                                            className={`cursor-pointer text-[10px] ${segStatuses.includes(s) ? 'bg-violet-500/20 border-violet-500/40' : ''}`}
                                            onClick={() => setSegStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                                <Select value={segProjectId} onValueChange={setSegProjectId}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tüm Projeler" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Projeler</SelectItem>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-1">
                                    <Label className="text-[10px]">Temsilci Durumu</Label>
                                    <Select value={segAssignedTo} onValueChange={setSegAssignedTo}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Fark etmez" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Fark etmez</SelectItem>
                                            <SelectItem value="unassigned">Atanmamış Lead'ler</SelectItem>
                                            {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Kayıt Başlangıç</Label>
                                        <Input type="date" value={segDateFrom} onChange={e => setSegDateFrom(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Kayıt Bitiş</Label>
                                        <Input type="date" value={segDateTo} onChange={e => setSegDateTo(e.target.value)} className="h-8 text-xs" />
                                    </div>
                                </div>

                                <div className="space-y-1 pb-1">
                                    <Label className="text-[10px]">Hareketsizlik Süresi (Gün)</Label>
                                    <Input type="number" placeholder="Örn: 7" value={segDaysInactive} onChange={e => setSegDaysInactive(e.target.value)} className="h-8 text-xs" />
                                </div>
                                <Button size="sm" onClick={handleCreateSegment} className="w-full h-8 text-xs">Hedef Kitleyi Kaydet</Button>
                            </div>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-xs">Otomatik Tespit</Label>
                                <p className="text-[10px] text-muted-foreground">Soğuyan lead&apos;leri otomatik bul</p>
                            </div>
                            <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
                        </div>
                        {autoDetect && (
                            <div className="flex items-center justify-between">
                                <Label className="text-xs">Soğuma süresi (gün)</Label>
                                <Input type="number" value={autoDetectDays} onChange={e => setAutoDetectDays(Number(e.target.value))} className="h-8 w-20 text-xs text-right" />
                            </div>
                        )}
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
                    <div className="col-span-2 flex items-center gap-2 p-2 rounded bg-muted/50 border">
                        <Switch checked={c.retry?.enabled || false}
                            onCheckedChange={v => onConfigChange('retry', { ...c.retry, enabled: v, interval_minutes: c.retry?.interval_minutes || 15, max_attempts: c.retry?.max_attempts || 3 })} />
                        <span className="text-[11px]">Tekrar dene:</span>
                        {c.retry?.enabled && (
                            <>
                                <Input type="number" value={c.retry?.max_attempts || 3}
                                    onChange={e => onConfigChange('retry', { ...c.retry, max_attempts: Number(e.target.value) })}
                                    className="h-6 w-12 text-[10px]" />
                                <span className="text-[10px] text-muted-foreground">kez,</span>
                                <Input type="number" value={c.retry?.interval_minutes || 15}
                                    onChange={e => onConfigChange('retry', { ...c.retry, interval_minutes: Number(e.target.value) })}
                                    className="h-6 w-12 text-[10px]" />
                                <span className="text-[10px] text-muted-foreground">dk ara</span>
                            </>
                        )}
                    </div>
                </div>
            )
        case 'whatsapp':
            return (
                <div className="space-y-2">
                    <div>
                        <Label className="text-[10px]">Template Adı (Meta onaylı)</Label>
                        <Input value={c.template_name || ''} onChange={e => onConfigChange('template_name', e.target.value)}
                            placeholder="lead_followup_v1" className="h-7 text-[11px]" />
                    </div>
                    <div>
                        <Label className="text-[10px]">Veya Serbest Mesaj</Label>
                        <Textarea value={c.free_text || ''} onChange={e => onConfigChange('free_text', e.target.value)}
                            placeholder="Merhaba {customer_name}..." rows={2} className="text-[11px]" />
                        <p className="text-[9px] text-muted-foreground mt-1">Değişkenler: {'{customer_name}'}, {'{project_name}'}</p>
                    </div>
                </div>
            )
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
        default:
            return null
    }
}

function getDefaultConfig(type: string): any {
    switch (type) {
        case 'ai_call': return { max_duration_seconds: 180, retry: { enabled: true, interval_minutes: 15, max_attempts: 3 } }
        case 'whatsapp': return { template_name: '', free_text: '' }
        case 'sms': return { sms_template_key: 'coldLeadReminder' }
        case 'wait': return { duration_value: 2, duration_unit: 'hours' }
        case 'status_update': return { new_status: '' }
        case 'notify': return { notify_message: 'Outreach tamamlandı: {customer_name}' }
        default: return {}
    }
}
