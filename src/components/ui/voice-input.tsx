'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface VoiceInputProps {
    onTranscriptionComplete: (text: string, data?: any) => void
    isProcessing?: boolean
}

export function VoiceInput({ onTranscriptionComplete, isProcessing: externalProcessing }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [duration, setDuration] = useState(0)
    const [isInternalProcessing, setIsInternalProcessing] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const isProcessing = externalProcessing || isInternalProcessing

    useEffect(() => {
        // Check browser support on mount
        if (typeof navigator !== 'undefined' && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) {
            setIsSupported(false)
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    const startRecording = async () => {
        if (!isSupported) {
            toast.error('Tarayıcınız ses kaydını desteklemiyor veya güvenli bağlantı (HTTPS) gerekli.')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Prefer opus in webm for best compatibility with Gemini/Whisper
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm'

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorderRef.current.onstop = async () => {
                if (chunksRef.current.length === 0) {
                    toast.error('Ses kaydedilemedi. Lütfen tekrar deneyin.')
                    return
                }
                const audioBlob = new Blob(chunksRef.current, { type: mimeType })
                await handleTranscription(audioBlob)

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setDuration(0)
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Microphone access error:', err)
            toast.error('Mikrofona erişilemedi. Lütfen izinlerinizi kontrol edin.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const handleTranscription = async (audioBlob: Blob) => {
        // Minimum size check (e.g., 500 bytes) to avoid sending empty/silent recordings
        if (audioBlob.size < 500) {
            toast.error('Ses çok kısa veya sessiz.')
            setIsInternalProcessing(false)
            return
        }

        setIsInternalProcessing(true)
        const formData = new FormData()
        formData.append('file', audioBlob, 'recording.webm')

        try {
            const response = await fetch('/api/ai/transcribe', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Transcription failed')
            }

            const data = await response.json()
            if (data.text || data.structured) {
                onTranscriptionComplete(data.text || "", data.structured)
                toast.success('Ses başarıyla yazıya döküldü!')
            } else {
                toast.info('Ses kaydında anlamlı bir konuşma bulunamadı.')
            }
        } catch (error: any) {
            console.error('Transcription error:', error)
            toast.error(error.message || 'Ses işlenirken bir hata oluştu.')
        } finally {
            setIsInternalProcessing(false)
            setDuration(0)
        }
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex items-center gap-2">
            {!isRecording ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startRecording}
                    disabled={isProcessing || !isSupported}
                    title={!isSupported ? "HTTPS bağlantısı gerekli" : "Sesli not başlat"}
                    className={`gap-2 transition-all ${isProcessing || !isSupported ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:text-blue-600'}`}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-xs">İşleniyor...</span>
                        </>
                    ) : (
                        <>
                            <Mic className={cn("h-4 w-4", !isSupported && "text-muted-foreground")} />
                            <span className="text-xs">{!isSupported ? 'Desteklenmiyor (HTTPS)' : 'Sesli Not Başlat'}</span>
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                    className="gap-2 animate-pulse pr-4"
                >
                    <Square className="h-4 w-4 fill-current" />
                    <span className="text-xs font-mono w-8 text-center">{formatDuration(duration)}</span>
                    <span className="text-xs">Durdur & Çevir</span>
                </Button>
            )}

            {/* Optional visualization of AI readiness */}
            {!isRecording && !isProcessing && isSupported && (
                <div className="hidden group-hover:flex text-[10px] text-muted-foreground items-center gap-1 animate-in fade-in zoom-in duration-300">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    <span>AI Ready</span>
                </div>
            )}
        </div>
    )
}
