import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, CreditCard, Activity, ArrowUpRight } from 'lucide-react'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { formatCurrency } from '@/lib/utils'
import { DashboardGeneralStats } from '@/components/dashboard-general-stats'

async function getDashboardStats() {
  const supabase = await createClient()

  // 1. Projects Count (Active)
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')

  // 2. Units Count (For Sale)
  const { count: availableUnits } = await supabase
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'For Sale')

  // General Stock Stats
  const { count: totalUnits } = await supabase.from('units').select('*', { count: 'exact', head: true })
  const { count: soldUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'Sold')
  const { count: reservedUnits } = await supabase.from('units').select('*', { count: 'exact', head: true }).in('status', ['Reserved', 'Reservation'])
  const { count: activeOffers } = await supabase.from('sales').select('*', { count: 'exact', head: true }).in('status', ['Proposal', 'Teklif - Kapora Bekleniyor', 'Negotiation'])


  // 3. Customers Count
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  // 4. Total Sales Volume (Contracts)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('signed_amount, created_at')
    .order('created_at', { ascending: true })

  const totalSalesVolume = contracts?.reduce((sum, c) => sum + Number(c.signed_amount), 0) || 0

  // Process chart data for Sales (Bar Chart)
  const salesByMonth = contracts?.reduce((acc: any, curr: any) => {
    const month = new Date(curr.created_at).toLocaleString('tr-TR', { month: 'short' })
    acc[month] = (acc[month] || 0) + Number(curr.signed_amount)
    return acc
  }, {})

  const chartData = Object.entries(salesByMonth || {}).map(([month, amount]) => ({
    month,
    amount: Number(amount)
  }))

  // 5. Active Leads (Sales not in 'Won' or 'Lost')
  const { data: leads } = await supabase
    .from('sales')
    .select('status')

  // Calculate specific active leads (excluding Won/Lost)
  const activeLeads = leads?.filter(l => l.status !== 'Sold' && l.status !== 'Lost').length || 0


  // Process chart data for Leads (Pie Chart)
  const leadsByStatus = leads?.reduce((acc: any, curr: any) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {})

  const leadStatusData = Object.entries(leadsByStatus || {}).map(([name, value]) => ({
    name: name === 'Lead' ? 'Aday' :
      name === 'Contacted' ? 'İletişimde' :
        name === 'Proposal' ? 'Teklif' :
          name === 'Negotiation' ? 'Pazarlık' :
            name === 'Sold' ? 'Kazanıldı' :

              name === 'Lost' ? 'Kaybedildi' : name,
    value: Number(value)
  }))

  // 6. Recent Activities
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('*, customers(name)')
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

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>

      {/* General Stock Stats - Moved from CRM */}
      <DashboardGeneralStats stats={stats.generalStats} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış Hacmi</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalSalesVolume)}
            </div>
            <p className="text-xs text-muted-foreground">+20.1% geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Fırsatlar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeads}</div>
            <p className="text-xs text-muted-foreground">Devam eden görüşmeler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satılık Üniteler</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableUnits}</div>
            <p className="text-xs text-muted-foreground">Stoktaki toplam bağımsız bölüm</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Müşteriler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Sisteme kayıtlı müşteriler</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">

        {/* Sales Chart (Client Component) */}
        <DashboardCharts salesData={stats.chartData} leadStatusData={stats.leadStatusData} />

        {/* Recent Activity */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Ekibinizin son zamanlardaki işlemleri.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {stats.recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz bir aktivite yok.</p>
              ) : (
                stats.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.customers?.name} ile {activity.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.summary}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
