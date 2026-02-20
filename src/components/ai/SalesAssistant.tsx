'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, X, MessageSquare, Phone, Info, Layout, Sparkles, Volume2 } from 'lucide-react'
import { createLeadFromAi } from '@/app/[locale]/ai/actions'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface SalesAssistantProps {
    project: any
    aiSettings?: {
        name: string
        personality: string
        instructions: string
        gender: 'male' | 'female'
    }
}

export default function SalesAssistant({ project, aiSettings }: SalesAssistantProps) {
    const assistantName = aiSettings?.name || 'Novo AI'

    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: project
                ? `Merhaba! Ben ${assistantName}. ${project.name} projesi hakkında bilgi almak isterseniz size yardımcı olabilirim.`
                : `Merhaba! Ben ${assistantName}. Tüm projelerimiz hakkında size bilgi verebilir, bütçenize ve tercihinize en uygun projeyi önerebilirim. Nasıl yardımcı olabilirim?`
        }
    ])
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)

    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    // DEBUG: Log settings to verify they are coming from the server correctly
    useEffect(() => {
        console.log('AI Settings Received:', aiSettings)
    }, [aiSettings])

    useEffect(() => {
        // Initialize Speech Recognition
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.lang = 'tr-TR'

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setInput(transcript)
                handleSend(transcript)
                setIsListening(false)
            }

            recognitionRef.current.onerror = () => setIsListening(false)
            recognitionRef.current.onend = () => setIsListening(false)
        }

        // Handle async voice loading
        const loadVoices = () => {
            const trVoices = window.speechSynthesis.getVoices()
            if (trVoices.length > 0) {
                setVoices(trVoices)
            }
        }
        loadVoices()
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices
        }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }

        // Speak initial message if it's the first render using Cloud TTS
        if (messages.length === 1 && messages[0].role === 'assistant') {
            const timer = setTimeout(() => {
                speak(messages[0].content)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [messages])

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isProcessing) return

        const userMessage: Message = { role: 'user', content: text }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsProcessing(true)

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    project: project,
                    history: messages
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || `Sunucu hatası: ${response.status}`)
            }

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
                speak(data.reply)

                // Actual Lead Capture in Database
                if (data.leadCaptured) {
                    const result = await createLeadFromAi({
                        name: data.leadData?.name || "AI Müşteri",
                        phone: data.leadData?.phone || "000",
                        projectId: data.leadData?.projectId || project?.id || null,
                        notes: `Müşteri ilgisi tespiti (${project?.name || 'Genel Portföy'}): ${text}`
                    })

                    if (result.success) {
                        toast.success("Bilgileriniz kaydedildi, uzmanlarımız sizi arayacak!")
                    } else {
                        toast.error(`Kayıt oluşturulamadı: ${result.error}`)
                    }
                }
            } else {
                throw new Error("AI yanıt veremedi (boş yanıt).")
            }
        } catch (error: any) {
            console.error('Chat error:', error)
            const errorMsg = error.message || "İletişim kurulurken bir sorun oluştu."
            toast.error(errorMsg)
        } finally {
            setIsProcessing(false)
        }
    }

    const speak = async (text: string) => {
        if (!text || typeof window === 'undefined') return

        const cleanText = text.replace(/\*\*/g, '').replace(/\[LEAD_CAPTURE_EVENT\]/g, '').trim()
        if (!cleanText) return

        console.log('AI Speaking (Cloud TTS):', cleanText.substring(0, 30) + '...')

        try {
            const existingAudio = document.getElementById('ai-audio-player') as HTMLAudioElement
            if (existingAudio) {
                existingAudio.pause()
                existingAudio.remove()
            }

            const response = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: cleanText,
                    gender: aiSettings?.gender || 'female'
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'TTS API hatası')
            }

            const data = await response.json()
            if (data.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`)
                audio.id = 'ai-audio-player'
                audio.play().catch(e => {
                    // Silently fail for initial message if user hasn't interacted yet
                    console.warn('Audio play blocked by browser (waiting for user interaction)')
                })
            }
        } catch (error: any) {
            console.warn('Cloud TTS failed, using fallback...', error.message)

            // Final fallback to browser synthesis so the bot still speaks
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
                const utterance = new SpeechSynthesisUtterance(cleanText)
                utterance.lang = 'tr-TR'
                window.speechSynthesis.speak(utterance)
            }
        }
    }

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
        } else {
            setIsListening(true)
            recognitionRef.current?.start()
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 md:p-8 bg-[#020203] relative overflow-hidden font-sans">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse delay-700"></div>
            </div>

            {/* Standalone Window Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-[500px] h-[800px] max-h-[90vh] flex flex-col bg-[#0a0a0c]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
            >
                {/* Window Header */}
                <header className="p-5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-semibold tracking-tight text-white/90">{assistantName}</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] text-blue-400 uppercase tracking-widest font-medium">
                                    {project?.name || 'Portföy Asistanı'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const lastMsg = messages[messages.length - 1];
                                if (lastMsg) speak(lastMsg.content);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-blue-400 transition-all border border-white/5"
                            title="Son mesajı seslendir"
                        >
                            <Volume2 size={18} />
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar-thin">
                    <AnimatePresence>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white/5 border border-white/10 text-white/90'
                                    }`}>
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex gap-1.5 items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Controls */}
                <footer className="p-5 border-t border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col gap-4">
                        {/* Voice Pulse */}
                        <AnimatePresence>
                            {isListening && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex justify-center"
                                >
                                    <div className="flex items-center gap-1.5 h-8">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: [4, 20, 4] }}
                                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                                className="w-1 bg-blue-500 rounded-full"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3 items-center">
                            {/* Voice Toggle */}
                            <button
                                onClick={toggleListening}
                                className={`p-4 rounded-2xl transition-all duration-300 ${isListening
                                    ? 'bg-red-500 shadow-lg shadow-red-500/40 text-white'
                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-blue-400'
                                    }`}
                            >
                                <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
                            </button>

                            {/* Input Field */}
                            <div className="flex-1 relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Bir şey sorun..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-5 pr-12 outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all text-sm font-light text-white placeholder:text-white/20"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isProcessing}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:text-slate-600 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {['Fiyatlar', 'Katalog', 'Randevu'].map((text) => (
                                <button
                                    key={text}
                                    onClick={() => handleSend(text)}
                                    className="whitespace-nowrap px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-medium text-white/40 hover:text-white/70 transition-colors"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                </footer>
            </motion.div>
        </div>
    )
}
