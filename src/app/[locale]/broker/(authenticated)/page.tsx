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
    Zap,
    ArrowUpRight
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

    // Parallel fetch
    const [
        { data: profile },
        { data: leads },
        { data: stats },
        { data: wonLeadsData },
    ] = await Promise.all([
        supabase.from('profiles').select('broker_slug, full_name, tenant_id, broker_levels(id, name, color, icon)').eq('id', user.id).single(),
        supabase.from('broker_leads').select('id, full_name, phone, status, created_at').eq('broker_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('broker_leads').select('status').eq('broker_id', user.id),
        supabase.from('broker_leads').select('customer_id').eq('broker_id', user.id).in('status', ['Won', 'Contract Signed']).not('customer_id', 'is', null),
    ])

    const totalLeads = stats?.length || 0
    const activeLeads = stats?.filter(s => !['Contract Signed', 'Rejected', 'Payment / Closing'].includes(s.status)).length || 0
    const wonLeads = stats?.filter(s => s.status === 'Contract Signed').length || 0
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    // Volume
    let totalVolume = 0
    if (wonLeadsData && wonLeadsData.length > 0) {
        const customerIds = wonLeadsData.map(l => l.customer_id).filter(Boolean)
        if (customerIds.length > 0) {
            const { data: volumeData } = await supabase.from('sales').select('final_price').in('customer_id', customerIds).eq('status', 'Completed')
            if (volumeData) totalVolume = volumeData.reduce((sum, sale) => sum + (Number(sale.final_price) || 0), 0)
        }
    }

    // Second batch
    const tenantId = profile?.tenant_id || ''
    const [{ data: levels }, { data: activeCampaigns }, { data: commissionModels }] = await Promise.all([
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
            progressToNext = Math.max(
                Math.min(100, (wonLeads / targetCount) * 100),
                Math.min(100, (totalVolume / targetVolume) * 100)
            )
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
        if (status === 'Contract Signed') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        if (['Rejected', 'Cancelled'].includes(status)) return 'bg-red-500/10 text-red-600 border-red-500/20'
        if (['Reserved', 'Qualified'].includes(status)) return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Hero Header — Gradient */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)' }} />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10"
                            style={currentLevel ? { background: `linear-gradient(135deg, ${currentLevel.color}40, ${currentLevel.color}15)`, color: currentLevel.color } : { background: 'linear-gradient(135deg, #3b82f640, #3b82f615)', color: '#60a5fa' }}
                        >
                            <Crown className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl sm:text-2xl font-bold text-white">{t('title')}</h1>
                                {currentLevel && (
                                    <span
                                        className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                        style={{ backgroundColor: currentLevel.color + '20', color: currentLevel.color, borderColor: currentLevel.color + '30' }}
                                    >
                                        {currentLevel.name} {t('partner')}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-blue-200/60 mt-1">{t('welcome')}, {profile?.full_name}</p>
                        </div>
                    </div>
                    <Link href="/broker/leads/new">
                        <Button className="bg-white text-slate-900 hover:bg-blue-50 shadow-xl gap-2 h-10 px-5 rounded-xl text-sm font-semibold">
                            <PlusCircle className="h-4 w-4" />
                            {t('newLead')}
                        </Button>
                    </Link>
                </div>

                {/* Inline Stats */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {[
                        { label: t('stats.total'), value: totalLeads, icon: Users, gradient: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
                        { label: t('stats.active'), value: activeLeads, icon: Clock, gradient: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-400' },
                        { label: t('stats.success'), value: wonLeads, icon: TrendingUp, gradient: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-400' },
                        { label: 'Dönüşüm', value: `%${conversionRate}`, icon: ArrowUpRight, gradient: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-sm rounded-xl border border-white/5 p-4`}>
                            <div className="flex items-center gap-2 mb-2">
                                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-5 lg:grid-cols-5">
                {/* Leads — 3 cols */}
                <div className="lg:col-span-3 space-y-5">
                    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <CardTitle className="text-sm font-bold text-slate-800">{t('recent.title')}</CardTitle>
                            </div>
                            <Link href="/broker/leads" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 group">
                                {t('recent.viewAll')} <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {leads && leads.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {leads.map((lead) => (
                                        <Link key={lead.id} href={`/broker/leads/${lead.id}`} className="block group">
                                            <div className="px-5 py-3.5 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0 group-hover:from-blue-100 group-hover:to-blue-50 group-hover:text-blue-600 transition-all">
                                                        {lead.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">{lead.full_name}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{lead.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(lead.status)}`}>
                                                        {getStatusLabel(lead.status)}
                                                    </span>
                                                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                                        <Users className="h-7 w-7 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{t('recent.empty')}</p>
                                    <p className="text-xs text-slate-400 mb-4">İlk müşterinizi ekleyerek başlayın</p>
                                    <Link href="/broker/leads/new">
                                        <Button size="sm" className="rounded-xl gap-1.5 h-9 text-xs" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                                            <PlusCircle className="h-3.5 w-3.5" />
                                            {t('newLead')}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Level Progress — Full Width */}
                    {nextLevel && (
                        <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-700">{t('level.target')}: {nextLevel.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">%{Math.round(progressToNext)}</span>
                                </div>
                                <Progress value={progressToNext} className="h-2 bg-slate-100" />
                                <div className="flex justify-between mt-2">
                                    <span className="text-[10px] text-slate-400">{wonLeads} / {nextLevel.min_sales_count} {t('level.sales')}</span>
                                    {nextLevel.min_sales_volume > 0 && (
                                        <span className="text-[10px] text-slate-400">{(totalVolume / 1000).toFixed(0)}K / {(nextLevel.min_sales_volume / 1000).toFixed(0)}K hacim</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Panel — 2 cols */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Campaigns */}
                    <IncentiveCampaignsList campaigns={activeCampaigns || []} />

                    {/* Slug Manager */}
                    <BrokerSlugManager initialSlug={profile?.broker_slug || ''} />

                    {/* Commission Models */}
                    <CommissionModelsList models={commissionModels || []} />

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <Link href="/broker/projects" className="group p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col items-center shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors mb-2.5">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{t('quickAccess.prices')}</span>
                        </Link>
                        <Link href="/broker/documents" className="group p-4 rounded-xl bg-white border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all flex flex-col items-center shadow-sm">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors mb-2.5">
                                <Zap className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">{t('quickAccess.catalog')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
