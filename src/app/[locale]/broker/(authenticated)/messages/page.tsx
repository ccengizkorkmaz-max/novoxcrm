import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Mail, Phone, User, Clock, CheckCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MarkReadButton } from './MarkReadButton'

export default async function BrokerMessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/broker/login')

    const { data: messages } = await supabase
        .from('broker_contact_messages')
        .select('*')
        .eq('broker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    const unreadCount = messages?.filter(m => !m.is_read).length || 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mesajlarım</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Profil sayfanızdan gelen iletişim talepleri
                    {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            {unreadCount} okunmamış
                        </span>
                    )}
                </p>
            </div>

            {!messages || messages.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Henüz Mesaj Yok</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Profil sayfanızı paylaştığınızda, müşterilerden gelen iletişim talepleri burada görünecek.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`bg-white rounded-2xl border p-5 transition-all ${
                                msg.is_read ? 'border-slate-100' : 'border-blue-200 bg-blue-50/30 shadow-sm'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {!msg.is_read && <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />}
                                        <span className="font-bold text-slate-900">{msg.sender_name}</span>
                                        {msg.subject && (
                                            <span className="text-xs text-slate-400">— {msg.subject}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{msg.message}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                        {msg.sender_email && (
                                            <a href={`mailto:${msg.sender_email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                                <Mail className="h-3 w-3" /> {msg.sender_email}
                                            </a>
                                        )}
                                        {msg.sender_phone && (
                                            <a href={`tel:${msg.sender_phone}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                                <Phone className="h-3 w-3" /> {msg.sender_phone}
                                            </a>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(msg.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                        </span>
                                    </div>
                                </div>
                                {!msg.is_read && (
                                    <MarkReadButton messageId={msg.id} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
