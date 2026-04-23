'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import AutoScroll from './AutoScroll'

export default function RealtimeMessages({ 
    initialMessages, 
    conversationId,
    customerName,
    tenantId
}: { 
    initialMessages: any[], 
    conversationId: string,
    customerName: string,
    tenantId: string
}) {
    const [messages, setMessages] = useState(initialMessages)

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    console.log('Realtime message received:', payload.new)
                    setMessages((prev) => {
                        // Prevent duplicates
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId])

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[url('/img/chat-bg.png')] bg-repeat opacity-95">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Henüz mesaj yok. Görüşmeyi başlatın.</p>
                </div>
            ) : (
                messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex max-w-[80%] items-end gap-2",
                            msg.direction === 'outbound' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        {/* Avatar */}
                        <div className={cn(
                            "h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-sm",
                            msg.direction === 'outbound'
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600"
                        )}>
                            {msg.sender_type === 'bot' ? (
                                <Bot className="h-4 w-4" />
                            ) : msg.direction === 'outbound' ? (
                                <User className="h-4 w-4" />
                            ) : (
                                <span className="text-xs font-bold uppercase">
                                    {customerName ? customerName.charAt(0) : '?'}
                                </span>
                            )}
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                            "flex flex-col",
                            msg.direction === 'outbound' ? "items-end" : "items-start"
                        )}>
                            <div
                                className={cn(
                                    "px-4 py-3 shadow-sm relative group",
                                    msg.direction === 'outbound'
                                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"
                                )}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 px-1">
                                {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
                            </span>
                        </div>
                    </div>
                ))
            )}
            <AutoScroll deps={messages.length} />
        </div>
    )
}
