'use client'

import { Link } from '@/i18n/routing'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MessageSquare, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"

interface ConversationSidebarProps {
    sessions: any[]
}

export default function ConversationSidebar({ sessions }: ConversationSidebarProps) {
    const pathname = usePathname()

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full lg:w-96 shrink-0 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        Mesajlaşmalar
                    </h2>
                    <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[10px] tracking-widest">
                        {sessions.length}
                    </Badge>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        Canlı Görüşme Akışı
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50/10">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-4 border border-slate-100 shadow-inner rotate-12">
                            <MessageSquare className="h-8 w-8 -rotate-12" />
                        </div>
                        <h3 className="text-slate-900 font-extrabold text-sm mb-1">Görüşme Bulunamadı</h3>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                            Henüz bir mesajlaşma trafiği başlatılmamış.
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isActive = pathname.includes(session.id)

                        return (
                            <Link
                                key={session.id}
                                href={`/conversations/${session.id}`}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden active:scale-[0.98]",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:bg-blue-700"
                                        : "hover:bg-white text-slate-600 border border-transparent hover:border-slate-100 hover:shadow-md"
                                )}
                            >
                                <div className={cn(
                                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-sm font-black",
                                    isActive
                                        ? "bg-white/10 border-white/20 text-white"
                                        : session.ai_enabled ? "bg-blue-50 border-blue-100 text-blue-600" :
                                                "bg-amber-50 border-amber-100 text-amber-600"
                                )}>
                                    {session.ai_enabled ? <MessageSquare className="h-6 w-6" /> : <User className="h-6 w-6" />}
                                </div>

                                <div className="flex-1 min-w-0 pr-2 text-left">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={cn(
                                            "font-black text-[13px] truncate tracking-tight",
                                            isActive ? "text-white" : "text-slate-900"
                                        )}>
                                            {session.customers?.full_name || `+${session.phone_number}`}
                                        </span>
                                        {!isActive && (
                                            <div className="flex items-center gap-1">
                                                {session.lead_score && session.lead_score !== 'unknown' && (
                                                    <span className={cn(
                                                        "text-[9px] px-1.5 py-0.5 rounded-full font-black tracking-wider",
                                                        session.lead_score === 'hot' && 'bg-red-100 text-red-700',
                                                        session.lead_score === 'warm' && 'bg-orange-100 text-orange-700',
                                                        session.lead_score === 'cold' && 'bg-sky-100 text-sky-600',
                                                    )}>
                                                        {session.lead_score === 'hot' ? '🔥' : session.lead_score === 'warm' ? '🟠' : '🔵'}
                                                    </span>
                                                )}
                                                <Badge className={cn(
                                                    "text-[9px] px-1.5 py-0 min-w-max uppercase font-black tracking-widest border-none",
                                                    session.ai_enabled ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {session.ai_enabled ? 'AI' : 'İNSAN'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-bold truncate opacity-50 tracking-widest",
                                        isActive ? "text-blue-100" : "text-slate-500"
                                    )}>
                                        {session.last_message_preview || 'Mesaj yok'}
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-[0.05em]",
                                        isActive ? "text-blue-100/70" : "text-slate-400"
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
