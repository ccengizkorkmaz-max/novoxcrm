'use client'

import React, { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bot, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import AutoScroll from './AutoScroll'

function getDateDividerLabel(date: Date): string {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
        return `Bugün, ${format(date, 'd MMMM yyyy', { locale: tr })}`
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return `Dün, ${format(date, 'd MMMM yyyy', { locale: tr })}`
    }
    return format(date, 'd MMMM yyyy, EEEE', { locale: tr })
}

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
                messages.map((msg, index) => {
                    const msgDate = new Date(msg.created_at)
                    const prevMsg = index > 0 ? messages[index - 1] : null
                    const prevDate = prevMsg ? new Date(prevMsg.created_at) : null
                    const isNewDay = !prevDate || msgDate.toDateString() !== prevDate.toDateString()

                    return (
                        <React.Fragment key={msg.id}>
                            {isNewDay && (
                                <div className="flex justify-center my-3 sticky top-2 z-10">
                                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs backdrop-blur-xs">
                                        {getDateDividerLabel(msgDate)}
                                    </span>
                                </div>
                            )}
                            <div
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
                                    {msg.direction === 'outbound' && msg.sender_name && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-white/80 mb-0.5">
                                            <User className="h-2.5 w-2.5" />
                                            <span>{msg.sender_name}</span>
                                        </div>
                                    )}
                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    
                                    {/* Date and Time */}
                                    <div className={cn(
                                        "flex items-center gap-1.5 mt-1.5 justify-end text-[10.5px] font-medium",
                                        msg.direction === 'outbound' ? "text-white/85" : "text-slate-500 dark:text-slate-400"
                                    )}>
                                        {msg.sender_type === 'bot' && (
                                            <Bot className="h-3 w-3 opacity-80" />
                                        )}
                                        <span title={format(msgDate, 'd MMMM yyyy, HH:mm:ss', { locale: tr })}>
                                            {format(msgDate, 'dd.MM.yyyy · HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    )
                })
            )}
            <AutoScroll deps={messages.length} />
        </div>
    )
}
