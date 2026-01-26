import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    Search,
    Filter,
    ChevronRight,
    MapPin,
    Calendar,
    BadgeTurkishLira,
    PlusCircle
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"

export default async function BrokerLeadsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: leads } = await supabase
        .from('broker_leads')
        .select('*, projects(name)')
        .eq('broker_id', user?.id)
        .order('created_at', { ascending: false })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Contract Signed': return 'bg-green-100 text-green-700 border-green-200'
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200'
            case 'Offer Sent': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'Visit Scheduled': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'Reserved': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'Visited': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
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
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Müşterilerim</h1>
                    <p className="text-slate-500 text-sm">Tüm başvurularınızın güncel durumunu buradan takip edebilirsiniz.</p>
                </div>
                <Link href="/broker/leads/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 rounded-xl gap-2">
                        <PlusCircle className="h-5 w-5" />
                        Yeni Müşteri
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="İsim veya telefon ile ara..." className="pl-9 rounded-xl border-slate-200 focus:ring-blue-500" />
                </div>
                <Button variant="outline" className="rounded-xl border-slate-200 gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrele
                </Button>
            </div>

            {/* Leads List */}
            <div className="grid gap-4">
                {leads && leads.length > 0 ? (
                    leads.map((lead) => (
                        <Card key={lead.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                            <CardContent className="p-0">
                                <Link href={`/broker/leads/${lead.id}`} className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            {lead.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-tight">{lead.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                {lead.projects?.name && (
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {lead.projects.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Durum</p>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(lead.status)}`}>
                                                {getStatusLabel(lead.status)}
                                            </span>
                                        </div>

                                        {(lead.budget_min || lead.budget_max) && (
                                            <div className="text-right hidden sm:block min-w-[100px]">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Bütçe</p>
                                                <p className="text-sm font-bold text-slate-700 flex items-center justify-end gap-1">
                                                    {lead.budget_max ? `${lead.budget_max.toLocaleString('tr-TR')} ₺` : 'Belirsiz'}
                                                </p>
                                            </div>
                                        )}

                                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="border-dashed border-2 border-slate-200 bg-transparent rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-900">Henüz müşteri kaydınız yok</h3>
                            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Yeni bir müşteri kaydı oluşturarak süreci başlatabilirsiniz.</p>
                            <Link href="/broker/leads/new" className="inline-block mt-6">
                                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                                    İlk Müşterini Kaydet
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
