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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 custom-scrollbar bg-[#efeae2] dark:bg-[#0b141a] bg-[url('/img/chat-bg.png')] bg-repeat opacity-95">
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
                            "flex w-full",
                            msg.direction === 'outbound' ? "justify-end" : "justify-start"
                        )}
                    >
                        {/* Bubble */}
                        <div
                            className={cn(
                                "relative max-w-[85%] md:max-w-[75%] px-3 py-1.5 shadow-sm",
                                msg.direction === 'outbound'
                                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-white rounded-lg rounded-tr-none"
                                    : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-white rounded-lg rounded-tl-none"
                            )}
                        >
                            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap pb-3 pr-8">{msg.content}</p>
                            
                            {/* Timestamp */}
                            <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                {msg.sender_type === 'bot' && (
                                    <Bot className="h-3 w-3 text-slate-400 dark:text-slate-300" />
                                )}
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
            <AutoScroll deps={messages.length} />
        </div>
    )
}
