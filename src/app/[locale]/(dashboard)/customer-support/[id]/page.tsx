import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, ArrowLeft, User, Phone, Mail, Star, ShieldAlert, Home } from "lucide-react"
import Link from 'next/link'
import { MessageForm } from '@/app/[locale]/customerservices/tickets/components/MessageForm'
import { StatusManager } from '../components/StatusManager'
import { BackButton } from '@/components/back-button'
import { getTranslations } from 'next-intl/server'
import { SnagListDialog } from '../components/SnagListDialog'

export default async function TenantSupportDetail(props: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('ServiceRequests')
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

    // Resolve associated Unit
    let associatedUnit: any = null
    if (request.contract_id) {
        const { data: contract } = await supabase
            .from('contracts')
            .select(`
                id,
                sales(
                    unit_id,
                    units(
                        id,
                        unit_number,
                        projects(name)
                    )
                )
            `)
            .eq('id', request.contract_id)
            .maybeSingle()

        if (contract?.sales) {
            associatedUnit = (contract.sales as any).units
        }
    }

    if (!associatedUnit && request.customer_id) {
        const { data: sale } = await supabase
            .from('sales')
            .select(`
                unit_id,
                units(
                    id,
                    unit_number,
                    projects(name)
                )
            `)
            .eq('customer_id', request.customer_id)
            .in('status', ['Sold', 'ContractSigned', 'Reservation'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (sale?.units) {
            associatedUnit = sale.units
        }
    }

    // Get snag items linked to this ticket
    const { data: snagItems } = await supabase
        .from('snag_items')
        .select(`
            id,
            title,
            status,
            subcontractors(name)
        `)
        .eq('service_request_id', id)

    // Get feedback/CSAT rating
    const { data: feedback } = await supabase
        .from('service_request_feedback')
        .select('*')
        .eq('service_request_id', id)
        .maybeSingle()

    // Get subcontractors for dialog
    const { data: subcontractors } = await supabase
        .from('subcontractors')
        .select('id, name')
        .eq('tenant_id', request.tenant_id)
        .order('name', { ascending: true })

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Open': return t('status.open')
            case 'In Progress': return t('status.inProgress')
            case 'Resolved': return t('status.resolved')
            case 'Closed': return t('status.closed')
            default: return status
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <BackButton variant="ghost" className="gap-2" label={t('detail.back')} />
                <StatusManager requestId={id} currentStatus={request.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant={request.status === 'Resolved' ? 'default' : 'outline'} className={request.status === 'Resolved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-blue-600 border-blue-100 bg-blue-50'}>
                                    {getStatusLabel(request.status)}
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
                            {t('detail.history')}
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
                                    {t('empty.messages')}
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
                            <CardTitle className="text-lg">{t('detail.customerInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 p-2 rounded-full">
                                    <User className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{request.customers?.full_name}</p>
                                    <p className="text-xs text-slate-500">{t('detail.customer')}</p>
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
                            <CardTitle className="text-sm font-semibold text-blue-900">{t('detail.requestInfo')}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 text-blue-800">
                            <div className="flex justify-between">
                                <span>{t('detail.requestNo')}:</span>
                                <span className="font-mono">{id.split('-')[0].toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('detail.created')}:</span>
                                <span>{new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('detail.priority')}:</span>
                                <span>{request.priority || 'Normal'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associated Unit & Defect Tracking Card */}
                    {associatedUnit && (
                        <Card className="border-none shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-semibold text-slate-800">
                                    İlişkili Daire
                                </CardTitle>
                                <SnagListDialog
                                    units={[]}
                                    subcontractors={subcontractors || []}
                                    defaultUnitId={associatedUnit.id}
                                    defaultServiceRequestId={id}
                                />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border">
                                    <Home className="h-4 w-4 text-blue-500" />
                                    <span>{associatedUnit.projects?.name} - Daire {associatedUnit.unit_number}</span>
                                </div>

                                {snagItems && snagItems.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Bildirilen Kusurlar</p>
                                        <div className="space-y-1">
                                            {snagItems.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-1.5 bg-slate-50/50 rounded border text-xs">
                                                    <span className="font-medium text-slate-800 truncate max-w-[130px]">{item.title}</span>
                                                    <Badge className={
                                                        item.status === 'Verified' ? 'bg-emerald-500 hover:bg-emerald-600 text-[9px] h-4 py-0' :
                                                        item.status === 'Repaired' ? 'bg-amber-500 hover:bg-amber-600 text-[9px] h-4 py-0' :
                                                        'bg-blue-500 text-[9px] h-4 py-0'
                                                    }>
                                                        {item.status === 'Verified' ? 'Onaylandı' :
                                                         item.status === 'Repaired' ? 'Onarıldı' :
                                                         item.status === 'In Progress' ? 'İşlemde' : 'Beklemede'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* CSAT Customer Feedback Card */}
                    {feedback && (
                        <Card className="border-none shadow-sm bg-emerald-50/30 border-emerald-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                                    Müşteri Geri Bildirimi (CSAT)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                        />
                                    ))}
                                </div>
                                {feedback.comment && (
                                    <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-emerald-100">
                                        &ldquo;{feedback.comment}&rdquo;
                                    </p>
                                )}
                                <p className="text-[10px] text-slate-400 text-right">
                                    {new Date(feedback.created_at).toLocaleDateString('tr-TR')}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
