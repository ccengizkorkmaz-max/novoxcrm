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
import CommissionModelsList from '../components/CommissionModelsList'
import IncentiveCampaignsList from '../components/IncentiveCampaignsList'

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
        .select(`
            broker_slug, 
            full_name,
            tenant_id,
            broker_levels (
                id,
                name,
                color,
                icon
            )
        `)
        .eq('id', user?.id)
        .single()

    const { data: stats } = await supabase
        .from('broker_leads')
        .select('status')
        .eq('broker_id', user?.id)

    const totalLeads = stats?.length || 0
    const activeLeads = stats?.filter(s => !['Contract Signed', 'Rejected', 'Payment / Closing'].includes(s.status)).length || 0
    const wonLeads = stats?.filter(s => s.status === 'Contract Signed').length || 0

    // NEW: Calculate Total Sales Volume (for OR logic)
    const { data: wonLeadsData } = await supabase
        .from('broker_leads')
        .select('customer_id')
        .eq('broker_id', user?.id)
        .in('status', ['Won', 'Contract Signed'])
        .not('customer_id', 'is', null)

    let totalVolume = 0
    if (wonLeadsData && wonLeadsData.length > 0) {
        const customerIds = wonLeadsData.map(l => l.customer_id)
        if (customerIds.length > 0) {
            const { data: volumeData } = await supabase
                .from('sales')
                .select('final_price')
                .in('customer_id', customerIds)
                .eq('status', 'Completed')

            if (volumeData) {
                totalVolume = volumeData.reduce((sum, sale) => sum + (Number(sale.final_price) || 0), 0)
            }
        }
    }

    // --- Broker Level Logic - Real Data ---
    const { data: levels } = await supabase
        .from('broker_levels')
        .select('*')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('min_sales_count', { ascending: true })

    const activeLevel = Array.isArray(profile?.broker_levels) ? profile.broker_levels[0] : profile?.broker_levels
    const currentLevel = levels?.find(l => l.name === activeLevel?.name) || levels?.[0]

    // Find next level
    let nextLevel = null
    let progressToNext = 100

    if (levels && currentLevel) {
        const currentIndex = levels.findIndex(l => l.id === currentLevel.id)
        if (currentIndex !== -1 && currentIndex < levels.length - 1) {
            nextLevel = levels[currentIndex + 1]
            // Calculate progress based on sales count OR volume (whichever is higher/closer)
            const targetCount = nextLevel.min_sales_count || 1;
            const targetVolume = nextLevel.min_sales_volume || 1;

            const progressCount = Math.min(100, (wonLeads / targetCount) * 100);
            const progressVolume = Math.min(100, (totalVolume / targetVolume) * 100);

            progressToNext = Math.max(progressCount, progressVolume);
        }
    }

    const { data: activeCampaigns } = await supabase
        .from('incentive_campaigns')
        .select('*, projects(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3)

    const { data: commissionModels } = await supabase
        .from('commission_models')
        .select('*, projects(name)')
        .eq('tenant_id', profile?.tenant_id || '')
        .order('created_at', { ascending: false })
        .limit(3)

    return (
        <div className="max-w-5xl mx-auto space-y-4 pb-8">
            {/* Header: Compact & Elegant */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center shadow-inner border border-white/50"
                        style={currentLevel ? { backgroundColor: currentLevel.color + '20', color: currentLevel.color } : {}}
                    >
                        <Crown className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-900 leading-none">Broker Paneli</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-300">|</span>
                                {currentLevel && (
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-current/10 shadow-sm"
                                        style={{ backgroundColor: currentLevel.color + '20', color: currentLevel.color }}
                                    >
                                        {currentLevel.name} PARTNER
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Hoş geldiniz, {profile?.full_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/broker/leads/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold">
                            <PlusCircle className="h-3.5 w-3.5" />
                            Yeni Müşteri
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats: Compact Row */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Toplam', value: totalLeads, icon: Users, color: 'blue' },
                    { label: 'Aktif', value: activeLeads, icon: Clock, color: 'orange' },
                    { label: 'Başarı', value: wonLeads, icon: TrendingUp, color: 'green' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stat.label}</p>
                                <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content: 2-Column Responsive */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Son Başvurular: Takes 2 columns on large screens */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <CardTitle className="text-sm font-bold text-slate-800">Son Başvurular</CardTitle>
                        </div>
                        <Link href="/broker/leads" className="text-[11px] text-blue-600 font-bold hover:text-blue-700 flex items-center gap-0.5">
                            Tümünü Gör <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50/60">
                            {leads && leads.length > 0 ? (
                                leads.map((lead) => (
                                    <div key={lead.id} className="p-3 px-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                                {lead.full_name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-[13px] truncate">{lead.full_name}</p>
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{lead.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight ${lead.status === 'Contract Signed' ? 'bg-green-100 text-green-700' :
                                                ['Rejected', 'Cancelled'].includes(lead.status) ? 'bg-red-100 text-red-700' :
                                                    ['Reserved', 'Qualified'].includes(lead.status) ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {lead.status === 'Submitted' ? 'Yeni' :
                                                    lead.status === 'Visited' ? 'Ziyaret' :
                                                        lead.status === 'Contract Signed' ? 'Satış' :
                                                            lead.status === 'Reserved' ? 'Rezerve' : 'Süreçte'}
                                            </span>
                                            <p className="text-[9px] text-slate-300 mt-1">
                                                {new Date(lead.created_at).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50/30">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-10 text-slate-900" />
                                    <p className="text-[11px] text-slate-400 font-medium">Henüz kayıt bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Column */}
                <div className="space-y-4">
                    {/* Active Campaigns - Mini (Moved Up) */}
                    <IncentiveCampaignsList campaigns={activeCampaigns || []} />

                    {/* Slug Manager - Compacted */}
                    <BrokerSlugManager initialSlug={profile?.broker_slug || ''} />

                    {/* Level Progress */}
                    {nextLevel && (
                        <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-100">
                            <CardHeader className="px-4 py-3 border-b border-slate-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hedef: {nextLevel.name}</CardTitle>
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium font-bold uppercase tracking-tighter">İlerleme</p>
                                        <p className="text-sm font-black text-slate-900 leading-none mt-0.5">%{Math.round(progressToNext)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-700">
                                            {wonLeads} / {nextLevel.min_sales_count} Satış
                                        </p>
                                    </div>
                                </div>
                                <Progress value={progressToNext} className="h-1.5 bg-slate-100 ring-1 ring-slate-200/50" />
                                <p className="text-[9px] text-slate-400 mt-3 italic leading-tight bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {nextLevel.name} seviyesi için <strong>{nextLevel.min_sales_count}</strong> satış veya
                                    <strong> {(nextLevel.min_sales_volume / 1000).toFixed(0)}K</strong> hacim hedeflenmelidir.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Commission Models - Compact List */}
                    <CommissionModelsList models={commissionModels || []} />

                    {/* Quick Access Grid (Moved Down) */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'Fiyatlar', icon: Building2, href: '/broker/documents' },
                            { label: 'Katalog', icon: FileText, href: '/broker/documents' }
                        ].map((item, i) => (
                            <Link key={i} href={item.href} className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col items-center shadow-sm">
                                <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2">
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
