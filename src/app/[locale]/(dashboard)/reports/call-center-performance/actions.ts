'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, parseISO, format, isWithinInterval
} from 'date-fns'

export interface CallCenterReportParams {
    period?: 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'last90' | 'custom'
    startDate?: string
    endDate?: string
    repId?: string
}

export interface RepPerformanceItem {
    id: string
    name: string
    avatar?: string
    totalCalls: number
    outboundCalls: number
    inboundCalls: number
    answeredCalls: number
    unansweredCalls: number
    totalDurationSeconds: number
    avgDurationSeconds: number
    appointmentCount: number
    lastCallDate: string | null
    successRate: number
}

export interface HourlyDistributionItem {
    hour: string
    callCount: number
    answeredCount: number
    totalDurationMinutes: number
}

export interface DailyTrendItem {
    date: string
    formattedDate: string
    callCount: number
    totalDurationMinutes: number
    answeredCount: number
}

export interface CallLogItem {
    id: string
    type: 'outbound' | 'inbound'
    date: string
    repName: string
    repId?: string
    customerName: string
    customerPhone: string
    durationSeconds: number
    status: string
    outcome: string
    notes?: string
    recordingUrl?: string | null
}

export async function getCallCenterPerformanceData(params: CallCenterReportParams = {}) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açılmalıdır.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı.' }
    if (!['manager', 'admin', 'owner', 'crm_manager'].includes(profile.role)) {
        return { error: 'Bu raporu görüntüleme yetkiniz yok.' }
    }

    const now = new Date()
    let rangeStart: Date
    let rangeEnd: Date = endOfDay(now)

    switch (params.period) {
        case 'today':
            rangeStart = startOfDay(now)
            rangeEnd = endOfDay(now)
            break
        case 'yesterday':
            rangeStart = startOfDay(subDays(now, 1))
            rangeEnd = endOfDay(subDays(now, 1))
            break
        case 'week':
            rangeStart = startOfWeek(now, { weekStartsOn: 1 })
            rangeEnd = endOfWeek(now, { weekStartsOn: 1 })
            break
        case 'month':
            rangeStart = startOfMonth(now)
            rangeEnd = endOfMonth(now)
            break
        case 'last30':
            rangeStart = startOfDay(subDays(now, 30))
            break
        case 'last90':
            rangeStart = startOfDay(subDays(now, 90))
            break
        case 'custom':
            rangeStart = params.startDate ? startOfDay(parseISO(params.startDate)) : startOfDay(subDays(now, 30))
            rangeEnd = params.endDate ? endOfDay(parseISO(params.endDate)) : endOfDay(now)
            break
        default:
            rangeStart = startOfMonth(now)
            rangeEnd = endOfMonth(now)
    }

    const startISO = rangeStart.toISOString()
    const endISO = rangeEnd.toISOString()

    // 1. Fetch active profiles for rep metadata
    const { data: profilesList } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('full_name')

    const profileMap = new Map<string, { name: string; avatar?: string }>()
    ;(profilesList || []).forEach(p => {
        if (p.full_name) {
            profileMap.set(p.id, { name: p.full_name, avatar: p.avatar_url || undefined })
        }
    })

    // 2. Fetch Call Activities with pagination loop to bypass 1000 row limit
    const activities: any[] = []
    let actPage = 0
    const pageSize = 1000

    while (true) {
        let query = supabase
            .from('activities')
            .select(`
                id, type, topic, status, outcome, summary, notes,
                duration_seconds, call_recording_url,
                due_date, created_at, completed_at,
                owner_id, user_id, customer_id,
                profiles:owner_id(id, full_name, avatar_url),
                customers:customer_id(id, full_name, phone)
            `)
            .eq('tenant_id', profile.tenant_id)
            .in('type', ['Call', 'Phone'])
            .gte('created_at', startISO)
            .lte('created_at', endISO)
            .order('created_at', { ascending: false })
            .range(actPage * pageSize, (actPage + 1) * pageSize - 1)

        if (params.repId && params.repId !== '__all__') {
            query = query.or(`owner_id.eq.${params.repId},user_id.eq.${params.repId}`)
        }

        const { data: chunk, error: actError } = await query

        if (actError) {
            console.error('[getCallCenterPerformanceData] activities error:', actError)
            break
        }
        if (!chunk || chunk.length === 0) break
        activities.push(...chunk)
        if (chunk.length < pageSize) break
        actPage++
    }

    // 3. Fetch Inbound Calls
    let inboundCalls: any[] = []
    try {
        const { data: inCalls } = await adminSupabase
            .from('inbound_calls')
            .select(`
                id, tenant_id, customer_id, caller_phone, caller_name,
                started_at, ended_at, duration, status, outcome,
                recording_url, summary, analysis
            `)
            .eq('tenant_id', profile.tenant_id)
            .gte('started_at', startISO)
            .lte('started_at', endISO)
            .order('started_at', { ascending: false })
            .limit(2000)

        inboundCalls = inCalls || []
    } catch (err) {
        console.warn('[getCallCenterPerformanceData] inbound_calls fetch skipped:', err)
    }

    // 4. Calculate Aggregate Metrics
    let totalOutbound = 0
    let totalInbound = inboundCalls.length
    let totalDurationSeconds = 0
    let answeredCallsCount = 0
    let unansweredCallsCount = 0
    let appointmentCount = 0

    const repStatsMap = new Map<string, RepPerformanceItem>()

    // Initialize all active sales profiles in repStatsMap
    ;(profilesList || []).forEach(p => {
        repStatsMap.set(p.id, {
            id: p.id,
            name: p.full_name || 'İsimsiz Temsilci',
            avatar: p.avatar_url || undefined,
            totalCalls: 0,
            outboundCalls: 0,
            inboundCalls: 0,
            answeredCalls: 0,
            unansweredCalls: 0,
            totalDurationSeconds: 0,
            avgDurationSeconds: 0,
            appointmentCount: 0,
            lastCallDate: null,
            successRate: 0
        })
    })

    const callLogs: CallLogItem[] = []

    // Process Outbound activities
    activities.forEach(act => {
        totalOutbound++
        const duration = Number(act.duration_seconds) || 0
        totalDurationSeconds += duration

        const outcome = (act.outcome || '').toLowerCase()
        const status = (act.status || '').toLowerCase()
        const notes = (act.notes || '').toLowerCase()
        const summary = (act.summary || '').toLowerCase()

        const isAnswered = duration > 10 ||
            status === 'completed' ||
            outcome.includes('ulaşıldı') ||
            outcome.includes('görüşüldü') ||
            outcome.includes('cevaplandı') ||
            outcome.includes('olumlu') ||
            outcome.includes('randevu')

        const isAppointment = outcome.includes('randevu') ||
            notes.includes('randevu') ||
            summary.includes('randevu') ||
            notes.includes('toplantı') ||
            summary.includes('toplantı')

        if (isAnswered) {
            answeredCallsCount++
        } else {
            unansweredCallsCount++
        }

        if (isAppointment) {
            appointmentCount++
        }

        // Rep stats
        const repId = act.owner_id || act.user_id || 'unassigned'
        let repStat = repStatsMap.get(repId)
        if (!repStat) {
            const repName = (act.profiles as any)?.full_name || 'Atanmamış Temsilci'
            repStat = {
                id: repId,
                name: repName,
                avatar: (act.profiles as any)?.avatar_url,
                totalCalls: 0,
                outboundCalls: 0,
                inboundCalls: 0,
                answeredCalls: 0,
                unansweredCalls: 0,
                totalDurationSeconds: 0,
                avgDurationSeconds: 0,
                appointmentCount: 0,
                lastCallDate: null,
                successRate: 0
            }
            repStatsMap.set(repId, repStat)
        }

        repStat.totalCalls++
        repStat.outboundCalls++
        repStat.totalDurationSeconds += duration
        if (isAnswered) repStat.answeredCalls++
        else repStat.unansweredCalls++
        if (isAppointment) repStat.appointmentCount++

        if (!repStat.lastCallDate || new Date(act.created_at) > new Date(repStat.lastCallDate)) {
            repStat.lastCallDate = act.created_at
        }

        // Add to call log
        if (callLogs.length < 100) {
            callLogs.push({
                id: act.id,
                type: 'outbound',
                date: act.created_at,
                repName: (act.profiles as any)?.full_name || repStat.name,
                repId: act.owner_id,
                customerName: (act.customers as any)?.full_name || 'İsimsiz Müşteri',
                customerPhone: (act.customers as any)?.phone || '-',
                durationSeconds: duration,
                status: act.status || 'Tamamlandı',
                outcome: act.outcome || (isAnswered ? 'Görüşüldü' : 'Ulaşılamadı'),
                notes: act.notes || act.summary || undefined,
                recordingUrl: act.call_recording_url || null
            })
        }
    })

    // Process Inbound calls
    inboundCalls.forEach(inCall => {
        const duration = Number(inCall.duration) || 0
        totalDurationSeconds += duration

        const isAnswered = duration > 5 || inCall.status === 'completed'
        if (isAnswered) answeredCallsCount++
        else unansweredCallsCount++

        const isInterested = inCall.interested === true || (inCall.summary && inCall.summary.toLowerCase().includes('randevu'))
        if (isInterested) appointmentCount++

        if (callLogs.length < 100) {
            callLogs.push({
                id: inCall.id,
                type: 'inbound',
                date: inCall.started_at,
                repName: 'Santral / AI Asistan',
                customerName: inCall.caller_name || 'Gelen Arama',
                customerPhone: inCall.caller_phone || '-',
                durationSeconds: duration,
                status: inCall.status || 'Tamamlandı',
                outcome: inCall.outcome || (isAnswered ? 'Cevaplandı' : 'Yanıtsız'),
                notes: inCall.summary || undefined,
                recordingUrl: inCall.recording_url || null
            })
        }
    })

    // Calculate rates and averages
    const totalCalls = totalOutbound + totalInbound
    const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0
    const answerRatePercentage = totalCalls > 0 ? Math.round((answeredCallsCount / totalCalls) * 100) : 0
    const appointmentRatePercentage = totalCalls > 0 ? Math.round((appointmentCount / totalCalls) * 100) : 0

    // Finalize Rep Stats list
    const repPerformanceList: RepPerformanceItem[] = Array.from(repStatsMap.values()).map(rep => {
        const avgSec = rep.totalCalls > 0 ? Math.round(rep.totalDurationSeconds / rep.totalCalls) : 0
        const rate = rep.totalCalls > 0 ? Math.round((rep.answeredCalls / rep.totalCalls) * 100) : 0
        return {
            ...rep,
            avgDurationSeconds: avgSec,
            successRate: rate
        }
    }).sort((a, b) => b.totalCalls - a.totalCalls)

    const topRep = repPerformanceList.find(r => r.totalCalls > 0 && r.id !== 'unassigned') || null

    // 5. Calculate Hourly Distribution (08:00 - 20:00)
    const hourlyMap: Record<number, { count: number; answered: number; duration: number }> = {}
    for (let h = 8; h <= 20; h++) {
        hourlyMap[h] = { count: 0, answered: 0, duration: 0 }
    }

    const allEvents = [
        ...activities.map(a => ({ date: parseISO(a.created_at), duration: Number(a.duration_seconds) || 0, isAnswered: (Number(a.duration_seconds) || 0) > 10 })),
        ...inboundCalls.map(i => ({ date: parseISO(i.started_at), duration: Number(i.duration) || 0, isAnswered: (Number(i.duration) || 0) > 5 }))
    ]

    allEvents.forEach(ev => {
        const hour = ev.date.getHours()
        if (hourlyMap[hour]) {
            hourlyMap[hour].count++
            if (ev.isAnswered) hourlyMap[hour].answered++
            hourlyMap[hour].duration += ev.duration
        }
    })

    const hourlyDistribution: HourlyDistributionItem[] = Object.keys(hourlyMap).map(hKey => {
        const h = Number(hKey)
        return {
            hour: `${String(h).padStart(2, '0')}:00`,
            callCount: hourlyMap[h].count,
            answeredCount: hourlyMap[h].answered,
            totalDurationMinutes: Math.round(hourlyMap[h].duration / 60)
        }
    })

    // 6. Calculate Daily Trend (last 14 days or chosen interval)
    const dailyMap = new Map<string, { callCount: number; duration: number; answered: number }>()

    allEvents.forEach(ev => {
        const dayKey = format(ev.date, 'yyyy-MM-dd')
        const curr = dailyMap.get(dayKey) || { callCount: 0, duration: 0, answered: 0 }
        curr.callCount++
        curr.duration += ev.duration
        if (ev.isAnswered) curr.answered++
        dailyMap.set(dayKey, curr)
    })

    const dailyTrend: DailyTrendItem[] = Array.from(dailyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateKey, stats]) => ({
            date: dateKey,
            formattedDate: format(parseISO(dateKey), 'dd MMM'),
            callCount: stats.callCount,
            totalDurationMinutes: Math.round(stats.duration / 60),
            answeredCount: stats.answered
        }))

    return {
        summary: {
            totalCalls,
            totalOutbound,
            totalInbound,
            totalDurationSeconds,
            totalDurationMinutes: Math.round(totalDurationSeconds / 60),
            totalDurationHours: (totalDurationSeconds / 3600).toFixed(1),
            avgDurationSeconds,
            answeredCallsCount,
            unansweredCallsCount,
            answerRatePercentage,
            appointmentCount,
            appointmentRatePercentage,
            topRep: topRep ? {
                id: topRep.id,
                name: topRep.name,
                totalCalls: topRep.totalCalls,
                totalMinutes: Math.round(topRep.totalDurationSeconds / 60)
            } : null
        },
        reps: repPerformanceList,
        hourlyDistribution,
        dailyTrend,
        recentCalls: callLogs,
        profiles: profilesList || [],
        period: params.period || 'month',
        startDate: format(rangeStart, 'yyyy-MM-dd'),
        endDate: format(rangeEnd, 'yyyy-MM-dd')
    }
}
