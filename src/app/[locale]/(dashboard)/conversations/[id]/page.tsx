import { getSessionMessages, getMessagingSession } from '../actions'
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Bot, Sparkles, Search } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import ConversationReply from './ConversationReply'
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
                            {session.customers?.full_name || `Kullanıcı #${id.slice(-4)}`}
                        </h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={cn(
                                "text-[10px] uppercase font-black px-2 py-0 border-none shadow-sm",
                                session.channel === 'whatsapp' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            )}>
                                {session.channel}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {session.external_user_id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {session.status === 'qualified' && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 py-1 font-black text-[10px] uppercase tracking-wider shadow-sm">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Potansiyel
                        </Badge>
                    )}
                </div>
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
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm sticky bottom-0">
                        <ConversationReply />
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="hidden xl:block w-80 border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar p-6 space-y-8 shadow-[inset_4px_0_12px_rgba(0,0,0,0.01)] border-t border-t-slate-50">
                    <section>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Müşteri Dosyası</h3>
                        {session.customers ? (
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:bg-slate-100/50">
                                <div className="font-black text-slate-900 text-base mb-1 tracking-tight">{session.customers.full_name}</div>
                                <div className="text-blue-600 font-bold text-xs mb-4">{session.customers.phone}</div>
                                <Link
                                    href={`/customers/${session.customer_id}`}
                                    className="w-full h-11 flex items-center justify-center rounded-xl bg-slate-900 text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
                                >
                                    DETAYLARI GÖR
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-slate-50/50 rounded-2xl p-8 border border-dashed border-slate-200 text-center">
                                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-[10px] font-black text-slate-400 leading-relaxed uppercase tracking-widest">
                                    Kimlik Doğrulanıyor...
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="bg-slate-50/30 rounded-2xl p-4 border border-slate-100/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">İstatistikler</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Durum</span>
                                <Badge className="bg-blue-50 text-blue-700 border-none font-black text-[10px] uppercase">{session.status}</Badge>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Mesajlar</span>
                                <span className="font-black text-slate-900 text-xs">{messages.length} ADET</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
