'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Plus, ArrowLeft, ArrowRight, Trash2, Save, Filter, PlayCircle, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTriggers, createTrigger, deleteTrigger, toggleTrigger } from '../actions'

interface TriggerManagerProps {
    workflows: any[]
    tenantId: string
    onClose: () => void
}

const EVENT_TYPES = [
    { value: 'lead_created', label: 'Yeni Lead Oluştuğunda', icon: Plus },
    { value: 'status_changed', label: 'Statü Değiştiğinde', icon: Settings2 },
    { value: 'activity_created', label: 'Aktivite Eklendiğinde', icon: PlayCircle },
]

export function TriggerManager({ workflows, tenantId, onClose }: TriggerManagerProps) {
    const [triggers, setTriggers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    
    // Form state
    const [workflowId, setWorkflowId] = useState('')
    const [eventType, setEventType] = useState('lead_created')
    const [configKey, setConfigKey] = useState('')
    const [configValue, setConfigValue] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadTriggers()
    }, [])

    async function loadTriggers() {
        const data = await getTriggers()
        setTriggers(data)
        setLoading(false)
    }

    async function handleSave() {
        if (!workflowId) return toast.error('Lütfen bir workflow seçin')
        setSaving(true)
        
        const event_config: any = {}
        if (configKey && configValue) {
            event_config[configKey] = configValue
        }

        const result = await createTrigger({
            workflow_id: workflowId,
            event_type: eventType,
            event_config
        })

        if (result.success) {
            toast.success('Tetikleyici oluşturuldu')
            setShowAdd(false)
            loadTriggers()
        } else {
            toast.error('Hata: ' + result.error)
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu tetikleyiciyi silmek istediğinize emin misiniz?')) return
        const result = await deleteTrigger(id)
        if (result.success) {
            setTriggers(prev => prev.filter(t => t.id !== id))
            toast.success('Tetikleyici silindi')
        }
    }

    async function handleToggle(id: string, active: boolean) {
        const result = await toggleTrigger(id, !active)
        if (result.success) {
            setTriggers(prev => prev.map(t => t.id === id ? { ...t, is_active: !active } : t))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between md:pr-36">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-400" />
                            Otomasyon Tetikleyicileri
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sistemdeki olaylar gerçekleştiğinde otomatik olarak akışları başlatın.
                        </p>
                    </div>
                </div>
                {!showAdd && (
                    <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2 bg-amber-600 hover:bg-amber-700">
                        <Plus className="h-4 w-4" />
                        Yeni Tetikleyici
                    </Button>
                )}
            </div>

            {showAdd && (
                <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Olay Tipi</Label>
                            <Select value={eventType} onValueChange={setEventType}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EVENT_TYPES.map(e => (
                                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Çalışacak Workflow</Label>
                            <Select value={workflowId} onValueChange={setWorkflowId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.filter(w => w.is_active).map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Kriter (Opsiyonel)</Label>
                            <div className="flex gap-2">
                                <Input placeholder="Alan (Örn: status)" value={configKey} onChange={e => setConfigKey(e.target.value)} className="h-9 text-xs" />
                                <Input placeholder="Değer (Örn: Inbox)" value={configValue} onChange={e => setConfigValue(e.target.value)} className="h-9 text-xs" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 bg-amber-600">
                                <Save className="h-4 w-4 mr-2" />
                                Kaydet
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="px-3">
                                İptal
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <p className="text-center py-12 text-muted-foreground animate-pulse">Tetikleyiciler yükleniyor...</p>
                ) : triggers.length === 0 ? (
                    <Card className="p-12 text-center border-dashed bg-muted/30">
                        <Zap className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="font-semibold">Henüz tetikleyici yok</h3>
                        <p className="text-sm text-muted-foreground mt-1">Sistemi otomatize etmek için ilk tetikleyicinizi oluşturun.</p>
                    </Card>
                ) : (
                    triggers.map(trigger => {
                        const EventIcon = EVENT_TYPES.find(e => e.value === trigger.event_type)?.icon || Zap
                        return (
                            <Card key={trigger.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <EventIcon className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm">
                                                    {EVENT_TYPES.find(e => e.value === trigger.event_type)?.label}
                                                </h3>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                                                    {trigger.outreach_workflows?.name}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {trigger.event_config && Object.keys(trigger.event_config).length > 0 && (
                                                    <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                                                        <Filter className="h-3 w-3" />
                                                        Kriter: {JSON.stringify(trigger.event_config)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground">{trigger.is_active ? 'Aktif' : 'Pasif'}</span>
                                            <Switch checked={trigger.is_active} onCheckedChange={() => handleToggle(trigger.id, trigger.is_active)} />
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(trigger.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
