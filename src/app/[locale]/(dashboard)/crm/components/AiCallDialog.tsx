'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Label } from "@/components/ui/label"
import {
    Phone,
    PhoneCall,
    PhoneOff,
    Loader2,
    Sparkles,
    Calendar,
    MessageSquare,
    Play,
    AlertCircle,
    User,
    Clock,
    Activity,
    ThumbsUp,
    Volume2
} from 'lucide-react'
import { getAiCallModalData, initiateAiCall, getCallDetails, stopAiCall } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface AiCallDialogProps {
    saleId: string | null
    onClose: () => void
}

export default function AiCallDialog({ saleId, onClose }: AiCallDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [modalData, setModalData] = useState<any>(null)
    
    // Call states
    const [callId, setCallId] = useState<string | null>(null)
    const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'in-progress' | 'ended' | 'failed'>('idle')
    const [transcript, setTranscript] = useState<string>('')
    const [summary, setSummary] = useState<string>('')
    const [recordingUrl, setRecordingUrl] = useState<string>('')
    const [analysis, setAnalysis] = useState<any>(null)
    const [initiating, setInitiating] = useState(false)
    const [polling, setPolling] = useState(false)
    const [stopping, setStopping] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const pollingStartRef = useRef<number>(0)

    const transcriptEndRef = useRef<HTMLDivElement>(null)

    // Open dialog when saleId is set
    useEffect(() => {
        if (saleId) {
            setIsOpen(true)
            loadModalData(saleId)
        } else {
            setIsOpen(false)
            resetStates()
        }
    }, [saleId])

    // Scroll transcript panel to bottom on update
    useEffect(() => {
        if (transcriptEndRef.current) {
            transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [transcript])


    // Poll call details during call (max 5 dakika timeout)
    useEffect(() => {
        let interval: any = null
        const MAX_POLLING_MS = 5 * 60 * 1000 // 5 dakika
        if (polling && callId) {
            pollingStartRef.current = Date.now()
            interval = setInterval(async () => {
                // Timeout kontrolü
                if (Date.now() - pollingStartRef.current > MAX_POLLING_MS) {
                    console.warn('Polling timeout — 5dk aşıldı')
                    setCallStatus('failed')
                    setPolling(false)
                    return
                }

                const res = await getCallDetails(callId)
                if (res.error) {
                    console.error('Error polling call status:', res.error)
                    return
                }

                if (res.status) {
                    // Update status
                    if (res.status === 'queued' || res.status === 'ringing') {
                        setCallStatus('ringing')
                    } else if (res.status === 'in-progress') {
                        setCallStatus('in-progress')
                    } else if (res.status === 'ended') {
                        setCallStatus('ended')
                        setPolling(false)
                    } else {
                        setCallStatus('failed')
                        setPolling(false)
                    }
                }

                if (res.transcript) setTranscript(res.transcript)
                if (res.summary) setSummary(res.summary)
                if (res.recordingUrl) setRecordingUrl(res.recordingUrl)
                if (res.analysis) setAnalysis(res.analysis)
            }, 3000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [polling, callId])

    const loadModalData = async (id: string) => {
        setLoadingData(true)
        try {
            const data = await getAiCallModalData(id)
            if (data.error) {
                toast.error(data.error)
                onClose()
            } else {
                setModalData(data)
            }
        } catch {
            toast.error('Veriler yüklenemedi.')
            onClose()
        } finally {
            setLoadingData(false)
        }
    }

    const resetStates = () => {
        setModalData(null)
        setCallId(null)
        setCallStatus('idle')
        setTranscript('')
        setSummary('')
        setRecordingUrl('')
        setAnalysis(null)
        setInitiating(false)
        setPolling(false)
        setStopping(false)
        setShowConfirm(false)
    }

    const executeStartCall = async () => {
        console.log("[AiCallDialog] executeStartCall starting...");
        setInitiating(true)
        setCallStatus('ringing')
        try {
            console.log("[AiCallDialog] calling initiateAiCall with saleId:", saleId);
            const res = await initiateAiCall(saleId!)
            console.log("[AiCallDialog] initiateAiCall result:", res);
            if (res.error) {
                toast.error(res.error)
                setCallStatus('idle')
            } else if (res.callId) {
                setCallId(res.callId)
                setPolling(true)
                toast.success('AI Arama Başlatıldı')
            }
        } catch (err) {
            console.error("[AiCallDialog] error in executeStartCall:", err);
            toast.error('Arama başlatılamadı.')
            setCallStatus('idle')
        } finally {
            setInitiating(false)
        }
    }



    const handleStopCall = async () => {
        if (!callId || stopping) return
        setStopping(true)
        try {
            const res = await stopAiCall(callId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Arama durduruldu')
                setCallStatus('ended')
                setPolling(false)
            }
        } catch {
            toast.error('Arama durdurulamadı.')
        } finally {
            setStopping(false)
        }
    }

    const formatCallHistoryDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getScoreBadgeColor = (score: string) => {
        const s = score?.toLowerCase()
        if (s === 'hot' || s === 'qualified') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        if (s === 'warm' || s === 'follow_up') return 'bg-amber-50 text-amber-700 border-amber-200'
        if (s === 'cold') return 'bg-sky-50 text-sky-700 border-sky-200'
        return 'bg-rose-50 text-rose-700 border-rose-200'
    }

    const getScoreLabel = (score: string) => {
        const s = score?.toLowerCase()
        if (s === 'hot') return 'Çok Sıcak (Hot)'
        if (s === 'warm') return 'Sıcak (Warm)'
        if (s === 'follow_up') return 'Takip Edilecek (Follow Up)'
        if (s === 'disqualified') return 'Elendi (Disqualified)'
        return score
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                        <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                        AI Satış Asistanı Araması
                    </DialogTitle>
                </DialogHeader>

                {loadingData ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
                        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        <p className="text-sm font-medium">Müşteri detayları çekiliyor...</p>
                    </div>
                ) : modalData ? (
                    <div className="space-y-6 pt-4">
                        {/* Customer Info Card */}
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between shadow-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-500" />
                                    <span className="font-bold text-slate-900">{modalData.customerName}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Phone className="h-3 w-3" />
                                    {modalData.customerPhone}
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold">
                                    {modalData.projectName || 'Belirtilmemiş Proje'}
                                </Badge>
                                <p className="text-[10px] text-slate-400 mt-1">İlgilenilen Proje</p>
                            </div>
                        </div>

                        {/* Last Call Warning Banner */}
                        {callStatus === 'idle' && (
                            <div className="p-4 rounded-lg border text-sm shadow-sm transition-all duration-200">
                                {modalData.lastCall ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between border-b pb-1.5 mb-1.5">
                                            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-amber-500" />
                                                Son Arama Bilgisi
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {formatCallHistoryDate(modalData.lastCall.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500">Durum:</span>
                                            <Badge variant="outline" className="text-xs bg-amber-50/50 text-amber-700 border-amber-100 capitalize">
                                                {modalData.lastCall.outcome === 'answered' ? 'Ulaşıldı' : 
                                                 modalData.lastCall.outcome === 'no_answer' ? 'Cevapsız' : 
                                                 modalData.lastCall.outcome === 'busy' ? 'Meşgul' : modalData.lastCall.outcome}
                                            </Badge>
                                        </div>
                                        {modalData.lastCall.summary && (
                                            <p className="text-xs text-slate-600 bg-white/70 p-2 rounded border border-slate-100 italic">
                                                "{modalData.lastCall.summary}"
                                            </p>
                                        )}
                                        <p className="text-[10px] text-amber-600 font-medium">
                                            ⚠️ Dikkat: Müşteri yakın zamanda aranmış olabilir. Üst üste arayarak rahatsız etmemek için kontrol ediniz.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <ThumbsUp className="h-4 w-4" />
                                        <p className="text-xs font-medium">
                                            Bu müşteriye daha önce hiç AI araması yapılmamış. Güvenle arayabilirsiniz.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Call Active Section */}
                        {callStatus !== 'idle' && (
                            <div className="space-y-4 border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                                {/* Soundwave pulse animation */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${
                                                callStatus === 'ended' ? 'bg-slate-400' :
                                                callStatus === 'failed' ? 'bg-rose-500' : 'bg-purple-600'
                                            }`}></span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                            {callStatus === 'ringing' ? 'ZİL ÇALIYOR...' :
                                             callStatus === 'in-progress' ? 'CANLI GÖRÜŞME DEVAM EDİYOR' :
                                             callStatus === 'ended' ? 'ARAMA TAMAMLANDI' : 'ARAMA BAŞARISIZ'}
                                        </span>
                                    </div>
                                    <Badge className="font-mono text-xs bg-slate-100 text-slate-600 border border-slate-200">
                                        {callStatus === 'ringing' ? 'Çalıyor' :
                                         callStatus === 'in-progress' ? 'Bağlantı Aktif' :
                                         callStatus === 'ended' ? 'Kapatıldı' : 'Hata'}
                                    </Badge>
                                </div>

                                {/* Call Transcript */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" /> Konuşma Transkripti (Canlı)
                                    </Label>
                                    <div className="h-56 bg-slate-900 text-slate-100 rounded-lg p-3 overflow-y-auto text-xs font-mono leading-relaxed space-y-2.5 shadow-inner border border-slate-800">
                                        {transcript ? (
                                            transcript.split('\n').map((line, idx) => {
                                                const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:')
                                                const isAgent = line.toLowerCase().startsWith('assistant:') || line.toLowerCase().startsWith('bot:')
                                                let cleanLine = line
                                                if (isUser) cleanLine = '👤 Müşteri: ' + line.replace(/^(user|customer):\s*/i, '')
                                                if (isAgent) cleanLine = '🤖 Asistan: ' + line.replace(/^(assistant|bot):\s*/i, '')
                                                
                                                return (
                                                    <div key={idx} className={`p-1.5 rounded ${
                                                        isUser ? 'bg-blue-950/40 text-blue-300 border-l-2 border-blue-500 pl-2' : 
                                                        isAgent ? 'bg-purple-950/40 text-purple-300 border-l-2 border-purple-500 pl-2' : ''
                                                    }`}>
                                                        {cleanLine}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-500 italic">
                                                Konuşma başladığında canlı döküm burada görünecek...
                                            </div>
                                        )}
                                        <div ref={transcriptEndRef} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Call outcome / Summary */}
                        {callStatus === 'ended' && (
                            <div className="space-y-4 border-t pt-4 border-slate-100 transition-all duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Lead Score */}
                                    {analysis?.structuredData?.lead_score && (
                                        <div className="p-3 border rounded-lg bg-white shadow-sm space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">AI Lead Skoru</span>
                                            <div>
                                                <Badge className={`text-xs font-bold ${getScoreBadgeColor(analysis.structuredData.lead_score)}`}>
                                                    {getScoreLabel(analysis.structuredData.lead_score)}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* Interest level */}
                                    {analysis?.structuredData?.interested !== undefined && (
                                        <div className="p-3 border rounded-lg bg-white shadow-sm space-y-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">İlgi Seviyesi</span>
                                            <div className="flex items-center gap-1.5 font-bold text-xs">
                                                {analysis.structuredData.interested ? (
                                                    <span className="text-emerald-600 flex items-center gap-1">İlgileniyor 👍</span>
                                                ) : (
                                                    <span className="text-rose-600 flex items-center gap-1">İlgilenmiyor 👎</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Call Summary */}
                                {summary && (
                                    <div className="p-3 bg-purple-50/30 border border-purple-100/50 rounded-lg space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-purple-600 flex items-center gap-1">
                                            <Activity className="h-3.5 w-3.5" /> Görüşme Özeti (AI Analizi)
                                        </span>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            {summary}
                                        </p>
                                    </div>
                                )}

                                {/* Call Recording Player */}
                                {recordingUrl && (
                                    <div className="p-3 border border-slate-200 bg-white rounded-lg flex flex-col gap-2 shadow-sm">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                            <Volume2 className="h-3.5 w-3.5 text-slate-500 animate-pulse" /> Ses Kaydı
                                        </span>
                                        <audio 
                                            src={recordingUrl} 
                                            controls 
                                            className="w-full h-8 outline-none bg-slate-50 rounded"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}

                <DialogFooter className="border-t pt-4 gap-2">
                    {showConfirm ? (
                        <div className="flex items-center justify-between gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-lg w-full animate-in fade-in slide-in-from-bottom-2 duration-250">
                            <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                Aramayı başlatmak istediğinizden emin misiniz?
                            </span>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    disabled={initiating}
                                    onClick={() => setShowConfirm(false)}
                                    className="h-8 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                >
                                    İptal
                                </Button>
                                <Button 
                                    size="sm" 
                                    disabled={initiating}
                                    onClick={async () => {
                                        await executeStartCall()
                                        setShowConfirm(false)
                                    }}
                                    className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 dark:shadow-none"
                                >
                                    {initiating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Evet, Ara'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => { setIsOpen(false); onClose() }}>
                                Kapat
                            </Button>
                            
                            {callStatus === 'idle' && (
                                <Button 
                                    className="bg-purple-600 hover:bg-purple-700 font-bold"
                                    onClick={() => setShowConfirm(true)}
                                    disabled={initiating}
                                >
                                    {initiating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Arama Hazırlanıyor...
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall className="h-4 w-4 mr-2" />
                                            AI Satış Asistanını Arat
                                        </>
                                    )}
                                </Button>
                            )}

                            {(callStatus === 'ringing' || callStatus === 'in-progress') && (
                                <Button variant="destructive" className="font-bold flex items-center gap-1.5" onClick={handleStopCall} disabled={stopping}>
                                    {stopping ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Durduruluyor...</>
                                    ) : (
                                        <><PhoneOff className="h-4 w-4" /> Aramayı Durdur</>
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
