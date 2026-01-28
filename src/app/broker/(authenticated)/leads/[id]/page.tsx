import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Phone,
    Mail,
    FileText,
    History,
    MessageCircle,
    User,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react"
import { getWhatsAppLink } from '@/lib/whatsapp'
import { BackButton } from '@/components/back-button'
import Link from 'next/link'

export default async function BrokerLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch lead details with history and project info
    const { data: lead } = await supabase
        .from('broker_leads')
        .select(`
            *,
            projects(name),
            broker_lead_history(
                *,
                profiles:changed_by(full_name)
            )
        `)
        .eq('id', id)
        .eq('broker_id', user?.id) // Security check
        .single()

    if (!lead) {
        notFound()
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Contract Signed': return 'bg-green-100 text-green-700 border-green-200'
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200'
            case 'Offer Sent': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'Reserved': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'Visit Scheduled': return 'bg-orange-100 text-orange-700 border-orange-200'
            default: return 'bg-blue-50 text-blue-700 border-blue-100'
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'Submitted': 'Gönderildi',
            'Contacted': 'Ulaşıldı',
            'Qualified': 'Nitelikli',
            'Visit Scheduled': 'Randevu Alındı',
            'Visited': 'Ziyaret Edildi',
            'Reserved': 'Opsiyonlu',
            'Offer Sent': 'Teklif Verildi',
            'Contract Signed': 'Sözleşme İmzalandı',
            'Payment / Closing': 'Ödeme / Kapanış',
            'Rejected': 'Reddedildi'
        }
        return labels[status] || status
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" className="rounded-full" iconType="chevron" />
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{lead.full_name}</h1>
                    <p className="text-xs text-slate-500">Kayıt No: #{lead.id.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Status Card */}
            <div className={`p-4 rounded-2xl border ${getStatusStyle(lead.status)} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/50 rounded-xl">
                        {lead.status === 'Contract Signed' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Güncel Süreç</p>
                        <p className="text-sm font-bold">{getStatusLabel(lead.status)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Oluşturma</p>
                    <p className="text-sm font-bold" suppressHydrationWarning>{new Date(lead.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 p-5">
                            <CardTitle className="text-md flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                Müşteri Bilgileri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Telefon</p>
                                            <p className="text-sm font-medium">{lead.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">E-posta</p>
                                            <p className="text-sm font-medium">{lead.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Uyruk</p>
                                            <p className="text-sm font-medium">{lead.nationality || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">İlgilendiği Proje</p>
                                            <p className="text-sm font-medium">{lead.projects?.name || 'Genel'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Bütçe Aralığı</p>
                                            <p className="text-sm font-medium">
                                                {lead.budget_min ? `${lead.budget_min.toLocaleString('tr-TR')} ₺` : '0'} - {lead.budget_max ? `${lead.budget_max.toLocaleString('tr-TR')} ₺` : 'Belirsiz'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild className="w-full bg-green-600 hover:bg-green-700 gap-2 rounded-xl mt-2">
                                        <Link href={getWhatsAppLink(lead.phone, '')} target="_blank">
                                            <MessageCircle className="h-4 w-4" />
                                            WhatsApp'tan Yaz
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 p-5">
                            <CardTitle className="text-md flex items-center gap-2">
                                <History className="h-4 w-4 text-blue-600" />
                                Süreç Geçmişi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-6">
                                {lead.broker_lead_history && lead.broker_lead_history.length > 0 ? (
                                    lead.broker_lead_history.map((item: any, idx: number) => (
                                        <div key={item.id} className="relative flex gap-4">
                                            {/* Timeline Line */}
                                            {idx !== lead.broker_lead_history.length - 1 && (
                                                <div className="absolute left-2.5 top-6 bottom-0 w-px bg-slate-100" />
                                            )}
                                            <div className={`mt-1 h-5 w-5 rounded-full border-4 border-white shadow-sm flex-shrink-0 z-10 ${idx === 0 ? 'bg-blue-600 pulse' : 'bg-slate-200'}`} />
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-slate-900">{getStatusLabel(item.new_status)}</p>
                                                    <p className="text-[10px] text-slate-400" suppressHydrationWarning>{new Date(item.created_at).toLocaleString('tr-TR')}</p>
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-slate-500 mt-1 italic">{item.notes}</p>
                                                )}
                                                {item.profiles?.full_name && (
                                                    <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase">İşlem Yapan: {item.profiles.full_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 text-center py-4">Süreç geçmişi bulunamadı.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions / Protection Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-blue-600 text-white rounded-2xl overflow-hidden">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Mülkiyet Koruması
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <p className="text-xs text-blue-100 mb-4 leading-relaxed">
                                Bu müşteri 60 gün boyunca sizin adınıza rezerve edilmiştir. Başka bir broker tarafından sisteme kaydedilemez.
                            </p>
                            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                                <p className="text-[10px] uppercase font-bold text-blue-200 mb-1">Kalan Koruma Süresi</p>
                                <p className="text-xl font-bold">59 Gün</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="p-5">
                            <CardTitle className="text-sm font-bold">Müşteri Notları</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 leading-relaxed italic">
                                "{lead.notes || 'Herhangi bir özel not belirtilmedi.'}"
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
