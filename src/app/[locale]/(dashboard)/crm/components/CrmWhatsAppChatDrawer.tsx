'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    MessageCircle,
    Send,
    Loader2,
    Check,
    CheckCheck,
    Bot,
    User,
    Sparkles,
    ExternalLink,
    RefreshCw,
    PhoneCall,
    FileText,
    Calendar,
    Clock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
    getOrCreateCustomerWhatsAppConversation,
    fetchCustomerWhatsAppMessages,
    toggleCustomerWhatsAppAi,
    sendCustomerWhatsAppTemplateAction
} from '../actions'

interface CrmWhatsAppChatDrawerProps {
    isOpen: boolean
    onClose: () => void
    customer: {
        id?: string
        full_name: string
        phone?: string | null
    }
    saleId?: string | null
    projectName?: string | null
}

interface Message {
    id: string
    content: string
    direction: 'inbound' | 'outbound'
    sender_type?: string
    role?: string
    status?: string
    created_at: string
}

export function CrmWhatsAppChatDrawer({
    isOpen,
    onClose,
    customer,
    saleId,
    projectName
}: CrmWhatsAppChatDrawerProps) {
    const [loading, setLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [conversation, setConversation] = useState<any>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputMessage, setInputMessage] = useState('')
    const [aiEnabled, setAiEnabled] = useState(false)
    const [isPolling, setIsPolling] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Scroll to bottom helper
    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }, [])

    // Load or create conversation on open
    useEffect(() => {
        if (!isOpen || !customer.phone) {
            setConversation(null)
            setMessages([])
            return
        }

        let isMounted = true
        setLoading(true)

        getOrCreateCustomerWhatsAppConversation({
            customerId: customer.id,
            phone: customer.phone,
            saleId: saleId || undefined,
            customerName: customer.full_name
        }).then((res) => {
            if (!isMounted) return
            setLoading(false)

            if (res.error) {
                toast.error(res.error)
                return
            }

            if (res.conversation) {
                setConversation(res.conversation)
                setAiEnabled(res.conversation.ai_enabled || false)
                setMessages(res.messages || [])
                setTimeout(() => scrollToBottom(false), 150)
            }
        }).catch((err) => {
            if (!isMounted) return
            setLoading(false)
            toast.error('WhatsApp sohbeti yüklenirken hata oluştu')
            console.error(err)
        })

        return () => {
            isMounted = false
        }
    }, [isOpen, customer.id, customer.phone, customer.full_name, saleId, scrollToBottom])

    // Live polling for new messages every 4 seconds while drawer is open
    useEffect(() => {
        if (!isOpen || !conversation?.id) return

        const interval = setInterval(async () => {
            setIsPolling(true)
            try {
                const res = await fetchCustomerWhatsAppMessages(conversation.id)
                if (res.success && res.messages) {
                    setMessages((prev) => {
                        if (res.messages.length !== prev.length) {
                            setTimeout(() => scrollToBottom(true), 100)
                            return res.messages
                        }
                        return prev
                    })
                }
            } catch (err) {
                console.warn('Poll error:', err)
            } finally {
                setIsPolling(false)
            }
        }, 4000)

        return () => clearInterval(interval)
    }, [isOpen, conversation?.id, scrollToBottom])

    // Send message via /api/conversations/reply
    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputMessage).trim()
        if (!text || sending || !conversation?.id) return

        setSending(true)
        try {
            const res = await fetch('/api/conversations/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: conversation.id,
                    message: text
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Mesaj gönderilemedi')
            }

            // Append optimistic outgoing message
            const newMsg: Message = {
                id: 'temp-' + Date.now(),
                content: text,
                direction: 'outbound',
                role: 'assistant',
                sender_type: 'agent',
                status: 'delivered',
                created_at: new Date().toISOString()
            }
            setMessages((prev) => [...prev, newMsg])
            setInputMessage('')
            toast.success('Mesaj kurumsal WhatsApp numaranızdan iletildi')
            setTimeout(() => scrollToBottom(true), 100)

            // Manual message disables AI on server
            setAiEnabled(false)
        } catch (err: any) {
            console.error('Send error:', err)
            toast.error(err.message || 'Mesaj gönderilemedi')
        } finally {
            setSending(false)
            textareaRef.current?.focus()
        }
    }

    const [sendingTemplate, setSendingTemplate] = useState(false)

    // Send official pre-approved Turkish Meta Template (new_lead_bilgilendirme)
    const handleSendApprovedTemplate = async () => {
        if (!conversation?.id || !customer.phone || sendingTemplate) return
        setSendingTemplate(true)
        try {
            const res = await sendCustomerWhatsAppTemplateAction({
                conversationId: conversation.id,
                phone: customer.phone,
                customerName: customer.full_name,
                projectName: projectName || undefined
            })
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Resmi Türkçe tanıtım şablonu müşteriye iletildi')
                const newMsg: Message = {
                    id: 'temp-' + Date.now(),
                    content: res.message || 'Bilgilendirme şablonu gönderildi',
                    direction: 'outbound',
                    role: 'assistant',
                    sender_type: 'agent',
                    status: 'delivered',
                    created_at: new Date().toISOString()
                }
                setMessages(prev => [...prev, newMsg])
                setTimeout(() => scrollToBottom(true), 150)
            }
        } catch (err: any) {
            toast.error(err.message || 'Şablon gönderilirken hata oluştu')
        } finally {
            setSendingTemplate(false)
        }
    }

    // Toggle AI
    const handleToggleAi = async () => {
        if (!conversation?.id) return
        const target = !aiEnabled
        setAiEnabled(target)
        const res = await toggleCustomerWhatsAppAi(conversation.id, target)
        if (res.success) {
            toast.success(target ? '🤖 Yapay Zekâ (AI) modu açıldı' : '👤 Temsilci manuel modu aktif')
        } else {
            setAiEnabled(!target)
            toast.error('AI durumu güncellenemedi')
        }
    }

    // Quick template responses
    const quickTemplates = [
        `Merhaba ${customer.full_name || 'Bey/Hanım'}, ilgilendiğiniz ${projectName || 'projemiz'} ile ilgili güncel fiyat ve detay bilgisi paylaşmak için ulaşıyorum.`,
        `İlgilendiğiniz daire tipinin güncel kat planları ve görsellerini iletebilirim. Müsait olduğunuzda incelemek ister misiniz?`,
        `Sayın ${customer.full_name || 'Müşterimiz'}, detayları telefonda görüşmek için bugün saat kaçta müsait olursunuz?`,
        `Satış ofisimizde örnek dairemizi yerinde görmek üzere bir kahve eşliğinde randevu organize edebiliriz.`
    ]

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-[500px] w-full p-0 flex flex-col bg-slate-50 border-l shadow-2xl">
                {/* Header */}
                <SheetHeader className="p-4 bg-emerald-600 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                                <MessageCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <SheetTitle className="text-white text-base font-bold flex items-center gap-2">
                                    {customer.full_name}
                                    <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold bg-white/20 text-white rounded-full">
                                        WhatsApp
                                    </span>
                                </SheetTitle>
                                <p className="text-emerald-100 text-xs font-mono">
                                    {customer.phone || 'Numara yok'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {conversation?.id && (
                                <Link
                                    href={`/conversations/${conversation.id}`}
                                    target="_blank"
                                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                    title="Tam Ekranda Aç"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Verified Corporate Number Info */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-500/50 flex items-center justify-between text-[11px] text-emerald-100">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                            <span>Kurumsal Hat: <strong>+90 533 602 42 81</strong> (Novo CRM)</span>
                        </div>

                        {conversation && (
                            <button
                                onClick={handleToggleAi}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                    aiEnabled
                                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                                title="Yapay zeka yanıtlarını aç/kapat"
                            >
                                <Bot className="h-3 w-3" />
                                {aiEnabled ? 'AI Aktif' : 'Temsilci Modu'}
                            </button>
                        )}
                    </div>
                </SheetHeader>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]/30">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                            <p className="text-xs font-medium">Sohbet geçmişi yükleniyor...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 py-16 text-muted-foreground">
                            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                <MessageCircle className="h-7 w-7" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800 mb-1">Henüz Mesajlaşma Başlatılmadı</h4>
                            <p className="text-xs text-slate-500 max-w-xs mb-4">
                                <strong>{customer.full_name}</strong> ile kurumsal WhatsApp hattınız üzerinden doğrudan yazışabilirsiniz.
                            </p>
                            <Button
                                size="sm"
                                disabled={sendingTemplate}
                                onClick={handleSendApprovedTemplate}
                                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 mb-4 active:scale-98 transition-all"
                            >
                                {sendingTemplate ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Şablon Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        📩 Resmi Türkçe Tanıtım Şablonu Gönder (Hattı Aç)
                                    </>
                                )}
                            </Button>

                            <div className="w-full space-y-1.5 text-left">
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                                    💡 Alternatif Serbest Metin Şablonları:
                                </p>
                                {quickTemplates.map((tmpl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(tmpl)}
                                        disabled={sending}
                                        className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs text-slate-700 transition-all active:scale-[0.99] shadow-sm flex items-start gap-2"
                                    >
                                        <Send className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                                        <span>{tmpl}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const lastInboundMsg = [...messages].reverse().find(m => m.direction === 'inbound')
                                const lastInboundTime = lastInboundMsg?.created_at ? new Date(lastInboundMsg.created_at).getTime() : 0
                                const is24hExpired = !lastInboundTime || (Date.now() - lastInboundTime > 24 * 60 * 60 * 1000)

                                if (is24hExpired) {
                                    return (
                                        <div className="p-3.5 bg-amber-50/95 border border-amber-200/80 rounded-2xl text-xs text-amber-900 shadow-xs mb-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                                                    <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                                    <span>WhatsApp 24 Saat İletişim Penceresi Kapalı</span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] bg-amber-100/80 text-amber-800 border-amber-300 py-0 h-4">
                                                    Şablon Gerekli
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-amber-800/90 leading-relaxed">
                                                Müşteri son 24 saat içinde yazmadığı için serbest metinler Meta tarafından bekletilir. Aşağıdaki butona tıklayarak müşteriye resmi Türkçe bilgilendirme şablonu gönderebilirsiniz:
                                            </p>
                                            <Button
                                                size="sm"
                                                disabled={sendingTemplate}
                                                onClick={handleSendApprovedTemplate}
                                                className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5 active:scale-98 transition-all"
                                            >
                                                {sendingTemplate ? (
                                                    <>
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        Şablon İletiliyor...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-3.5 w-3.5" />
                                                        Resmi Türkçe Tanıtım Şablonu Gönder (Canlı Hattı Aç)
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )
                                }
                                return null
                            })()}

                            {messages.map((msg) => {
                                const isOutbound = msg.direction === 'outbound'
                                const isAi = msg.role === 'assistant' && msg.sender_type === 'ai'
                                const time = msg.created_at
                                    ? new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                                    : ''

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm relative leading-relaxed ${
                                                isOutbound
                                                    ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none border border-emerald-200/50'
                                                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
                                            }`}
                                        >
                                            {isAi && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700 mb-1">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    <span>Novo AI Yanıtı</span>
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            <div
                                                className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                                    isOutbound ? 'text-emerald-800/70' : 'text-slate-400'
                                                }`}
                                            >
                                                <span>{time}</span>
                                                {isOutbound && (
                                                    <CheckCheck className="h-3 w-3 text-emerald-600" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Quick Templates Bar */}
                {messages.length > 0 && (
                    <div className="p-2 border-t border-slate-200 bg-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0">Hızlı Şablon:</span>
                        <button
                            type="button"
                            onClick={() => setInputMessage(`Merhaba ${customer.full_name}, projemizle ilgili detaylı bilgi ve güncel fiyat listesini iletiyorum.`)}
                            className="text-[11px] whitespace-nowrap bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 px-2 py-1 rounded-full shrink-0 shadow-xs"
                        >
                            📑 Fiyat & Detay
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMessage(`Sayın ${customer.full_name}, detayları telefonda görüşmek için bugün saat kaçta müsait olursunuz?`)}
                            className="text-[11px] whitespace-nowrap bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 px-2 py-1 rounded-full shrink-0 shadow-xs"
                        >
                            📞 Arama Randevusu
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMessage(`Satış ofisimizde örnek dairemizi yerinde görmek üzere bir kahve eşliğinde randevu organize edebiliriz.`)}
                            className="text-[11px] whitespace-nowrap bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 px-2 py-1 rounded-full shrink-0 shadow-xs"
                        >
                            📍 Ofis Randevusu
                        </button>
                    </div>
                )}

                {/* Footer / Input */}
                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSendMessage()
                        }}
                        className="flex items-end gap-2"
                    >
                        <Textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder={customer.phone ? "WhatsApp mesajı yazın... (Gönder için Enter)" : "Müşteri telefonu eksik"}
                            disabled={!customer.phone || sending || loading}
                            rows={2}
                            className="min-h-[46px] max-h-[120px] resize-none text-xs rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <Button
                            type="submit"
                            disabled={!inputMessage.trim() || sending || !customer.phone || loading}
                            className="h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    <p className="text-[10px] text-slate-400 mt-1 text-center">
                        Mesajlar kurumsal WhatsApp Business Cloud API ile anında iletilir.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
