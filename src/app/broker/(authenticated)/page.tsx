import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    TrendingUp,
    Clock,
    CheckCircle2,
    PlusCircle,
    Building2,
    ChevronRight,
    ArrowUpRight,
    FileText,
    Link as LinkIcon,
    Copy,
    ExternalLink,
    Medal,
    Award,
    Zap,
    Crown
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import BrokerSlugManager from '../components/BrokerSlugManager'

export default async function BrokerDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Mock data for UI development if tables are empty
    const { data: leads } = await supabase
        .from('broker_leads')
        .select('*')
        .eq('broker_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: profile } = await supabase
        .from('profiles')
        .select('broker_slug, full_name')
        .eq('id', user?.id)
        .single()

    const { data: stats } = await supabase
        .from('broker_leads')
        .select('status')
        .eq('broker_id', user?.id)

    const totalLeads = stats?.length || 0
    const activeLeads = stats?.filter(s => !['Contract Signed', 'Rejected', 'Payment / Closing'].includes(s.status)).length || 0
    const wonLeads = stats?.filter(s => s.status === 'Contract Signed').length || 0

    // --- Broker Level Logic ---
    const levels = [
        { name: 'Bronz', min: 0, next: 1, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
        { name: 'Gümüş', min: 1, next: 6, icon: Medal, color: 'text-slate-500', bg: 'bg-slate-50' },
        { name: 'Altın', min: 6, next: 16, icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { name: 'Platin', min: 16, next: Infinity, icon: Crown, color: 'text-indigo-600', bg: 'bg-indigo-50' }
    ]

    const currentLevel = [...levels].reverse().find(l => wonLeads >= l.min) || levels[0]
    const nextLevel = levels[levels.indexOf(currentLevel) + 1]
    const progressToNext = nextLevel ? Math.min(100, (wonLeads / nextLevel.min) * 100) : 100

    const { data: activeCampaigns } = await supabase
        .from('incentive_campaigns')
        .select('*, projects(name)')
        .eq('is_active', true)
        .limit(2)

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Primary CTA */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-2xl ${currentLevel.bg} flex items-center justify-center ${currentLevel.color} shadow-sm border border-white/50`}>
                        <currentLevel.icon className="h-10 w-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">Broker Portalı</h1>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentLevel.bg} ${currentLevel.color} border border-current/10`}>
                                {currentLevel.name} Partner
                            </span>
                        </div>
                        <p className="text-slate-500">Müşteri yönlendirmelerinizi ve komisyonlarınızı takip edin.</p>
                    </div>
                </div>
                <Link href="/broker/leads/new">
                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 gap-2 h-11 px-6 rounded-xl">
                        <PlusCircle className="h-5 w-5" />
                        Yeni Müşteri Kaydı
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-500">Toplam Lead</p>
                                <p className="text-2xl font-bold text-slate-900">{totalLeads}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-500">Aktif Süreç</p>
                                <p className="text-2xl font-bold text-slate-900">{activeLeads}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-500">Kazanılan (Won)</p>
                                <p className="text-2xl font-bold text-slate-900">{wonLeads}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Recent Leads */}
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-slate-50">
                        <CardTitle className="text-lg font-bold">Son Başvurular</CardTitle>
                        <Link href="/broker/leads" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                            Tümünü Gör <ChevronRight className="h-4 w-4" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {leads && leads.length > 0 ? (
                                leads.map((lead) => (
                                    <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                {lead.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 leading-tight">{lead.full_name}</p>
                                                <p className="text-xs text-slate-500">{lead.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${lead.status === 'Contract Signed' ? 'bg-green-100 text-green-700' :
                                                lead.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    lead.status === 'Reserved' ? 'bg-amber-100 text-amber-700' :
                                                        lead.status === 'Visited' ? 'bg-cyan-100 text-cyan-700' :
                                                            lead.status === 'Visit Scheduled' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-blue-100 text-blue-700'
                                                }`}>
                                                {lead.status === 'Submitted' ? 'Gönderildi' :
                                                    lead.status === 'Contacted' ? 'Ulaşıldı' :
                                                        lead.status === 'Qualified' ? 'Nitelikli' :
                                                            lead.status === 'Visit Scheduled' ? 'Randevu Alındı' :
                                                                lead.status === 'Visited' ? 'Ziyaret Edildi' :
                                                                    lead.status === 'Reserved' ? 'Opsiyonlu' :
                                                                        lead.status === 'Offer Sent' ? 'Teklif Verildi' :
                                                                            lead.status === 'Contract Signed' ? 'Sözleşme İmzalandı' :
                                                                                lead.status === 'Payment / Closing' ? 'Ödeme / Kapanış' :
                                                                                    lead.status === 'Rejected' ? 'Reddedildi' : lead.status}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    Henüz lead kaydınız bulunmamaktadır.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Campaigns & Materials */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl overflow-hidden">
                        <CardHeader className="px-6 py-5 pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Aktif Kampanyalar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-2">
                            {activeCampaigns && activeCampaigns.length > 0 ? (
                                activeCampaigns.map((camp) => (
                                    <div key={camp.id} className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 mb-4 last:mb-0">
                                        <p className="font-bold text-sm">{camp.name}</p>
                                        <p className="text-xs text-blue-100 mt-1">{camp.description}</p>
                                        {camp.target_count && (
                                            <>
                                                <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
                                                    <div className="bg-white h-full w-[0%]"></div>
                                                </div>
                                                <p className="text-[10px] mt-1 text-right text-blue-100">0 / {camp.target_count} Satış</p>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-blue-100 italic py-4">Şu an aktif bir kampanya bulunmamaktadır.</p>
                            )}
                            <Button variant="ghost" className="w-full text-white hover:bg-white/10 border border-white/20 rounded-xl h-10 group mt-4">
                                Tüm Kampanyaları Gör <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="px-6 py-4 border-b border-slate-50">
                            <CardTitle className="text-md font-bold">Hızlı Erişim</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-3">
                            <Link href="/broker/documents" className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center group">
                                <div className="h-10 w-10 mx-auto bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Fiyat Listeleri</span>
                            </Link>
                            <Link href="/broker/documents" className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-center group">
                                <div className="h-10 w-10 mx-auto bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700">Broşürler</span>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Form Link Manager */}
                    <BrokerSlugManager initialSlug={profile?.broker_slug || ''} />

                    {/* Level Progress */}
                    {nextLevel && (
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="px-6 py-4 border-b border-slate-50">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    {nextLevel.name} Seviyesine İlerleme
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                    <span>{wonLeads} Satış</span>
                                    <span>{nextLevel.min} Satış Hedefi</span>
                                </div>
                                <Progress value={progressToNext} className="h-2 bg-slate-100" />
                                <p className="text-[11px] text-slate-400 mt-3 italic">
                                    {nextLevel.min - wonLeads} satış daha yaparak <strong>{nextLevel.name}</strong> seviyesine yükselebilir ve özel avantajlardan yararlanabilirsiniz.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
