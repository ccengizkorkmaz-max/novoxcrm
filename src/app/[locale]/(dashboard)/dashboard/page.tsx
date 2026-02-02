import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, CreditCard, Activity, ArrowUpRight } from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { formatCurrency } from '@/lib/utils'
import { DashboardGeneralStats } from '@/components/dashboard-general-stats'
import { getTranslations } from 'next-intl/server'

async function getDashboardStats(t: any, locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {
    activeProjects: 0,
    availableUnits: 0,
    totalCustomers: 0,
    activeLeads: 0,
    totalSalesVolume: 0,
    chartData: [],
    leadStatusData: [],
    recentActivities: [],
    generalStats: { total: 0, sold: 0, reserved: 0, offers: 0 }
  }

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

  if (!tenant_id) return {
    activeProjects: 0,
    availableUnits: 0,
    totalCustomers: 0,
    activeLeads: 0,
    totalSalesVolume: 0,
    chartData: [],
    leadStatusData: [],
    recentActivities: [],
    generalStats: { total: 0, sold: 0, reserved: 0, offers: 0 }
  }

  // 1. Projects Count (Active)
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
    .eq('status', 'Active')

  // Fetch project IDs first for reliable unit filtering
  const { data: tenantProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('tenant_id', tenant_id)

  const projectIds = tenantProjects?.map(p => p.id) || []

  // 2. Units Count (For Sale)
  const { count: availableUnits } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'For Sale')
    .in('project_id', projectIds)

  // General Stock Stats
  const { count: totalUnits } = await supabase.from('units').select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
  const { count: soldUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'Sold')
    .in('project_id', projectIds)
  const { count: reservedUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).in('status', ['Reserved', 'Reservation'])
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
    .select('signed_amount, created_at')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: true })

  const totalSalesVolume = contracts?.reduce((sum, c) => sum + Number(c.signed_amount), 0) || 0

  // Process chart data for Sales (Bar Chart)
  // Initialize with all 12 months
  const months = locale === 'tr'
    ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const salesByMonth = months.reduce((acc: any, month) => {
    acc[month] = { total: 0, count: 0 }
    return acc
  }, {})

  contracts?.forEach((curr: any) => {
    const month = new Date(curr.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })
    // Remove potential dot from Turkish short months (e.g., "Oca." -> "Oca")
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

  // 5. Active Leads (Sales not in 'Won' or 'Lost')
  const { data: leads } = await supabase
    .from('sales')
    .select('status')
    .eq('tenant_id', tenant_id)

  // Calculate specific active leads (excluding Won/Lost)
  const activeLeads = leads?.filter(l => l.status !== 'Sold' && l.status !== 'Lost').length || 0


  // Process chart data for Leads (Pie Chart)
  const leadStatusMap: Record<string, number> = {}
  leads?.forEach(curr => {
    const translationKey = curr.status === 'Lead' || curr.status === 'Prospect' ? 'lead' :
      curr.status === 'Contacted' ? 'contacted' :
        curr.status === 'Proposal' ? 'proposal' :
          curr.status === 'Negotiation' ? 'negotiation' :
            curr.status === 'Reservation' ? 'reservation' :
              curr.status === 'Contract' ? 'contract' :
                curr.status === 'Completed' || curr.status === 'Sold' ? 'won' :
                  curr.status === 'Lost' ? 'lost' : 'lead'; // fallback

    const translation = t(`status.${translationKey}`)

    leadStatusMap[translation] = (leadStatusMap[translation] || 0) + 1
  })

  const leadStatusData = Object.entries(leadStatusMap).map(([name, value]) => ({
    name,
    value: Number(value)
  }))

  // 6. Recent Activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, customers(full_name)')
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    activeProjects: activeProjects || 0,
    availableUnits: availableUnits || 0,
    totalCustomers: totalCustomers || 0,
    activeLeads,
    totalSalesVolume,
    chartData,
    leadStatusData,
    recentActivities: recentActivities || [],
    generalStats: {
      total: totalUnits || 0,
      sold: soldUnits || 0,
      reserved: reservedUnits || 0,
      offers: activeOffers || 0
    }
  }
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const t = await getTranslations('Dashboard')
  const stats = await getDashboardStats(t, locale)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('overview')}</h1>

      {/* General Stock Stats - Moved from CRM */}
      <DashboardGeneralStats stats={stats.generalStats} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeads}</div>
            <p className="text-xs text-muted-foreground">{t('kpi.ongoingNegotiations')}</p>
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
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

        {/* Sales Chart (Client Component) */}
        <div className="lg:col-span-4">
          <DashboardCharts
            monthlySales={stats.chartData}
            opportunityDist={stats.leadStatusData}
          />
        </div>

        {/* Recent Activity */}
        <Card className="col-span-1 lg:col-span-3 border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t('activity.title')}</CardTitle>
            <CardDescription>{t('activity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('activity.empty')}</p>
              ) : (
                stats.recentActivities.map((activity: any) => {
                  const typeKey = activity.type === 'Call' || activity.type === 'Phone' ? 'call' :
                    activity.type === 'Meeting' ? 'meeting' :
                      activity.type === 'Visit' || activity.type === 'Site Visit' ? 'visit' :
                        activity.type === 'Whatsapp' ? 'whatsapp' :
                          activity.type === 'Email' ? 'email' : 'call' // default fallback

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
    </div>
  )
}
