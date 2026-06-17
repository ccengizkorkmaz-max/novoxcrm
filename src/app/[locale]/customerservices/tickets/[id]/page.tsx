import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, ArrowLeft, CheckCircle2, Star } from "lucide-react"
import Link from 'next/link'
import { MessageForm } from '../components/MessageForm'
import { updateServiceRequestStatus } from '../actions'
import { redirect } from 'next/navigation'
import { CloseRequestButton } from '../components/CloseRequestButton'
import { BackButton } from '@/components/back-button'
import { RequestFeedbackForm } from '../components/RequestFeedbackForm'

export default async function ServiceRequestDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get the request
    const { data: request } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .single()

    if (!request) notFound()

    // Get messages
    const { data: messages } = await supabase
        .from('service_request_messages')
        .select('*, profiles(full_name)')
        .eq('service_request_id', id)
        .order('created_at', { ascending: true })

    // Get feedback/CSAT rating
    const { data: feedback } = await supabase
        .from('service_request_feedback')
        .select('*')
        .eq('service_request_id', id)
        .maybeSingle()

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <BackButton variant="ghost" className="gap-2" />

                {request.status !== 'Resolved' && (
                    <CloseRequestButton requestId={id} />
                )}
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant={request.status === 'Resolved' ? 'default' : 'outline'} className={request.status === 'Resolved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-blue-600 border-blue-100 bg-blue-50'}>
                            {request.status === 'Open' ? 'Açık' : request.status === 'In Progress' ? 'İşlemde' : 'Çözüldü'}
                        </Badge>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.created_at).toLocaleString('tr-TR')}
                        </div>
                    </div>
                    <CardTitle className="text-2xl">{request.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-base mt-2">
                        {request.description}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 px-1">
                    <MessageSquare className="h-5 w-5" />
                    Mesajlar
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                    {messages?.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender_id === user?.id
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-900 rounded-tl-none'
                                }`}>
                                <p className="text-sm">{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {msg.profiles?.full_name} • {new Date(msg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {(!messages || messages.length === 0) && (
                        <div className="text-center py-8 text-slate-400 italic text-sm">
                            Henüz mesaj bulunmuyor.
                        </div>
                    )}
                </div>

                {request.status !== 'Resolved' && request.status !== 'Closed' && (
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden mt-6">
                        <CardContent className="p-4">
                            <MessageForm requestId={id} />
                        </CardContent>
                    </Card>
                )}

                {(request.status === 'Resolved' || request.status === 'Closed') && (
                    <div className="mt-8">
                        {feedback ? (
                            <Card className="border-none shadow-sm bg-emerald-50/20 border border-emerald-100/30 p-6 rounded-2xl">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        Geri Bildiriminiz Alınmıştır
                                    </h4>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                    {feedback.comment && (
                                        <p className="text-slate-600 italic bg-white p-3 rounded-xl border border-emerald-50 text-xs">
                                            &ldquo;{feedback.comment}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <RequestFeedbackForm requestId={id} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
