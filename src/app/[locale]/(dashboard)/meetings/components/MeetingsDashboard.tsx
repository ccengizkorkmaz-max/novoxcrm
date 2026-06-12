'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Video, Plus, Calendar, Clock, User, Phone, MapPin,
    Building2, Search, Trash2, X, ExternalLink, Send,
    CheckCircle, XCircle, AlertCircle, Play, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cancelMeeting, deleteMeeting } from '../actions'
import { MEETING_TYPE_LABELS, MEETING_STATUS_LABELS, MEETING_OUTCOME_LABELS } from '../constants'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface MeetingsDashboardProps {
    meetings: any[]
    profiles: any[]
    projects: any[]
    currentUserId: string
    currentUserName: string
}

const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-blue-600/20 text-blue-700 dark:text-blue-300 border-blue-500/40',
    in_progress: 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    completed: 'bg-slate-600/20 text-slate-700 dark:text-slate-300 border-slate-500/40',
    cancelled: 'bg-red-600/20 text-red-700 dark:text-red-300 border-red-500/40',
    no_show: 'bg-amber-600/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
}

const TYPE_ICONS: Record<string, string> = {
    project_presentation: '🏗️',
    sales_meeting: '💼',
    follow_up: '🔄',
    general: '📋',
}

export function MeetingsDashboard({ meetings: initialMeetings, profiles, projects, currentUserId, currentUserName }: MeetingsDashboardProps) {
    const router = useRouter()
    const locale = useLocale()
    const [meetings, setMeetings] = useState(initialMeetings)
    const [view, setView] = useState<'list' | 'create'>('list')
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'past'>('upcoming')
    const [saving, setSaving] = useState(false)
    const [meetingToCancel, setMeetingToCancel] = useState<string | null>(null)
    const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null)

    // Create form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [meetingType, setMeetingType] = useState<string>('project_presentation')
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('10:00')
    const [projectId, setProjectId] = useState('')
    const [hostUserId, setHostUserId] = useState(currentUserId)
    const [sendWa, setSendWa] = useState(true)

    // Customer search
    const [customerSearch, setCustomerSearch] = useState('')
    const [customerResults, setCustomerResults] = useState<any[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [searching, setSearching] = useState(false)

    // Search customers via API route
    useEffect(() => {
        if (customerSearch.length < 2) {
            setCustomerResults([])
            return
        }
        const timer = setTimeout(async () => {
            setSearching(true)
            try {
                const res = await fetch(`/api/meetings/search-customers?q=${encodeURIComponent(customerSearch)}`)
                if (res.ok) {
                    const data = await res.json()
                    setCustomerResults(Array.isArray(data) ? data : [])
                } else {
                    console.error('Customer search failed:', res.status)
                    setCustomerResults([])
                }
            } catch (err) {
                console.error('Customer search error:', err)
                setCustomerResults([])
            }
            setSearching(false)
        }, 400)
        return () => clearTimeout(timer)
    }, [customerSearch])

    // Filter meetings
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const filteredMeetings = meetings.filter(m => {
        const d = new Date(m.scheduled_at)
        switch (filter) {
            case 'today': return d >= todayStart && d < todayEnd
            case 'upcoming': return d >= now && m.status !== 'cancelled' && m.status !== 'completed'
            case 'past': return d < now || m.status === 'completed' || m.status === 'cancelled'
            default: return true
        }
    })

    const todayMeetings = meetings.filter(m => {
        const d = new Date(m.scheduled_at)
        return d >= todayStart && d < todayEnd && m.status !== 'cancelled'
    })

    const upcomingCount = meetings.filter(m => new Date(m.scheduled_at) >= now && m.status === 'scheduled').length
    const completedCount = meetings.filter(m => m.status === 'completed').length

    // Reset form
    const resetForm = () => {
        setTitle('')
        setDescription('')
        setMeetingType('project_presentation')
        setScheduledDate('')
        setScheduledTime('10:00')
        setProjectId('')
        setHostUserId(currentUserId)
        setSendWa(true)
        setSelectedCustomer(null)
        setCustomerSearch('')
        setCustomerResults([])
    }

    // Auto-generate title
    useEffect(() => {
        if (selectedCustomer && projectId) {
            const project = projects.find(p => p.id === projectId)
            if (project) {
                setTitle(`${project.name} — ${selectedCustomer.full_name}`)
            }
        } else if (selectedCustomer) {
            setTitle(`Toplantı — ${selectedCustomer.full_name}`)
        }
    }, [selectedCustomer, projectId, projects])

    const handleCreate = async () => {
        if (!selectedCustomer) return toast.warning('Müşteri seçin')
        if (!scheduledDate) return toast.warning('Tarih seçin')
        if (!title.trim()) return toast.warning('Başlık girin')

        setSaving(true)
        try {
            const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()

            const res = await fetch('/api/meetings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomer.id,
                    title,
                    description,
                    meeting_type: meetingType || 'general',
                    scheduled_at: scheduledAt,
                    project_id: projectId || undefined,
                    host_user_id: hostUserId,
                    send_whatsapp: sendWa,
                }),
            })

            const result = await res.json()

            if (!res.ok || result.error) {
                toast.error('Hata: ' + (result.error || 'Bilinmeyen hata'))
            } else {
                toast.success('✅ Toplantı oluşturuldu' + (sendWa ? ' ve müşteriye WhatsApp gönderildi' : ''))
                setMeetings(prev => [result.data, ...prev])
                resetForm()
                setView('list')
                router.refresh()
            }
        } catch (err: any) {
            toast.error('Bağlantı hatası: ' + (err.message || 'Sunucuya ulaşılamadı'))
        }
        setSaving(false)
    }

    const handleCancel = async (id: string) => {
        const result = await cancelMeeting(id)
        if (result.error) {
            toast.error('Hata: ' + result.error)
        } else {
            setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m))
            toast.success('Toplantı iptal edildi')
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteMeeting(id)
        if (result.error) {
            toast.error('Hata: ' + result.error)
        } else {
            setMeetings(prev => prev.filter(m => m.id !== id))
            toast.success('Toplantı silindi')
        }
    }

    // ─── Create View ─────────────────────────────────────────
    if (view === 'create') {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => { resetForm(); setView('list') }}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
                                <Video className="h-5 w-5 text-violet-400" />
                            </div>
                            Yeni Toplantı Oluştur
                        </h1>
                    </div>
                    <Button onClick={handleCreate} disabled={saving}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {saving ? 'Oluşturuluyor...' : 'Oluştur ve Gönder'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Müşteri Seçimi */}
                    <Card className="p-5 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <User className="h-4 w-4 text-emerald-400" /> Müşteri
                        </h2>

                        {selectedCustomer ? (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{selectedCustomer.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                                        {selectedCustomer.email && (
                                            <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={customerSearch}
                                        onChange={e => setCustomerSearch(e.target.value)}
                                        placeholder="Müşteri ara (isim veya telefon)..."
                                        className="pl-9 h-9"
                                    />
                                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                                {customerResults.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden divide-y max-h-48 overflow-y-auto">
                                        {customerResults.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                                                className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors text-xs">
                                                <p className="font-medium">{c.full_name}</p>
                                                <p className="text-muted-foreground">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Tarih & Saat */}
                    <Card className="p-5 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-400" /> Zamanlama
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tarih *</Label>
                                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Saat *</Label>
                                <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="h-9" />
                            </div>
                        </div>
                    </Card>

                    {/* Toplantı Detayları */}
                    <Card className="p-5 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Video className="h-4 w-4 text-violet-400" /> Toplantı Detayları
                        </h2>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Başlık *</Label>
                                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Toplantı başlığı..." className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Toplantı Tipi</Label>
                                <Select value={meetingType} onValueChange={setMeetingType}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(MEETING_TYPE_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{TYPE_ICONS[k]} {v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Açıklama</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Toplantı notları..." rows={2} className="text-xs" />
                            </div>
                        </div>
                    </Card>

                    {/* Proje & Danışman */}
                    <Card className="p-5 space-y-4">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-amber-400" /> Proje & Atama
                        </h2>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Proje</Label>
                                <Select value={projectId || 'none'} onValueChange={v => setProjectId(v === 'none' ? '' : v)}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Proje seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Proje seçilmedi</SelectItem>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Danışman</Label>
                                <Select value={hostUserId} onValueChange={setHostUserId}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <input type="checkbox" checked={sendWa} onChange={e => setSendWa(e.target.checked)}
                                    className="rounded border-emerald-500/30" id="send-wa" />
                                <label htmlFor="send-wa" className="text-xs cursor-pointer">
                                    <Send className="h-3.5 w-3.5 inline mr-1.5 text-emerald-400" />
                                    Müşteriye WhatsApp ile toplantı linki gönder
                                </label>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    // ─── List View ───────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
                            <Video className="h-5 w-5 text-violet-400" />
                        </div>
                        Online Toplantılar
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Müşterilerinize canlı proje sunumu yapın, video görüşme planlayın.
                    </p>
                </div>
                <Button onClick={() => setView('create')}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
                    <Plus className="h-4 w-4" /> Yeni Toplantı
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">{todayMeetings.length}</p>
                    <p className="text-xs text-muted-foreground">Bugün</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-violet-500/5 to-transparent border-violet-500/20">
                    <p className="text-2xl font-bold text-violet-400">{upcomingCount}</p>
                    <p className="text-xs text-muted-foreground">Yaklaşan</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-400">{completedCount}</p>
                    <p className="text-xs text-muted-foreground">Tamamlanan</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-slate-500/5 to-transparent border-slate-500/20">
                    <p className="text-2xl font-bold text-slate-400">{meetings.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: 'upcoming', label: 'Yaklaşan' },
                    { key: 'today', label: 'Bugün' },
                    { key: 'past', label: 'Geçmiş' },
                    { key: 'all', label: 'Tümü' },
                ].map(f => (
                    <Badge key={f.key} variant="outline"
                        className={`cursor-pointer px-3 py-1.5 text-xs transition-all hover:scale-105 ${filter === f.key ? 'bg-violet-600 border-violet-600 text-white font-semibold' : 'bg-transparent border-border text-foreground hover:bg-muted'}`}
                        onClick={() => setFilter(f.key as any)}>
                        {filter === f.key && '✓ '}{f.label}
                    </Badge>
                ))}
            </div>

            {/* Meeting List */}
            {filteredMeetings.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/30 p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-violet-500/10">
                            <Video className="h-8 w-8 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Henüz toplantı yok</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                İlk online toplantınızı oluşturarak müşterilerinize canlı sunum yapmaya başlayın.
                            </p>
                        </div>
                        <Button onClick={() => setView('create')}
                            className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600">
                            <Plus className="h-4 w-4" /> İlk Toplantıyı Oluştur
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredMeetings.map(meeting => {
                        const scheduledAt = new Date(meeting.scheduled_at)
                        const isUpcoming = scheduledAt > now && meeting.status === 'scheduled'
                        const isToday = scheduledAt >= todayStart && scheduledAt < todayEnd
                        const canJoin = meeting.status === 'scheduled' || meeting.status === 'in_progress'

                        return (
                            <Card key={meeting.id} className={`hover:bg-muted/30 transition-colors ${isToday && meeting.status !== 'cancelled' ? 'border-violet-500/30 bg-violet-500/5' : ''}`}>
                                <div className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Date Column */}
                                        <div className="text-center min-w-[52px] shrink-0">
                                            <p className="text-2xl font-bold leading-none">{scheduledAt.getDate()}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">
                                                {scheduledAt.toLocaleDateString('tr-TR', { month: 'short' })}
                                            </p>
                                            <p className="text-xs font-medium text-violet-400 mt-0.5">
                                                {scheduledAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm">{TYPE_ICONS[meeting.meeting_type] || '📋'}</span>
                                                <h3 className="font-semibold text-sm truncate">{meeting.title}</h3>
                                                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[meeting.status] || ''}`}>
                                                    {MEETING_STATUS_LABELS[meeting.status] || meeting.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                {meeting.customer && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" /> {meeting.customer.full_name}
                                                    </span>
                                                )}
                                                {meeting.project && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="h-3 w-3" /> {meeting.project.name}
                                                    </span>
                                                )}
                                                {meeting.host && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" /> {meeting.host.full_name}
                                                    </span>
                                                )}
                                                {meeting.duration_seconds && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {Math.round(meeting.duration_seconds / 60)} dk
                                                    </span>
                                                )}
                                                {meeting.outcome && (
                                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                                                        {MEETING_OUTCOME_LABELS[meeting.outcome] || meeting.outcome}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {canJoin && (
                                                <Button size="sm"
                                                    onClick={() => {
                                                        const localePrefix = locale === 'tr' ? '' : `/${locale}`
                                                        window.open(`${localePrefix}/meetings/${meeting.id}`, '_blank')
                                                    }}
                                                    className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-8 text-xs">
                                                    <Play className="h-3 w-3" /> Katıl
                                                </Button>
                                            )}
                                            {meeting.status === 'scheduled' && (
                                                <Button variant="ghost" size="sm" onClick={() => setMeetingToCancel(meeting.id)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {(meeting.status === 'cancelled' || meeting.status === 'completed') && (
                                                <Button variant="ghost" size="sm" onClick={() => setMeetingToDelete(meeting.id)}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Cancel Confirm Dialog */}
            <AlertDialog open={!!meetingToCancel} onOpenChange={(open) => !open && setMeetingToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplantıyı İptal Et</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu toplantıyı iptal etmek istediğinize emin misiniz? Müşteriye gönderilen katılım bağlantısı pasif hale gelecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (meetingToCancel) {
                                handleCancel(meetingToCancel)
                                setMeetingToCancel(null)
                            }
                        }} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Evet, İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirm Dialog */}
            <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplantıyı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu toplantıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (meetingToDelete) {
                                handleDelete(meetingToDelete)
                                setMeetingToDelete(null)
                            }
                        }} className="bg-red-600 hover:bg-red-700 text-white">
                            Kalıcı Olarak Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
