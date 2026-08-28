'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format, isToday, isThisWeek, isThisMonth } from 'date-fns'
import { tr } from 'date-fns/locale'

export async function getSalesAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get total metrics
    const { data: sales } = await supabase
        .from('sales')
        .select(`
            id, 
            final_price, 
            status, 
            created_at,
            assigned_to,
            customer_id,
            profiles:assigned_to(full_name),
            customers(source)
        `)
        .limit(10000)

    if (!sales) return { error: 'No data' }

    // 2. Aggregate by Status (Mapped to Turkish Labels)
    // 2. Aggregate by Status (Mapped to Turkish Labels)
    const statusLabels: Record<string, string> = {
        'Lead': 'Aday',
        'Prospect': 'Fırsat',
        'Reservation': 'Opsiyonlu',
        'Opsiyon - Kapora Bekleniyor': 'Opsiyon (Kapora Bekleniyor)',
        'Proposal': 'Teklif Verildi',
        'Teklif - Kapora Bekleniyor': 'Teklif (Kapora Bekleniyor)',
        'Negotiation': 'Pazarlık',
        'Sold': 'Satıldı',
        'Contract': 'Sözleşme',
        'Completed': 'Kazanıldı',
        'Lost': 'Kaybedildi',
        'Cancelled': 'İptal Edildi',
        'Transferred': 'Devredildi',
        'Reserved': 'Rezerve'
    }

    const labelsDistribution = sales.reduce((acc: Record<string, number>, sale) => {
        const label = statusLabels[sale.status] || sale.status || 'Diğer'
        acc[label] = (acc[label] || 0) + 1
        return acc
    }, {})

    const pieData = Object.entries(labelsDistribution).map(([name, value]) => ({
        name,
        value
    }))

    // 3. Aggregate Monthly Revenue (Last 6 Months)
    const monthlyData: any[] = []
    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const monthStart = startOfMonth(date)
        const monthLabel = format(date, 'MMM', { locale: tr })

        const monthSales = sales.filter(s => {
            const sDate = new Date(s.created_at)
            return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear()
        })

        const revenue = monthSales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)
        const count = monthSales.length

        monthlyData.push({
            name: monthLabel,
            revenue: revenue / 1000000, // In Millions
            count
        })
    }

    // 4. Team Performance
    const teamPerformance = sales.reduce((acc: any, sale) => {
        const name = (sale.profiles as any)?.full_name || 'Atanmamış'
        if (!acc[name]) acc[name] = { name, sales: 0, revenue: 0 }
        acc[name].sales += 1
        acc[name].revenue += (Number(sale.final_price) || 0)
        return acc
    }, {})

    const teamData = Object.values(teamPerformance).sort((a: any, b: any) => b.revenue - a.revenue)

    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)
    // activeLeads should include all non-finalized leads (Lead, Prospect, Contacted, Proposal, etc.)
    const activeLeads = sales.filter(s =>
        !['Sold', 'Completed', 'Lost', 'Cancelled', 'Transferred'].includes(s.status || '')
    ).length
    const activeProspects = sales.filter(s => s.status === 'Prospect').length
    const conversionRate = sales.length > 0 ? (sales.filter(s => s.status === 'Sold' || s.status === 'Completed').length / sales.length) * 100 : 0

    // 5. Channel Distribution (Lead Source) - Calculated directly from joined customer source
    const channelDistribution = sales.reduce((acc: Record<string, number>, sale) => {
        const source = (sale.customers as any)?.source || 'Bilinmiyor'
        acc[source] = (acc[source] || 0) + 1
        return acc
    }, {})

    const channelData = Object.entries(channelDistribution).map(([name, value]) => ({
        name,
        value
    }))

    // 6. Enriched Sales List for Table View
    const enrichedSales = sales.map(s => ({
        ...s,
        customer_source: (s.customers as any)?.source || 'Bilinmiyor',
        sales_rep: (s.profiles as any)?.full_name || 'Atanmamış'
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
        totalRevenue,
        totalSales: sales.length,
        activeLeads,
        activeProspects,
        conversionRate,
        pieData,
        monthlyData,
        teamData,
        channelData,
        enrichedSales
    }
}

export async function getInventoryAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Projects with Unit counts
    const { data: projects } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            city,
            units(id, status, price, type)
        `)

    if (!projects) return { error: 'No projects' }

    // 2. Aggregate Project Stats
    const projectStats = projects.map(p => {
        const units = p.units as any[]
        const total = units.length
        const sold = units.filter(u => u.status === 'Sold').length
        const reserved = units.filter(u => u.status === 'Reserved').length
        const available = total - sold - reserved
        const totalValue = units.reduce((sum, u) => sum + (Number(u.price) || 0), 0)

        return {
            name: p.name,
            total,
            sold,
            reserved,
            available,
            occupancyRate: total > 0 ? (sold / total) * 100 : 0,
            value: totalValue / 1000000 // In Millions
        }
    })

    // 3. Aggregate by Unit Type (Total Stock)
    const typeDistribution: Record<string, number> = {}
    projects.forEach(p => {
        (p.units as any[]).forEach(u => {
            typeDistribution[u.type] = (typeDistribution[u.type] || 0) + 1
        })
    })

    const typeData = Object.entries(typeDistribution).map(([name, value]) => ({
        name,
        value
    }))

    const totalUnits = projectStats.reduce((sum, p) => sum + p.total, 0)
    const totalSold = projectStats.reduce((sum, p) => sum + p.sold, 0)
    const totalCurrentValue = projectStats.reduce((sum, p) => sum + p.value, 0)

    return {
        projectStats,
        typeData,
        totalUnits,
        totalSold,
        totalCurrentValue,
        availableUnits: totalUnits - totalSold
    }
}

export async function getFinancialAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Payment Items with details
    const { data: payments } = await supabase
        .from('payment_items')
        .select('*')
        .order('due_date', { ascending: true })

    if (!payments) return { error: 'No payment data' }

    // 2. Metrics
    const totalCollected = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const totalPending = payments
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const today = new Date()
    const totalOverdue = payments
        .filter(p => p.status === 'Pending' && new Date(p.due_date) < today)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    // 3. Monthly Projections (6 Months looking forward)
    const monthlyCashflow: any[] = []
    for (let i = 0; i < 6; i++) {
        const date = startOfMonth(subMonths(new Date(), -i))
        const monthStart = date
        const monthLabel = format(date, 'MMM', { locale: tr })

        const monthPayments = payments.filter(p => {
            const dDate = new Date(p.due_date)
            return dDate.getMonth() === date.getMonth() && dDate.getFullYear() === date.getFullYear()
        })

        const total = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        const collected = monthPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

        monthlyCashflow.push({
            name: monthLabel,
            total: total / 1000000,
            collected: collected / 1000000
        })
    }

    // 4. Status Legend Data
    const statusData = [
        { name: 'Tahsil Edildi', value: totalCollected, color: '#10b981' },
        { name: 'Bekleyen', value: totalPending - totalOverdue, color: '#3b82f6' },
        { name: 'Vadesi Geçmiş', value: totalOverdue, color: '#ef4444' }
    ]

    return {
        totalCollected,
        totalPending,
        totalOverdue,
        monthlyCashflow,
        statusData,
        vatMetrics: {
            totalVat: payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (Number(p.amount) * 0.1666), 0), // Assuming 20% inclusive
            pendingVat: totalPending * 0.1666
        }
    }
}

export async function getLossAnalytics() {
    const supabase = await createClient()

    const { data: sales } = await supabase
        .from('sales')
        .select('id, status, created_at')

    if (!sales) return { error: 'No sales data' }

    const total = sales.length
    const lost = sales.filter(s => s.status === 'Lost').length
    const cancelled = sales.filter(s => s.status === 'Cancelled').length
    const transferred = sales.filter(s => s.status === 'Transferred').length

    const lossRate = total > 0 ? ((lost + cancelled + transferred) / total) * 100 : 0

    const distribution = [
        { name: 'Kazanıldı', value: sales.filter(s => s.status === 'Sold' || s.status === 'Contract').length, color: '#10b981' },
        { name: 'Kaybedildi', value: lost, color: '#ef4444' },
        { name: 'İptal Edildi', value: cancelled, color: '#f97316' },
        { name: 'Devredildi', value: transferred, color: '#3b82f6' }
    ]

    return {
        total,
        lossRate,
        distribution,
        lost,
        cancelled,
        transferred
    }
}

export async function getDeliverySchedule() {
    const supabase = await createClient()

    const { data: units } = await supabase
        .from('units')
        .select('id, unit_number, delivery_date, projects(name)')
        .not('delivery_date', 'is', null)
        .order('delivery_date', { ascending: true })

    if (!units) return { error: 'No delivery data' }

    const schedule = units.reduce((acc: any[], unit) => {
        const date = new Date(unit.delivery_date)
        const monthLabel = format(date, 'MMMM yyyy', { locale: tr })

        const existing = acc.find(i => i.month === monthLabel)
        if (existing) {
            existing.units.push(unit)
            existing.count += 1
        } else {
            acc.push({ month: monthLabel, units: [unit], count: 1 })
        }
        return acc
    }, [])

    return schedule
}

export async function getActivityAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Activities (Last 30 days)
    const thirtyDaysAgo = subMonths(new Date(), 1).toISOString()
    const { data: activities } = await supabase
        .from('activities')
        .select(`
            id,
            type,
            status,
            outcome,
            created_at,
            owner_id,
            profiles:owner_id(full_name)
        `)
        .gte('created_at', thirtyDaysAgo)

    if (!activities) return { error: 'No activity data' }

    // 2. Activity Type Distribution
    const typeLabels: Record<string, string> = {
        'Call': 'Telefon',
        'Phone': 'Telefon',
        'Meeting': 'Toplantı',
        'Site Visit': 'Saha Gezisi',
        'Visit': 'Saha Gezisi',
        'Email': 'E-posta',
        'Whatsapp': 'Whatsapp',
        'Other': 'Diğer'
    }

    const typeDistribution = activities.reduce((acc: Record<string, number>, act) => {
        const label = typeLabels[act.type] || act.type || 'Diğer'
        acc[label] = (acc[label] || 0) + 1
        return acc
    }, {})

    const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
        name,
        value
    }))

    // 3. Daily Trend (Last 14 days)
    const dailyTrend: any[] = []
    for (let i = 13; i >= 0; i--) {
        const date = subMonths(new Date(), 0)
        date.setDate(date.getDate() - i)
        const dateKey = format(date, 'dd MMM', { locale: tr })

        const count = activities.filter(a => {
            const aDate = new Date(a.created_at)
            return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth()
        }).length

        dailyTrend.push({ name: dateKey, count })
    }

    // 4. Team Activity Ranking
    const teamActivity = activities.reduce((acc: any, act) => {
        const name = (act.profiles as any)?.full_name || 'Atanmamış'
        acc[name] = (acc[name] || 0) + 1
        return acc
    }, {})

    const teamData: { name: string, count: number }[] = Object.entries(teamActivity)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)

    const totalActivities = activities.length
    const completedActivities = activities.filter(a => a.status === 'Completed').length
    const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

    return {
        totalActivities,
        completedActivities,
        completionRate,
        pieData,
        dailyTrend,
        teamData
    }
}

export async function getMarketingAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch aggregated summaries from marketing database views (zero loops, extremely fast)
    const [channelSummaryRes, projectSummaryRes, campaignGroupedRes] = await Promise.all([
        supabase
            .from('marketing_channel_summary')
            .select('name, total, today, this_week, this_month')
            .order('total', { ascending: false }),
        supabase
            .from('marketing_project_summary')
            .select('name, total, today, this_week, this_month')
            .order('total', { ascending: false }),
        supabase
            .from('marketing_form_campaign_grouped')
            .select('form_name, channel, campaign, total, today, this_week, this_month, statuses')
    ])

    const channelSummary = channelSummaryRes.data || []
    const projectSummary = projectSummaryRes.data || []
    const campaignRows = campaignGroupedRes.data || []

    const channelData = channelSummary.map(row => ({
        name: row.name,
        total: row.total,
        today: row.today,
        thisWeek: row.this_week,
        thisMonth: row.this_month
    }))

    const projectData = projectSummary.map(row => ({
        name: row.name,
        total: row.total,
        today: row.today,
        thisWeek: row.this_week,
        thisMonth: row.this_month
    }))

    // Group and aggregate campaigns/statuses on Next.js side from the grouped SQL rows
    const leadsByForm: Record<string, any> = {}
    let totalMarketingLeads = 0

    campaignRows.forEach(row => {
        const formName = row.form_name || 'Diğer'
        totalMarketingLeads += row.total

        if (!leadsByForm[formName]) {
            leadsByForm[formName] = {
                formName,
                total: 0, today: 0, thisWeek: 0, thisMonth: 0,
                channel: row.channel,
                campaigns: {},
                statuses: {}
            }
        }

        const form = leadsByForm[formName]
        form.total += row.total
        form.today += row.today
        form.thisWeek += row.this_week
        form.thisMonth += row.this_month

        // Aggregate campaigns
        if (row.campaign) {
            form.campaigns[row.campaign] = (form.campaigns[row.campaign] || 0) + row.total
        }

        // Aggregate statuses
        if (row.statuses && typeof row.statuses === 'object') {
            Object.entries(row.statuses).forEach(([status, count]) => {
                form.statuses[status] = (form.statuses[status] || 0) + Number(count)
            })
        }
    })

    const statusLabels: Record<string, string> = {
        'Lead': 'Aday',
        'Prospect': 'Fırsat',
        'Reservation': 'Opsiyonlu',
        'Opsiyon - Kapora Bekleniyor': 'Opsiyon (Kapora Bekleniyor)',
        'Proposal': 'Teklif Verildi',
        'Teklif - Kapora Bekleniyor': 'Teklif (Kapora Bekleniyor)',
        'Negotiation': 'Pazarlık',
        'Sold': 'Satıldı',
        'Contract': 'Sözleşme',
        'Completed': 'Kazanıldı',
        'Lost': 'Kaybedildi',
        'Cancelled': 'İptal Edildi',
        'Transferred': 'Devredildi',
        'Reserved': 'Rezerve'
    }

    const formData = Object.values(leadsByForm).map((data: any) => {
        // Map status keys to Turkish labels
        const mappedStatuses: Record<string, number> = {}
        Object.entries(data.statuses).forEach(([status, count]) => {
            const label = statusLabels[status] || status || 'Diğer'
            mappedStatuses[label] = (mappedStatuses[label] || 0) + Number(count)
        })

        // Pick the most common campaign for display
        const topCampaign = Object.entries(data.campaigns)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([name]) => name)[0] || ''
        const campaignCount = Object.keys(data.campaigns).length

        return {
            formName: data.formName,
            total: data.total,
            today: data.today,
            thisWeek: data.thisWeek,
            thisMonth: data.thisMonth,
            channel: data.channel,
            campaign: campaignCount > 1 
                ? `${topCampaign} (+${campaignCount - 1} diğer)` 
                : topCampaign,
            campaigns: data.campaigns,
            statuses: mappedStatuses
        }
    }).sort((a, b) => b.total - a.total)

    return {
        totalMarketingLeads,
        formData,
        channelData,
        projectData,
    }
}

export async function getAdSourceAnalytics() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadıı' }

    const tenantId = profile.tenant_id
    
    // Yalnızca Novo Şirketler Grubu (89b2829e-fc21-477e-8fd8-9f9f0c587e81) için Meta entegrasyonu tanımlı
    const isNovoTenant = tenantId === '89b2829e-fc21-477e-8fd8-9f9f0c587e81'
    const metaToken = isNovoTenant ? process.env.META_ADS_ACCESS_TOKEN : null
    const adAccountId = isNovoTenant ? 'act_4061690447453961' : null

    let dailyCampaignInsights: any[] = []
    let metaConnected = false

    // 1. Fetch from Meta API if token is configured
    if (metaToken && adAccountId) {
        try {
            const metaApi = await import('@/lib/meta-api')
            dailyCampaignInsights = await metaApi.getCampaignDailyInsights(adAccountId, metaToken, 'last_30d')
            metaConnected = dailyCampaignInsights && dailyCampaignInsights.length > 0
        } catch (e) {
            console.error('Failed to fetch Meta daily campaign insights:', e)
        }
    }

    // 2. If Meta API is connected and fetched data, upsert into the DB table to accumulate data over time
    if (metaConnected && dailyCampaignInsights.length > 0) {
        try {
            const upsertRows = dailyCampaignInsights.map(row => ({
                tenant_id: tenantId,
                stat_date: row.date,
                campaign_name: row.campaign_name,
                status: row.status,
                spend: row.spend,
                impressions: row.impressions,
                clicks: row.clicks,
                ctr: row.ctr,
                leads: row.leads,
                cpl: row.cpl,
                updated_at: new Date().toISOString()
            }))

            await supabase
                .from('campaign_daily_stats')
                .upsert(upsertRows, { onConflict: 'tenant_id,stat_date,campaign_name' })
        } catch (e) {
            console.error('Failed to upsert campaign daily stats (table might not be created yet):', e)
        }
    }

    // 3. Try to read the accumulated daily campaign stats from DB
    let dbRows: any[] = []
    try {
        const { data, error } = await supabase
            .from('campaign_daily_stats')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('stat_date', { ascending: false })
            .limit(1000)
        if (!error && data) {
            dbRows = data
        }
    } catch (e) {
        console.error('campaign_daily_stats query failed:', e)
    }

    const mappedRows = dbRows.map(r => ({
        date: r.stat_date,
        campaign_name: r.campaign_name,
        status: r.status,
        spend: Number(r.spend),
        impressions: r.impressions,
        clicks: r.clicks,
        ctr: Number(r.ctr),
        leads: r.leads,
        cpl: Number(r.cpl)
    })).sort((a, b) => b.date.localeCompare(a.date) || b.spend - a.spend)

    return { rows: mappedRows }
}

export async function getSalesComparisonReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get all sold/completed units with their initial price and final sale price
    const { data, error } = await supabase
        .from('sales')
        .select(`
            id,
            final_price,
            currency,
            status,
            created_at,
            units (
                unit_number,
                price,
                currency,
                projects (name)
            ),
            customers (full_name)
        `)
        .in('status', ['Sold', 'Completed', 'Contract'])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Sales Comparison Error:', error)
        return { error: error.message }
    }

    const comparison = (data || []).map((sale: any) => {
        const unit = Array.isArray(sale.units) ? sale.units[0] : sale.units
        const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers
        const listPrice = unit?.price || 0
        const salePrice = sale.final_price || 0
        const diff = salePrice - listPrice
        const diffPercent = listPrice > 0 ? (diff / listPrice) * 100 : 0

        return {
            id: sale.id,
            project: unit?.projects?.name || (Array.isArray(unit?.projects) ? unit?.projects[0]?.name : '-'),
            unit: unit?.unit_number || '-',
            customer: customer?.full_name || '-',
            listPrice,
            salePrice,
            currency: sale.currency || unit?.currency || 'TRY',
            diff,
            diffPercent,
            date: sale.created_at
        }
    })

    return comparison
}

// ── Kampanya Bazlı Performans Raporu ──

export async function getOutreachWorkflowsList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return []

    const { data, error } = await supabase
        .from('outreach_workflows')
        .select('id, name, is_active, created_at, total_executions')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('getOutreachWorkflowsList error:', error)
        return []
    }
    return data || []
}

export async function getCampaignPerformanceReport(workflowId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const emptyResult = { leads: [], stats: { total: 0, callRequested: 0, optedOut: 0, noResponse: 0, hot: 0, warm: 0 } }
    if (!user) return emptyResult

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return emptyResult

    // 1. Kampanyanın tüm execution'larını sayfalı çek (1000 limit aşımı düzeltmesi)
    let allExecutions: any[] = []
    let page = 0
    const PAGE_SIZE = 1000
    while (true) {
        const { data: batch, error } = await supabase
            .from('outreach_executions')
            .select(`
                id, status, started_at, completed_at, customer_id,
                customers(id, full_name, phone, source),
                sales(id, status, assigned_to)
            `)
            .eq('workflow_id', workflowId)
            .eq('tenant_id', profile.tenant_id)
            .order('started_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (error) {
            console.error('getCampaignPerformanceReport error:', error)
            break
        }
        if (!batch || batch.length === 0) break
        allExecutions = allExecutions.concat(batch)
        if (batch.length < PAGE_SIZE) break
        page++
    }

    if (allExecutions.length === 0) return emptyResult

    // 2. Unique customer_id'leri + gönderim zamanlarını topla
    const customerIds = [...new Set(allExecutions.map(e => e.customer_id).filter(Boolean))]
    if (customerIds.length === 0) return emptyResult

    // customer_id → İLK gönderim zamanı (müşterinin bu kampanyadan ilk mesajı aldığı an)
    const customerSentAt: Record<string, string> = {}
    allExecutions.forEach(e => {
        if (e.customer_id && e.started_at) {
            if (!customerSentAt[e.customer_id] || e.started_at < customerSentAt[e.customer_id]) {
                customerSentAt[e.customer_id] = e.started_at
            }
        }
    })

    // 3. WhatsApp conversation_id'leri topla (mesaj sorgusu için)
    const customerConversationIds: Record<string, string> = {}
    for (let i = 0; i < customerIds.length; i += 50) {
        const chunk = customerIds.slice(i, i + 50)
        const { data: convs } = await supabase
            .from('whatsapp_conversations')
            .select('id, customer_id')
            .in('customer_id', chunk)
            .eq('tenant_id', profile.tenant_id)

        convs?.forEach(c => {
            if (c.customer_id) {
                customerConversationIds[c.customer_id] = c.id
            }
        })
    }

    // 4. Kampanya gönderiminden SONRA gelen TÜM inbound mesajları topla
    // Bu mesajlardan hem buton yanıtını hem yanıt durumunu belirleyeceğiz
    const convIds = Object.values(customerConversationIds).filter(Boolean)
    const convToCustomer: Record<string, string> = {}
    Object.entries(customerConversationIds).forEach(([custId, convId]) => { convToCustomer[convId] = custId })

    // Kampanyanın en SON gönderim tarihi (global filtre — en güncel batch)
    const allSentDates = Object.values(customerSentAt).filter(Boolean)
    const globalCutoff = allSentDates.length > 0
        ? new Date(Math.min(...allSentDates.map(d => new Date(d).getTime())) - 60000).toISOString()
        : new Date('2020-01-01').toISOString()

    // Müşteri bazlı mesaj yanıtları
    const customerReplies: Record<string, { buttonReply: string | null, buttonTime: string | null, hasReply: boolean, replyContent: string }> = {}
    // Sadece kampanya şablonundaki butonlar: "Beni Arayın" ve "Hayır, teşekkürler"
    const positiveKeywords = ['beni aray']
    const negativeKeywords = ['hayır', 'hayir']

    for (let i = 0; i < convIds.length; i += 50) {
        const chunk = convIds.slice(i, i + 50)
        const { data: msgs } = await supabase
            .from('whatsapp_messages')
            .select('conversation_id, content, created_at')
            .in('conversation_id', chunk)
            .eq('direction', 'inbound')
            .eq('sender_type', 'customer')
            .gte('created_at', globalCutoff)
            .order('created_at', { ascending: false })

        msgs?.forEach(m => {
            const custId = convToCustomer[m.conversation_id]
            if (!custId) return

            const sentAt = customerSentAt[custId]
            if (sentAt && new Date(m.created_at) < new Date(sentAt)) return // kampanyadan önce → atla

            if (!customerReplies[custId]) {
                customerReplies[custId] = { buttonReply: null, buttonTime: null, hasReply: false, replyContent: '' }
            }

            customerReplies[custId].hasReply = true
            if (!customerReplies[custId].replyContent) {
                customerReplies[custId].replyContent = m.content || ''
            }

            // Buton yanıtı — sadece kampanya butonları: "Beni Arayın" veya "Hayır"
            if (!customerReplies[custId].buttonReply) {
                const lower = (m.content || '').toLowerCase()
                if (positiveKeywords.some(kw => lower.includes(kw)) || negativeKeywords.some(kw => lower.includes(kw))) {
                    customerReplies[custId].buttonReply = m.content
                    customerReplies[custId].buttonTime = m.created_at
                }
            }
        })
    }

    // 5. Opt-out kayıtlarını kontrol et
    const customerPhones = allExecutions.map(e => (e.customers as any)?.phone).filter(Boolean)
    const optedOutPhones = new Set<string>()
    if (customerPhones.length > 0) {
        const normalizedPhones = [...new Set(customerPhones.map((p: string) => p.replace(/\D/g, '').slice(-10)))]
        for (let i = 0; i < normalizedPhones.length; i += 50) {
            const chunk = normalizedPhones.slice(i, i + 50)
            const { data: optouts } = await supabase
                .from('outreach_optouts')
                .select('phone')
                .in('phone', chunk.map((p: string) => `%${p}`))

            optouts?.forEach(o => {
                if (o.phone) optedOutPhones.add(o.phone.replace(/\D/g, '').slice(-10))
            })
        }
    }

    // 6. Atanmış temsilci profillerini topla
    const assignedToIds = [...new Set(allExecutions.map(e => (e.sales as any)?.assigned_to).filter(Boolean))]
    const repProfiles: Record<string, string> = {}
    if (assignedToIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', assignedToIds)

        profiles?.forEach(p => { repProfiles[p.id] = p.full_name || 'Bilinmiyor' })
    }

    // 7. Verileri birleştir — yanıt durumunu SADECE kampanya sonrası mesajlardan belirle
    const seen = new Set<string>()
    const leads = allExecutions
        .filter(e => {
            if (!e.customer_id || seen.has(e.customer_id)) return false
            seen.add(e.customer_id)
            return true
        })
        .map(e => {
            const customer = e.customers as any
            const sale = e.sales as any
            const phone = customer?.phone || ''
            const phoneNorm = phone.replace(/\D/g, '').slice(-10)
            const isOptedOut = optedOutPhones.has(phoneNorm)
            const assignedTo = sale?.assigned_to ? repProfiles[sale.assigned_to] || null : null
            const reply = customerReplies[e.customer_id!]
            const btnReply = reply?.buttonReply || null
            const btnReplyTime = reply?.buttonTime || null

            // Yanıt durumunu SADECE kampanya sonrası buton tıklamalarından belirle
            let responseStatus: string
            if (isOptedOut) {
                responseStatus = 'opted_out'
            } else if (!reply?.hasReply) {
                responseStatus = 'no_response'
            } else {
                const btnLower = (btnReply || '').toLowerCase()
                if (positiveKeywords.some(kw => btnLower.includes(kw))) {
                    responseStatus = 'call_requested'
                } else if (negativeKeywords.some(kw => btnLower.includes(kw))) {
                    responseStatus = 'opted_out'
                } else {
                    // Bir mesaj gelmiş ama buton tıklaması değil → warm (yanıt vermiş)
                    responseStatus = 'warm'
                }
            }

            return {
                id: e.id,
                customerId: e.customer_id,
                customerName: customer?.full_name || 'Bilinmiyor',
                customerPhone: phone,
                customerSource: customer?.source || '',
                executionStatus: e.status,
                startedAt: e.started_at,
                completedAt: e.completed_at,
                leadScore: responseStatus,
                responseStatus,
                assignedTo,
                saleStatus: sale?.status || null,
                buttonReply: btnReply,
                buttonReplyTime: btnReplyTime,
            }
        })

    // 8. İstatistikler
    const stats = {
        total: leads.length,
        callRequested: leads.filter(l => l.responseStatus === 'call_requested').length,
        optedOut: leads.filter(l => l.responseStatus === 'opted_out').length,
        noResponse: leads.filter(l => l.responseStatus === 'no_response').length,
        hot: leads.filter(l => l.responseStatus === 'hot').length,
        warm: leads.filter(l => l.responseStatus === 'warm').length,
    }

    return { leads, stats }
}

export async function getHotLeadsReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return []

    // ─── STEP 1: Fetch all hot/warm/call_requested conversations with customer join ───
    const { data: convs, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
            id,
            phone_number,
            lead_score,
            hot_lead_notified,
            created_at,
            updated_at,
            customer_id,
            customers (
                id,
                full_name,
                phone,
                source
            )
        `)
        .eq('tenant_id', profile.tenant_id)
        .in('lead_score', ['hot', 'warm', 'call_requested'])
        .order('updated_at', { ascending: false })

    if (error || !convs || convs.length === 0) {
        if (error) console.error('getHotLeadsReport error:', error)
        return []
    }

    // ─── STEP 2: Collect unmatched phones → batch lookup in customers table ───
    const unmatchedPhones: string[] = []
    const phoneToConvIds: Record<string, string[]> = {}

    convs.forEach(c => {
        if (!(c.customers as any)?.full_name && c.phone_number) {
            const last10 = c.phone_number.replace(/\D/g, '').slice(-10)
            if (last10.length >= 10) {
                unmatchedPhones.push(last10)
                if (!phoneToConvIds[last10]) phoneToConvIds[last10] = []
                phoneToConvIds[last10].push(c.id)
            }
        }
    })

    // Batch phone lookup (single query for all unmatched)
    const phoneMatches: Record<string, any> = {}
    if (unmatchedPhones.length > 0) {
        // Use OR filter with ilike for batch phone matching
        const uniquePhones = [...new Set(unmatchedPhones)]
        // Process in chunks of 50 to avoid query limits
        for (let i = 0; i < uniquePhones.length; i += 50) {
            const chunk = uniquePhones.slice(i, i + 50)
            const orFilter = chunk.map(p => `phone.ilike.%${p}%`).join(',')
            const { data: matches } = await supabase
                .from('customers')
                .select('id, full_name, phone, source')
                .or(orFilter)

            if (matches) {
                matches.forEach(m => {
                    const mLast10 = m.phone?.replace(/\D/g, '').slice(-10) || ''
                    if (mLast10) phoneMatches[mLast10] = m
                })
            }
        }
    }

    // ─── STEP 3: Batch fetch project names from lead_qualifications ───
    const allCustomerIds = convs
        .map(c => (c.customers as any)?.id || (c.customer_id))
        .filter(Boolean)

    // Also add phone-matched customer IDs
    Object.values(phoneMatches).forEach(m => {
        if (m.id && !allCustomerIds.includes(m.id)) {
            allCustomerIds.push(m.id)
        }
    })

    const projectMap: Record<string, string> = {}
    if (allCustomerIds.length > 0) {
        // Batch fetch all lead qualifications for these customers
        const uniqueCustomerIds = [...new Set(allCustomerIds)]
        for (let i = 0; i < uniqueCustomerIds.length; i += 100) {
            const chunk = uniqueCustomerIds.slice(i, i + 100)
            const { data: quals } = await supabase
                .from('lead_qualifications')
                .select(`customer_id, projects:project_id (name)`)
                .in('customer_id', chunk)
                .order('created_at', { ascending: false })

            if (quals) {
                quals.forEach(q => {
                    if (!projectMap[q.customer_id]) {
                        const projObj = q.projects as any
                        if (projObj) {
                            if (Array.isArray(projObj) && projObj.length > 0) {
                                projectMap[q.customer_id] = projObj[0].name || 'Genel'
                            } else if (projObj.name) {
                                projectMap[q.customer_id] = projObj.name
                            }
                        }
                    }
                })
            }
        }
    }

    // ─── STEP 4: Batch fetch recent messages (last 3 per conversation) ───
    const convIds = convs.map(c => c.id)
    const messageMap: Record<string, string> = {}
    
    // Fetch messages for all conversations in batch (limit total to prevent huge results)
    for (let i = 0; i < convIds.length; i += 50) {
        const chunk = convIds.slice(i, i + 50)
        const { data: messages } = await supabase
            .from('whatsapp_messages')
            .select('conversation_id, role, content, created_at')
            .in('conversation_id', chunk)
            .order('created_at', { ascending: false })
            .limit(chunk.length * 5) // ~5 messages per conversation

        if (messages) {
            // Group by conversation_id, keep only latest 3 per conversation
            const grouped: Record<string, any[]> = {}
            messages.forEach(m => {
                if (!grouped[m.conversation_id]) grouped[m.conversation_id] = []
                if (grouped[m.conversation_id].length < 3) {
                    grouped[m.conversation_id].push(m)
                }
            })

            Object.entries(grouped).forEach(([convId, msgs]) => {
                messageMap[convId] = msgs
                    .reverse()
                    .map(m => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 100).replace(/\n/g, ' ')}`)
                    .join(' | ')
            })
        }
    }

    // ─── STEP 5: Assemble results (no more DB queries) ───
    return convs.map(c => {
        let customerId = (c.customers as any)?.id || c.customer_id || null
        let customerName = (c.customers as any)?.full_name || ''
        let customerPhone = (c.customers as any)?.phone || c.phone_number
        let customerSource = (c.customers as any)?.source || 'WhatsApp'

        // Try phone match fallback
        if (!customerName && c.phone_number) {
            const last10 = c.phone_number.replace(/\D/g, '').slice(-10)
            const match = phoneMatches[last10]
            if (match) {
                customerName = match.full_name || ''
                customerPhone = match.phone || c.phone_number
                customerSource = match.source || 'WhatsApp'
                customerId = match.id
            }
        }

        return {
            id: c.id,
            customerName: customerName || 'Bilinmeyen Müşteri',
            customerPhone,
            customerSource,
            leadScore: c.lead_score,
            hotLeadNotified: c.hot_lead_notified,
            updatedAt: c.updated_at,
            createdAt: c.created_at,
            summary: messageMap[c.id] || '-',
            projectName: (customerId && projectMap[customerId]) || 'Genel'
        }
    })
}

export async function getOutreachCeoReportData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const workflowId = 'ea62719d-198e-4d1d-83c1-f008c9e2d583'

    // 1. Fetch all executions for this workflow
    const executions: any[] = []
    let page = 0
    const limit = 1000
    while (true) {
        const { data, error } = await supabase
            .from('outreach_executions')
            .select('status, customer_id, started_at, completed_at, current_step_order, current_retry_count')
            .eq('workflow_id', workflowId)
            .range(page * limit, (page + 1) * limit - 1)
        if (error || !data || data.length === 0) break
        executions.push(...data)
        if (data.length < limit) break
        page++
    }

    // 2. Fetch ALL logs for this workflow (no date filter — full campaign view)
    const allLogs: any[] = []
    let logsPage = 0
    const logsLimit = 1000
    while (true) {
        const { data, error } = await supabase
            .from('outreach_step_logs')
            .select(`
                id, channel, status, call_duration_seconds, call_outcome, call_summary, call_recording_url, external_id, executed_at,
                outreach_executions!inner(workflow_id)
            `)
            .eq('outreach_executions.workflow_id', workflowId)
            .range(logsPage * logsLimit, (logsPage + 1) * logsLimit - 1)
        if (error || !data || data.length === 0) break
        allLogs.push(...data)
        if (data.length < logsLimit) break
        logsPage++
    }

    // Calculate outcomes — use RELIABLE proxy fields
    // Vapi webhook does NOT populate call_duration_seconds, and status classification is unreliable.
    // Instead, use:
    //   - call_summary filled → real conversation happened (matches NetGSM >10s data)
    //   - call_recording_url filled but no summary → phone answered briefly then hung up
    //   - external_id NULL → call never reached Vapi (API failure) — EXCLUDED from counts
    //   - everything else with external_id → call placed but not answered (busy/no_answer)
    const allCallLogs = allLogs.filter(l => l.channel === 'ai_call')
    const whatsappLogs = allLogs.filter(l => l.channel === 'whatsapp')

    // Only count calls that actually reached the telco (have external_id)
    const callLogs = allCallLogs.filter(l => l.external_id)

    let konusulan = 0       // Real conversation (call_summary filled)
    let acipKapatan = 0     // Phone answered but hung up quickly (recording exists, no summary)
    let cevapsiz = 0        // No answer
    let mesgul = 0          // Busy signal

    callLogs.forEach(l => {
        if (l.call_summary) {
            konusulan++
        } else if (l.call_recording_url) {
            acipKapatan++
        } else if (l.status === 'busy' || l.call_outcome === 'busy') {
            mesgul++
        } else {
            cevapsiz++
        }
    })

    // Segment stats — use UNIQUE customers, not total execution rows
    const totalExecutionsCount = executions.length
    const uniqueCustomerIds = new Set(executions.map(e => e.customer_id).filter(Boolean))
    const uniqueCustomersCount = uniqueCustomerIds.size
    const duplicateExecutions = totalExecutionsCount - uniqueCustomersCount

    // De-duplicate status counts: for each unique customer, use the LATEST execution status
    const customerLatest = new Map<string, { status: string; started_at: string; current_step_order: number; current_retry_count: number }>()
    executions.forEach(e => {
        if (!e.customer_id) return
        const existing = customerLatest.get(e.customer_id)
        if (!existing || (e.started_at && e.started_at > (existing.started_at || ''))) {
            customerLatest.set(e.customer_id, e)
        }
    })

    const statusCounts: Record<string, number> = {
        active: 0,
        completed: 0,
        stopped: 0,
        converted: 0,
        waiting: 0
    }
    customerLatest.forEach(e => {
        if (e.status in statusCounts) {
            statusCounts[e.status]++
        }
    })

    // Queues — based on de-duplicated latest executions
    let firstCallPending = 0
    let retryPending = 0
    customerLatest.forEach(e => {
        if (e.status === 'active' && e.current_step_order === 1) {
            if (!e.current_retry_count || e.current_retry_count === 0) {
                firstCallPending++
            } else {
                retryPending++
            }
        }
    })

    // Date distribution — only real calls (with external_id)
    const dateDist: Record<string, number> = {}
    callLogs.forEach(l => {
        const date = l.executed_at ? l.executed_at.substring(0, 10) : 'unknown'
        dateDist[date] = (dateDist[date] || 0) + 1
    })

    return {
        totalExecutions: totalExecutionsCount,
        uniqueCustomers: uniqueCustomersCount,
        duplicateExecutions,
        statusCounts,
        firstCallPending,
        retryPending,
        resumptionCalls: callLogs.length,
        resumptionWhatsapp: whatsappLogs.length,
        resumptionBusy: mesgul,
        resumptionNoAnswer: cevapsiz,
        resumptionSpoke: konusulan,
        resumptionHungUp: acipKapatan,
        callDateDistribution: dateDist,
        segmentActiveTargets: uniqueCustomersCount
    }
}

export async function getOutreachCostReportData(workflowIdParam?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch tenant configuration
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const tenantId = profile?.tenant_id
    if (!tenantId) return { error: 'Tenant not found' }

    // Fetch all campaigns/workflows for the dropdown selector
    const { data: workflows } = await supabase
        .from('outreach_workflows')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name')

    const workflowId = workflowIdParam || 'all'
    let campaignName = 'Tüm Kampanyalar (Toplam)'
    let logs: any[] = []
    let totalUniqueCustomers = 0

    if (workflowId === 'all') {
        campaignName = 'Tüm Kampanyalar (Toplam)'

        // Fetch executions to count unique segment size
        const executions: any[] = []
        let execPage = 0
        const execLimit = 1000
        while (true) {
            const { data, error } = await supabase
                .from('outreach_executions')
                .select('status, customer_id, started_at')
                .eq('tenant_id', tenantId)
                .range(execPage * execLimit, (execPage + 1) * execLimit - 1)
            if (error || !data || data.length === 0) break
            executions.push(...data)
            if (data.length < execLimit) break
            execPage++
        }
        const uniqueCustomerIds = new Set(executions.map(e => e.customer_id).filter(Boolean))
        totalUniqueCustomers = uniqueCustomerIds.size

        // Fetch all outreach step logs for the tenant
        let page = 0
        const limit = 1000
        while (true) {
            const { data, error } = await supabase
                .from('outreach_step_logs')
                .select(`
                    id, channel, status, call_duration_seconds, call_outcome, 
                    call_recording_url, call_summary, cost_amount, executed_at, external_id,
                    outreach_executions!inner(customer_id, tenant_id)
                `)
                .eq('outreach_executions.tenant_id', tenantId)
                .range(page * limit, (page + 1) * limit - 1)

            if (error || !data || data.length === 0) break
            logs.push(...data)
            if (data.length < limit) break
            page++
        }
    } else if (workflowId === 'manual') {
        campaignName = 'Tekil Aramalar (Manuel AI)'

        // Fetch manual call activities
        const { data: activities, error } = await supabase
            .from('activities')
            .select('id, summary, description, created_at, customer_id, outcome')
            .eq('tenant_id', tenantId)
            .eq('type', 'Call')
            .ilike('summary', '%AI Arama%')
            .limit(10000)

        if (error) {
            console.error('Error fetching manual call activities:', error.message)
        }

        const uniqueCustomerIds = new Set((activities || []).map(a => a.customer_id).filter(Boolean))
        totalUniqueCustomers = uniqueCustomerIds.size

        // Map activities to the logs interface
        logs = (activities || []).map(act => {
            const summary = act.summary || ''
            const desc = act.description || ''
            
            let duration = 0
            let outcome = 'no_answer'
            let status = 'no_answer'
            
            if (summary.includes('Meşgul')) {
                outcome = 'busy'
                status = 'busy'
            } else if (summary.includes('Cevapsız') || summary.includes('Cevap Yok')) {
                outcome = 'no_answer'
                status = 'no_answer'
            } else if (summary.includes('Ulaşılamadı') || summary.includes('Başarısız')) {
                outcome = 'failed'
                status = 'failed'
            } else {
                outcome = 'success'
                status = 'answered'
                
                // Regex parsing for duration
                const dkMatch = summary.match(/(\d+)\s*dk/)
                const snMatch = summary.match(/(\d+)\s*sn/)
                
                let mins = 0
                let secs = 0
                
                if (dkMatch) mins = parseInt(dkMatch[1])
                if (snMatch) secs = parseInt(snMatch[1])
                
                duration = mins * 60 + secs
                if (duration === 0) {
                    duration = 30 // assume 30s default
                }
            }
            
            let cost = 0
            if (duration > 0) {
                cost = duration * (0.15 / 60)
            } else if (outcome === 'busy' || outcome === 'no_answer') {
                cost = 0.01
            }

            // Extract call recording URL from description if possible
            let recordingUrl = null
            const recMatch = desc.match(/Kayıt Dinle:\s*(https:\/\/[^\s]+)/)
            if (recMatch) {
                recordingUrl = recMatch[1]
            }
            
            return {
                id: act.id,
                channel: 'ai_call',
                status,
                call_duration_seconds: duration,
                call_outcome: outcome,
                call_recording_url: recordingUrl,
                call_summary: summary,
                cost_amount: cost,
                executed_at: act.created_at,
                external_id: 'manual',
                outreach_executions: {
                    customer_id: act.customer_id
                }
            }
        })
    } else {
        // Fetch specific campaign metadata
        const { data: workflow } = await supabase
            .from('outreach_workflows')
            .select('name')
            .eq('id', workflowId)
            .single()
        campaignName = workflow?.name || 'Seçili Kampanya'

        // Fetch executions to get target segment size
        const executions: any[] = []
        let execPage = 0
        const execLimit = 1000
        while (true) {
            const { data, error } = await supabase
                .from('outreach_executions')
                .select('status, customer_id, started_at')
                .eq('workflow_id', workflowId)
                .range(execPage * execLimit, (execPage + 1) * execLimit - 1)
            if (error || !data || data.length === 0) break
            executions.push(...data)
            if (data.length < execLimit) break
            execPage++
        }
        const uniqueCustomerIds = new Set(executions.map(e => e.customer_id).filter(Boolean))
        totalUniqueCustomers = uniqueCustomerIds.size

        // Fetch step logs for this campaign
        let page = 0
        const limit = 1000
        while (true) {
            const { data, error } = await supabase
                .from('outreach_step_logs')
                .select(`
                    id, channel, status, call_duration_seconds, call_outcome, 
                    call_recording_url, call_summary, cost_amount, executed_at, external_id,
                    outreach_executions!inner(customer_id)
                `)
                .eq('outreach_executions.workflow_id', workflowId)
                .range(page * limit, (page + 1) * limit - 1)

            if (error || !data || data.length === 0) break
            logs.push(...data)
            if (data.length < limit) break
            page++
        }
    }

    const callLogs = logs.filter(l => l.channel === 'ai_call')
    const whatsappLogs = logs.filter(l => l.channel === 'whatsapp')
    const smsLogs = logs.filter(l => l.channel === 'sms')

    // AI Call Cost calculations
    let recordedVapiCost = 0
    let estimatedVapiCost = 0
    let nullCostCallsCount = 0
    let answeredCallsCount = 0
    let unansweredCallsCount = 0
    let busyCallsCount = 0
    let failedCallsCount = 0
    let totalDurationSeconds = 0

    callLogs.forEach(l => {
        const cost = l.cost_amount
        if (cost !== null && cost !== undefined) {
            recordedVapiCost += cost
        } else {
            nullCostCallsCount++
            let est = 0
            if (l.call_duration_seconds && l.call_duration_seconds > 0) {
                est = l.call_duration_seconds * (0.15 / 60)
            } else if (l.call_summary) {
                est = 60 * (0.15 / 60) // 1 min estimate
            } else if (l.call_recording_url) {
                est = 30 * (0.15 / 60) // 30 sec estimate
            } else if (l.external_id) {
                est = 0.01 // flat 1 cent for call setups
            }
            estimatedVapiCost += est
        }

        // Duration accumulation
        if (l.call_duration_seconds && l.call_duration_seconds > 0) {
            totalDurationSeconds += l.call_duration_seconds
        } else if (l.call_summary) {
            totalDurationSeconds += 60 // assume 60s
        } else if (l.call_recording_url) {
            totalDurationSeconds += 30 // assume 30s
        }

        // Answered status check
        const wasAnswered = (l.call_duration_seconds && l.call_duration_seconds > 0) || l.call_recording_url != null || l.call_summary != null || l.status === 'answered' || l.status === 'converted' || l.call_outcome === 'success'
        if (wasAnswered) {
            answeredCallsCount++
        } else if (l.status === 'busy' || l.call_outcome === 'busy') {
            busyCallsCount++
        } else if (l.status === 'failed' || l.call_outcome === 'failed') {
            failedCallsCount++
        } else {
            unansweredCallsCount++
        }
    })

    const totalCallCost = recordedVapiCost + estimatedVapiCost
    const totalWhatsAppCost = whatsappLogs.length * 0.01
    const totalSmsCost = smsLogs.length * 0.01

    const totalCost = totalCallCost + totalWhatsAppCost + totalSmsCost

    // Cost Per Call calculations
    const avgCostPerCallAttempt = callLogs.length > 0 ? totalCallCost / callLogs.length : 0
    const avgCostPerAnsweredCall = answeredCallsCount > 0 ? totalCallCost / answeredCallsCount : 0
    const avgCallDurationSeconds = answeredCallsCount > 0 ? totalDurationSeconds / answeredCallsCount : 0

    // Unique reached customers from logs
    const uniqueReachedCustomerIds = new Set(logs.map(l => l.outreach_executions?.customer_id || (l as any).outreach_executions?.customer_id).filter(Boolean))
    const totalUniqueReached = uniqueReachedCustomerIds.size
    const costPerUniqueReach = totalUniqueReached > 0 ? totalCost / totalUniqueReached : 0
    const costPerTargetCustomer = totalUniqueCustomers > 0 ? totalCost / totalUniqueCustomers : 0

    // Daily distribution of costs for charting
    const dailySpendMap = new Map<string, { callCost: number, whatsappCost: number, smsCost: number, callCount: number, whatsappCount: number }>()

    logs.forEach(l => {
        const date = l.executed_at ? l.executed_at.substring(0, 10) : 'unknown'
        if (date === 'unknown') return

        if (!dailySpendMap.has(date)) {
            dailySpendMap.set(date, { callCost: 0, whatsappCost: 0, smsCost: 0, callCount: 0, whatsappCount: 0 })
        }
        const current = dailySpendMap.get(date)!

        if (l.channel === 'ai_call') {
            current.callCount++
            let cost = l.cost_amount
            if (cost === null || cost === undefined) {
                if (l.call_duration_seconds && l.call_duration_seconds > 0) {
                    cost = l.call_duration_seconds * (0.15 / 60)
                } else if (l.call_summary) {
                    cost = 60 * (0.15 / 60)
                } else if (l.call_recording_url) {
                    cost = 30 * (0.15 / 60)
                } else if (l.external_id) {
                    cost = 0.01
                } else {
                    cost = 0
                }
            }
            current.callCost += cost
        } else if (l.channel === 'whatsapp') {
            current.whatsappCount++
            current.whatsappCost += 0.01
        } else if (l.channel === 'sms') {
            current.smsCost += 0.01
        }
    })

    const dailySpend = Array.from(dailySpendMap.entries()).map(([date, data]) => ({
        date,
        callCost: parseFloat(data.callCost.toFixed(4)),
        whatsappCost: parseFloat(data.whatsappCost.toFixed(4)),
        smsCost: parseFloat(data.smsCost.toFixed(4)),
        totalCost: parseFloat((data.callCost + data.whatsappCost + data.smsCost).toFixed(4)),
        callCount: data.callCount,
        whatsappCount: data.whatsappCount
    })).sort((a, b) => a.date.localeCompare(b.date))

    return {
        campaignName,
        workflows: workflows || [],
        totalUniqueCustomers,
        totalUniqueReached,
        totalLogsCount: logs.length,
        totalCallsCount: callLogs.length,
        totalWhatsAppCount: whatsappLogs.length,
        totalSmsCount: smsLogs.length,
        answeredCallsCount,
        unansweredCallsCount,
        busyCallsCount,
        failedCallsCount,
        recordedVapiCost,
        estimatedVapiCost,
        totalCallCost,
        totalWhatsAppCost,
        totalSmsCost,
        totalCost,
        avgCostPerCallAttempt,
        avgCostPerAnsweredCall,
        avgCallDurationSeconds,
        costPerUniqueReach,
        costPerTargetCustomer,
        dailySpend,
        statusCounts: logs.reduce((acc: Record<string, number>, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1
            return acc
        }, {})
    }
}

export async function getMetaAutomationAnalytics(startDate?: string, endDate?: string, datePresetParam: string = 'last_30d') {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        const tenantId = profile?.tenant_id
        if (!tenantId) return { error: 'Tenant not found' }

        return fetchAdsAnalyticsData(supabase, tenantId, startDate, endDate, datePresetParam)
    } catch (error: any) {
        console.error("getMetaAutomationAnalytics uncaught error:", error)
        return {
            error: error?.message || String(error)
        }
    }
}

export async function fetchAdsAnalyticsData(
    supabase: any,
    tenantId: string,
    startDate?: string,
    endDate?: string,
    datePresetParam: string = 'last_30d'
) {
    // Parse dates for Supabase queries and Meta API
    let sinceDate: Date
    let untilDate: Date
    let datePreset: string | { since: string; until: string } = datePresetParam

    if (startDate && endDate) {
        sinceDate = new Date(`${startDate}T00:00:00.000Z`)
        untilDate = new Date(`${endDate}T23:59:59.999Z`)
        datePreset = { since: startDate, until: endDate }
    } else {
        sinceDate = new Date()
        if (datePresetParam === 'last_7d') {
            sinceDate.setDate(sinceDate.getDate() - 7)
        } else if (datePresetParam === 'this_month') {
            sinceDate = new Date(sinceDate.getFullYear(), sinceDate.getMonth(), 1)
        } else {
            // last_30d is default
            sinceDate.setDate(sinceDate.getDate() - 30)
        }
        sinceDate.setHours(0, 0, 0, 0)
        untilDate = new Date()
    }

    const periodDurationMs = untilDate.getTime() - sinceDate.getTime()
    const prevSinceDate = new Date(sinceDate.getTime() - periodDurationMs)
    const prevUntilDate = sinceDate

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    // ── 1. Meta Marketing API (via meta-api.ts client) ──
    const metaToken = process.env.META_ADS_ACCESS_TOKEN
    const adAccountId = 'act_4061690447453961' // NOVO Şirketler Grubu

    let metaConnected = false
    let accountSummary = { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, cpl: 0, cpm: 0, ctr: 0, cpc: 0, frequency: 0 }
    let campaigns: any[] = []
    let topAds: any[] = []
    let dailyBreakdown: any[] = []
    let leadForms: any[] = []

    if (metaToken) {
        try {
            // Dynamic import to keep the module tree-shakeable
            const metaApi = await import('@/lib/meta-api')
            const result = await metaApi.fetchMetaAdsAnalytics(adAccountId, metaToken, datePreset)
            metaConnected = result.connected
            accountSummary = result.accountSummary
            campaigns = result.campaigns
            topAds = result.topAds
            dailyBreakdown = result.dailyBreakdown
            leadForms = result.leadForms
        } catch (e) {
            console.error('Meta API analytics fetch failed:', e)
        }
    }

    // ── 2. Make.com Scenarios ──
    let makeScenarios: any[] = []
    let makeConnected = false

    try {
        const response = await fetch('https://eu1.make.com/api/v2/scenarios?organizationId=6505896&pg[limit]=100', {
            headers: {
                'Authorization': 'Token c208dab9-4f83-4bb6-94b7-3811c3e09628',
                'Content-Type': 'application/json'
            },
            next: { revalidate: 60 }
        })

        if (response.ok) {
            const result = await response.json()
            const rawScenarios = result.scenarios || []
            makeConnected = true
            makeScenarios = rawScenarios.map((s: any) => {
                let schedulingStr = 'polling'
                if (s.isInstant) schedulingStr = 'instant'
                else if (typeof s.scheduling === 'string') schedulingStr = s.scheduling
                else if (s.scheduling && typeof s.scheduling === 'object') {
                    schedulingStr = s.scheduling.type === 'indefinitely' || s.scheduling.interval ? 'polling' : 'instant'
                }
                return { id: s.id, name: s.name, active: s.isActive, scheduling: schedulingStr }
            })
        }
    } catch (e) {
        console.error('Failed to fetch Make.com scenarios:', e)
    }

    // ── 3. CRM Funnel Data (from Supabase) ──
    let crmConversions = 0
    let salesCount = 0

    let webStats = {
        leads: 0,
        leadsToday: 0,
        leadsPrev: 0,
        crmConversions: 0,
        sales: 0
    }

    let formQualityBreakdowns: any[] = []
    let overallQuality = {
        potansiyel: 0,
        olumlu: 0,
        cop: 0,
        total: 0
    }

    if (tenantId) {
        // ── 3a. Meta Ads CRM Data (Filtered by source) ──
        const { count: convCount } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('source', ['Facebook Ads', 'Instagram', 'Facebook', 'ig', 'fb'])
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        crmConversions = convCount || 0

        const { data: metaSalesData } = await supabase
            .from('sales')
            .select('id, customers(source)')
            .eq('tenant_id', tenantId)
            .in('status', ['Sold', 'Won', 'Contract', 'Contracted', 'Reserved', 'Optioned'])
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        salesCount = metaSalesData?.filter(
            (s: any) => s.customers && ['Facebook Ads', 'Instagram', 'Facebook', 'ig', 'fb'].includes(s.customers.source)
        ).length || 0

        // ── 3b. Web Form Leads & Funnel Data ──
        const { count: webCurrent } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('source', ['Website', 'WEB Form'])
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        const webLeadsCurrent = webCurrent || 0

        const { count: webToday } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('source', ['Website', 'WEB Form'])
            .gte('created_at', startOfToday.toISOString())

        const webLeadsToday = webToday || 0

        const { count: webPrev } = await supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .in('source', ['Website', 'WEB Form'])
                .gte('created_at', prevSinceDate.toISOString())
                .lt('created_at', prevUntilDate.toISOString())

        const webLeadsPrev = webPrev || 0

        const { count: webConv } = await supabase
            .from('customers')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('source', ['Website', 'WEB Form'])
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        const webConvCount = webConv || 0

        const { data: webSalesData } = await supabase
            .from('sales')
            .select('id, customers(source)')
            .eq('tenant_id', tenantId)
            .in('status', ['Sold', 'Won', 'Contract', 'Contracted', 'Reserved', 'Optioned'])
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        const webSalesCount = webSalesData?.filter(
            (s: any) => s.customers && ['Website', 'WEB Form'].includes(s.customers.source)
        ).length || 0

        webStats = {
            leads: webLeadsCurrent,
            leadsToday: webLeadsToday,
            leadsPrev: webLeadsPrev,
            crmConversions: webConvCount,
            sales: webSalesCount
        }

        // ── 3c. Form Quality Breakdowns (from leads table) ──
        const { data: leadsData } = await supabase
            .from('leads')
            .select('source, form_name, status')
            .eq('tenant_id', tenantId)
            .gte('created_at', sinceDate.toISOString())
            .lte('created_at', untilDate.toISOString())

        if (leadsData) {
            const mapStatusToCategory = (status: string | null): 'potansiyel' | 'olumlu' | 'cop' => {
                const s = (status || '').toLowerCase().trim()
                if (['new', 'prospect', 'aday'].includes(s)) return 'potansiyel'
                if (['contacted', 'qualified', 'won', 'sold', 'contract', 'contracted', 'reserved', 'optioned', 'gorusuldu', 'nitelikli'].includes(s)) return 'olumlu'
                if (['lost', 'trash', 'spam', 'unqualified', 'kaybedildi', 'cop'].includes(s)) return 'cop'
                return 'potansiyel'
            }

            const groups: Record<string, {
                name: string
                source: string
                isMeta: boolean
                total: number
                potansiyel: number
                olumlu: number
                cop: number
            }> = {}

            leadsData.forEach((lead: any) => {
                // Only include web form and Meta Ads lead sources in the breakdown
                const isMeta = ['Facebook Ads', 'Instagram', 'Facebook', 'ig', 'fb'].includes(lead.source || '')
                const isWeb = ['Website', 'WEB Form'].includes(lead.source || '')
                
                if (isMeta || isWeb) {
                    const name = lead.form_name || lead.source || 'Belirtilmemiş'
                    if (!groups[name]) {
                        groups[name] = {
                            name,
                            source: lead.source || 'Diğer',
                            isMeta,
                            total: 0,
                            potansiyel: 0,
                            olumlu: 0,
                            cop: 0
                        }
                    }

                    groups[name].total++
                    const cat = mapStatusToCategory(lead.status)
                    groups[name][cat]++

                    overallQuality.total++
                    overallQuality[cat]++
                }
            })

            formQualityBreakdowns = Object.values(groups).sort((a, b) => b.total - a.total)
        }
    }

    // ── 4. Build response ──
    return {
        connected: metaConnected,
        makeConnected,
        accountSummary,
        accountSummaryPrev: null,
        campaigns,
        topAds,
        dailyBreakdown,
        leadForms,
        funnel: {
            impressions: accountSummary.impressions,
            clicks: accountSummary.clicks,
            leads: accountSummary.leads,
            crmConversions,
            sales: salesCount,
        },
        webStats,
        makeScenarios,
        datePreset: typeof datePreset === 'string' ? datePreset : 'custom',
        formQualityBreakdowns,
        overallQuality,
    }
}


export async function getActivityTrackingReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant' }
    if (!['manager', 'admin', 'owner', 'crm_manager'].includes(profile.role)) return { error: 'Yetkisiz' }

    const now = new Date()

    // 1. Get all activities for this tenant (last 90 days for context)
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: activities } = await supabase
        .from('activities')
        .select(`
            id, type, status, outcome, summary, notes, priority,
            due_date, created_at, completed_at,
            owner_id,
            customer_id,
            profiles:owner_id(full_name),
            customers:customer_id(full_name, phone)
        `)
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', ninetyDaysAgo.toISOString())
        .order('due_date', { ascending: true })

    if (!activities) return { error: 'No activity data' }

    // 2. Get sales data for pipeline stage context
    const { data: sales } = await supabase
        .from('sales')
        .select('id, customer_id, status, project_id, projects(name), assigned_to, profiles!sales_assigned_to_fkey(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .not('status', 'in', '("Lost","Cancelled","Transferred")')

    const salesByCustomer: Record<string, any> = {}
    ;(sales || []).forEach(s => {
        salesByCustomer[s.customer_id] = {
            status: s.status,
            project: (s.projects as any)?.name || '-',
            assignedTo: (s.profiles as any)?.full_name || '-'
        }
    })

    // 3. Build per-rep data
    const repMap: Record<string, {
        name: string
        total: number
        completed: number
        planned: number
        overdue: number
        avgIdleDays: number
        lastActivityDate: string | null
        activities: any[]
    }> = {}

    const typeLabels: Record<string, string> = {
        'Call': 'Telefon', 'Phone': 'Telefon', 'Meeting': 'Toplantı',
        'Site Visit': 'Saha Gezisi', 'Visit': 'Saha Gezisi',
        'Email': 'E-posta', 'Whatsapp': 'WhatsApp', 'Other': 'Diğer'
    }

    const priorityLabels: Record<string, string> = {
        'High': 'Yüksek', 'Medium': 'Orta', 'Low': 'Düşük', 'Urgent': 'Acil'
    }

    for (const act of activities) {
        const repName = (act.profiles as any)?.full_name || 'Atanmamış'
        const repId = act.owner_id || 'unknown'

        if (!repMap[repId]) {
            repMap[repId] = {
                name: repName,
                total: 0, completed: 0, planned: 0, overdue: 0,
                avgIdleDays: 0, lastActivityDate: null,
                activities: []
            }
        }

        const rep = repMap[repId]
        rep.total++

        const isCompleted = act.status === 'Completed'
        const isPlanned = act.status === 'Planned' || act.status === 'Pending'
        const dueDate = act.due_date ? new Date(act.due_date) : null
        const isOverdue = isPlanned && dueDate && dueDate < now

        if (isCompleted) rep.completed++
        if (isPlanned) rep.planned++
        if (isOverdue) rep.overdue++

        // Track last activity
        if (!rep.lastActivityDate || new Date(act.created_at) > new Date(rep.lastActivityDate)) {
            rep.lastActivityDate = act.created_at
        }

        const customerName = (act.customers as any)?.full_name || '-'
        const customerPhone = (act.customers as any)?.phone || ''
        const saleInfo = act.customer_id ? salesByCustomer[act.customer_id] : null
        const daysSinceDue = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : null

        rep.activities.push({
            id: act.id,
            type: typeLabels[act.type] || act.type || 'Diğer',
            status: act.status,
            outcome: act.outcome || '-',
            summary: act.summary || act.notes || '-',
            priority: priorityLabels[act.priority] || act.priority || 'Orta',
            dueDate: act.due_date,
            createdAt: act.created_at,
            completedAt: act.completed_at,
            isOverdue: !!isOverdue,
            daysSinceDue,
            customerName,
            customerPhone,
            pipelineStage: saleInfo?.status || '-',
            projectName: saleInfo?.project || '-',
        })
    }

    // Calculate idle days for each rep
    const repData = Object.values(repMap).map(rep => {
        const idleDays = rep.lastActivityDate
            ? Math.floor((now.getTime() - new Date(rep.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999

        // Sort: overdue first, then by due_date ascending
        rep.activities.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1
            if (!a.isOverdue && b.isOverdue) return 1
            return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
        })

        return {
            ...rep,
            idleDays,
            completionRate: rep.total > 0 ? Math.round((rep.completed / rep.total) * 100) : 0,
        }
    }).sort((a, b) => b.overdue - a.overdue) // Reps with most overdue first

    // Summary stats
    const totalOverdue = repData.reduce((sum, r) => sum + r.overdue, 0)
    const totalPlanned = repData.reduce((sum, r) => sum + r.planned, 0)
    const totalCompleted = repData.reduce((sum, r) => sum + r.completed, 0)
    const totalActivities = repData.reduce((sum, r) => sum + r.total, 0)

    return {
        repData,
        summary: {
            totalReps: repData.length,
            totalActivities,
            totalCompleted,
            totalPlanned,
            totalOverdue,
            completionRate: totalActivities > 0 ? Math.round((totalCompleted / totalActivities) * 100) : 0
        }
    }
}

// ─── AI CALL PERFORMANCE REPORT ──────────────────────────────────
export async function getAICallPerformance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    // Fetch all outreach call logs with external_id (actual calls)
    const allLogs: any[] = []
    let page = 0
    while (true) {
        const { data, error } = await supabase
            .from('outreach_step_logs')
            .select(`id, channel, status, call_duration_seconds, call_outcome, call_summary, call_recording_url, external_id, executed_at, outreach_executions!inner(customer_id, tenant_id, customers(full_name, phone))`)
            .eq('channel', 'ai_call')
            .eq('outreach_executions.tenant_id', profile.tenant_id)
            .not('external_id', 'is', null)
            .order('executed_at', { ascending: false })
            .range(page * 1000, (page + 1) * 1000 - 1)
        if (error || !data || data.length === 0) break
        allLogs.push(...data)
        if (data.length < 1000) break
        page++
    }

    // Also fetch manual AI call activities
    const { data: manualCalls } = await supabase
        .from('activities')
        .select('id, summary, description, created_at, customer_id, customers(full_name, phone)')
        .eq('tenant_id', profile.tenant_id)
        .eq('type', 'Call')
        .ilike('summary', '%AI Arama%')
        .order('created_at', { ascending: false })
        .limit(5000)

    // Classify outreach logs
    let spoke = 0, noAnswer = 0, busy = 0, hungUp = 0
    let totalDuration = 0, durationCount = 0

    const leadScores: Record<string, number> = { hot: 0, warm: 0, follow_up: 0, disqualified: 0 }
    const dailyMap: Record<string, { spoke: number, noAnswer: number, busy: number }> = {}
    const hourlyMap: Record<string, { total: number, spoke: number }> = {}

    allLogs.forEach(l => {
        // Outcome
        if (l.call_summary) {
            spoke++
            // Parse lead score from summary
            const summary = (l.call_summary || '').toLowerCase()
            if (summary.includes('hot') || summary.includes('sıcak')) leadScores.hot++
            else if (summary.includes('warm') || summary.includes('ılık')) leadScores.warm++
            else if (summary.includes('follow') || summary.includes('takip')) leadScores.follow_up++
            else leadScores.disqualified++
        } else if (l.call_recording_url) {
            hungUp++
        } else if (l.status === 'busy' || l.call_outcome === 'busy') {
            busy++
        } else {
            noAnswer++
        }

        // Duration
        if (l.call_duration_seconds && l.call_duration_seconds > 0) {
            totalDuration += l.call_duration_seconds
            durationCount++
        }

        // Daily trend
        const day = l.executed_at?.substring(0, 10) || 'unknown'
        if (!dailyMap[day]) dailyMap[day] = { spoke: 0, noAnswer: 0, busy: 0 }
        if (l.call_summary) dailyMap[day].spoke++
        else if (l.status === 'busy' || l.call_outcome === 'busy') dailyMap[day].busy++
        else dailyMap[day].noAnswer++

        // Hourly
        if (l.executed_at) {
            const hour = new Date(l.executed_at).getHours().toString().padStart(2, '0') + ':00'
            if (!hourlyMap[hour]) hourlyMap[hour] = { total: 0, spoke: 0 }
            hourlyMap[hour].total++
            if (l.call_summary) hourlyMap[hour].spoke++
        }
    })

    // Add manual calls
    ;(manualCalls || []).forEach(mc => {
        const summary = mc.summary || ''
        if (summary.includes('Meşgul')) busy++
        else if (summary.includes('Cevapsız') || summary.includes('Cevap Yok')) noAnswer++
        else if (summary.includes('Ulaşılamadı') || summary.includes('Başarısız')) noAnswer++
        else spoke++

        const day = mc.created_at?.substring(0, 10) || 'unknown'
        if (!dailyMap[day]) dailyMap[day] = { spoke: 0, noAnswer: 0, busy: 0 }
        if (!summary.includes('Meşgul') && !summary.includes('Cevapsız') && !summary.includes('Ulaşılamadı') && !summary.includes('Başarısız')) {
            dailyMap[day].spoke++
        }
    })

    const totalCalls = spoke + noAnswer + busy + hungUp
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0
    const successRate = totalCalls > 0 ? Math.round((spoke / totalCalls) * 100) : 0

    // Format daily trend (last 14 days)
    const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, v]) => ({
            date: format(new Date(date + 'T00:00:00'), 'd MMM', { locale: tr }),
            ...v
        }))

    // Format hourly
    const hourlyPerformance = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0') + ':00'
        return { hour, ...(hourlyMap[hour] || { total: 0, spoke: 0 }) }
    }).filter(h => h.total > 0)

    // Recent calls (last 50)
    const recentCalls = allLogs.slice(0, 50).map(l => {
        const exec = l.outreach_executions as any
        const cust = exec?.customers as any
        let outcome = 'no_answer'
        if (l.call_summary) outcome = 'spoke'
        else if (l.call_recording_url) outcome = 'hung_up'
        else if (l.status === 'busy' || l.call_outcome === 'busy') outcome = 'busy'

        return {
            id: l.id,
            customerName: cust?.full_name || 'Bilinmeyen',
            phone: cust?.phone || '-',
            outcome,
            duration: l.call_duration_seconds,
            leadScore: l.call_outcome,
            summary: l.call_summary,
            recordingUrl: l.call_recording_url,
            externalId: l.external_id,
            executedAt: l.executed_at
        }
    })

    return {
        kpis: { totalCalls, spoke, noAnswer, busy, hungUp, avgDuration, successRate },
        outcomeDistribution: [
            { name: 'Konuşulan', value: spoke },
            { name: 'Cevapsız', value: noAnswer },
            { name: 'Meşgul', value: busy },
            { name: 'Açıp Kapatan', value: hungUp }
        ].filter(d => d.value > 0),
        dailyTrend,
        hourlyPerformance,
        leadScoreDistribution: [
            { name: 'Sıcak (HOT)', value: leadScores.hot },
            { name: 'Ilık (WARM)', value: leadScores.warm },
            { name: 'Takip', value: leadScores.follow_up },
            { name: 'Disqualified', value: leadScores.disqualified }
        ].filter(d => d.value > 0),
        recentCalls
    }
}

// ─── WHATSAPP ANALYTICS REPORT ──────────────────────────────────
export async function getWhatsAppAnalytics() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    // Fetch all conversations
    const { data: convs } = await supabase
        .from('whatsapp_conversations')
        .select('id, lead_score, created_at, updated_at, phone_number, customer_id, customers(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .order('updated_at', { ascending: false })

    // Fetch message counts per conversation
    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('conversation_id, role, created_at')
        .limit(50000)

    const allConvs = convs || []
    const allMsgs = messages || []

    // Message counts per conversation
    const msgCounts: Record<string, { total: number, user: number, ai: number }> = {}
    allMsgs.forEach(m => {
        if (!msgCounts[m.conversation_id]) msgCounts[m.conversation_id] = { total: 0, user: 0, ai: 0 }
        msgCounts[m.conversation_id].total++
        if (m.role === 'user') msgCounts[m.conversation_id].user++
        else msgCounts[m.conversation_id].ai++
    })

    // KPIs
    const totalConversations = allConvs.length
    const scoreDist: Record<string, number> = {}
    allConvs.forEach(c => {
        const s = c.lead_score || 'unknown'
        scoreDist[s] = (scoreDist[s] || 0) + 1
    })

    let totalMsgs = 0, totalUserMsgs = 0
    Object.values(msgCounts).forEach(v => { totalMsgs += v.total; totalUserMsgs += v.user })
    const avgMsgsPerConv = totalConversations > 0 ? Math.round(totalMsgs / totalConversations * 10) / 10 : 0
    const botResponseRate = totalMsgs > 0 ? Math.round(((totalMsgs - totalUserMsgs) / totalMsgs) * 100) : 0

    // Lead score distribution for chart
    const scoreLabels: Record<string, string> = { hot: '🔥 Sıcak', warm: '🍊 Ilık', cold: '❄️ Soğuk', disqualified: '❌ DQ', call_requested: '📞 Arama', unknown: '❓ Belirsiz' }
    const leadScoreChart = Object.entries(scoreDist)
        .map(([key, value]) => ({ name: scoreLabels[key] || key, value }))
        .sort((a, b) => b.value - a.value)

    // Daily trend (last 30 days)
    const dailyMap: Record<string, number> = {}
    allConvs.forEach(c => {
        const day = c.created_at?.substring(0, 10)
        if (day) dailyMap[day] = (dailyMap[day] || 0) + 1
    })
    const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, count]) => ({
            date: format(new Date(date + 'T00:00:00'), 'd MMM', { locale: tr }),
            count
        }))

    // Day of week distribution
    const dowMap: Record<string, number> = { 'Pzt': 0, 'Sal': 0, 'Çar': 0, 'Per': 0, 'Cum': 0, 'Cmt': 0, 'Paz': 0 }
    const dowNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    allConvs.forEach(c => {
        if (c.created_at) {
            const dow = new Date(c.created_at).getDay()
            dowMap[dowNames[dow]]++
        }
    })
    const dowChart = Object.entries(dowMap).map(([name, value]) => ({ name, value }))

    // Message length distribution
    const lengthBuckets = { '1 mesaj': 0, '2-5': 0, '6-10': 0, '10+': 0 }
    allConvs.forEach(c => {
        const count = msgCounts[c.id]?.total || 0
        if (count <= 1) lengthBuckets['1 mesaj']++
        else if (count <= 5) lengthBuckets['2-5']++
        else if (count <= 10) lengthBuckets['6-10']++
        else lengthBuckets['10+']++
    })
    const lengthChart = Object.entries(lengthBuckets).map(([name, value]) => ({ name, value }))

    // Recent conversations
    const recentConvs = allConvs.slice(0, 50).map(c => ({
        id: c.id,
        customerName: (c.customers as any)?.full_name || 'Bilinmeyen',
        phone: c.phone_number || '-',
        leadScore: c.lead_score,
        messageCount: msgCounts[c.id]?.total || 0,
        updatedAt: c.updated_at
    }))

    return {
        kpis: { totalConversations, avgMsgsPerConv, botResponseRate, totalMessages: totalMsgs },
        scoreDist,
        leadScoreChart,
        dailyTrend,
        dowChart,
        lengthChart,
        recentConvs
    }
}

// ─── PROJECT PERFORMANCE REPORT ──────────────────────────────────
export async function getProjectPerformance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('tenant_id', profile.tenant_id)
        .neq('status', 'Archived')

    const { data: units } = await supabase
        .from('units')
        .select('id, project_id, status, price, currency')

    const { data: sales } = await supabase
        .from('sales')
        .select('id, final_price, currency, status, created_at, units!inner(project_id)')

    const allProjects = projects || []
    const allUnits = units || []
    const allSales = sales || []

    // Calculate per-project stats
    const projectStats = allProjects.map(p => {
        const pUnits = allUnits.filter(u => u.project_id === p.id)
        const totalUnits = pUnits.length
        const soldUnits = pUnits.filter(u => u.status === 'Sold' || u.status === 'Delivered').length
        const forSaleUnits = pUnits.filter(u => u.status === 'For Sale' || u.status === 'Stock').length
        const reservedUnits = pUnits.filter(u => u.status === 'Reserved' || u.status === 'Option').length

        const pSales = allSales.filter(s => {
            const su = s.units as any
            return su?.project_id === p.id
        })
        const totalRevenue = pSales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)

        // Sales velocity (last 3 months)
        const threeMonthsAgo = subMonths(new Date(), 3)
        const recentSales = pSales.filter(s => new Date(s.created_at) > threeMonthsAgo)
        const monthlyVelocity = Math.round(recentSales.length / 3 * 10) / 10

        // Estimated depletion
        const depletionMonths = monthlyVelocity > 0 ? Math.round(forSaleUnits / monthlyVelocity) : null

        const occupancyRate = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0

        return {
            id: p.id,
            name: p.name,
            totalUnits,
            soldUnits,
            forSaleUnits,
            reservedUnits,
            totalRevenue,
            monthlyVelocity,
            depletionMonths,
            occupancyRate,
            salesCount: pSales.length
        }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Monthly sales trend by project (last 6 months)
    const monthlySales: Record<string, Record<string, number>> = {}
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i)
        const monthKey = format(monthDate, 'MMM yy', { locale: tr })
        monthlySales[monthKey] = {}
        allProjects.forEach(p => { monthlySales[monthKey][p.name] = 0 })
    }

    allSales.forEach(s => {
        const monthKey = format(new Date(s.created_at), 'MMM yy', { locale: tr })
        const su = s.units as any
        const pName = allProjects.find(p => p.id === su?.project_id)?.name
        if (pName && monthlySales[monthKey]) {
            monthlySales[monthKey][pName] = (monthlySales[monthKey][pName] || 0) + 1
        }
    })

    const monthlyTrend = Object.entries(monthlySales).map(([month, projects]) => ({
        month,
        ...projects
    }))

    return { projectStats, monthlyTrend, projectNames: allProjects.map(p => p.name) }
}

// ─── BROKER PERFORMANCE REPORT ──────────────────────────────────
export async function getBrokerPerformance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    // Get all brokers/team
    const { data: team } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile.tenant_id)
        .in('role', ['broker', 'sales_rep', 'manager', 'owner', 'crm_manager'])

    // Get sales with owner
    const { data: sales } = await supabase
        .from('sales')
        .select('id, final_price, currency, status, created_at, owner_id')

    // Get activities last 30 days
    const thirtyDaysAgo = subMonths(new Date(), 1).toISOString()
    const { data: activities } = await supabase
        .from('activities')
        .select('id, type, owner_id, created_at, status')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', thirtyDaysAgo)

    const allTeam = team || []
    const allSales = sales || []
    const allActs = activities || []

    const brokerStats = allTeam.map(member => {
        const memberSales = allSales.filter(s => s.owner_id === member.id)
        const soldSales = memberSales.filter(s => ['Sold', 'Completed', 'Contract'].includes(s.status))
        const totalRevenue = soldSales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)

        const memberActs = allActs.filter(a => a.owner_id === member.id)
        const calls = memberActs.filter(a => a.type === 'Call' || a.type === 'Phone').length
        const meetings = memberActs.filter(a => a.type === 'Meeting' || a.type === 'Site Visit' || a.type === 'Visit').length
        const others = memberActs.length - calls - meetings

        const lastActivity = memberActs.length > 0
            ? memberActs.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at
            : null

        return {
            id: member.id,
            name: member.full_name || 'İsimsiz',
            role: member.role,
            salesCount: soldSales.length,
            totalLeads: memberSales.length,
            totalRevenue,
            activityCount: memberActs.length,
            calls,
            meetings,
            others,
            lastActivity,
            conversionRate: memberSales.length > 0 ? Math.round((soldSales.length / memberSales.length) * 100) : 0
        }
    }).sort((a, b) => b.salesCount - a.salesCount)

    // Top 10 by sales
    const topBySales = brokerStats.slice(0, 10).map(b => ({ name: b.name.split(' ')[0], value: b.salesCount }))
    const topByRevenue = [...brokerStats].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10).map(b => ({
        name: b.name.split(' ')[0],
        value: Math.round(b.totalRevenue / 1000000 * 100) / 100
    }))

    return { brokerStats, topBySales, topByRevenue }
}

// ─── LEAD FUNNEL REPORT ──────────────────────────────────────────
export async function getLeadFunnel() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    const { data: sales } = await supabase
        .from('sales')
        .select('id, status, created_at')

    const allSales = sales || []
    const statusMap: Record<string, number> = {}
    allSales.forEach(s => {
        statusMap[s.status] = (statusMap[s.status] || 0) + 1
    })

    // Define funnel stages
    const funnel = [
        { stage: 'Lead', count: statusMap['Lead'] || 0, color: '#3b82f6' },
        { stage: 'Prospect', count: statusMap['Prospect'] || 0, color: '#6366f1' },
        { stage: 'Teklif', count: (statusMap['Proposal'] || 0) + (statusMap['Teklif - Kapora Bekleniyor'] || 0), color: '#8b5cf6' },
        { stage: 'Opsiyon', count: (statusMap['Reservation'] || 0) + (statusMap['Opsiyon - Kapora Bekleniyor'] || 0) + (statusMap['Reserved'] || 0), color: '#a855f7' },
        { stage: 'Pazarlık', count: statusMap['Negotiation'] || 0, color: '#d946ef' },
        { stage: 'Sözleşme', count: statusMap['Contract'] || 0, color: '#ec4899' },
        { stage: 'Satış', count: (statusMap['Sold'] || 0) + (statusMap['Completed'] || 0), color: '#10b981' },
    ]

    // Conversion rates between stages
    const conversions = funnel.map((stage, i) => {
        if (i === 0) return { ...stage, conversionFromPrev: 100 }
        const prev = funnel[i - 1].count
        return { ...stage, conversionFromPrev: prev > 0 ? Math.round((stage.count / prev) * 100) : 0 }
    })

    // Lost/cancelled
    const lost = (statusMap['Lost'] || 0) + (statusMap['Cancelled'] || 0) + (statusMap['Transferred'] || 0)

    return { funnel: conversions, totalSales: allSales.length, lost, statusMap }
}

// ─── MAYA TRACKING REPORT ──────────────────────────────────────────
export async function getMayaTracking() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    const MAYA_USER_ID = '66a35e7c-1c1f-4b79-b8cc-ccf52042c279'

    const { data: tasks } = await supabase
        .from('activities')
        .select('id, summary, description, status, priority, due_date, created_at, customer_id, customers(full_name, phone)')
        .eq('tenant_id', profile.tenant_id)
        .eq('owner_id', MAYA_USER_ID)
        .order('created_at', { ascending: false })

    const allTasks = tasks || []

    if (allTasks.length === 0) {
        return { isEmpty: true, kpis: { total: 0, pending: 0, completed: 0, overdue: 0, completionRate: 0, todayTasks: 0 }, tasks: [], dailyTrend: [], statusChart: [] }
    }

    const now = new Date()
    const pending = allTasks.filter(t => t.status === 'Pending').length
    const completed = allTasks.filter(t => t.status === 'Completed').length
    const overdue = allTasks.filter(t => t.status === 'Pending' && t.due_date && new Date(t.due_date) < now).length
    const todayTasks = allTasks.filter(t => t.due_date && isToday(new Date(t.due_date))).length
    const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0

    // Daily trend
    const dailyMap: Record<string, number> = {}
    allTasks.forEach(t => {
        const day = t.created_at?.substring(0, 10)
        if (day) dailyMap[day] = (dailyMap[day] || 0) + 1
    })
    const dailyTrend = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, count]) => ({
            date: format(new Date(date + 'T00:00:00'), 'd MMM', { locale: tr }),
            count
        }))

    const statusChart = [
        { name: 'Bekleyen', value: pending - overdue, color: '#f97316' },
        { name: 'Geciken', value: overdue, color: '#ef4444' },
        { name: 'Tamamlanan', value: completed, color: '#10b981' },
    ].filter(d => d.value > 0)

    const formattedTasks = allTasks.slice(0, 50).map(t => ({
        id: t.id,
        summary: t.summary,
        customerName: (t.customers as any)?.full_name || 'Bilinmeyen',
        phone: (t.customers as any)?.phone || '-',
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
        createdAt: t.created_at,
        isOverdue: t.status === 'Pending' && t.due_date && new Date(t.due_date) < now
    }))

    return {
        isEmpty: false,
        kpis: { total: allTasks.length, pending, completed, overdue, completionRate, todayTasks },
        tasks: formattedTasks,
        dailyTrend,
        statusChart
    }
}

// ─── PERIOD COMPARISON REPORT ──────────────────────────────────────
export async function getPeriodComparison() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant' }

    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = thisMonthStart

    // Sales
    const { data: sales } = await supabase
        .from('sales')
        .select('id, final_price, status, created_at')
        .gte('created_at', subMonths(now, 6).toISOString())

    // Activities
    const { data: activities } = await supabase
        .from('activities')
        .select('id, created_at')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', subMonths(now, 6).toISOString())

    // Customers (new leads)
    const { data: customers } = await supabase
        .from('customers')
        .select('id, created_at')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', subMonths(now, 6).toISOString())

    const allSales = sales || []
    const allActs = activities || []
    const allCusts = customers || []

    // This month vs last month
    const thisMonthSales = allSales.filter(s => new Date(s.created_at) >= thisMonthStart)
    const lastMonthSales = allSales.filter(s => new Date(s.created_at) >= lastMonthStart && new Date(s.created_at) < lastMonthEnd)

    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)
    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + (Number(s.final_price) || 0), 0)

    const thisMonthActs = allActs.filter(a => new Date(a.created_at) >= thisMonthStart).length
    const lastMonthActs = allActs.filter(a => new Date(a.created_at) >= lastMonthStart && new Date(a.created_at) < lastMonthEnd).length

    const thisMonthLeads = allCusts.filter(c => new Date(c.created_at) >= thisMonthStart).length
    const lastMonthLeads = allCusts.filter(c => new Date(c.created_at) >= lastMonthStart && new Date(c.created_at) < lastMonthEnd).length

    const calcChange = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0

    const comparison = {
        sales: { thisMonth: thisMonthSales.length, lastMonth: lastMonthSales.length, change: calcChange(thisMonthSales.length, lastMonthSales.length) },
        revenue: { thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue, change: calcChange(thisMonthRevenue, lastMonthRevenue) },
        activities: { thisMonth: thisMonthActs, lastMonth: lastMonthActs, change: calcChange(thisMonthActs, lastMonthActs) },
        leads: { thisMonth: thisMonthLeads, lastMonth: lastMonthLeads, change: calcChange(thisMonthLeads, lastMonthLeads) }
    }

    // 6-month trend
    const sixMonthTrend = []
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const mStart = startOfMonth(monthDate)
        const mEnd = i > 0 ? startOfMonth(subMonths(now, i - 1)) : now
        const label = format(monthDate, 'MMM yy', { locale: tr })

        sixMonthTrend.push({
            month: label,
            sales: allSales.filter(s => new Date(s.created_at) >= mStart && new Date(s.created_at) < mEnd).length,
            revenue: Math.round(allSales.filter(s => new Date(s.created_at) >= mStart && new Date(s.created_at) < mEnd).reduce((sum, s) => sum + (Number(s.final_price) || 0), 0) / 1000000 * 100) / 100,
            leads: allCusts.filter(c => new Date(c.created_at) >= mStart && new Date(c.created_at) < mEnd).length,
            activities: allActs.filter(a => new Date(a.created_at) >= mStart && new Date(a.created_at) < mEnd).length
        })
    }

    return { comparison, sixMonthTrend }
}


export async function getCrmStatistics() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı�' }

    return {
        kpis: {
            totalCustomers: 0,
            totalLeads: 0,
            conversionRate: 0,
            newCustomersThisMonth: 0,
            newLeadsThisMonth: 0,
            avgConversionDays: 0,
            convertedLeads: 0
        },
        projectLeadDist: [],
        monthlyTrend: [],
        utm: {
            utmSourceDist: [],
            utmCampaignDist: [],
            utmMediumDist: []
        }
    }
}
