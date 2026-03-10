import { getSessionMessages, getMessagingSession } from '../actions'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Clock, ChevronLeft, Bot, Sparkles, CheckCircle2, Search } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import ConversationReply from './ConversationReply'

export const dynamic = 'force-dynamic'

export default async function ConversationDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const [messages, session] = await Promise.all([
        getSessionMessages(id),
        getMessagingSession(id)
    ])

    if (!session) {
        return <div className="p-8">Görüşme bulunamadı.</div>
    }

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href="/conversations"
                        className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {session.customers?.full_name || `Görüşme #${id.slice(0, 8)}`}
                        </h1>
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            {session.channel} üzerinden canlı görüşme
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {session.status === 'qualified' && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 py-1.5 px-4 font-bold text-xs uppercase tracking-tight">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Potansiyel Müşteri
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50 py-1.5 px-4">
                        PSID: {session.external_user_id}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat History */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-white border-slate-200 overflow-hidden flex flex-col min-h-[700px] shadow-sm rounded-2xl">
                        <CardHeader className="border-b border-slate-100 py-4 px-6 bg-slate-50/30">
                            <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                Görüşme Akışı
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[700px] bg-[#f0f2f5]/30">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3",
                                        msg.role === 'assistant' ? "flex-row" : "flex-row-reverse"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border mt-1 shadow-sm",
                                        msg.role === 'assistant' ? "bg-white border-slate-200 text-blue-600" : "bg-blue-600 border-blue-500 text-white"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-1 max-w-[75%]",
                                        msg.role === 'assistant' ? "items-start" : "items-end"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm",
                                            msg.role === 'assistant'
                                                ? "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                                : "bg-[#0084ff] text-white rounded-tr-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className="text-[10px] text-slate-400 px-1 font-medium">
                                            {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <ConversationReply />
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                        <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase">Müşteri Kartı</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {session.customers ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                            <User className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-lg leading-tight">{session.customers.full_name}</div>
                                            <div className="text-blue-600 font-medium text-sm mt-0.5">{session.customers.phone}</div>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/customers/${session.customer_id}`}
                                        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95"
                                    >
                                        Profilini Görüntüle
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <div className="text-[13px] text-slate-500 px-4 leading-relaxed">
                                        AI henüz müşteri kimliğini doğrulamadı.
                                        İsim ve telefon onaylandığında burası otomatik güncellenir.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                        <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs font-bold text-slate-500 uppercase">Görüşme Bilgisi</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-[13px]">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-slate-500">İletişim Kanalı</span>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 font-bold px-3">
                                    {session.channel === 'facebook_messenger' ? 'Messenger' : session.channel}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-slate-500">Mevcut Durum</span>
                                <span className={cn(
                                    "font-bold",
                                    session.status === 'qualified' ? "text-green-600" : "text-blue-600"
                                )}>
                                    {session.status === 'active' ? 'Aktif Görüşme' :
                                        session.status === 'qualified' ? 'Müşteri Kaydedildi' :
                                            session.status === 'human_required' ? 'Müdahale Bekliyor' : session.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <span className="text-slate-500">Mesaj Sayısı</span>
                                <span className="text-slate-900 font-bold">{messages.length} Adet</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">İlk Temas</span>
                                <span className="text-slate-900 font-bold">
                                    {format(new Date(session.created_at), 'dd MMM yyyy', { locale: tr })}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
