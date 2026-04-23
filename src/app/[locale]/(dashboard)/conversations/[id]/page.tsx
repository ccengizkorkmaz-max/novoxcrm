import { getSessionMessages, getMessagingSession } from '../actions'
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Bot, Sparkles, Activity, CalendarCheck } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import ConversationReply from './ConversationReply'
import AiToggle from './AiToggle'
import AutoScroll from './AutoScroll'
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

interface Message {
    id: string
    role: 'assistant' | 'user'
    content: string
    created_at: string
}

export default async function ConversationDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const [messagesData, session] = await Promise.all([
        getSessionMessages(id),
        getMessagingSession(id)
    ])

    const messages = messagesData as Message[]

    if (!session) {
        return <div className="p-8 font-black text-slate-400 uppercase tracking-widest text-center">Görüşme Bulunamadı</div>
    }

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                            {session.customers ? <User className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight">
                            {session.customers?.full_name || `+${session.phone_number}`}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={cn(
                                "text-[10px] uppercase font-black px-2 py-0 border-none shadow-sm",
                                session.channel === 'messenger' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                            )}>
                                {session.channel === 'messenger' ? 'MESSENGER' : 'WHATSAPP'}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {session.phone_number}</span>
                        </div>
                    </div>
                </div>

                <AiToggle sessionId={id} initialAiEnabled={session.ai_enabled ?? true} />
            </div>

            <div className="flex-1 flex overflow-hidden lg:max-h-[calc(100vh-140px)]">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/20">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-10">
                                <MessageSquare className="h-24 w-24 mb-4" />
                                <span className="font-black text-2xl uppercase tracking-[0.2em]">Henüz Mesaj Yok</span>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === 'assistant' ? "flex-row" : "flex-row-reverse"
                                    )}
                                >
                                    <div className={cn(
                                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform hover:scale-110",
                                        msg.role === 'assistant' ? "bg-white border-slate-200 text-blue-600" : "bg-blue-600 border-blue-500 text-white shadow-blue-200"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-1.5 max-w-[80%]",
                                        msg.role === 'assistant' ? "items-start" : "items-end"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl px-5 py-3 text-[14px] font-medium leading-relaxed shadow-sm",
                                            msg.role === 'assistant'
                                                ? "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                                : "bg-[#0084ff] text-white rounded-tr-none shadow-blue-50"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                                            {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <AutoScroll deps={messages.length} />
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm sticky bottom-0">
                        <ConversationReply />
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="hidden xl:block w-72 border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {/* Customer Card */}
                    {session.customers ? (
                        <Link
                            href={`/customers/${session.customer_id}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all group"
                        >
                            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                {session.customers.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 truncate">{session.customers.full_name}</div>
                                <div className="text-[11px] text-blue-600 font-medium">{session.customers.phone}</div>
                            </div>
                        </Link>
                    ) : (
                        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-center">
                            <p className="text-[11px] font-semibold text-amber-700 mb-2">Müşteri eşleşmedi</p>
                            <Link
                                href="/customers?new=true"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-all uppercase tracking-wider"
                            >
                                + CRM'e Ekle
                            </Link>
                        </div>
                    )}

                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Kanal</div>
                            <div className={cn(
                                "text-xs font-black mt-0.5",
                                session.channel === 'messenger' ? "text-blue-600" : "text-emerald-600"
                            )}>
                                {session.channel === 'messenger' ? 'Messenger' : 'WhatsApp'}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Mesaj</div>
                            <div className="text-xs font-black text-slate-900 mt-0.5">{messages.length}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Başlangıç</div>
                            <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                                {format(new Date(session.created_at), 'dd MMM', { locale: tr })}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-slate-400 font-bold uppercase">Son Mesaj</div>
                            <div className="text-[11px] font-bold text-slate-700 mt-0.5">
                                {format(new Date(session.last_message_at), 'HH:mm', { locale: tr })}
                            </div>
                        </div>
                    </div>

                    {/* Notes / Quick Actions */}
                    <div className="space-y-2">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hızlı İşlemler</div>
                        <Link
                            href={`/crm?phone=${session.phone_number}`}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all text-[11px] font-semibold text-slate-600"
                        >
                            <Activity className="h-3.5 w-3.5" />
                            CRM'de Ara
                        </Link>
                        <Link
                            href={`/activities?source=conversation&ref=${id}`}
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all text-[11px] font-semibold text-slate-600"
                        >
                            <CalendarCheck className="h-3.5 w-3.5" />
                            Aktivite Oluştur
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
