'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, parseISO, format
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

    const { data: profile } = await adminSupabase
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
    const { data: profilesList } = await adminSupabase
        .from('profiles')
        .select('id, full_name, role, profile_photo_url')
        .eq('tenant_id', profile.tenant_id)
        .order('full_name')

    const repStatsMap = new Map<string, RepPerformanceItem>()
    ;(profilesList || []).forEach(p => {
        if (p.full_name) {
            repStatsMap.set(p.id, {
                id: p.id,
                name: p.full_name,
                avatar: p.profile_photo_url || undefined,
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
        }
    })

    const callLogs: CallLogItem[] = []
    const allCallEvents: { date: Date; duration: number; isAnswered: boolean }[] = []

    const pageSize = 1000

    // 2. Fetch Sales with first_contact (Temsilcilerin CRM arama ve görüşme kayıtları)
    let salesPage = 0
    while (true) {
        let query = adminSupabase
            .from('sales')
            .select(`
                id, assigned_to, first_contact, process_note, updated_at, created_at,
                customers (id, full_name, phone),
                profiles:assigned_to (id, full_name, profile_photo_url)
            `)
            .eq('tenant_id', profile.tenant_id)
            .not('first_contact', 'is', null)
            .gte('updated_at', startISO)
            .lte('updated_at', endISO)
            .order('updated_at', { ascending: false })
            .range(salesPage * pageSize, (salesPage + 1) * pageSize - 1)

        if (params.repId && params.repId !== '__all__') {
            query = query.eq('assigned_to', params.repId)
        }

        const { data: chunk, error: sErr } = await query
        if (sErr) {
            console.error('[getCallCenterPerformanceData] sales error:', sErr)
            break
        }
        if (!chunk || chunk.length === 0) break

        chunk.forEach(s => {
            const fc = (s.first_contact || '').trim()
            const fcLower = fc.toLowerCase()
            const noteLower = (s.process_note || '').toLowerCase()
            const callDate = parseISO(s.updated_at)

            const isAnswered = fcLower.includes('olumlu') ||
                fcLower.includes('olumsuz') ||
                fcLower.includes('tekrar') ||
                fcLower.includes('değerlendir') ||
                fcLower.includes('görüşüldü') ||
                fcLower.includes('aradım')

            const isAppointment = fcLower.includes('randevu') ||
                noteLower.includes('randevu') ||
                noteLower.includes('toplantı') ||
                noteLower.includes('ofis')

            // Estimate duration based on outcome type (in seconds)
            let estimatedDuration = 0
            if (fcLower.includes('olumlu') || isAppointment) estimatedDuration = 180
            else if (fcLower.includes('değerlendir')) estimatedDuration = 120
            else if (fcLower.includes('tekrar')) estimatedDuration = 90
            else if (fcLower.includes('olumsuz')) estimatedDuration = 60
            else if (isAnswered) estimatedDuration = 60
            else estimatedDuration = 15

            allCallEvents.push({ date: callDate, duration: estimatedDuration, isAnswered })

            const repId = s.assigned_to || 'unassigned'
            let repStat = repStatsMap.get(repId)
            if (!repStat) {
                repStat = {
                    id: repId,
                    name: (s.profiles as any)?.full_name || 'Atanmamış',
                    avatar: (s.profiles as any)?.profile_photo_url,
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
            repStat.totalDurationSeconds += estimatedDuration
            if (isAnswered) repStat.answeredCalls++
            else repStat.unansweredCalls++
            if (isAppointment) repStat.appointmentCount++

            if (!repStat.lastCallDate || new Date(s.updated_at) > new Date(repStat.lastCallDate)) {
                repStat.lastCallDate = s.updated_at
            }

            if (callLogs.length < 150) {
                callLogs.push({
                    id: s.id,
                    type: 'outbound',
                    date: s.updated_at,
                    repName: (s.profiles as any)?.full_name || repStat.name,
                    repId: s.assigned_to,
                    customerName: (s.customers as any)?.full_name || 'Müşteri',
                    customerPhone: (s.customers as any)?.phone || '-',
                    durationSeconds: estimatedDuration,
                    status: 'Tamamlandı',
                    outcome: s.first_contact,
                    notes: s.process_note || undefined,
                    recordingUrl: null
                })
            }
        })

        if (chunk.length < pageSize) break
        salesPage++
        if (salesPage >= 25) break
    }

    // 3. Fetch Call Activities
    let actPage = 0
    while (true) {
        let query = adminSupabase
            .from('activities')
            .select(`
                id, type, topic, status, outcome, summary, description, notes,
                due_date, created_at, completed_at,
                owner_id, user_id, customer_id,
                profiles:owner_id(id, full_name, profile_photo_url),
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

        chunk.forEach(act => {
            const outcome = (act.outcome || '').toLowerCase()
            const status = (act.status || '').toLowerCase()
            const notes = (act.notes || '').toLowerCase()
            const summary = (act.summary || '').toLowerCase()
            const desc = (act.description || '').toLowerCase()

            const isAnswered = status === 'completed' ||
                outcome.includes('ulaşıldı') ||
                outcome.includes('görüşüldü') ||
                outcome.includes('success') ||
                outcome.includes('olumlu')

            const isAppointment = outcome.includes('randevu') ||
                notes.includes('randevu') ||
                summary.includes('randevu')

            const duration = isAnswered ? 90 : 15
            const actDate = parseISO(act.created_at)
            allCallEvents.push({ date: actDate, duration, isAnswered })

            const repId = act.owner_id || act.user_id || 'unassigned'
            let repStat = repStatsMap.get(repId)
            if (!repStat) {
                repStat = {
                    id: repId,
                    name: (act.profiles as any)?.full_name || 'Atanmamış',
                    avatar: (act.profiles as any)?.profile_photo_url,
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

            if (callLogs.length < 150) {
                callLogs.push({
                    id: act.id,
                    type: 'outbound',
                    date: act.created_at,
                    repName: (act.profiles as any)?.full_name || repStat.name,
                    repId: act.owner_id,
                    customerName: (act.customers as any)?.full_name || 'Müşteri',
                    customerPhone: (act.customers as any)?.phone || '-',
                    durationSeconds: duration,
                    status: act.status || 'Tamamlandı',
                    outcome: act.outcome || act.summary || (isAnswered ? 'Görüşüldü' : 'Ulaşılamadı'),
                    notes: act.notes || act.description || undefined,
                    recordingUrl: null
                })
            }
        })

        if (chunk.length < pageSize) break
        actPage++
        if (actPage >= 25) break
    }

    // 4. Fetch Inbound Calls (Santral / AI Gelen Çağrılar)
    let inboundCallsCount = 0
    try {
        const { data: inCalls } = await adminSupabase
            .from('inbound_calls')
            .select(`
                id, tenant_id, customer_id, caller_phone, caller_name,
                started_at, ended_at, duration, status, outcome,
                recording_url, summary, analysis, interested
            `)
            .eq('tenant_id', profile.tenant_id)
            .gte('started_at', startISO)
            .lte('started_at', endISO)
            .order('started_at', { ascending: false })
            .limit(1000)

        if (inCalls && inCalls.length > 0) {
            inboundCallsCount = inCalls.length
            inCalls.forEach(inCall => {
                const dur = Number(inCall.duration) || 0
                const isAns = dur > 5 || inCall.status === 'completed'
                const inDate = parseISO(inCall.started_at)
                allCallEvents.push({ date: inDate, duration: dur, isAnswered: isAns })

                if (callLogs.length < 150) {
                    callLogs.push({
                        id: inCall.id,
                        type: 'inbound',
                        date: inCall.started_at,
                        repName: 'Santral / AI',
                        customerName: inCall.caller_name || 'Gelen Çağrı',
                        customerPhone: inCall.caller_phone || '-',
                        durationSeconds: dur,
                        status: inCall.status || 'Tamamlandı',
                        outcome: inCall.outcome || (isAns ? 'Cevaplandı' : 'Yanıtsız'),
                        notes: inCall.summary || undefined,
                        recordingUrl: inCall.recording_url || null
                    })
                }
            })
        }
    } catch (err) {
        console.warn('[getCallCenterPerformanceData] inbound_calls fetch warning:', err)
    }

    // 5. Aggregate Summary
    const totalCalls = allCallEvents.length
    let totalDurationSeconds = 0
    let answeredCallsCount = 0
    let appointmentCount = 0

    allCallEvents.forEach(ev => {
        totalDurationSeconds += ev.duration
        if (ev.isAnswered) answeredCallsCount++
    })

    // Rep Stats
    const repPerformanceList: RepPerformanceItem[] = Array.from(repStatsMap.values()).map(rep => {
        const avgSec = rep.totalCalls > 0 ? Math.round(rep.totalDurationSeconds / rep.totalCalls) : 0
        const rate = rep.totalCalls > 0 ? Math.round((rep.answeredCalls / rep.totalCalls) * 100) : 0
        appointmentCount += rep.appointmentCount
        return {
            ...rep,
            avgDurationSeconds: avgSec,
            successRate: rate
        }
    }).sort((a, b) => b.totalCalls - a.totalCalls)

    const topRep = repPerformanceList.find(r => r.totalCalls > 0 && r.id !== 'unassigned') || null

    const unansweredCallsCount = Math.max(0, totalCalls - answeredCallsCount)
    const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0
    const answerRatePercentage = totalCalls > 0 ? Math.round((answeredCallsCount / totalCalls) * 100) : 0
    const appointmentRatePercentage = totalCalls > 0 ? Math.round((appointmentCount / totalCalls) * 100) : 0

    // 6. Hourly Distribution (08:00 - 20:00)
    const hourlyMap: Record<number, { count: number; answered: number; duration: number }> = {}
    for (let h = 8; h <= 20; h++) {
        hourlyMap[h] = { count: 0, answered: 0, duration: 0 }
    }

    allCallEvents.forEach(ev => {
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

    // 7. Daily Trend
    const dailyMap = new Map<string, { callCount: number; duration: number; answered: number }>()
    allCallEvents.forEach(ev => {
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

    // Sort recent calls by date desc
    callLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return {
        summary: {
            totalCalls,
            totalOutbound: totalCalls - inboundCallsCount,
            totalInbound: inboundCallsCount,
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
