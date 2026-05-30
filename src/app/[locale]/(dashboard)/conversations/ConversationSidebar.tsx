'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MessageSquare, User, Clock, Search, X } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'

interface ConversationSidebarProps {
    sessions: any[]
}

export default function ConversationSidebar({ sessions }: ConversationSidebarProps) {
    const pathname = usePathname()
    const [search, setSearch] = useState('')

    useSupabaseRealtime({ table: 'whatsapp_conversations' })

    const filteredSessions = search.trim()
        ? sessions.filter((s) => {
            const q = search.toLowerCase()
            const name = (s.customers?.full_name || '').toLowerCase()
            const phone = (s.phone_number || '').toLowerCase()
            return name.includes(q) || phone.includes(q)
        })
        : sessions

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full lg:w-96 shrink-0 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        Mesajlaşmalar
                    </h2>
                    <Badge variant="outline" className="border-slate-200 text-slate-500 font-medium text-xs">
                        {filteredSessions.length}{search.trim() ? `/${sessions.length}` : ''}
                    </Badge>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="İsim veya telefon ile ara..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50/10">
                {filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-4 border border-slate-100 shadow-inner rotate-12">
                            <MessageSquare className="h-8 w-8 -rotate-12" />
                        </div>
                        <h3 className="text-slate-900 font-medium text-sm mb-1">
                            {search.trim() ? 'Sonuç Bulunamadı' : 'Görüşme Bulunamadı'}
                        </h3>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                            {search.trim()
                                ? `"${search}" için eşleşen görüşme yok.`
                                : 'Henüz bir mesajlaşma trafiği başlatılmamış.'
                            }
                        </p>
                    </div>
                ) : (
                    filteredSessions.map((session) => {
                        const isActive = pathname.includes(session.id)

                        return (
                            <Link
                                key={session.id}
                                href={`/conversations/${session.id}`}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden active:scale-[0.98]",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:bg-blue-700"
                                        : "hover:bg-white text-slate-600 border border-transparent hover:border-slate-100 hover:shadow-md"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm font-semibold",
                                    isActive
                                        ? "bg-white/10 border-white/20 text-white"
                                        : session.ai_enabled ? "bg-blue-50 border-blue-100 text-blue-600" :
                                                "bg-amber-50 border-amber-100 text-amber-600"
                                )}>
                                    {session.ai_enabled ? <MessageSquare className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </div>

                                <div className="flex-1 min-w-0 pr-2 text-left">
                                    <div className="flex flex-col gap-0.5 mb-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn(
                                                "font-bold text-sm truncate",
                                                isActive ? "text-white" : "text-slate-900"
                                            )}>
                                                {session.customers?.full_name || `+${session.phone_number}`}
                                            </span>
                                            {!isActive && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {session.unread_count > 0 && (
                                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm" title={`${session.unread_count} okunmamış mesaj`}>
                                                            {session.unread_count}
                                                        </span>
                                                    )}
                                                    {session.lead_score && session.lead_score !== 'unknown' && (
                                                        <span className={cn(
                                                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                                            session.lead_score === 'hot' && 'bg-red-100 text-red-700',
                                                            session.lead_score === 'warm' && 'bg-orange-100 text-orange-700',
                                                            session.lead_score === 'cold' && 'bg-sky-100 text-sky-600',
                                                        )}>
                                                            {session.lead_score === 'hot' ? '🔥' : session.lead_score === 'warm' ? '🟠' : '🔵'}
                                                        </span>
                                                    )}
                                                    <Badge className={cn(
                                                        "text-[9px] px-1.5 py-0 min-w-max uppercase font-bold border-none",
                                                        session.ai_enabled ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                    )}>
                                                        {session.ai_enabled ? 'AI' : 'İNSAN'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        {session.customers?.full_name && (
                                            <span className={cn(
                                                "text-[11px] font-semibold",
                                                isActive ? "text-blue-200" : "text-slate-500"
                                            )}>
                                                +{session.phone_number}
                                            </span>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "text-[13px] leading-snug line-clamp-2",
                                        isActive ? "text-blue-100" : "text-slate-600"
                                    )}>
                                        {session.last_message_preview || 'Mesaj yok'}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 mt-1.5 text-[11px] font-medium",
                                        isActive ? "text-blue-100/70" : "text-slate-500"
                                    )}>
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true, locale: tr })}
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="absolute top-0 right-0 h-full w-1.5 bg-white/20 animate-pulse" />
                                )}
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}

