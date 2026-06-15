'use server'

import { createClient } from '@/lib/supabase/server'

export type PeriodKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month'

interface DateRange {
    from: string  // YYYY-MM-DD
    to: string    // YYYY-MM-DD
}

function getDateRange(period: PeriodKey): DateRange {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    switch (period) {
        case 'today':
            return { from: today, to: today }
        case 'yesterday': {
            const yd = new Date(now)
            yd.setDate(yd.getDate() - 1)
            return { from: yd.toISOString().split('T')[0], to: yd.toISOString().split('T')[0] }
        }
        case 'this_week': {
            const day = now.getDay()
            const diff = day === 0 ? 6 : day - 1
            const weekStart = new Date(now)
            weekStart.setDate(weekStart.getDate() - diff)
            return { from: weekStart.toISOString().split('T')[0], to: today }
        }
        case 'this_month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return { from: monthStart.toISOString().split('T')[0], to: today }
        }
        case 'last_month': {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
            return { from: lastMonthStart.toISOString().split('T')[0], to: lastMonthEnd.toISOString().split('T')[0] }
        }
    }
}

export interface PeriodStats {
    period: PeriodKey
    label: string
    whatsapp_count: number
    outbound_call_count: number
    inbound_call_count: number
    cold_count: number
    warm_count: number
    hot_count: number
}

export interface PerformanceData {
    periods: PeriodStats[]
    daily_trend: { date: string; whatsapp: number; outbound: number; inbound: number }[]
    wa_breakdown: Record<string, Record<string, number>>
    calls_breakdown: Record<string, Record<string, number>>
    last_updated: string | null
}

export async function getPerformanceAnalytics(): Promise<PerformanceData> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { periods: [], daily_trend: [], wa_breakdown: {}, calls_breakdown: {}, last_updated: null }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { periods: [], daily_trend: [], wa_breakdown: {}, calls_breakdown: {}, last_updated: null }

    const tenantId = profile.tenant_id

    // Fetch all needed data in a single query — last 60 days covers all periods
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    
    const { data: stats } = await supabase
        .from('report_daily_stats')
        .select('stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, whatsapp_breakdown, calls_breakdown, updated_at')
        .eq('tenant_id', tenantId)
        .gte('stat_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('stat_date', { ascending: true })

    if (!stats || stats.length === 0) {
        return { periods: [], daily_trend: [], wa_breakdown: {}, calls_breakdown: {}, last_updated: null }
    }

    // Build a date-keyed lookup
    const dateMap = new Map<string, typeof stats[0]>()
    for (const row of stats) {
        dateMap.set(row.stat_date, row)
    }

    // Last updated timestamp
    const lastUpdated = stats[stats.length - 1]?.updated_at || null

    // Aggregate periods
    const periodKeys: { key: PeriodKey; label: string }[] = [
        { key: 'today', label: 'Bugün' },
        { key: 'yesterday', label: 'Dün' },
        { key: 'this_week', label: 'Bu Hafta' },
        { key: 'this_month', label: 'Bu Ay' },
        { key: 'last_month', label: 'Geçen Ay' }
    ]

    // Helper: aggregate wa_breakdown JSONB across date range
    function aggregateBreakdown(fromStr: string, toStr: string): Record<string, number> {
        const result: Record<string, number> = {}
        const from = new Date(fromStr)
        const to = new Date(toStr)
        const cur = new Date(from)
        while (cur <= to) {
            const dk = cur.toISOString().split('T')[0]
            const row = dateMap.get(dk)
            if (row?.whatsapp_breakdown && typeof row.whatsapp_breakdown === 'object') {
                for (const [tmpl, cnt] of Object.entries(row.whatsapp_breakdown as Record<string, number>)) {
                    result[tmpl] = (result[tmpl] || 0) + (cnt || 0)
                }
            }
            cur.setDate(cur.getDate() + 1)
        }
        return result
    }

    const periods: PeriodStats[] = periodKeys.map(({ key, label }) => {
        const range = getDateRange(key)
        let wa = 0, outbound = 0, inbound = 0, cold = 0, warm = 0, hot = 0

        const fromDate = new Date(range.from)
        const toDate = new Date(range.to)
        const current = new Date(fromDate)
        
        while (current <= toDate) {
            const dateKey = current.toISOString().split('T')[0]
            const row = dateMap.get(dateKey)
            if (row) {
                wa += row.whatsapp_count || 0
                outbound += row.outbound_call_count || 0
                inbound += row.inbound_call_count || 0
                cold += row.cold_count || 0
                warm += row.warm_count || 0
                hot += row.hot_count || 0
            }
            current.setDate(current.getDate() + 1)
        }

        return { period: key, label, whatsapp_count: wa, outbound_call_count: outbound, inbound_call_count: inbound, cold_count: cold, warm_count: warm, hot_count: hot }
    })

    // Aggregate WA breakdown for active period (this_month as default overview)
    // We'll send all period breakdowns so client can switch
    const periodBreakdowns: Record<string, Record<string, number>> = {}
    for (const { key } of periodKeys) {
        const range = getDateRange(key)
        periodBreakdowns[key] = aggregateBreakdown(range.from, range.to)
    }

    // Aggregate calls breakdown per period
    function aggregateCallsBreakdown(fromStr: string, toStr: string): Record<string, number> {
        const result: Record<string, number> = { manuel_giden: 0, ai_giden: 0, gelen: 0 }
        const from = new Date(fromStr)
        const to = new Date(toStr)
        const cur = new Date(from)
        while (cur <= to) {
            const dk = cur.toISOString().split('T')[0]
            const row = dateMap.get(dk)
            if (row?.calls_breakdown && typeof row.calls_breakdown === 'object') {
                const cb = row.calls_breakdown as Record<string, number>
                result.manuel_giden += cb.manuel_giden || 0
                result.ai_giden += cb.ai_giden || 0
                result.gelen += cb.gelen || 0
            }
            cur.setDate(cur.getDate() + 1)
        }
        return result
    }

    const callsBreakdowns: Record<string, Record<string, number>> = {}
    for (const { key } of periodKeys) {
        const range = getDateRange(key)
        callsBreakdowns[key] = aggregateCallsBreakdown(range.from, range.to)
    }

    // Daily trend — last 14 days
    const daily_trend: { date: string; whatsapp: number; outbound: number; inbound: number }[] = []
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)

    for (let i = 0; i < 14; i++) {
        const d = new Date(fourteenDaysAgo)
        d.setDate(d.getDate() + i)
        const dateKey = d.toISOString().split('T')[0]
        const row = dateMap.get(dateKey)
        daily_trend.push({
            date: dateKey,
            whatsapp: row?.whatsapp_count || 0,
            outbound: row?.outbound_call_count || 0,
            inbound: row?.inbound_call_count || 0
        })
    }

    return { periods, daily_trend, wa_breakdown: periodBreakdowns, calls_breakdown: callsBreakdowns, last_updated: lastUpdated }
}
