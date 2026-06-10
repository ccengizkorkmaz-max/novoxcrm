'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Target, Plus, ArrowLeft, Trash2, Save, Users, Search,
    Pencil, Eye, Filter, X, Loader2, ChevronRight, Sparkles
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { createSegment, updateSegment, deleteSegment, previewSegment } from '../actions'
import { aiParseSegmentFilters, type ParsedSegmentFilters } from '@/lib/ai/segment-parser'

const SALES_STATUS_OPTIONS = ['Lead', 'Prospect', 'Potential', 'Lost', 'Customer', 'Contacted']
const LQ_STATUS_OPTIONS = ['new', 'follow_up', 'unreachable', 'qualified', 'disqualified']
const LQ_STATUS_LABELS: Record<string, string> = { new: 'Yeni', follow_up: 'Takipte', unreachable: 'Ulaşılamadı', qualified: 'Uygun', disqualified: 'Elendi' }
const SOURCE_OPTIONS = [
    { value: 'sales', label: 'Satış Pipeline' },
    { value: 'lead_qualifications', label: 'Ön Değerlendirme' },
]

interface SegmentManagerProps {
    segments: any[]
    projects: any[]
    profiles: any[]
    tenantId: string
    onClose: () => void
    onSegmentsChange?: (segments: any[]) => void
    isStandalone?: boolean
}

export function SegmentManager({ segments: initialSegments, projects, profiles, tenantId, onClose, onSegmentsChange, isStandalone }: SegmentManagerProps) {
    const [segments, setSegments] = useState(initialSegments)
    const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
    const [editingSegment, setEditingSegment] = useState<any>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState('sales')
    const [statuses, setStatuses] = useState<string[]>(['Lead', 'Prospect'])
    const [projectId, setProjectId] = useState('')
    const [assignedTo, setAssignedTo] = useState('any')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [daysInactive, setDaysInactive] = useState('')
    const [saving, setSaving] = useState(false)

    // Preview state
    const [previewCount, setPreviewCount] = useState<number | null>(null)
    const [previewLeads, setPreviewLeads] = useState<any[]>([])
    const [previewing, setPreviewing] = useState(false)

    // AI state
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiParsing, setAiParsing] = useState(false)
    const [aiFilters, setAiFilters] = useState<ParsedSegmentFilters | null>(null)
    const [aiError, setAiError] = useState('')

    const resetForm = () => {
        setName('')
        setDescription('')
        setSource('sales')
        setStatuses(['Lead', 'Prospect'])
        setProjectId('')
        setAssignedTo('any')
        setDateFrom('')
        setDateTo('')
        setDaysInactive('')
        setPreviewCount(null)
        setPreviewLeads([])
        setAiPrompt('')
        setAiFilters(null)
        setAiError('')
    }

    const openCreate = () => {
        resetForm()
        setEditingSegment(null)
        setView('create')
    }

    const openEdit = (segment: any) => {
        const f = segment.filters || {}
        setName(segment.name || '')
        setDescription(segment.description || '')
        setSource(f.source || 'sales')
        setStatuses(f.statuses || (f.source === 'lead_qualifications' ? ['new', 'follow_up'] : ['Lead', 'Prospect']))
        setProjectId(f.project_id || '')
        setAssignedTo(f.unassigned ? 'unassigned' : f.assigned_to || 'any')
        setDateFrom(f.date_from || '')
        setDateTo(f.date_to || '')
        setDaysInactive(f.days_inactive?.toString() || '')
        setEditingSegment(segment)
        setPreviewCount(null)
        setPreviewLeads([])
        setView('edit')
    }

    const buildFilters = () => {
        const filters: any = { source, statuses }
        if (projectId && projectId !== 'all') filters.project_id = projectId
        if (assignedTo === 'unassigned') filters.unassigned = true
        else if (assignedTo && assignedTo !== 'any') filters.assigned_to = assignedTo
        if (dateFrom) filters.date_from = dateFrom
        if (dateTo) filters.date_to = dateTo
        if (daysInactive) filters.days_inactive = Number(daysInactive)
        // Extended filters from AI
        if (aiFilters?.tags?.length) filters.tags = aiFilters.tags
        if (aiFilters?.city) filters.city = aiFilters.city
        if (aiFilters?.profile_data && Object.keys(aiFilters.profile_data).length > 0) filters.profile_data = aiFilters.profile_data
        if (aiFilters?.demand_filters && Object.keys(aiFilters.demand_filters).length > 0) filters.demand_filters = aiFilters.demand_filters
        return filters
    }

    const handleSourceChange = (newSource: string) => {
        setSource(newSource)
        // Reset statuses to appropriate defaults for the new source
        if (newSource === 'lead_qualifications') {
            setStatuses(['new', 'follow_up', 'unreachable', 'qualified'])
        } else {
            setStatuses(['Lead', 'Prospect'])
        }
    }

    const currentStatusOptions = source === 'lead_qualifications' ? LQ_STATUS_OPTIONS : SALES_STATUS_OPTIONS

    const handlePreview = useCallback(async () => {
        setPreviewing(true)
        try {
            const filters = buildFilters()
            const result = await previewSegment(filters)
            setPreviewCount(result.count)
            setPreviewLeads(result.preview || [])
        } catch { /* ignore */ }
        setPreviewing(false)
    }, [statuses, projectId, assignedTo, dateFrom, dateTo, daysInactive, source, aiFilters])

    // Auto-preview on filter change (debounced)
    useEffect(() => {
        if (view !== 'create' && view !== 'edit') return
        const timer = setTimeout(() => { handlePreview() }, 600)
        return () => clearTimeout(timer)
    }, [statuses, projectId, assignedTo, dateFrom, dateTo, daysInactive, source, view, handlePreview, aiFilters])

    const handleSave = async () => {
        if (!name.trim()) return alert('Segment adı gerekli')
        setSaving(true)
        const filters = buildFilters()

        if (editingSegment) {
            const result = await updateSegment(editingSegment.id, { name, description, filters })
            if (result.success) {
                const updated = segments.map(s => s.id === editingSegment.id ? { ...s, name, description, filters } : s)
                setSegments(updated)
                onSegmentsChange?.(updated)
            } else {
                alert('Hata: ' + result.error)
            }
        } else {
            const result = await createSegment({ name, description, filters })
            if (result.data) {
                const updated = [result.data, ...segments]
                setSegments(updated)
                onSegmentsChange?.(updated)
            } else {
                alert('Hata: ' + result.error)
            }
        }
        setSaving(false)
        setView('list')
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu segment silinsin mi?')) return
        const result = await deleteSegment(id)
        if (result.success) {
            const updated = segments.filter(s => s.id !== id)
            setSegments(updated)
            onSegmentsChange?.(updated)
        }
    }

    // ─── List View ───────────────────────────────────────────
    if (view === 'list') {
        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 md:pr-36">
                    {!isStandalone && (
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                                <Target className="h-5 w-5 text-emerald-400" />
                            </div>
                            Segment Yönetimi
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Hedef kitlelerinizi oluşturun ve yönetin. Workflow&apos;larda kullanılmak üzere hazır segmentler tanımlayın.
                        </p>
                    </div>
                    <Button size="sm" onClick={openCreate}
                        className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        <Plus className="h-4 w-4" />
                        Yeni Segment
                    </Button>
                </div>

                {/* Segment Cards */}
                {segments.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/30 p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 rounded-full bg-emerald-500/10">
                                <Target className="h-8 w-8 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Henüz segment oluşturulmamış</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    İlk hedef kitlenizi oluşturarak outreach kampanyalarınıza başlayın.
                                </p>
                            </div>
                            <Button onClick={openCreate}
                                className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                                <Plus className="h-4 w-4" />
                                İlk Segmenti Oluştur
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {segments.map(seg => {
                            const f = seg.filters || {}
                            const isExpanded = expandedId === seg.id
                            return (
                                <Card key={seg.id} className="hover:bg-muted/30 transition-colors">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1 cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : seg.id)}>
                                                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                    <Target className="h-4 w-4 text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-sm">{seg.name}</h3>
                                                        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                    {seg.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{seg.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {f.statuses?.map((s: string) => (
                                                            <Badge key={s} variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 bg-violet-500/10">
                                                                {s}
                                                            </Badge>
                                                        ))}
                                                        {f.project_id && (
                                                            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
                                                                📁 {projects.find(p => p.id === f.project_id)?.name || 'Proje'}
                                                            </Badge>
                                                        )}
                                                        {f.days_inactive && (
                                                            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                                                                ⏰ {f.days_inactive} gün hareketsiz
                                                            </Badge>
                                                        )}
                                                        {f.unassigned && (
                                                            <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400 bg-rose-500/10">
                                                                Atanmamış
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-3">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(seg)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-400">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(seg.id)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Expanded Preview */}
                                        {isExpanded && (
                                            <SegmentPreviewCard segmentId={seg.id} filters={f} />
                                        )}
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    // ─── Create / Edit View ──────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 md:pr-36">
                <Button variant="ghost" size="sm" onClick={() => setView('list')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-bold">
                    {editingSegment ? 'Segmenti Düzenle' : 'Yeni Segment Oluştur'}
                </h1>
                <div className="flex-1" />
                <Button onClick={handleSave} disabled={saving}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <Save className="h-4 w-4" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Basic Info */}
                    <Card className="p-5 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-emerald-400" />
                            Segment Bilgileri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Segment Adı *</Label>
                                <Input value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Örn: Soğuyan İzmir Lead'leri" className="h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Açıklama</Label>
                                <Input value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Kısa açıklama..." className="h-9" />
                            </div>
                        </div>
                    </Card>

                    {/* AI Segment Builder */}
                    <Card className="p-5 space-y-4 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-400" />
                            AI ile Segment Oluştur
                        </h2>
                        <p className="text-[11px] text-muted-foreground">
                            Hedef kitlenizi doğal dilde tanımlayın, AI filtreleri otomatik oluşturur.
                        </p>
                        <Textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder="Örn: Son 30 günde gelen İstanbul'daki premium yatırımcı müşteriler, 3+1 arayan, 500K-1M bütçeli..."
                            className="min-h-[80px] text-xs resize-none border-violet-500/20 focus:border-violet-500/40"
                        />
                        <Button
                            type="button"
                            onClick={async () => {
                                if (!aiPrompt.trim()) return
                                setAiParsing(true)
                                setAiError('')
                                setAiFilters(null)
                                const result = await aiParseSegmentFilters(
                                    aiPrompt,
                                    projects.map(p => p.name),
                                    profiles.map(p => p.full_name)
                                )
                                if (result.error) {
                                    setAiError(result.error)
                                } else if (result.filters) {
                                    setAiFilters(result.filters)
                                    // Apply parsed filters to form
                                    if (result.filters.source) handleSourceChange(result.filters.source)
                                    if (result.filters.statuses?.length) setStatuses(result.filters.statuses)
                                    if (result.filters.date_from) setDateFrom(result.filters.date_from)
                                    if (result.filters.date_to) setDateTo(result.filters.date_to)
                                    if (result.filters.days_inactive) setDaysInactive(result.filters.days_inactive.toString())
                                    if (result.filters.unassigned) setAssignedTo('unassigned')
                                    if (result.filters.segment_name && !name) setName(result.filters.segment_name)
                                    if (result.filters.segment_description && !description) setDescription(result.filters.segment_description)
                                    // Match project name to ID
                                    if (result.filters.project_name) {
                                        const match = projects.find(p => p.name.toLowerCase().includes(result.filters!.project_name!.toLowerCase()))
                                        if (match) setProjectId(match.id)
                                    }
                                    // Match assigned_to_name to ID
                                    if (result.filters.assigned_to_name) {
                                        const match = profiles.find(p => p.full_name.toLowerCase().includes(result.filters!.assigned_to_name!.toLowerCase()))
                                        if (match) setAssignedTo(match.id)
                                    }
                                }
                                setAiParsing(false)
                            }}
                            disabled={aiParsing || !aiPrompt.trim()}
                            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-xs font-bold"
                        >
                            {aiParsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            {aiParsing ? 'AI Analiz Ediyor...' : 'AI ile Filtrele'}
                        </Button>

                        {aiError && (
                            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">{aiError}</p>
                        )}

                        {/* AI Parsed Filters Display */}
                        {aiFilters && (
                            <div className="space-y-2 pt-2 border-t border-violet-500/20">
                                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">AI Önerisi</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {aiFilters.statuses?.map(s => (
                                        <Badge key={s} variant="outline" className="text-[10px] bg-violet-500/10 border-violet-500/30 text-violet-300">
                                            📊 {s}
                                        </Badge>
                                    ))}
                                    {aiFilters.tags?.map(t => (
                                        <Badge key={t} variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300">
                                            🏷️ {t}
                                        </Badge>
                                    ))}
                                    {aiFilters.city && (
                                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-300">
                                            📍 {aiFilters.city}
                                        </Badge>
                                    )}
                                    {aiFilters.date_from && (
                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                                            📅 {aiFilters.date_from}{aiFilters.date_to ? ` → ${aiFilters.date_to}` : ' →'}
                                        </Badge>
                                    )}
                                    {aiFilters.days_inactive && (
                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300">
                                            ⏰ {aiFilters.days_inactive} gün hareketsiz
                                        </Badge>
                                    )}
                                    {aiFilters.profile_data?.occupation && (
                                        <Badge variant="outline" className="text-[10px] bg-teal-500/10 border-teal-500/30 text-teal-300">
                                            💼 {aiFilters.profile_data.occupation}
                                        </Badge>
                                    )}
                                    {aiFilters.profile_data?.income_segment && (
                                        <Badge variant="outline" className="text-[10px] bg-teal-500/10 border-teal-500/30 text-teal-300">
                                            💰 {aiFilters.profile_data.income_segment}
                                        </Badge>
                                    )}
                                    {aiFilters.demand_filters?.room_count?.map((rc: string) => (
                                        <Badge key={rc} variant="outline" className="text-[10px] bg-pink-500/10 border-pink-500/30 text-pink-300">
                                            🏠 {rc}
                                        </Badge>
                                    ))}
                                    {(aiFilters.demand_filters?.min_price || aiFilters.demand_filters?.max_price) && (
                                        <Badge variant="outline" className="text-[10px] bg-pink-500/10 border-pink-500/30 text-pink-300">
                                            💵 {aiFilters.demand_filters.min_price ? `${(aiFilters.demand_filters.min_price/1000).toFixed(0)}K` : '0'} - {aiFilters.demand_filters.max_price ? `${(aiFilters.demand_filters.max_price/1000).toFixed(0)}K` : '∞'}
                                        </Badge>
                                    )}
                                    {aiFilters.unassigned && (
                                        <Badge variant="outline" className="text-[10px] bg-rose-500/10 border-rose-500/30 text-rose-300">
                                            👤 Atanmamış
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setAiFilters(null); setAiPrompt('') }}
                                    className="text-[10px] text-muted-foreground h-6 px-2"
                                >
                                    <X className="h-3 w-3 mr-1" /> Temizle
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Filters */}
                    <Card className="p-5 space-y-5">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Filter className="h-4 w-4 text-blue-400" />
                            Filtreler
                        </h2>

                        {/* Source Selector */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Kaynak</Label>
                            <div className="flex gap-2">
                                {SOURCE_OPTIONS.map(opt => (
                                    <Badge key={opt.value} variant="outline"
                                        className={`cursor-pointer text-xs px-4 py-2 transition-all hover:scale-105 ${source === opt.value
                                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/10'
                                            : 'hover:border-blue-500/30'
                                            }`}
                                        onClick={() => handleSourceChange(opt.value)}>
                                        {source === opt.value && '✓ '}{opt.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">{source === 'lead_qualifications' ? 'Ön Değerlendirme Statüleri' : 'Lead Statüleri'}</Label>
                            <div className="flex flex-wrap gap-2">
                                {currentStatusOptions.map(s => (
                                    <Badge key={s} variant="outline"
                                        className={`cursor-pointer text-xs px-3 py-1.5 transition-all hover:scale-105 ${statuses.includes(s)
                                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-sm shadow-violet-500/10'
                                            : 'hover:border-violet-500/30'
                                            }`}
                                        onClick={() => setStatuses(prev =>
                                            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                                        )}>
                                        {statuses.includes(s) && '✓ '}{source === 'lead_qualifications' ? (LQ_STATUS_LABELS[s] || s) : s}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Project Filter */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Proje</Label>
                                <Select value={projectId || 'all'} onValueChange={v => setProjectId(v === 'all' ? '' : v)}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Tüm Projeler" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Projeler</SelectItem>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Temsilci</Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Fark etmez" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Fark etmez</SelectItem>
                                        <SelectItem value="unassigned">Atanmamış Lead&apos;ler</SelectItem>
                                        {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Kayıt Başlangıç</Label>
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Kayıt Bitiş</Label>
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Hareketsizlik Süresi (Gün)</Label>
                                <Input type="number" placeholder="Örn: 7" value={daysInactive}
                                    onChange={e => setDaysInactive(e.target.value)} className="h-9" />
                            </div>
                        </div>

                        {/* Active Filters Summary */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                            <span className="text-xs text-muted-foreground mr-1">Aktif filtreler:</span>
                            {statuses.map(s => (
                                <Badge key={s} variant="outline" className="text-[10px] gap-1 bg-violet-500/10 border-violet-500/30 text-violet-400">
                                    {s}
                                    <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-400"
                                        onClick={() => setStatuses(prev => prev.filter(x => x !== s))} />
                                </Badge>
                            ))}
                            {projectId && projectId !== 'all' && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-blue-500/10 border-blue-500/30 text-blue-400">
                                    📁 {projects.find(p => p.id === projectId)?.name}
                                    <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-400" onClick={() => setProjectId('')} />
                                </Badge>
                            )}
                            {assignedTo === 'unassigned' && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-rose-500/10 border-rose-500/30 text-rose-400">
                                    Atanmamış
                                    <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-400" onClick={() => setAssignedTo('any')} />
                                </Badge>
                            )}
                            {daysInactive && (
                                <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 border-amber-500/30 text-amber-400">
                                    ⏰ {daysInactive} gün
                                    <X className="h-2.5 w-2.5 cursor-pointer hover:text-red-400" onClick={() => setDaysInactive('')} />
                                </Badge>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Live Preview */}
                <div className="space-y-4">
                    <Card className="p-5 space-y-4 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Eye className="h-4 w-4 text-emerald-400" />
                            Canlı Önizleme
                        </h2>

                        {/* Count */}
                        <div className="text-center py-4">
                            {previewing ? (
                                <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto" />
                            ) : (
                                <>
                                    <p className="text-4xl font-bold text-emerald-400">
                                        {previewCount !== null ? previewCount : '—'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">eşleşen lead</p>
                                </>
                            )}
                        </div>

                        {/* Preview Leads */}
                        {previewLeads.length > 0 && (
                            <div className="space-y-1.5 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Önizleme (ilk {previewLeads.length}):</p>
                                {previewLeads.map((lead: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                                        <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="font-medium truncate flex-1">
                                            {lead.customers?.full_name || 'İsimsiz'}
                                        </span>
                                        <span className="text-muted-foreground text-[10px]">
                                            {lead.customers?.phone ? lead.customers.phone.replace(/(\+90)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 *** $5') : '—'}
                                        </span>
                                    </div>
                                ))}
                                {previewCount !== null && previewCount > previewLeads.length && (
                                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                                        +{previewCount - previewLeads.length} lead daha
                                    </p>
                                )}
                            </div>
                        )}

                        <Button variant="outline" size="sm" onClick={handlePreview}
                            disabled={previewing}
                            className="w-full gap-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                            <Search className="h-3 w-3" />
                            {previewing ? 'Sorgulanıyor...' : 'Yenile'}
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// ─── Inline Preview for List View ────────────────────────────

function SegmentPreviewCard({ segmentId, filters }: { segmentId: string; filters: any }) {
    const [loading, setLoading] = useState(true)
    const [count, setCount] = useState(0)
    const [leads, setLeads] = useState<any[]>([])

    useEffect(() => {
        previewSegment(filters).then(result => {
            setCount(result.count)
            setLeads(result.preview || [])
            setLoading(false)
        })
    }, [segmentId])

    if (loading) {
        return (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Sorgulanıyor...
            </div>
        )
    }

    return (
        <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-4 mb-2">
                <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">
                    <Users className="h-3 w-3" />
                    {count} lead
                </Badge>
            </div>
            {leads.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {leads.slice(0, 6).map((lead: any, i: number) => (
                        <div key={i} className="text-xs p-1.5 rounded bg-muted/50 truncate">
                            {lead.customers?.full_name || 'İsimsiz'}
                        </div>
                    ))}
                    {count > 6 && (
                        <div className="text-[10px] text-muted-foreground p-1.5 flex items-center">
                            +{count - 6} daha
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
