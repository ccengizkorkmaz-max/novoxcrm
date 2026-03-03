import { getMessagingSessions } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function ConversationsPage() {
    const sessions = await getMessagingSessions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-blue-500" />
                        Sanal Asistan Görüşmeleri
                    </h1>
                    <p className="text-slate-400">
                        AI asistanınızın Facebook Messenger üzerinden yürüttüğü canlı görüşmeleri izleyin.
                    </p>
                </div>
            </div>

            {sessions.length === 0 ? (
                <Card className="bg-[#111114] border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                            <MessageSquare className="h-8 w-8 text-slate-700" />
                        </div>
                        <h3 className="text-slate-300 font-medium text-lg">Henüz görüşme yok</h3>
                        <p className="text-slate-500 mt-1 max-w-sm text-center">
                            Messenger üzerinden bir mesaj geldiğinde burada canlı olarak belirecektir.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <Link
                            key={session.id}
                            href={`/conversations/${session.id}`}
                            className="block group"
                        >
                            <Card className="bg-[#111114] border-slate-800 hover:border-blue-500/50 transition-all hover:bg-slate-900/50 overflow-hidden relative">
                                {session.status === 'qualified' && (
                                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all" />
                                )}

                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center border",
                                                session.status === 'qualified' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                                    session.status === 'human_required' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                                        "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                            )}>
                                                {session.status === 'qualified' ? <CheckCircle2 className="h-6 w-6" /> :
                                                    session.status === 'human_required' ? <AlertCircle className="h-6 w-6" /> :
                                                        <User className="h-6 w-6" />}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                                        {session.customers?.full_name || `Kullanıcı #${session.external_user_id.slice(-4)}`}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-slate-900">
                                                        {session.channel}
                                                    </Badge>
                                                    {session.status === 'qualified' && (
                                                        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20 border-green-500/30 gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            Onaylandı
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true, locale: tr })}
                                                    </span>
                                                    <span className="text-slate-700">•</span>
                                                    <span>PSID: {session.external_user_id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Durum</div>
                                                <div className={cn(
                                                    "text-sm font-medium",
                                                    session.status === 'qualified' ? "text-green-400" :
                                                        session.status === 'human_required' ? "text-amber-400" :
                                                            "text-blue-400"
                                                )}>
                                                    {session.status === 'active' ? 'Devam Ediyor' :
                                                        session.status === 'qualified' ? 'Lider Kaydedildi' :
                                                            session.status === 'human_required' ? 'Müdahale Gerekli' : session.status}
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <MessageSquare className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
