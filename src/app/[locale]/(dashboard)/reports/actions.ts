'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, subMonths, format } from 'date-fns'
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
            profiles:assigned_to(full_name)
        `)

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
    const activeLeads = sales.filter(s => s.status === 'Lead').length
    const conversionRate = sales.length > 0 ? (sales.filter(s => s.status === 'Sold').length / sales.length) * 100 : 0

    // 5. Channel Distribution (Lead Source)
    // We need to fetch customer sources for this
    const { data: customers } = await supabase
        .from('customers')
        .select('id, source')

    const sourceMap: Record<string, string> = {}
    customers?.forEach(c => sourceMap[c.id] = c.source || 'Bilinmiyor')

    const channelDistribution = sales.reduce((acc: Record<string, number>, sale) => {
        const source = sourceMap[sale.customer_id] || 'Bilinmiyor'
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
        customer_source: sourceMap[s.customer_id] || 'Bilinmiyor',
        sales_rep: (s.profiles as any)?.full_name || 'Atanmamış'
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
        totalRevenue,
        totalSales: sales.length,
        activeLeads,
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
