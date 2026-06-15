import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, CreditCard, Activity, ArrowUpRight, Briefcase } from 'lucide-react'
import { EnhancedDashboardCharts } from '@/components/dashboard/enhanced-dashboard-charts'
import { formatCurrency } from '@/lib/utils'
import { DashboardGeneralStats } from '@/components/dashboard-general-stats'
import { getTranslations } from 'next-intl/server'
import { AiInsightWidget } from '@/components/dashboard/AiInsightWidget'
import { BrokerDashboardWidget } from '@/components/dashboard/BrokerDashboardWidget'

// Force dynamic rendering and disable caching to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardStats(t: any, locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const emptyState = {
    activeProjects: 0,
    availableUnits: 0,
    totalCustomers: 0,
    activeLeads: 0,
    activeProspects: 0,
    activePipeline: 0,
    totalSalesVolume: 0,
    chartData: [],
    leadStatusData: [],
    recentActivities: [],
    generalStats: { total: 0, sold: 0, reserved: 0, offers: 0 },
    hrStats: { total: 0, active: 0 },
    funnelData: [],
    projectOccupancy: [],
    leaderboard: [],
    monthlyComparison: { thisMonth: 0, lastMonth: 0, thisMonthCount: 0, lastMonthCount: 0 }
  }

  if (!user) return emptyState

  // Get user's profile and metadata to ensure strict isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  const metaTenantId = user.user_metadata?.tenant_id
  let tenant_id = profile?.tenant_id

  const isManager = profile?.role === 'manager' || profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'crm_manager'

  // SELF-CORRECTION: If profile tenant doesn't match metadata tenant, trust metadata (official)
  if (metaTenantId && metaTenantId !== tenant_id) {
    console.log(`Self-correcting tenant_id for user ${user.id}: ${tenant_id} -> ${metaTenantId}`)
    await supabase.from('profiles').update({ tenant_id: metaTenantId }).eq('id', user.id)
    tenant_id = metaTenantId
  }

  if (!tenant_id) return emptyState

  // Fetch project IDs first (needed as dependency for unit queries)
  const [
    { count: activeProjects },
    { data: tenantProjects }
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'Active'),
    supabase.from('projects').select('id, name').eq('tenant_id', tenant_id)
  ])

  const projectIds = tenantProjects?.map(p => p.id) || []

  // Run ALL independent count queries in parallel (was ~8 sequential queries!)
  // Also run contracts query in parallel
  let contractsQuery = supabase
    .from('contracts')
    .select('signed_amount, created_at, assigned_to')
    .eq('tenant_id', tenant_id)
    .neq('status', 'Cancelled')

  if (!isManager) {
    contractsQuery = contractsQuery.eq('assigned_to', user.id)
  }

  // Build sold-sales query (fallback for volume when contracts table is empty)
  let soldSalesQuery = supabase
    .from('sales')
    .select('final_price, currency, created_at, assigned_to, units(price, currency)')
    .in('status', ['Sold', 'Completed'])
    .eq('tenant_id', tenant_id)
  if (!isManager) {
    soldSalesQuery = soldSalesQuery.eq('assigned_to', user.id)
  }

  const [
    { count: availableUnits },
    { count: totalUnits },
    { count: soldUnits },
    { count: reservedUnits },
    { count: activeOffers },
    { count: totalCustomers },
    { data: contracts },
    { data: soldSales }
  ] = await Promise.all([
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'For Sale').eq('is_legacy', false).in('project_id', projectIds),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('is_legacy', false).in('project_id', projectIds),
    supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'Sold').eq('is_legacy', false).in('project_id', projectIds),
    supabase.from('units').select('*', { count: 'exact', head: true }).in('status', ['Reserved', 'Reservation']).eq('is_legacy', false).in('project_id', projectIds),
    supabase.from('sales').select('*', { count: 'exact', head: true }).in('status', ['Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation']).eq('tenant_id', tenant_id),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
    contractsQuery.order('created_at', { ascending: true }),
    soldSalesQuery.order('created_at', { ascending: true })
  ])

  // Sales Volume: prefer contracts.signed_amount, fallback to sales.final_price / units.price
  const contractsVolume = contracts?.reduce((sum, c) => sum + Number(c.signed_amount || 0), 0) || 0
  const salesVolume = (soldSales || []).reduce((sum, s: any) => {
    const price = Number(s.final_price) || Number((s.units as any)?.price) || 0
    return sum + price
  }, 0)
  const totalSalesVolume = contractsVolume > 0 ? contractsVolume : salesVolume

  // Unified data source helpers (used by chart, monthly comparison, and leaderboard)
  const useContracts = contractsVolume > 0
  const getAmount = (item: any) => useContracts ? Number(item.signed_amount || 0) : (Number(item.final_price) || Number((item.units as any)?.price) || 0)

  // Process chart data for Sales (Bar Chart)
  const months = locale === 'tr'
    ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const salesByMonth = months.reduce((acc: any, month) => {
    acc[month] = { total: 0, count: 0 }
    return acc
  }, {})

  // Chart source: prefer contracts, fallback to sold sales
  const chartSource = useContracts ? (contracts || []) : (soldSales || [])
  chartSource.forEach((curr: any) => {
    const month = new Date(curr.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })
    const cleanMonth = month.replace('.', '')
    if (salesByMonth[cleanMonth]) {
      salesByMonth[cleanMonth].total += getAmount(curr)
      salesByMonth[cleanMonth].count += 1
    }
  })

  const chartData = months.map(month => ({
    month,
    total: Number(salesByMonth[month].total),
    count: salesByMonth[month].count,
    average: salesByMonth[month].count > 0 ? Number(salesByMonth[month].total) / salesByMonth[month].count : 0
  }))

  // ============== NEW: Monthly Comparison ==============
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // Monthly comparison: use unified data source
  const volumeSource = useContracts ? (contracts || []) : (soldSales || [])

  const thisMonthItems = volumeSource.filter(c => new Date(c.created_at) >= new Date(thisMonthStart))
  const lastMonthItems = volumeSource.filter(c => {
    const d = new Date(c.created_at)
    return d >= new Date(lastMonthStart) && d <= new Date(lastMonthEnd)
  })

  const monthlyComparison = {
    thisMonth: thisMonthItems.reduce((s, c) => s + getAmount(c), 0),
    lastMonth: lastMonthItems.reduce((s, c) => s + getAmount(c), 0),
    thisMonthCount: thisMonthItems.length,
    lastMonthCount: lastMonthItems.length
  }

  // 5. Active Leads (Use headless counts to bypass 1000-row limit)
  const getDashboardCount = (statusMatch: any) => {
    let q = supabase.from('sales').select('*', { count: 'exact', head: true })
    if (typeof statusMatch === 'string') {
      q = q.eq('status', statusMatch)
    } else if (Array.isArray(statusMatch)) {
      q = q.in('status', statusMatch)
    } else {
      // For active pipeline (non-finalized)
      q = q.not('status', 'in', '("Sold","Completed","Lost","Cancelled")')
    }
    q = q.eq('tenant_id', tenant_id)
    if (!isManager) {
      q = q.eq('assigned_to', user.id)
    }
    return q
  }

  let allRelevantQuery = supabase.from('sales').select('status').eq('tenant_id', tenant_id)
  if (!isManager) {
    allRelevantQuery = allRelevantQuery.eq('assigned_to', user.id)
  }

  const [
    countActivePipeline,
    countActiveProspects,
    countActiveLeadsOnly,
    allRelevantSales // Still need some for the chart, but we can limit this for the chart specifically
  ] = await Promise.all([
    getDashboardCount(null), // Active Pipeline
    getDashboardCount('Prospect'),
    getDashboardCount('Lead'),
    allRelevantQuery.limit(5000)
  ])

  const activePipelineCount = countActivePipeline.count || 0
  const activeProspects = countActiveProspects.count || 0
  const activeLeadsOnly = countActiveLeadsOnly.count || 0
  const leads = allRelevantSales.data || []

  // Process chart data for Leads (Pie Chart)
  const leadStatusMap: Record<string, number> = {}
  leads?.forEach(curr => {
    const translationKey = curr.status === 'Prospect' ? 'prospect' :
      curr.status === 'Lead' ? 'lead' :
        curr.status === 'Contacted' ? 'contacted' :
          curr.status === 'Proposal' ? 'proposal' :
            curr.status === 'Negotiation' ? 'negotiation' :
              curr.status === 'Reservation' ? 'reservation' :
                curr.status === 'Contract' ? 'contract' :
                  curr.status === 'Completed' || curr.status === 'Sold' ? 'won' :
                    curr.status === 'Lost' || curr.status === 'Cancelled' ? 'lost' : 'lead';

    const translation = t(`status.${translationKey}`)
    leadStatusMap[translation] = (leadStatusMap[translation] || 0) + 1
  })

  const leadStatusData = Object.entries(leadStatusMap).map(([name, value]) => ({
    name,
    value: Number(value)
  }))

  // ============== NEW: Sales Funnel ==============
  const funnelStages = [
    { key: 'Lead', label: 'Yeni Lead', color: '#94a3b8' },
    { key: 'Prospect', label: 'Fırsat', color: '#6366f1' },
    { key: 'Contacted', label: 'İletişime Geçildi', color: '#60a5fa' },
    { key: 'Proposal', label: 'Teklif Verildi', color: '#a78bfa' },
    { key: 'Negotiation', label: 'Müzakere', color: '#f59e0b' },
    { key: 'Reservation', label: 'Opsiyon/Rezerve', color: '#fb923c' },
    { key: 'Contract', label: 'Sözleşme', color: '#34d399' },
    { key: 'Sold', label: 'Satış Tamamlandı', color: '#10b981' },
  ]

  const statusCounts: Record<string, number> = {}
  leads?.forEach(l => {
    // Map variations
    const mappedStatus = l.status === 'Completed' ? 'Sold' :
      l.status === 'Teklif - Kapora Bekleniyor' ? 'Proposal' :
        l.status
    statusCounts[mappedStatus] = (statusCounts[mappedStatus] || 0) + 1
  })

  const funnelData = funnelStages
    .map(stage => ({
      stage: stage.label,
      count: statusCounts[stage.key] || 0,
      color: stage.color
    }))
    .filter(s => s.count > 0 || funnelStages.findIndex(f => f.label === s.stage) < 4) // Always show first 4 stages

  // ============== Parallel fetch: Units, Leaderboard, Activities, HR ==============
  const [
    { data: allUnits },
    { data: teamProfiles },
    { data: activitiesByUser },
    { data: recentActivities },
    { count: totalEmployees },
    { count: activeEmployees }
  ] = await Promise.all([
    // Project Occupancy units
    supabase.from('units').select('project_id, status').eq('is_legacy', false).in('project_id', projectIds),
    // Team profiles for leaderboard
    supabase.from('profiles').select('id, full_name').eq('tenant_id', tenant_id).in('role', ['owner', 'admin', 'manager', 'sales']),
    // Activity counts per user
    supabase.from('activities').select('assigned_to').eq('tenant_id', tenant_id),
    // Recent activities
    supabase.from('activities').select('*, customers(full_name)').eq('tenant_id', tenant_id).order('created_at', { ascending: false }).limit(5),
    // HR Stats
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active')
  ])

  // Process project occupancy
  const projectOccupancyMap: Record<string, { total: number, sold: number, reserved: number, available: number }> = {}

  allUnits?.forEach(unit => {
    if (!projectOccupancyMap[unit.project_id]) {
      projectOccupancyMap[unit.project_id] = { total: 0, sold: 0, reserved: 0, available: 0 }
    }
    projectOccupancyMap[unit.project_id].total++
    if (unit.status === 'Sold') projectOccupancyMap[unit.project_id].sold++
    else if (unit.status === 'Reserved' || unit.status === 'Reservation') projectOccupancyMap[unit.project_id].reserved++
    else projectOccupancyMap[unit.project_id].available++
  })

  const projectOccupancy = Object.entries(projectOccupancyMap).map(([projectId, data]) => ({
    projectName: tenantProjects?.find(p => p.id === projectId)?.name || projectId,
    ...data
  })).sort((a, b) => {
    const aOcc = (a.sold + a.reserved) / a.total
    const bOcc = (b.sold + b.reserved) / b.total
    return bOcc - aOcc
  })

  // Build leaderboard
  const activityCounts: Record<string, number> = {}
  activitiesByUser?.forEach(a => {
    if (a.assigned_to) {
      activityCounts[a.assigned_to] = (activityCounts[a.assigned_to] || 0) + 1
    }
  })

  const salesByPerson: Record<string, { total: number, count: number }> = {}
  const leaderSource = useContracts ? (contracts || []) : (soldSales || [])
  leaderSource.forEach((item: any) => {
    const personId = item.assigned_to || 'unknown'
    if (!salesByPerson[personId]) salesByPerson[personId] = { total: 0, count: 0 }
    salesByPerson[personId].total += getAmount(item)
    salesByPerson[personId].count++
  })

  const leaderboard = Object.entries(salesByPerson)
    .map(([personId, data]) => ({
      name: teamProfiles?.find(p => p.id === personId)?.full_name || 'Bilinmeyen',
      totalSales: data.total,
      contractCount: data.count,
      activitiesCount: activityCounts[personId] || 0
    }))
    .sort((a, b) => b.totalSales - a.totalSales)

  return {
    activeProjects: activeProjects || 0,
    availableUnits: availableUnits || 0,
    totalCustomers: totalCustomers || 0,
    activeLeads: activeLeadsOnly,
    activeProspects,
    activePipeline: activePipelineCount,
    totalSalesVolume,
    chartData,
    leadStatusData,
    recentActivities: recentActivities || [],
    generalStats: {
      total: totalUnits || 0,
      sold: soldUnits || 0,
      reserved: reservedUnits || 0,
      offers: activeOffers || 0
    },
    hrStats: {
      total: totalEmployees || 0,
      active: activeEmployees || 0
    },
    funnelData,
    projectOccupancy,
    leaderboard,
    monthlyComparison
  }
}

export default async function DashboardPage(props: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await props.params

  // Run translations and auth check in parallel
  const supabase = await createClient()
  const [t, { data: { user } }] = await Promise.all([
    getTranslations('Dashboard'),
    supabase.auth.getUser()
  ])

  let tenantType = 'developer'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (profile?.tenant_id) {
      const { data: tenant } = await supabase.from('tenants').select('tenant_type').eq('id', profile.tenant_id).single()
      tenantType = (tenant as any)?.tenant_type || 'developer'
    }
  }

  // Broker Dashboard
  if (tenantType === 'broker') {
    // Fetch broker-specific stats in parallel
    const { data: profileForTenant } = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single()
    const brokerTenantId = profileForTenant?.tenant_id || ''

    const [
      { data: bPortfolios },
      { data: bLeads },
      { data: bTransactions },
      { data: bAgents }
    ] = await Promise.all([
      supabase.from('portfolios').select('status, authorization_end'),
      supabase.from('customers').select('id, created_at, assigned_to'),
      supabase.from('agent_transactions').select('gross_commission, office_share, listing_agent_id, listing_agent_share, buyer_agent_id, buyer_agent_share, status, transaction_date, sale_price'),
      supabase.from('profiles').select('id, full_name').eq('tenant_id', brokerTenantId).in('role', ['sales', 'manager', 'admin', 'owner'])
    ])

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)

    const pStats = {
      total: bPortfolios?.length || 0,
      active: bPortfolios?.filter(p => p.status === 'active').length || 0,
      sold: bPortfolios?.filter(p => p.status === 'sold').length || 0,
      rented: bPortfolios?.filter(p => p.status === 'rented').length || 0,
      expiringCount: bPortfolios?.filter(p => {
        if (!p.authorization_end) return false
        const daysLeft = Math.ceil((new Date(p.authorization_end).getTime() - now.getTime()) / 86400000)
        return daysLeft >= 0 && daysLeft <= 30
      }).length || 0,
    }

    const lStats = {
      unassigned: bLeads?.filter(l => !l.assigned_to).length || 0,
      totalToday: bLeads?.filter(l => new Date(l.created_at) >= todayStart).length || 0,
    }

    const approvedTx = bTransactions?.filter(t => ['approved', 'paid'].includes(t.status)) || []
    const monthlyTx = approvedTx.filter(t => new Date(t.transaction_date) >= monthStart)
    const rStats = {
      totalGCI: approvedTx.reduce((s, t) => s + (t.gross_commission || 0), 0),
      monthlyGCI: monthlyTx.reduce((s, t) => s + (t.gross_commission || 0), 0),
      pendingPayments: (bTransactions?.filter(t => t.status === 'pending') || []).reduce((s, t) => s + (t.gross_commission || 0), 0),
    }

    // Top agents by earnings this month
    const agentEarnings: Record<string, { earnings: number; deals: number }> = {}
    monthlyTx.forEach(tx => {
      if (tx.listing_agent_id) {
        if (!agentEarnings[tx.listing_agent_id]) agentEarnings[tx.listing_agent_id] = { earnings: 0, deals: 0 }
        agentEarnings[tx.listing_agent_id].earnings += (tx.listing_agent_share || 0)
        agentEarnings[tx.listing_agent_id].deals++
      }
      if (tx.buyer_agent_id && tx.buyer_agent_id !== tx.listing_agent_id) {
        if (!agentEarnings[tx.buyer_agent_id]) agentEarnings[tx.buyer_agent_id] = { earnings: 0, deals: 0 }
        agentEarnings[tx.buyer_agent_id].earnings += (tx.buyer_agent_share || 0)
        agentEarnings[tx.buyer_agent_id].deals++
      }
    })

    const topAgents = Object.entries(agentEarnings)
      .map(([id, data]) => ({ name: bAgents?.find(a => a.id === id)?.full_name || 'Bilinmeyen', ...data }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5)

    // Pipeline / Sales stats
    const { data: bSales } = await supabase.from('sales').select('status, created_at, source, description')
    const pipelineStats = {
      lead: bSales?.filter(s => s.status === 'Lead').length || 0,
      prospect: bSales?.filter(s => s.status === 'Prospect').length || 0,
      showing: bSales?.filter(s => s.status === 'Showing').length || 0,
      proposal: bSales?.filter(s => ['Proposal', 'Teklif - Kapora Bekleniyor'].includes(s.status)).length || 0,
      negotiation: bSales?.filter(s => s.status === 'Negotiation').length || 0,
      contract: bSales?.filter(s => ['Sold', 'Completed', 'Contract'].includes(s.status)).length || 0,
      lost: bSales?.filter(s => s.status === 'Lost').length || 0,
      totalActive: bSales?.filter(s => !['Lost', 'Sold', 'Completed'].includes(s.status)).length || 0,
    }

    // Recent activities (last 5)
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('id, type, summary, created_at, customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(5)

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('overview')}</h1>
          <p className="text-muted-foreground text-sm mt-1">Acente kontrol paneli</p>
        </div>
        <BrokerDashboardWidget
          portfolioStats={pStats}
          leadStats={lStats}
          revenueStats={rStats}
          topAgents={topAgents}
          pipelineStats={pipelineStats}
          recentActivities={(recentActivities || []) as any[]}
        />
      </div>
    )
  }

  // Developer Dashboard (existing)
  const stats = await getDashboardStats(t, locale)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('overview')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content (3/4 width on XL) */}
        <div className="xl:col-span-3 space-y-6">
          {/* General Stock Stats */}
          <DashboardGeneralStats stats={stats.generalStats} />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('kpi.totalSalesVolume')}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalSalesVolume)}
                </div>
                <p className="text-xs text-muted-foreground">{t('kpi.totalContracts')}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('kpi.activeOpportunities')}</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.activeProspects}</div>
                <p className="text-xs text-muted-foreground">{stats.activeLeads} {t('status.lead')}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('kpi.unitsForSale')}</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.availableUnits}</div>
                <p className="text-xs text-muted-foreground">{t('kpi.totalStock')}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('kpi.customers')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">{t('kpi.registeredCustomers')}</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('kpi.personnel')}</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.hrStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">{stats.hrStats?.active || 0} {t('kpi.activeStaff')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts & Analytics */}
          <EnhancedDashboardCharts
            monthlySales={stats.chartData}
            opportunityDist={stats.leadStatusData}
            funnelData={stats.funnelData}
            projectOccupancy={stats.projectOccupancy}
            leaderboard={stats.leaderboard}
            monthlyComparison={stats.monthlyComparison}
          />

          {/* Recent Activity */}
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>{t('activity.title')}</CardTitle>
              <CardDescription>{t('activity.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('activity.empty')}</p>
                ) : (
                  stats.recentActivities.map((activity: any) => {
                    const typeKey = activity.type === 'Call' || activity.type === 'Phone' ? 'call' :
                      activity.type === 'Meeting' ? 'meeting' :
                        activity.type === 'Visit' || activity.type === 'Site Visit' ? 'visit' :
                          activity.type === 'Whatsapp' ? 'whatsapp' :
                            activity.type === 'Email' ? 'email' : 'call'

                    return (
                      <div key={activity.id} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.customers?.full_name} - {t(`activity.types.${typeKey}`)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.summary}
                          </p>
                        </div>
                        <div className="ml-auto font-medium text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (AI Co-Pilot) - 1/4 width on XL */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <AiInsightWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
