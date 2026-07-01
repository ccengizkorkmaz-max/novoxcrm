'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
    PhoneIncoming, Clock, User, Search, Play, Pause, ExternalLink,
    PhoneCall, Flame, Thermometer, Snowflake, AlertCircle, ChevronLeft, ChevronRight,
    FileText, Volume2, VolumeX, X, Loader2, SkipBack, SkipForward, Download
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getVapiRecordingUrl } from '@/lib/utils'

interface CallRecord {
    id: string
    vapi_call_id?: string | null
    customer_id: string
    customer_name: string
    customer_phone: string
    date: string
    duration: number
    outcome: string
    lead_score: string | null
    summary: string
    transcript: string
    recording_url: string | null
    cost: number | null
}

interface InboundCallsClientProps {
    calls: CallRecord[]
    totalCount: number
    page: number
    pageSize: number
}

function formatDuration(seconds: number): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}dk ${s}sn` : `${s}sn`
}

function formatAudioTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function LeadScoreBadge({ score }: { score: string | null }) {
    if (!score) return <Badge variant="outline" className="text-slate-500 border-slate-200">—</Badge>
    
    const config: Record<string, { icon: any; className: string; label: string }> = {
        hot: { icon: Flame, className: 'bg-red-50 text-red-700 border-red-200', label: 'Sıcak' },
        warm: { icon: Thermometer, className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Ilık' },
        follow_up: { icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Takip' },
        cold: { icon: Snowflake, className: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Soğuk' },
        disqualified: { icon: AlertCircle, className: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Uygun Değil' },
    }
    
    const c = config[score] || config.cold!
    const Icon = c.icon
    
    return (
        <Badge variant="outline" className={`font-medium ${c.className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {c.label}
        </Badge>
    )
}

function OutcomeBadge({ outcome }: { outcome: string }) {
    const config: Record<string, string> = {
        'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Failed': 'bg-red-50 text-red-600 border-red-200',
        'No Answer': 'bg-slate-50 text-slate-500 border-slate-200',
        'Busy': 'bg-amber-50 text-amber-600 border-amber-200',
        'Devam Ediyor': 'bg-orange-50 text-orange-600 border-orange-300 animate-pulse',
    }
    const labels: Record<string, string> = {
        'Success': 'Görüşme',
        'Failed': 'Başarısız',
        'No Answer': 'Cevaplanmadı',
        'Busy': 'Meşgul',
        'Devam Ediyor': 'Devam Ediyor',
    }
    return (
        <Badge variant="outline" className={`font-medium ${config[outcome] || ''}`}>
            {labels[outcome] || outcome}
        </Badge>
    )
}

// ─── Inline Audio Player ───────────────────────────────────────
function InlineAudioPlayer({ url, callId }: { url: string; callId: string }) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const togglePlay = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            setIsLoading(true)
            audio.play().then(() => setIsLoading(false)).catch(() => setIsLoading(false))
        }
    }, [isPlaying])

    const skip = useCallback((e: React.MouseEvent, seconds: number) => {
        e.stopPropagation()
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
    }, [])

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        const audio = audioRef.current
        if (!audio || !audioDuration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const pct = x / rect.width
        audio.currentTime = pct * audioDuration
    }, [audioDuration])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const onPlay = () => setIsPlaying(true)
        const onPause = () => setIsPlaying(false)
        const onTimeUpdate = () => setCurrentTime(audio.currentTime)
        const onDurationChange = () => setAudioDuration(audio.duration)
        const onLoadedMetadata = () => setAudioDuration(audio.duration)

        audio.addEventListener('play', onPlay)
        audio.addEventListener('pause', onPause)
        audio.addEventListener('timeupdate', onTimeUpdate)
        audio.addEventListener('durationchange', onDurationChange)
        audio.addEventListener('loadedmetadata', onLoadedMetadata)

        return () => {
            audio.removeEventListener('play', onPlay)
            audio.removeEventListener('pause', onPause)
            audio.removeEventListener('timeupdate', onTimeUpdate)
            audio.removeEventListener('durationchange', onDurationChange)
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
        }
    }, [])

    const progress = audioDuration ? (currentTime / audioDuration) * 100 : 0

    return (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <audio ref={audioRef} src={getVapiRecordingUrl(url, callId)} preload="metadata" />
            
            {/* Skip back */}
            <button
                onClick={(e) => skip(e, -10)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="10sn geri"
            >
                <SkipBack className="h-3 w-3" />
            </button>

            {/* Play/Pause */}
            <button
                onClick={togglePlay}
                className={`p-1.5 rounded-full transition-all ${isPlaying 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                ) : (
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                )}
            </button>

            {/* Skip forward */}
            <button
                onClick={(e) => skip(e, 10)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="10sn ileri"
            >
                <SkipForward className="h-3 w-3" />
            </button>

            {/* Time */}
            <span className="text-[10px] font-mono text-slate-400 min-w-[64px]">
                {formatAudioTime(currentTime)} / {formatAudioTime(audioDuration)}
            </span>

            {/* Progress bar */}
            <div
                className="flex-1 h-1.5 bg-slate-100 rounded-full cursor-pointer min-w-[60px] relative group"
                onClick={handleSeek}
            >
                <div
                    className="h-full bg-emerald-500 rounded-full transition-[width] duration-100 relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
                </div>
            </div>
        </div>
    )
}

// ─── Transcript Viewer Panel ───────────────────────────────────
function TranscriptPanel({ transcript, onClose }: { transcript: string; onClose: (e: React.MouseEvent) => void }) {
    // Parse transcript to show AI vs User messages differently
    const lines = transcript.split('\n').filter(l => l.trim())

    return (
        <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Transkript</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                {lines.map((line, i) => {
                    const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('assistant:') || line.toLowerCase().startsWith('bot:')
                    const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:')
                    
                    let speaker = ''
                    let text = line
                    if (isAI || isUser) {
                        const colonIdx = line.indexOf(':')
                        speaker = isAI ? '🤖 AI' : '👤 Müşteri'
                        text = line.substring(colonIdx + 1).trim()
                    }

                    return (
                        <div key={i} className={`text-xs leading-relaxed rounded-lg px-3 py-2 ${
                            isAI ? 'bg-blue-50/80 border border-blue-100 text-slate-700 ml-4' 
                            : isUser ? 'bg-white border border-slate-200 text-slate-800 mr-4' 
                            : 'bg-white/50 text-slate-600'
                        }`}>
                            {speaker && <span className="font-semibold text-[10px] block mb-0.5 text-slate-500">{speaker}</span>}
                            {text}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function InboundCallsClient({ calls, totalCount, page, pageSize }: InboundCallsClientProps) {
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null)

    const totalPages = Math.ceil(totalCount / pageSize)

    const filteredCalls = searchTerm.trim()
        ? calls.filter(c =>
            c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customer_phone.includes(searchTerm)
        )
        : calls

    // Stats
    const todayCalls = calls.filter(c => {
        const d = new Date(c.date)
        const today = new Date()
        return d.toDateString() === today.toDateString()
    }).length
    const successCalls = calls.filter(c => c.outcome === 'Success').length
    const hotLeads = calls.filter(c => c.lead_score === 'hot').length

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50">
                            <PhoneIncoming className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
                            <p className="text-xs text-slate-500">Toplam Arama</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50">
                            <PhoneCall className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{todayCalls}</p>
                            <p className="text-xs text-slate-500">Bugün</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-50">
                            <Flame className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{hotLeads}</p>
                            <p className="text-xs text-slate-500">Sıcak Lead</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50">
                            <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{successCalls}</p>
                            <p className="text-xs text-slate-500">Başarılı Görüşme</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Table */}
            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PhoneIncoming className="h-5 w-5 text-emerald-600" />
                            Gelen Aramalar
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Ad veya telefon ara..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[220px]">Arayan</TableHead>
                                <TableHead className="w-[160px]">Tarih / Saat</TableHead>
                                <TableHead className="w-[70px]">Süre</TableHead>
                                <TableHead className="w-[110px]">Sonuç</TableHead>
                                <TableHead className="w-[100px]">Lead Skoru</TableHead>
                                <TableHead>Ses Kaydı / Transkript</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCalls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <PhoneIncoming className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p>Henüz gelen arama kaydı yok</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCalls.map((call) => (
                                    <React.Fragment key={call.id}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                                            onClick={() => setSelectedCall(call)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                                                        {call.customer_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-900 text-sm truncate">{call.customer_name}</p>
                                                        <p className="text-xs text-slate-400">{call.customer_phone}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">{formatDate(call.date)}</TableCell>
                                            <TableCell className="text-sm text-slate-600 font-mono">{formatDuration(call.duration)}</TableCell>
                                            <TableCell><OutcomeBadge outcome={call.outcome} /></TableCell>
                                            <TableCell><LeadScoreBadge score={call.lead_score} /></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {/* Recording indicator */}
                                                    {call.recording_url ? (
                                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 text-[10px] gap-1 cursor-pointer hover:bg-emerald-100 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedCall(call)
                                                            }}
                                                        >
                                                            <Volume2 className="h-3 w-3" />
                                                            Dinle
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] gap-1">
                                                            <VolumeX className="h-3 w-3" />
                                                            Kayıt yok
                                                        </Badge>
                                                    )}
                                                    
                                                    {/* Transcript indicator */}
                                                    {call.transcript ? (
                                                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 text-[10px] gap-1 cursor-pointer hover:bg-blue-100 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setExpandedTranscript(expandedTranscript === call.id ? null : call.id)
                                                            }}
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            Transkript
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] gap-1">
                                                            <FileText className="h-3 w-3" />
                                                            Yok
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Transcript Row */}
                                        {expandedTranscript === call.id && call.transcript && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="p-0">
                                                    {/* Inline Audio Player (if recording exists) */}
                                                    {call.recording_url && (
                                                        <div className="px-6 pt-4 pb-2 bg-slate-50/50 border-t border-slate-100">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Volume2 className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-sm font-semibold text-slate-700">Ses Kaydı</span>
                                                            </div>
                                                            <InlineAudioPlayer url={call.recording_url} callId={call.id} />
                                                        </div>
                                                    )}
                                                    <TranscriptPanel 
                                                        transcript={call.transcript} 
                                                        onClose={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedTranscript(null)
                                                        }} 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-xs text-slate-500">{totalCount} aramadan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} gösteriliyor</p>
                            <div className="flex items-center gap-1">
                                <Link href={`/calls?page=${Math.max(1, page - 1)}`}>
                                    <Button variant="outline" size="sm" disabled={page <= 1} className="h-8">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                                <Link href={`/calls?page=${Math.min(totalPages, page + 1)}`}>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages} className="h-8">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Call Detail Modal */}
            <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    {selectedCall && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <PhoneIncoming className="h-5 w-5 text-emerald-600" />
                                    Arama Detayı
                                </DialogTitle>
                                <DialogDescription>
                                    {formatDate(selectedCall.date)} • {formatDuration(selectedCall.duration)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5">
                                {/* Caller Info */}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                        {selectedCall.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{selectedCall.customer_name}</p>
                                        <p className="text-sm text-slate-500">{selectedCall.customer_phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <OutcomeBadge outcome={selectedCall.outcome} />
                                        <LeadScoreBadge score={selectedCall.lead_score} />
                                    </div>
                                    {selectedCall.customer_id && (
                                        <Link href={`/crm?customer=${selectedCall.customer_id}`}>
                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Müşteri
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                {/* Recording — Full player */}
                                {selectedCall.recording_url && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                <Volume2 className="h-4 w-4 text-emerald-600" />
                                                Ses Kaydı
                                            </p>
                                            <a 
                                                href={getVapiRecordingUrl(selectedCall.recording_url, selectedCall.vapi_call_id)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <Download className="h-3 w-3" />
                                                İndir
                                            </a>
                                        </div>
                                        <audio controls className="w-full" src={getVapiRecordingUrl(selectedCall.recording_url, selectedCall.vapi_call_id)}>
                                            Tarayıcınız ses oynatmayı desteklemiyor.
                                        </audio>
                                    </div>
                                )}

                                {/* Summary */}
                                {selectedCall.summary && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700">📋 AI Özeti</p>
                                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-slate-700 leading-relaxed">
                                            {selectedCall.summary}
                                        </div>
                                    </div>
                                )}

                                {/* Transcript */}
                                {selectedCall.transcript && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            Transkript
                                        </p>
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono text-xs">
                                            {selectedCall.transcript}
                                        </div>
                                    </div>
                                )}

                                {/* No recording/transcript message */}
                                {!selectedCall.recording_url && !selectedCall.transcript && selectedCall.outcome === 'Devam Ediyor' && (
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-sm text-orange-700 flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Bu arama henüz sonlanmamış veya webhook yanıtı gelmemiş olabilir. Kayıt ve transkript arama tamamlandıktan sonra görünecektir.
                                    </div>
                                )}

                                {/* Cost */}
                                {selectedCall.cost != null && selectedCall.cost > 0 && (
                                    <p className="text-xs text-slate-400">Maliyet: ${selectedCall.cost.toFixed(4)}</p>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

