import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, CreditCard, Activity, ArrowUpRight, Briefcase } from 'lucide-react'
import { EnhancedDashboardCharts } from '@/components/dashboard/enhanced-dashboard-charts'
import { formatCurrency } from '@/lib/utils'
import { DashboardGeneralStats } from '@/components/dashboard-general-stats'
import { getTranslations } from 'next-intl/server'
import { AiInsightWidget } from '@/components/dashboard/AiInsightWidget'

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
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const metaTenantId = user.user_metadata?.tenant_id
  let tenant_id = profile?.tenant_id

  // SELF-CORRECTION: If profile tenant doesn't match metadata tenant, trust metadata (official)
  if (metaTenantId && metaTenantId !== tenant_id) {
    console.log(`Self-correcting tenant_id for user ${user.id}: ${tenant_id} -> ${metaTenantId}`)
    await supabase.from('profiles').update({ tenant_id: metaTenantId }).eq('id', user.id)
    tenant_id = metaTenantId
  }

  if (!tenant_id) return emptyState

  // 1. Projects Count (Active)
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
    .eq('status', 'Active')

  // Fetch project IDs first for reliable unit filtering
  const { data: tenantProjects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('tenant_id', tenant_id)

  const projectIds = tenantProjects?.map(p => p.id) || []

  // 2. Units Count (For Sale)
  const { count: availableUnits } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'For Sale')
    .eq('is_legacy', false)
    .in('project_id', projectIds)

  // General Stock Stats
  const { count: totalUnits } = await supabase.from('units').select('*', { count: 'exact', head: true })
    .eq('is_legacy', false)
    .in('project_id', projectIds)
  const { count: soldUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'Sold')
    .eq('is_legacy', false)
    .in('project_id', projectIds)
  const { count: reservedUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).in('status', ['Reserved', 'Reservation'])
    .eq('is_legacy', false)
    .in('project_id', projectIds)
  const { count: activeOffers } = await supabase.from('sales').select('*', { count: 'exact', head: true }).in('status', ['Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation'])
    .eq('tenant_id', tenant_id)

  // 3. Customers Count
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)

  // 4. Total Sales Volume (Contracts)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('signed_amount, created_at, assigned_to')
    .eq('tenant_id', tenant_id)
    .neq('status', 'Cancelled')
    .order('created_at', { ascending: true })

  const totalSalesVolume = contracts?.reduce((sum, c) => sum + Number(c.signed_amount), 0) || 0

  // Process chart data for Sales (Bar Chart)
  const months = locale === 'tr'
    ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const salesByMonth = months.reduce((acc: any, month) => {
    acc[month] = { total: 0, count: 0 }
    return acc
  }, {})

  contracts?.forEach((curr: any) => {
    const month = new Date(curr.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })
    const cleanMonth = month.replace('.', '')
    if (salesByMonth[cleanMonth]) {
      salesByMonth[cleanMonth].total += Number(curr.signed_amount)
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

  const thisMonthContracts = contracts?.filter(c => new Date(c.created_at) >= new Date(thisMonthStart)) || []
  const lastMonthContracts = contracts?.filter(c => {
    const d = new Date(c.created_at)
    return d >= new Date(lastMonthStart) && d <= new Date(lastMonthEnd)
  }) || []

  const monthlyComparison = {
    thisMonth: thisMonthContracts.reduce((s, c) => s + Number(c.signed_amount), 0),
    lastMonth: lastMonthContracts.reduce((s, c) => s + Number(c.signed_amount), 0),
    thisMonthCount: thisMonthContracts.length,
    lastMonthCount: lastMonthContracts.length
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
    return q.eq('tenant_id', tenant_id)
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
    supabase.from('sales').select('status').eq('tenant_id', tenant_id).limit(1000)
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

  // ============== NEW: Project Occupancy ==============
  const { data: allUnits } = await supabase
    .from('units')
    .select('project_id, status')
    .eq('is_legacy', false)
    .in('project_id', projectIds)

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

  // ============== NEW: Sales Leaderboard ==============
  // Get profiles for team members
  const { data: teamProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenant_id)
    .in('role', ['owner', 'admin', 'manager', 'sales'])

  // Get activity counts per user
  const { data: activitiesByUser } = await supabase
    .from('activities')
    .select('assigned_to')
    .eq('tenant_id', tenant_id)

  const activityCounts: Record<string, number> = {}
  activitiesByUser?.forEach(a => {
    if (a.assigned_to) {
      activityCounts[a.assigned_to] = (activityCounts[a.assigned_to] || 0) + 1
    }
  })

  // Build leaderboard from contracts assigned_to
  const salesByPerson: Record<string, { total: number, count: number }> = {}
  contracts?.forEach(c => {
    const personId = c.assigned_to || 'unknown'
    if (!salesByPerson[personId]) salesByPerson[personId] = { total: 0, count: 0 }
    salesByPerson[personId].total += Number(c.signed_amount)
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

  // 6. Recent Activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, customers(full_name)')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 7. HR Stats
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })

  const { count: activeEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')

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
  const t = await getTranslations('Dashboard')
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
