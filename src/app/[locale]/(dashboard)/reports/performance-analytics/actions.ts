'use server'

import { createClient } from '@/lib/supabase/server'

export type PeriodKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month'

interface PeriodRange {
    from: string
    to: string
}

function getPeriodRange(period: PeriodKey): PeriodRange {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
        case 'today': {
            return {
                from: todayStart.toISOString(),
                to: new Date(todayStart.getTime() + 86400000 - 1).toISOString()
            }
        }
        case 'yesterday': {
            const yd = new Date(todayStart.getTime() - 86400000)
            return {
                from: yd.toISOString(),
                to: new Date(todayStart.getTime() - 1).toISOString()
            }
        }
        case 'this_week': {
            const day = now.getDay()
            const diff = day === 0 ? 6 : day - 1 // Monday start
            const weekStart = new Date(todayStart.getTime() - diff * 86400000)
            return {
                from: weekStart.toISOString(),
                to: now.toISOString()
            }
        }
        case 'this_month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return {
                from: monthStart.toISOString(),
                to: now.toISOString()
            }
        }
        case 'last_month': {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            return {
                from: lastMonthStart.toISOString(),
                to: lastMonthEnd.toISOString()
            }
        }
    }
}

export interface PeriodStats {
    period: PeriodKey
    label: string
    whatsapp_count: number
    call_count: number
    cold_count: number
    warm_count: number
    hot_count: number
}

export interface PerformanceData {
    periods: PeriodStats[]
    daily_trend: { date: string; whatsapp: number; calls: number }[]
}

export async function getPerformanceAnalytics(): Promise<PerformanceData> {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { periods: [], daily_trend: [] }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    const periodKeys: { key: PeriodKey; label: string }[] = [
        { key: 'today', label: 'Bugün' },
        { key: 'yesterday', label: 'Dün' },
        { key: 'this_week', label: 'Bu Hafta' },
        { key: 'this_month', label: 'Bu Ay' },
        { key: 'last_month', label: 'Geçen Ay' }
    ]

    const periods: PeriodStats[] = await Promise.all(
        periodKeys.map(async ({ key, label }) => {
            const range = getPeriodRange(key)

            // WhatsApp activities count
            const waQuery = supabase
                .from('activities')
                .select('id', { count: 'exact', head: true })
                .eq('type', 'Whatsapp')
                .gte('created_at', range.from)
                .lte('created_at', range.to)

            // Call activities count
            const callQuery = supabase
                .from('activities')
                .select('id', { count: 'exact', head: true })
                .eq('type', 'Call')
                .gte('created_at', range.from)
                .lte('created_at', range.to)

            // Lead interest levels — count current state filtered by updated_at
            const coldQuery = supabase
                .from('lead_qualifications')
                .select('id', { count: 'exact', head: true })
                .eq('interest_level', 'cold')
                .gte('updated_at', range.from)
                .lte('updated_at', range.to)

            const warmQuery = supabase
                .from('lead_qualifications')
                .select('id', { count: 'exact', head: true })
                .eq('interest_level', 'warm')
                .gte('updated_at', range.from)
                .lte('updated_at', range.to)

            const hotQuery = supabase
                .from('lead_qualifications')
                .select('id', { count: 'exact', head: true })
                .eq('interest_level', 'hot')
                .gte('updated_at', range.from)
                .lte('updated_at', range.to)

            const [waRes, callRes, coldRes, warmRes, hotRes] = await Promise.all([
                waQuery, callQuery, coldQuery, warmQuery, hotQuery
            ])

            return {
                period: key,
                label,
                whatsapp_count: waRes.count || 0,
                call_count: callRes.count || 0,
                cold_count: coldRes.count || 0,
                warm_count: warmRes.count || 0,
                hot_count: hotRes.count || 0
            }
        })
    )

    // Daily trend for the last 14 days (for line chart)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const { data: recentActivities } = await supabase
        .from('activities')
        .select('type, created_at')
        .in('type', ['Whatsapp', 'Call'])
        .gte('created_at', fourteenDaysAgo.toISOString())
        .order('created_at')

    // Group by date
    const dayMap: Record<string, { whatsapp: number; calls: number }> = {}
    for (let i = 0; i < 14; i++) {
        const d = new Date(fourteenDaysAgo.getTime() + i * 86400000)
        const key = d.toISOString().split('T')[0]
        dayMap[key] = { whatsapp: 0, calls: 0 }
    }

    if (recentActivities) {
        for (const act of recentActivities) {
            const dateKey = new Date(act.created_at).toISOString().split('T')[0]
            if (dayMap[dateKey]) {
                if (act.type === 'Whatsapp') dayMap[dateKey].whatsapp++
                else if (act.type === 'Call') dayMap[dateKey].calls++
            }
        }
    }

    const daily_trend = Object.entries(dayMap).map(([date, counts]) => ({
        date,
        ...counts
    }))

    return { periods, daily_trend }
}
