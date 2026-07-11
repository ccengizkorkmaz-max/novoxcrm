'use server'

import { createClient } from '@/lib/supabase/server'

interface SaleJourney {
    saleId: string
    customerName: string
    projectName: string
    unitNumber: string
    finalPrice: number
    currency: string
    saleDate: string
    status: string
    assignedTo: string
    // Attribution
    leadSource: string
    firstContact: string | null
    outreachTouches: number
    mayaCalls: number
    mayaContributed: boolean
    whatsappMessages: number
    daysToClose: number
    lastOutreachBefore: string | null
}

interface AttributionSummary {
    totalRevenue: number
    totalSales: number
    mayaContributedRevenue: number
    mayaContributedCount: number
    mayaContributionRate: number
    avgDaysToClose: number
    avgTouchesBeforeSale: number
    channelBreakdown: {
        channel: string
        revenue: number
        count: number
        avgTouches: number
    }[]
    monthlyTrend: {
        month: string
        revenue: number
        mayaRevenue: number
        sales: number
    }[]
    topPerformingSource: string
    journeys: SaleJourney[]
}

export async function getRevenueAttribution(tenantId: string): Promise<AttributionSummary> {
    const supabase = await createClient()

    // 1. Fetch all sales with customer info (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: sales } = await supabase
        .from('sales')
        .select(`
            id, final_price, currency, status, created_at,
            customer_id,
            customers(full_name, source, created_at),
            units(unit_number, block),
            projects:project_id(name),
            profiles:assigned_to(full_name)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', sixMonthsAgo.toISOString())
        .not('final_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500)

    if (!sales || sales.length === 0) {
        return emptyResult()
    }

    // 2. Fetch outreach step logs for all customers in these sales
    const customerIds = [...new Set(sales.map(s => s.customer_id).filter(Boolean))]

    const { data: outreachLogs } = await supabase
        .from('outreach_step_logs')
        .select('customer_id, channel, status, call_outcome, executed_at')
        .in('customer_id', customerIds.slice(0, 200))
        .order('executed_at', { ascending: true })

    // Build lookup: customer_id -> logs
    const logsByCustomer: Record<string, any[]> = {}
    for (const log of (outreachLogs || [])) {
        if (!logsByCustomer[log.customer_id]) logsByCustomer[log.customer_id] = []
        logsByCustomer[log.customer_id].push(log)
    }

    // 3. Build journeys
    const journeys: SaleJourney[] = []
    let totalRevenue = 0
    let mayaContributedRevenue = 0
    let mayaContributedCount = 0
    let totalDaysToClose = 0
    let totalTouches = 0
    const channelMap: Record<string, { revenue: number; count: number; touches: number }> = {}
    const monthlyMap: Record<string, { revenue: number; mayaRevenue: number; sales: number }> = {}
    const sourceCount: Record<string, number> = {}

    for (const sale of sales) {
        const price = sale.final_price || 0
        const custId = sale.customer_id
        const logs = custId ? (logsByCustomer[custId] || []) : []
        const customer = sale.customers as any
        const saleDate = new Date(sale.created_at)
        const customerCreated = customer?.created_at ? new Date(customer.created_at) : saleDate
        const daysToClose = Math.max(0, Math.round((saleDate.getTime() - customerCreated.getTime()) / (1000 * 60 * 60 * 24)))

        const mayaCalls = logs.filter((l: any) => l.channel === 'ai_call' && l.status === 'sent').length
        const whatsappMessages = logs.filter((l: any) => l.channel === 'whatsapp' && l.status === 'sent').length
        const outreachTouches = logs.length
        const mayaContributed = mayaCalls > 0

        // First contact from outreach
        const firstLog = logs[0]
        const lastLogBeforeSale = [...logs].reverse().find((l: any) =>
            new Date(l.executed_at) <= saleDate
        )

        const source = customer?.source || 'unknown'
        const project = (sale.projects as any)?.name || '-'
        const unit = (sale.units as any)?.unit_number || '-'

        journeys.push({
            saleId: sale.id,
            customerName: customer?.full_name || '-',
            projectName: project,
            unitNumber: unit,
            finalPrice: price,
            currency: sale.currency || 'TRY',
            saleDate: sale.created_at,
            status: sale.status,
            assignedTo: (sale.profiles as any)?.full_name || '-',
            leadSource: source,
            firstContact: firstLog?.executed_at || null,
            outreachTouches,
            mayaCalls,
            mayaContributed,
            whatsappMessages,
            daysToClose,
            lastOutreachBefore: lastLogBeforeSale?.executed_at || null
        })

        totalRevenue += price
        totalDaysToClose += daysToClose
        totalTouches += outreachTouches

        if (mayaContributed) {
            mayaContributedRevenue += price
            mayaContributedCount++
        }

        // Channel breakdown — primary channel = most frequent
        const primaryChannel = mayaCalls > whatsappMessages ? 'ai_call' :
            whatsappMessages > 0 ? 'whatsapp' : 'direct'
        if (!channelMap[primaryChannel]) channelMap[primaryChannel] = { revenue: 0, count: 0, touches: 0 }
        channelMap[primaryChannel].revenue += price
        channelMap[primaryChannel].count++
        channelMap[primaryChannel].touches += outreachTouches

        // Monthly trend
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, mayaRevenue: 0, sales: 0 }
        monthlyMap[monthKey].revenue += price
        monthlyMap[monthKey].sales++
        if (mayaContributed) monthlyMap[monthKey].mayaRevenue += price

        // Source tracking
        sourceCount[source] = (sourceCount[source] || 0) + 1
    }

    const channelBreakdown = Object.entries(channelMap).map(([channel, data]) => ({
        channel,
        revenue: data.revenue,
        count: data.count,
        avgTouches: data.count > 0 ? Math.round(data.touches / data.count) : 0
    })).sort((a, b) => b.revenue - a.revenue)

    const monthlyTrend = Object.entries(monthlyMap)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))

    const topPerformingSource = Object.entries(sourceCount)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    return {
        totalRevenue,
        totalSales: sales.length,
        mayaContributedRevenue,
        mayaContributedCount,
        mayaContributionRate: sales.length > 0 ? Math.round((mayaContributedCount / sales.length) * 100) : 0,
        avgDaysToClose: sales.length > 0 ? Math.round(totalDaysToClose / sales.length) : 0,
        avgTouchesBeforeSale: sales.length > 0 ? Math.round(totalTouches / sales.length) : 0,
        channelBreakdown,
        monthlyTrend,
        topPerformingSource,
        journeys: journeys.slice(0, 50)
    }
}

function emptyResult(): AttributionSummary {
    return {
        totalRevenue: 0,
        totalSales: 0,
        mayaContributedRevenue: 0,
        mayaContributedCount: 0,
        mayaContributionRate: 0,
        avgDaysToClose: 0,
        avgTouchesBeforeSale: 0,
        channelBreakdown: [],
        monthlyTrend: [],
        topPerformingSource: '-',
        journeys: []
    }
}
