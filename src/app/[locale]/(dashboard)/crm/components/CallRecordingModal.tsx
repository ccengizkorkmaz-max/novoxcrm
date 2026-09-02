'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Headphones,
    Play,
    Pause,
    FileText,
    Loader2,
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    Copy,
    Check,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CDRRecord {
    uniqueid: string
    date: string
    destination: string
    source: string
    duration: string
    direction: number
    recording?: string
    playerUrl?: string
}

interface CallRecordingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    phone: string
    customerName: string
}

const DIRECTION_MAP: Record<number, { label: string; icon: typeof Phone; color: string }> = {
    0: { label: 'Giden', icon: PhoneOutgoing, color: 'text-blue-600' },
    1: { label: 'Gelen', icon: PhoneIncoming, color: 'text-emerald-600' },
    2: { label: 'Cevapsız Gelen', icon: PhoneMissed, color: 'text-red-500' },
    3: { label: 'Cevapsız Giden', icon: PhoneMissed, color: 'text-amber-500' },
    4: { label: 'Dahili', icon: Phone, color: 'text-slate-500' },
    5: { label: 'Cevapsız Dahili', icon: PhoneMissed, color: 'text-slate-400' },
}

function formatDuration(seconds: string | number): string {
    const s = typeof seconds === 'string' ? parseInt(seconds) : seconds
    if (!s || isNaN(s)) return '0sn'
    const min = Math.floor(s / 60)
    const sec = s % 60
    if (min === 0) return `${sec}sn`
    return `${min}dk ${sec}sn`
}

export default function CallRecordingModal({
    open,
    onOpenChange,
    phone,
    customerName,
}: CallRecordingModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [records, setRecords] = useState<CDRRecord[]>([])
    const [days, setDays] = useState('7')

    // Player state
    const [activePlayerUrl, setActivePlayerUrl] = useState<string | null>(null)
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

    // Transcript state
    const [transcribing, setTranscribing] = useState<string | null>(null) // uniqueid being transcribed
    const [transcripts, setTranscripts] = useState<Record<string, {
        transcript: string
        summary: string
        sentiment: string
        keyPoints: string[]
    }>>({})
    const [copied, setCopied] = useState<string | null>(null)

    // Fetch CDR records
    const fetchRecords = useCallback(async () => {
        if (!phone) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/netgsm-cdr?phone=${encodeURIComponent(phone)}&days=${days}`)
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Bir hata oluştu')
                setRecords([])
            } else {
                setRecords(data.records || [])
                if (data.total === 0) {
                    setError('Bu numara ile yapılmış arama kaydı bulunamadı.')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Bağlantı hatası')
            setRecords([])
        } finally {
            setLoading(false)
        }
    }, [phone, days])

    useEffect(() => {
        if (open && phone) {
            fetchRecords()
        }
        if (!open) {
            setRecords([])
            setActivePlayerUrl(null)
            setExpandedRecord(null)
            setError(null)
        }
    }, [open, phone, fetchRecords])

    // Transcribe a recording
    const handleTranscribe = async (record: CDRRecord) => {
        if (!record.recording) return
        if (transcripts[record.uniqueid]) {
            // Already transcribed, just toggle visibility
            setExpandedRecord(expandedRecord === record.uniqueid ? null : record.uniqueid)
            return
        }

        setTranscribing(record.uniqueid)
        try {
            const res = await fetch('/api/netgsm-transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingUrl: record.recording }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Transkript alınamadı')
            } else {
                setTranscripts(prev => ({
                    ...prev,
                    [record.uniqueid]: {
                        transcript: data.transcript || '',
                        summary: data.summary || '',
                        sentiment: data.sentiment || 'neutral',
                        keyPoints: data.keyPoints || [],
                    }
                }))
                setExpandedRecord(record.uniqueid)
                toast.success('Transkript oluşturuldu')
            }
        } catch (err: any) {
            toast.error('Transkript hatası: ' + (err.message || 'Bilinmeyen hata'))
        } finally {
            setTranscribing(null)
        }
    }

    // Copy transcript
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        toast.success('Kopyalandı')
        setTimeout(() => setCopied(null), 2000)
    }

    const recordingsCount = records.filter(r => !!r.recording).length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-indigo-600" />
                        <span>Arama Kayıtları</span>
                    </DialogTitle>
                    <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="font-medium">{customerName}</span>
                            <span className="text-slate-400">({phone})</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 uppercase font-medium">Son</span>
                            <Select value={days} onValueChange={(v) => setDays(v)}>
                                <SelectTrigger className="h-7 w-[90px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Gün</SelectItem>
                                    <SelectItem value="3">3 Gün</SelectItem>
                                    <SelectItem value="7">7 Gün</SelectItem>
                                    <SelectItem value="14">14 Gün</SelectItem>
                                    <SelectItem value="30">30 Gün</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={fetchRecords}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sorgula'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Stats bar */}
                {!loading && records.length > 0 && (
                    <div className="flex items-center gap-3 px-1 py-1.5 text-[10px] text-slate-500 border-b">
                        <span className="font-semibold">{records.length} arama</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{recordingsCount} ses kaydı</span>
                        <span>•</span>
                        <span>Toplam süre: {formatDuration(records.reduce((acc, r) => acc + (parseInt(r.duration) || 0), 0))}</span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-1 min-h-0 py-1">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            <p className="text-xs text-slate-500">Arama kayıtları sorgulanıyor...</p>
                            <p className="text-[10px] text-slate-400">Son {days} gün kontrol ediliyor</p>
                        </div>
                    )}

                    {!loading && error && records.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                            <p className="text-xs text-slate-500">{error}</p>
                        </div>
                    )}

                    {!loading && records.map((record) => {
                        const dirInfo = DIRECTION_MAP[record.direction] || DIRECTION_MAP[0]
                        const DirIcon = dirInfo.icon
                        const hasRecording = !!record.recording
                        const isPlaying = activePlayerUrl === record.playerUrl
                        const isExpanded = expandedRecord === record.uniqueid
                        const hasTranscript = !!transcripts[record.uniqueid]
                        const isTranscribing = transcribing === record.uniqueid

                        return (
                            <div key={record.uniqueid} className={cn(
                                "border rounded-lg transition-all",
                                hasRecording ? "bg-white hover:shadow-sm" : "bg-slate-50/50",
                                isExpanded && "shadow-md border-indigo-200"
                            )}>
                                {/* Record row */}
                                <div className="flex items-center gap-2 px-3 py-2">
                                    {/* Direction icon */}
                                    <DirIcon className={cn("w-4 h-4 shrink-0", dirInfo.color)} />

                                    {/* Date & Direction */}
                                    <div className="min-w-[130px]">
                                        <div className="text-[11px] font-medium text-slate-700">{record.date}</div>
                                        <div className={cn("text-[9px] font-semibold", dirInfo.color)}>{dirInfo.label}</div>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center gap-1 min-w-[60px]">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-[11px] text-slate-600 font-medium">
                                            {formatDuration(record.duration)}
                                        </span>
                                    </div>

                                    {/* Numbers */}
                                    <div className="text-[10px] text-slate-400 truncate flex-1">
                                        {record.source} → {record.destination}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {hasRecording && (
                                            <>
                                                <Button
                                                    variant={isPlaying ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "h-7 text-[10px] gap-1",
                                                        isPlaying && "bg-indigo-600 hover:bg-indigo-700"
                                                    )}
                                                    onClick={() => {
                                                        if (isPlaying) {
                                                            setActivePlayerUrl(null)
                                                        } else {
                                                            setActivePlayerUrl(record.playerUrl || null)
                                                        }
                                                    }}
                                                >
                                                    {isPlaying ? (
                                                        <><Pause className="w-3 h-3" /> Durdur</>
                                                    ) : (
                                                        <><Play className="w-3 h-3" /> Dinle</>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-7 text-[10px] gap-1",
                                                        hasTranscript && "text-indigo-600"
                                                    )}
                                                    disabled={isTranscribing}
                                                    onClick={() => handleTranscribe(record)}
                                                >
                                                    {isTranscribing ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <FileText className="w-3 h-3" />
                                                    )}
                                                    <span>{hasTranscript ? 'Transkript' : 'Transkript Al'}</span>
                                                </Button>

                                                {(isPlaying || hasTranscript) && (
                                                    <button
                                                        className="p-1 text-slate-400 hover:text-slate-600"
                                                        onClick={() => setExpandedRecord(isExpanded ? null : record.uniqueid)}
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {!hasRecording && (
                                            <span className="text-[9px] text-slate-300 italic">Kayıt yok</span>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded section: Player + Transcript */}
                                {isExpanded && (
                                    <div className="border-t bg-slate-50/50 px-3 py-3 space-y-3">
                                        {/* Audio Player (HTML5 Audio + iframe Fallback) */}
                                        {isPlaying && activePlayerUrl && (
                                            <div className="bg-white rounded-lg border p-2.5 space-y-2">
                                                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                                                    <span className="flex items-center gap-1">
                                                        <Headphones className="w-3 h-3 text-indigo-600" /> Ses Kaydı Oynatıcı
                                                    </span>
                                                    <a
                                                        href={activePlayerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:underline text-[10px]"
                                                    >
                                                        Dosyayı İndir
                                                    </a>
                                                </div>
                                                {activePlayerUrl.includes('/player/') ? (
                                                    <iframe
                                                        src={activePlayerUrl}
                                                        className="w-full h-[60px] border-0 rounded"
                                                        allow="autoplay"
                                                        sandbox="allow-scripts allow-same-origin"
                                                    />
                                                ) : (
                                                    <audio
                                                        controls
                                                        autoPlay
                                                        src={activePlayerUrl}
                                                        className="w-full h-9 rounded"
                                                    >
                                                        Tarayıcınız ses oynatmayı desteklemiyor.
                                                    </audio>
                                                )}
                                            </div>
                                        )}

                                        {/* Transcript */}
                                        {hasTranscript && (
                                            <div className="bg-white rounded-lg border p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-indigo-500" /> AI Transkript
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {/* Sentiment badge */}
                                                        <span className={cn(
                                                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                                            transcripts[record.uniqueid].sentiment === 'positive' && "bg-emerald-100 text-emerald-700",
                                                            transcripts[record.uniqueid].sentiment === 'negative' && "bg-red-100 text-red-700",
                                                            transcripts[record.uniqueid].sentiment === 'neutral' && "bg-slate-100 text-slate-600",
                                                        )}>
                                                            {transcripts[record.uniqueid].sentiment === 'positive' ? '😊 Olumlu' :
                                                             transcripts[record.uniqueid].sentiment === 'negative' ? '😞 Olumsuz' : '😐 Nötr'}
                                                        </span>
                                                        <button
                                                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                                            onClick={() => handleCopy(transcripts[record.uniqueid].transcript, record.uniqueid)}
                                                            title="Kopyala"
                                                        >
                                                            {copied === record.uniqueid ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Summary */}
                                                {transcripts[record.uniqueid].summary && (
                                                    <div className="text-xs text-slate-600 bg-indigo-50/50 rounded px-2 py-1.5 border border-indigo-100">
                                                        <span className="font-semibold text-indigo-700">Özet: </span>
                                                        {transcripts[record.uniqueid].summary}
                                                    </div>
                                                )}

                                                {/* Full transcript */}
                                                <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                                    {transcripts[record.uniqueid].transcript}
                                                </div>

                                                {/* Key points */}
                                                {transcripts[record.uniqueid].keyPoints.length > 0 && (
                                                    <div className="space-y-1 pt-1 border-t">
                                                        <div className="text-[9px] text-slate-400 font-semibold uppercase">Önemli Noktalar</div>
                                                        {transcripts[record.uniqueid].keyPoints.map((point, i) => (
                                                            <div key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                                                                <span className="text-indigo-500 mt-0.5">•</span>
                                                                {point}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
