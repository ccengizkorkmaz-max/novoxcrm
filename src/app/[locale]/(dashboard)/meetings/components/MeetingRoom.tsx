'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Video, VideoOff, Mic, MicOff, Monitor, Phone as PhoneIcon,
    User, Building2, Clock, MapPin, MessageSquare, FileText,
    Save, ArrowLeft, Loader2, CheckCircle, AlertCircle, Maximize2, Minimize2
} from 'lucide-react'
import { toast } from 'sonner'
import { startMeeting, endMeeting, updateMeeting, MEETING_OUTCOME_LABELS } from '../actions'
import { useRouter } from 'next/navigation'

interface MeetingRoomProps {
    meeting: any
    activities: any[]
    sales: any[]
    userName: string
}

export function MeetingRoom({ meeting, activities, sales, userName }: MeetingRoomProps) {
    const router = useRouter()
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [status, setStatus] = useState(meeting.status)
    const [notes, setNotes] = useState(meeting.notes || '')
    const [outcome, setOutcome] = useState(meeting.outcome || '')
    const [nextAction, setNextAction] = useState(meeting.next_action || '')
    const [saving, setSaving] = useState(false)
    const [ending, setEnding] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [elapsed, setElapsed] = useState(0)

    // Start meeting when joining
    useEffect(() => {
        if (meeting.status === 'scheduled') {
            startMeeting(meeting.id).then(result => {
                if (!result.error) {
                    setStatus('in_progress')
                }
            })
        }
    }, [meeting.id, meeting.status])

    // Timer
    useEffect(() => {
        if (status !== 'in_progress') return
        const startTime = meeting.started_at ? new Date(meeting.started_at).getTime() : Date.now()
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [status, meeting.started_at])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Auto-save notes
    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handleNotesChange = (value: string) => {
        setNotes(value)
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
            updateMeeting(meeting.id, { notes: value })
        }, 2000)
    }

    const handleEnd = async () => {
        if (!confirm('Toplantıyı sonlandırmak istediğinize emin misiniz?')) return
        setEnding(true)
        const result = await endMeeting(meeting.id, {
            outcome: outcome || undefined,
            notes: notes || undefined,
            next_action: nextAction || undefined,
        })
        if (result.error) {
            toast.error('Hata: ' + result.error)
        } else {
            toast.success('✅ Toplantı tamamlandı')
            router.push('/meetings')
        }
        setEnding(false)
    }

    // Build Daily.co URL with token
    const dailyUrl = meeting.daily_room_url
        ? `${meeting.daily_room_url}?t=${meeting.host_token}&showLeaveButton=true&showFullscreenButton=true&lang=tr`
        : null

    const customer = meeting.customer
    const project = meeting.project

    if (status === 'completed') {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <CheckCircle className="h-16 w-16 text-emerald-400" />
                <h1 className="text-2xl font-bold">Toplantı Tamamlandı</h1>
                <p className="text-muted-foreground">Bu toplantı zaten tamamlanmış.</p>
                <Button onClick={() => router.push('/meetings')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Toplantılara Dön
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header Bar */}
            <div className="flex items-center gap-3 px-1">
                <Button variant="ghost" size="sm" onClick={() => router.push('/meetings')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate">{meeting.title}</h1>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {customer && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {customer.full_name}</span>}
                        {project && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {project.name}</span>}
                    </div>
                </div>
                {status === 'in_progress' && (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 animate-pulse gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-500" /> CANLI
                        </Badge>
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-300 border-slate-500/30 font-mono text-sm">
                            <Clock className="h-3 w-3 mr-1" /> {formatTime(elapsed)}
                        </Badge>
                    </div>
                )}
                <Button variant="destructive" size="sm" onClick={handleEnd} disabled={ending} className="gap-1.5">
                    {ending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneIcon className="h-3.5 w-3.5" />}
                    Toplantıyı Bitir
                </Button>
            </div>

            {/* Main Content: Video + Side Panel */}
            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
                {/* Video Area */}
                <div className={`${isFullscreen ? '' : 'lg:col-span-2'} relative`}>
                    <Card className="overflow-hidden bg-black border-slate-800">
                        <div className="relative" style={{ paddingBottom: isFullscreen ? '56.25%' : '56.25%' }}>
                            {dailyUrl ? (
                                <iframe
                                    ref={iframeRef}
                                    src={dailyUrl}
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                    className="absolute inset-0 w-full h-full"
                                    style={{ border: 'none' }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-sm">Toplantı odası oluşturulamadı</p>
                                        <p className="text-xs text-muted-foreground mt-1">Daily.co API anahtarını kontrol edin</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Fullscreen Toggle */}
                        <Button variant="ghost" size="sm"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white z-10">
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    </Card>
                </div>

                {/* CRM Side Panel */}
                {!isFullscreen && (
                    <div className="space-y-3">
                        {/* Customer Info */}
                        {customer && (
                            <Card className="p-4 space-y-2 border-emerald-500/20 bg-emerald-500/5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" /> Müşteri
                                </h3>
                                <div className="space-y-1">
                                    <p className="font-semibold text-sm">{customer.full_name}</p>
                                    {customer.phone && <p className="text-xs text-muted-foreground">📱 {customer.phone}</p>}
                                    {customer.email && <p className="text-xs text-muted-foreground">✉️ {customer.email}</p>}
                                    {customer.city && <p className="text-xs text-muted-foreground">📍 {customer.city}</p>}
                                    {customer.profile_data?.occupation && (
                                        <p className="text-xs text-muted-foreground">💼 {customer.profile_data.occupation}</p>
                                    )}
                                </div>
                                {/* Demands */}
                                {customer.customer_demands?.length > 0 && (
                                    <div className="pt-2 border-t border-emerald-500/20">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Talepleri</p>
                                        <div className="flex flex-wrap gap-1">
                                            {customer.customer_demands.map((d: any) => (
                                                <Badge key={d.id} variant="outline" className="text-[10px]">
                                                    {d.room_count && `${d.room_count}`}
                                                    {d.min_price && ` ${(d.min_price / 1000).toFixed(0)}K`}
                                                    {d.max_price && `-${(d.max_price / 1000).toFixed(0)}K`}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Project Info */}
                        {project && (
                            <Card className="p-4 space-y-2 border-blue-500/20 bg-blue-500/5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" /> Proje
                                </h3>
                                <p className="font-semibold text-sm">{project.name}</p>
                                {project.location && <p className="text-xs text-muted-foreground">📍 {project.location}</p>}
                                {project.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-3">{project.description}</p>
                                )}
                            </Card>
                        )}

                        {/* Meeting Notes */}
                        <Card className="p-4 space-y-3 border-violet-500/20 bg-violet-500/5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" /> Toplantı Notları
                            </h3>
                            <Textarea
                                value={notes}
                                onChange={e => handleNotesChange(e.target.value)}
                                placeholder="Toplantı sırasında notlarınızı buraya yazın..."
                                rows={4}
                                className="text-xs resize-none"
                            />
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Sonuç</p>
                                <Select value={outcome || 'none'} onValueChange={v => setOutcome(v === 'none' ? '' : v)}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sonuç seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Henüz belirlenmedi</SelectItem>
                                        {Object.entries(MEETING_OUTCOME_LABELS).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Sonraki Adım</p>
                                <Textarea
                                    value={nextAction}
                                    onChange={e => setNextAction(e.target.value)}
                                    placeholder="Takip araması yap, teklif gönder..."
                                    rows={2}
                                    className="text-xs resize-none"
                                />
                            </div>
                        </Card>

                        {/* Recent Activities */}
                        {activities.length > 0 && (
                            <Card className="p-4 space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" /> Son Aktiviteler
                                </h3>
                                <div className="space-y-1.5">
                                    {activities.slice(0, 5).map(a => (
                                        <div key={a.id} className="flex gap-2 text-xs p-1.5 rounded hover:bg-muted/30">
                                            <span className="text-muted-foreground shrink-0">
                                                {new Date(a.due_date || a.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                            <span className="truncate">{a.summary || a.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
