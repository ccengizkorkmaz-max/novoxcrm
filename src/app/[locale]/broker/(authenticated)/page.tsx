import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    TrendingUp,
    Clock,
    PlusCircle,
    Building2,
    ChevronRight,
    Crown,
    Zap
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import BrokerSlugManager from '../components/BrokerSlugManager'
import CommissionModelsList from '../components/CommissionModelsList'
import IncentiveCampaignsList from '../components/IncentiveCampaignsList'
import { getTranslations } from 'next-intl/server'

export default async function BrokerDashboard(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const [t, { data: { user } }] = await Promise.all([
        getTranslations('Broker.dashboard'),
        supabase.auth.getUser(),
    ])

    if (!user) return null

    // Parallel fetch — all independent queries at once
    const [
        { data: profile },
        { data: leads },
        { data: stats },
        { data: wonLeadsData },
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select('broker_slug, full_name, tenant_id, broker_levels(id, name, color, icon)')
            .eq('id', user.id)
            .single(),
        supabase
            .from('broker_leads')
            .select('id, full_name, phone, status, created_at, project_id')
            .eq('broker_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
        supabase
            .from('broker_leads')
            .select('status')
            .eq('broker_id', user.id),
        supabase
            .from('broker_leads')
            .select('customer_id')
            .eq('broker_id', user.id)
            .in('status', ['Won', 'Contract Signed'])
            .not('customer_id', 'is', null),
    ])

    const totalLeads = stats?.length || 0
    const activeLeads = stats?.filter(s => !['Contract Signed', 'Rejected', 'Payment / Closing'].includes(s.status)).length || 0
    const wonLeads = stats?.filter(s => s.status === 'Contract Signed').length || 0

    // Volume calculation
    let totalVolume = 0
    if (wonLeadsData && wonLeadsData.length > 0) {
        const customerIds = wonLeadsData.map(l => l.customer_id).filter(Boolean)
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

    // Second parallel batch — depends on profile.tenant_id
    const tenantId = profile?.tenant_id || ''
    const [
        { data: levels },
        { data: activeCampaigns },
        { data: commissionModels },
    ] = await Promise.all([
        supabase.from('broker_levels').select('*').eq('tenant_id', tenantId).order('min_sales_count', { ascending: true }),
        supabase.from('incentive_campaigns').select('*, projects(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('commission_models').select('*, projects(name)').eq('tenant_id', tenantId).eq('status', 'Active').order('created_at', { ascending: false }).limit(3),
    ])

    // Level progress
    const activeLevel = Array.isArray(profile?.broker_levels) ? profile.broker_levels[0] : profile?.broker_levels
    const currentLevel = levels?.find(l => l.name === activeLevel?.name) || levels?.[0]

    let nextLevel: any = null
    let progressToNext = 100

    if (levels && currentLevel) {
        const currentIndex = levels.findIndex(l => l.id === currentLevel.id)
        if (currentIndex !== -1 && currentIndex < levels.length - 1) {
            nextLevel = levels[currentIndex + 1]
            const targetCount = nextLevel.min_sales_count || 1
            const targetVolume = nextLevel.min_sales_volume || 1
            const progressCount = Math.min(100, (wonLeads / targetCount) * 100)
            const progressVolume = Math.min(100, (totalVolume / targetVolume) * 100)
            progressToNext = Math.max(progressCount, progressVolume)
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Submitted': return t('status.submitted')
            case 'Visited': return t('status.visited')
            case 'Contract Signed': return t('status.contractSigned')
            case 'Reserved': return t('status.reserved')
            default: return t('status.process')
        }
    }

    const getStatusColor = (status: string) => {
        if (status === 'Contract Signed') return 'bg-emerald-100 text-emerald-700'
        if (['Rejected', 'Cancelled'].includes(status)) return 'bg-red-100 text-red-700'
        if (['Reserved', 'Qualified'].includes(status)) return 'bg-amber-100 text-amber-700'
        return 'bg-blue-50 text-blue-700'
    }

    return (
        <div className="max-w-5xl mx-auto space-y-5 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center shadow-sm"
                        style={currentLevel ? { backgroundColor: currentLevel.color + '18', color: currentLevel.color } : { backgroundColor: '#eff6ff', color: '#2563eb' }}
                    >
                        <Crown className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-900">{t('title')}</h1>
                            {currentLevel && (
                                <>
                                    <span className="text-xs text-slate-300">|</span>
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                                        style={{ backgroundColor: currentLevel.color + '15', color: currentLevel.color, borderColor: currentLevel.color + '30' }}
                                    >
                                        {currentLevel.name} {t('partner')}
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{t('welcome')}, {profile?.full_name}</p>
                    </div>
                </div>
                <Link href="/broker/leads/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold">
                        <PlusCircle className="h-3.5 w-3.5" />
                        {t('newLead')}
                    </Button>
                </Link>
            </div>

            {/* Stats Row — fixed color classes */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('stats.total')}</p>
                            <p className="text-xl font-bold text-slate-900 leading-none mt-0.5">{totalLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('stats.active')}</p>
                            <p className="text-xl font-bold text-slate-900 leading-none mt-0.5">{activeLeads}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('stats.success')}</p>
                            <p className="text-xl font-bold text-slate-900 leading-none mt-0.5">{wonLeads}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content 2-Column */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Recent Leads — 2 cols */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-5 py-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <CardTitle className="text-sm font-bold text-slate-800">{t('recent.title')}</CardTitle>
                        </div>
                        <Link href="/broker/leads" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-0.5">
                            {t('recent.viewAll')} <ChevronRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {leads && leads.length > 0 ? (
                                leads.map((lead) => (
                                    <Link key={lead.id} href={`/broker/leads/${lead.id}`} className="block">
                                        <div className="p-3.5 px-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                                                    {lead.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{lead.full_name}</p>
                                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{lead.phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight ${getStatusColor(lead.status)}`}>
                                                    {getStatusLabel(lead.status)}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-10 text-slate-900" />
                                    <p className="text-xs text-slate-400 font-medium">{t('recent.empty')}</p>
                                    <Link href="/broker/leads/new" className="inline-block mt-3">
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
                                            <PlusCircle className="h-3 w-3 mr-1.5" />
                                            {t('newLead')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Column */}
                <div className="space-y-4">
                    {/* Campaigns */}
                    <IncentiveCampaignsList campaigns={activeCampaigns || []} />

                    {/* Slug Manager */}
                    <BrokerSlugManager initialSlug={profile?.broker_slug || ''} />

                    {/* Level Progress */}
                    {nextLevel && (
                        <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                            <CardHeader className="px-4 py-3 border-b border-slate-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('level.target')}: {nextLevel.name}</CardTitle>
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t('level.progress')}</p>
                                        <p className="text-sm font-black text-slate-900 leading-none mt-0.5">%{Math.round(progressToNext)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-700">
                                            {wonLeads} / {nextLevel.min_sales_count} {t('level.sales')}
                                        </p>
                                    </div>
                                </div>
                                <Progress value={progressToNext} className="h-1.5 bg-slate-100" />
                                <p className="text-[9px] text-slate-400 mt-3 italic leading-tight bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {t('level.goalDescPart1')} {nextLevel.name} {t('level.goalDescPart2')} <strong>{nextLevel.min_sales_count}</strong> {t('level.goalDescPart3')}
                                    {nextLevel.min_sales_volume > 0 && (
                                        <> <strong>{(nextLevel.min_sales_volume / 1000).toFixed(0)}K</strong> {t('level.goalDescPart4')}</>
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Commission Models */}
                    <CommissionModelsList models={commissionModels || []} />

                    {/* Quick Access */}
                    <div className="grid grid-cols-2 gap-2">
                        <Link href="/broker/projects" className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col items-center shadow-sm">
                            <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{t('quickAccess.prices')}</span>
                        </Link>
                        <Link href="/broker/documents" className="group p-3 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex flex-col items-center shadow-sm">
                            <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2">
                                <Zap className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700">{t('quickAccess.catalog')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
