import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, ArrowLeft, User, Phone, Mail } from "lucide-react"
import Link from 'next/link'
import { MessageForm } from '@/app/customerservices/service-requests/components/MessageForm'
import { StatusManager } from '../components/StatusManager'
import { BackButton } from '@/components/back-button'

export default async function TenantSupportDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get the request with customer info
    const { data: request } = await supabase
        .from('service_requests')
        .select('*, customers(*)')
        .eq('id', id)
        .single()

    if (!request) notFound()

    // Get messages
    const { data: messages } = await supabase
        .from('service_request_messages')
        .select('*, profiles(full_name)')
        .eq('service_request_id', id)
        .order('created_at', { ascending: true })

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <BackButton variant="ghost" className="gap-2" label="Taleplere Dön" />
                <StatusManager requestId={id} currentStatus={request.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
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
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            İletişim Geçmişi
                        </h3>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 bg-white rounded-2xl shadow-sm border border-slate-50 p-4">
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
                                    Müşteri ile henüz bir yazışma bulunmuyor.
                                </div>
                            )}
                        </div>

                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardContent className="p-4">
                                <MessageForm requestId={id} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-full">
                                    <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{request.customers?.full_name}</p>
                                    <p className="text-xs text-slate-500">Müşteri</p>
                                </div>
                            </div>

                            {request.customers?.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-full">
                                        <Phone className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <p className="text-sm">{request.customers?.phone}</p>
                                </div>
                            )}

                            {request.customers?.email && (
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-full">
                                        <Mail className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <p className="text-sm truncate">{request.customers?.email}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-blue-900">Talep Bilgisi</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-blue-800">
                            <div className="flex justify-between">
                                <span>Talep No:</span>
                                <span className="font-mono">{id.split('-')[0].toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Oluşturulma:</span>
                                <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Öncelik:</span>
                                <span>{request.priority || 'Normal'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
