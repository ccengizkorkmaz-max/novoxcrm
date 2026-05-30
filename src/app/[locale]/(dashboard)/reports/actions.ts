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

export async function getHotLeadsReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user's tenant_id from profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return []

    // Fetch conversations scored as hot, warm, or call_requested for this tenant
    const { data: convs, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
            id,
            phone_number,
            lead_score,
            hot_lead_notified,
            created_at,
            updated_at,
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

    if (error) {
        console.error('getHotLeadsReport error:', error)
        return []
    }

    // Match unmatched sessions with customers table by last 10 digits
    const formattedConvs = []
    for (const c of (convs || [])) {
        let customerId = (c.customers as any)?.id || null
        let customerName = (c.customers as any)?.full_name || ''
        let customerPhone = (c.customers as any)?.phone || c.phone_number
        let customerSource = (c.customers as any)?.source || 'WhatsApp'

        if (!customerName && c.phone_number) {
            const last10 = c.phone_number.replace(/\D/g, '').slice(-10)
            if (last10.length >= 10) {
                const { data: matches } = await supabase
                    .from('customers')
                    .select('id, full_name, phone, source')
                    .ilike('phone', `%${last10}%`)
                    .limit(1)
                if (matches && matches.length > 0) {
                    customerName = matches[0].full_name || ''
                    customerPhone = matches[0].phone || c.phone_number
                    customerSource = matches[0].source || 'WhatsApp'
                    customerId = matches[0].id
                }
            }
        }

        // Fetch interested project from lead_qualifications
        let projectName = 'Genel'
        if (customerId) {
            const { data: qual } = await supabase
                .from('lead_qualifications')
                .select(`
                    projects:project_id (
                        name
                    )
                `)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            const projObj = qual?.projects as any
            if (projObj) {
                if (Array.isArray(projObj) && projObj.length > 0) {
                    projectName = projObj[0].name || 'Genel'
                } else if (projObj.name) {
                    projectName = projObj.name
                }
            }
        }

        // Fetch recent messages to show a quick excerpt
        const { data: recentMessages } = await supabase
            .from('whatsapp_messages')
            .select('role, content, created_at')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(5)

        let summary = ''
        if (recentMessages && recentMessages.length > 0) {
            summary = recentMessages
                .reverse()
                .map(m => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 100).replace(/\n/g, ' ')}`)
                .join(' | ')
        }

        formattedConvs.push({
            id: c.id,
            customerName: customerName || 'Bilinmeyen Müşteri',
            customerPhone,
            customerSource,
            leadScore: c.lead_score,
            hotLeadNotified: c.hot_lead_notified,
            updatedAt: c.updated_at,
            createdAt: c.created_at,
            summary: summary || '-',
            projectName
        })
    }

    return formattedConvs
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


