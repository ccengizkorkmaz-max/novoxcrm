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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-white dark:bg-slate-950">
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
                            "flex w-full items-end gap-2",
                            msg.direction === 'outbound' ? "justify-end" : "justify-start"
                        )}
                    >
                        {/* Avatar for Inbound Messages */}
                        {msg.direction === 'inbound' && (
                            <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shadow-sm mb-1">
                                <span className="text-[10px] font-bold uppercase">
                                    {customerName ? customerName.charAt(0) : '?'}
                                </span>
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={cn(
                                "relative max-w-[75%] md:max-w-[65%] px-4 py-2.5 shadow-sm",
                                msg.direction === 'outbound'
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-[22px] rounded-br-sm"
                                    : "bg-[#f0f2f5] dark:bg-slate-800 text-slate-900 dark:text-white rounded-[22px] rounded-bl-sm"
                            )}
                        >
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            
                            {/* Timestamp below bubble if needed, but Messenger puts it outside or very small */}
                            <div className={cn(
                                "flex items-center gap-1 mt-1 justify-end",
                                msg.direction === 'outbound' ? "text-white/80" : "text-slate-500"
                            )}>
                                {msg.sender_type === 'bot' && (
                                    <Bot className="h-3 w-3 opacity-70" />
                                )}
                                <span className="text-[10px] font-medium">
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
