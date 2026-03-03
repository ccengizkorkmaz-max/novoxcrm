import { getSessionMessages, getMessagingSessions } from '../actions'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Clock, ChevronLeft, Bot, Sparkles, CheckCircle2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function ConversationDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const messages = await getSessionMessages(id)

    // Find sessions to get status (we can optimize this by adding a getSessionById later)
    const allSessions = await getMessagingSessions()
    const session = allSessions.find(s => s.id === id)

    if (!session) {
        return <div className="p-8 text-white">Görüşme bulunamadı.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/conversations"
                        className="h-10 w-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {session.customers?.full_name || `Görüşme #${id.slice(0, 8)}`}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {session.channel} kanalı üzerinden AI asistanı ile konuşuyor.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {session.status === 'qualified' && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 py-1.5 px-4 font-medium">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Lider Onaylandı
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-slate-400 border-slate-800 py-1.5 px-4">
                        PSID: {session.external_user_id}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat History */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-[#111114] border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
                        <CardHeader className="border-b border-slate-800 py-4 px-6 bg-slate-900/30">
                            <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Görüşme Geçmişi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[700px]">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-4",
                                        msg.role === 'assistant' ? "flex-row" : "flex-row-reverse"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border",
                                        msg.role === 'assistant' ? "bg-blue-600/10 border-blue-600/20 text-blue-500" : "bg-slate-800 border-slate-700 text-slate-300"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                    </div>
                                    <div className={cn(
                                        "flex flex-col gap-1 max-w-[80%]",
                                        msg.role === 'assistant' ? "items-start" : "items-end"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl p-4 text-sm leading-relaxed",
                                            msg.role === 'assistant'
                                                ? "bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none"
                                                : "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20"
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className="text-[10px] text-slate-600 px-2 uppercase font-medium">
                                            {format(new Date(msg.created_at), 'HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-[#111114] border-slate-800">
                        <CardHeader className="py-4 border-b border-slate-800">
                            <CardTitle className="text-sm">Müşteri Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {session.customers ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white leading-tight">{session.customers.full_name}</div>
                                            <div className="text-slate-500 text-sm">{session.customers.phone}</div>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/customers/${session.customer_id}`}
                                        className="w-full inline-flex h-9 items-center justify-center rounded-md bg-slate-800 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                                    >
                                        Profilini Görüntüle
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-700">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        AI henüz müşteri bilgilerini doğrulamadı.
                                        Görüşme devam ederken bilgiler otomatik olarak buraya eklenecektir.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111114] border-slate-800">
                        <CardHeader className="py-4 border-b border-slate-800">
                            <CardTitle className="text-sm">Görüşme Özeti</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4 text-sm text-slate-400">
                            <div className="flex justify-between">
                                <span>Kanal</span>
                                <span className="text-white font-medium uppercase">{session.channel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Durum</span>
                                <span className={cn(
                                    "font-medium",
                                    session.status === 'qualified' ? "text-green-400" : "text-blue-400"
                                )}>
                                    {session.status === 'active' ? 'Aktif' :
                                        session.status === 'qualified' ? 'Potansiyel Müşteri' :
                                            session.status === 'human_required' ? 'Müdahale Bekliyor' : session.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Toplam Mesaj</span>
                                <span className="text-white font-medium">{messages.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Başlangıç</span>
                                <span className="text-white font-medium">
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
