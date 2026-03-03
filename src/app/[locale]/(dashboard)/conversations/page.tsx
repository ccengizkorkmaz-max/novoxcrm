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
        <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        Sanal Asistan Görüşmeleri
                    </h1>
                    <p className="text-slate-500 font-medium">
                        AI asistanınızın Facebook Messenger üzerinden yürüttüğü canlı görüşmeleri izleyin.
                    </p>
                </div>
            </div>

            {sessions.length === 0 ? (
                <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                            <MessageSquare className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-xl">Henüz görüşme yok</h3>
                        <p className="text-slate-500 mt-2 max-w-sm text-center leading-relaxed">
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
                            <Card className="bg-white border-slate-200 hover:border-blue-400 transition-all hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden relative rounded-2xl">
                                {session.status === 'qualified' && (
                                    <div className="absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
                                )}

                                <CardContent className="p-0">
                                    <div className="flex items-center justify-between gap-4 p-6">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110",
                                                session.status === 'qualified' ? "bg-green-50 border-green-100 text-green-600" :
                                                    session.status === 'human_required' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                        "bg-blue-50 border-blue-100 text-blue-600"
                                            )}>
                                                {session.status === 'qualified' ? <CheckCircle2 className="h-7 w-7" /> :
                                                    session.status === 'human_required' ? <AlertCircle className="h-7 w-7" /> :
                                                        <User className="h-7 w-7" />}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                                        {session.customers?.full_name || `Kullanıcı #${session.external_user_id.slice(-4)}`}
                                                    </span>
                                                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100 text-[10px] uppercase font-bold px-2 py-0">
                                                        {session.channel === 'facebook_messenger' ? 'Messenger' : session.channel}
                                                    </Badge>
                                                    {session.status === 'qualified' && (
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1 font-bold text-[10px] uppercase">
                                                            <Sparkles className="h-3 w-3" />
                                                            Onaylandı
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true, locale: tr })}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="tracking-tight">PSID: {session.external_user_id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 pr-2">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mevcut Durum</div>
                                                <div className={cn(
                                                    "text-sm font-bold",
                                                    session.status === 'qualified' ? "text-green-600" :
                                                        session.status === 'human_required' ? "text-amber-600" :
                                                            "text-blue-600"
                                                )}>
                                                    {session.status === 'active' ? 'Devam Ediyor' :
                                                        session.status === 'qualified' ? 'Lider Kaydedildi' :
                                                            session.status === 'human_required' ? 'Müdahale Gerekli' : session.status}
                                                </div>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border border-slate-100">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar for Qualification */}
                                    <div className="h-1 w-full bg-slate-50">
                                        <div className={cn(
                                            "h-full transition-all duration-1000",
                                            session.status === 'qualified' ? "w-full bg-green-500" :
                                                session.status === 'human_required' ? "w-3/4 bg-amber-500" :
                                                    "w-1/3 bg-blue-500"
                                        )} />
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
