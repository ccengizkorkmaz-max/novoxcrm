'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, parseISO, format, differenceInDays
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
    recordingsCount?: number
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

function formatNetgsmDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0')
    const MM = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    const HH = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${dd}${MM}${yyyy}${HH}${mm}`
}

function parseNetgsmDate(dStr: string): Date {
    try {
        const [datePart, timePart] = dStr.split(' ')
        const [day, month, year] = datePart.split('.')
        const [hour, min, sec] = (timePart || '00:00:00').split(':')
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour || 0), Number(min || 0), Number(sec || 0))
    } catch {
        return new Date()
    }
}

function normalizePhone(phone: string): string {
    if (!phone) return ''
    return phone.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '')
}

function buildPlayerUrl(recordingUrl?: string | null): string | null {
    if (!recordingUrl) return null
    try {
        const url = new URL(recordingUrl)
        const tip = url.searchParams.get('tip') || '1'
        const a = url.searchParams.get('a')
        const q = url.searchParams.get('q')
        if (a) return `https://dosyaindir.netgsm.com.tr/player/?tip=${tip}&y=${a}`
        if (q) return `https://dosyaindir.netgsm.com.tr/player/?tip=${tip}&q=${q}`
        return recordingUrl
    } catch {
        return recordingUrl
    }
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

    // 1. Fetch Tenant NetGSM config
    const { data: tenant } = await adminSupabase
        .from('tenants')
        .select('netgsm_cdr_usercode, netgsm_cdr_password, netgsm_sip_username, netgsm_sip_password')
        .eq('id', profile.tenant_id)
        .single()

    const cdrUsercode = tenant?.netgsm_cdr_usercode || tenant?.netgsm_sip_username
    const cdrPassword = tenant?.netgsm_cdr_password || tenant?.netgsm_sip_password

    // 2. Fetch active profiles for rep metadata and phone mapping
    const { data: profilesList } = await adminSupabase
        .from('profiles')
        .select('id, full_name, role, phone, profile_photo_url')
        .eq('tenant_id', profile.tenant_id)
        .order('full_name')

    const repStatsMap = new Map<string, RepPerformanceItem>()
    const repPhoneMap = new Map<string, string>()

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
                successRate: 0,
                recordingsCount: 0
            })

            if (p.phone) {
                const clean = normalizePhone(p.phone)
                if (clean) repPhoneMap.set(clean, p.id)
            }
        }
    })

    // 3. Fetch sales & customer phones to map customer numbers to assigned reps
    const { data: salesList } = await adminSupabase
        .from('sales')
        .select(`
            id, assigned_to, first_contact, updated_at,
            customers (id, full_name, phone),
            profiles:assigned_to (id, full_name, profile_photo_url)
        `)
        .eq('tenant_id', profile.tenant_id)

    const custPhoneToSaleMap = new Map<string, {
        repId: string
        repName: string
        repAvatar?: string
        customerName: string
        customerPhone: string
    }>()

    ;(salesList || []).forEach(s => {
        const phone = (s.customers as any)?.phone
        if (phone && s.assigned_to) {
            const clean = normalizePhone(phone)
            if (clean) {
                custPhoneToSaleMap.set(clean, {
                    repId: s.assigned_to,
                    repName: (s.profiles as any)?.full_name || 'Temsilci',
                    repAvatar: (s.profiles as any)?.profile_photo_url,
                    customerName: (s.customers as any)?.full_name || 'Müşteri',
                    customerPhone: phone
                })
            }
        }
    })

    // 4. Fetch Accurate Appointments (Meetings) in range (Gerçek randevular)
    // Sadece gerçek toplantı/randevu aktivitelerini ve iptal edilmemişleri say
    const { data: meetings } = await adminSupabase
        .from('activities')
        .select('id, type, status, topic, summary, notes, owner_id, user_id, created_at')
        .eq('tenant_id', profile.tenant_id)
        .in('type', ['Meeting', 'OnlineMeeting'])
        .neq('status', 'Cancelled')
        .gte('created_at', startISO)
        .lte('created_at', endISO)

    ;(meetings || []).forEach(m => {
        const rId = m.owner_id || m.user_id
        if (rId && repStatsMap.has(rId)) {
            repStatsMap.get(rId)!.appointmentCount++
        }
    })

    const callLogs: CallLogItem[] = []
    const allCallEvents: { date: Date; duration: number; isAnswered: boolean }[] = []
    let hasNetgsmData = false

    // 5. Query NetGSM CDR if configured
    if (cdrUsercode && cdrPassword) {
        try {
            const diffDays = Math.min(differenceInDays(rangeEnd, rangeStart) + 1, 31)
            const dayPromises = []

            for (let i = 0; i < diffDays; i++) {
                const dayDate = new Date(rangeStart)
                dayDate.setDate(rangeStart.getDate() + i)
                if (dayDate > rangeEnd) break

                const dayStart = startOfDay(dayDate)
                const dayEnd = endOfDay(dayDate)
                const startStr = formatNetgsmDate(dayStart)
                const stopStr = formatNetgsmDate(dayEnd)

                const url = `https://api.netgsm.com.tr/netsantral/report?` +
                    `usercode=${encodeURIComponent(cdrUsercode)}` +
                    `&password=${encodeURIComponent(cdrPassword)}` +
                    `&startdate=${startStr}` +
                    `&stopdate=${stopStr}` +
                    `&querytype=2` +
                    `&output=json`

                dayPromises.push(
                    fetch(url)
                        .then(res => res.ok ? res.json() : [])
                        .catch(() => [])
                )
            }

            const results = await Promise.all(dayPromises)
            const seenUniqueKeys = new Set<string>()

            results.forEach(dayData => {
                if (Array.isArray(dayData) && dayData.length > 0) {
                    hasNetgsmData = true
                    dayData.forEach((item: any) => {
                        const uid = item.uniqueid || ''
                        ;(item.values || []).forEach((v: any) => {
                            const callKey = `${uid}-${v.date}-${v.source}-${v.destination}`
                            if (seenUniqueKeys.has(callKey)) return
                            seenUniqueKeys.add(callKey)

                            const callDate = parseNetgsmDate(v.date)
                            if (callDate < rangeStart || callDate > rangeEnd) return

                            const src = v.source || ''
                            const dst = v.destination || ''
                            const dur = parseInt(v.duration || '0')
                            const isAnswered = dur > 0
                            const rec = v.recording || null
                            const playerUrl = buildPlayerUrl(rec)

                            const cleanSrc = normalizePhone(src)
                            const cleanDst = normalizePhone(dst)

                            // Match Rep
                            let repId: string | null = null
                            let repName = 'Santral / Genel'
                            let customerName = 'Müşteri'
                            let customerPhone = dst.length > 4 ? dst : src

                            if (repPhoneMap.has(cleanSrc)) {
                                repId = repPhoneMap.get(cleanSrc)!
                            } else if (repPhoneMap.has(cleanDst)) {
                                repId = repPhoneMap.get(cleanDst)!
                            } else if (custPhoneToSaleMap.has(cleanDst)) {
                                const sale = custPhoneToSaleMap.get(cleanDst)!
                                repId = sale.repId
                                repName = sale.repName
                                customerName = sale.customerName
                                customerPhone = sale.customerPhone
                            } else if (custPhoneToSaleMap.has(cleanSrc)) {
                                const sale = custPhoneToSaleMap.get(cleanSrc)!
                                repId = sale.repId
                                repName = sale.repName
                                customerName = sale.customerName
                                customerPhone = sale.customerPhone
                            }

                            // Filter by rep if selected
                            if (params.repId && params.repId !== '__all__' && repId !== params.repId) {
                                return
                            }

                            if (repId && repStatsMap.has(repId)) {
                                const rep = repStatsMap.get(repId)!
                                repName = rep.name
                                rep.totalCalls++
                                rep.totalDurationSeconds += dur
                                if (isAnswered) rep.answeredCalls++
                                else rep.unansweredCalls++
                                if (rec) rep.recordingsCount = (rep.recordingsCount || 0) + 1

                                if (src.length <= 4 || repPhoneMap.has(cleanSrc)) {
                                    rep.outboundCalls++
                                } else {
                                    rep.inboundCalls++
                                }

                                if (!rep.lastCallDate || callDate > new Date(rep.lastCallDate)) {
                                    rep.lastCallDate = callDate.toISOString()
                                }
                            }

                            allCallEvents.push({ date: callDate, duration: dur, isAnswered })

                            if (callLogs.length < 200) {
                                const isOutbound = src.length <= 4 || repPhoneMap.has(cleanSrc)
                                const durMin = Math.floor(dur / 60)
                                const durSec = dur % 60
                                const durText = durMin > 0 ? `${durMin} dk ${durSec} sn` : `${durSec} sn`

                                callLogs.push({
                                    id: uid || `${callDate.getTime()}-${src}`,
                                    type: isOutbound ? 'outbound' : 'inbound',
                                    date: callDate.toISOString(),
                                    repName,
                                    repId: repId || undefined,
                                    customerName,
                                    customerPhone,
                                    durationSeconds: dur,
                                    status: isAnswered ? 'Ulaşıldı' : 'Ulaşılamadı',
                                    outcome: isAnswered ? `Görüşme (${durText})` : 'Cevapsız',
                                    recordingUrl: playerUrl
                                })
                            }
                        })
                    })
                }
            })
        } catch (netgsmErr) {
            console.error('[getCallCenterPerformanceData] NetGSM CDR error:', netgsmErr)
        }
    }

    // 6. Fallback / supplementary CRM Call Activities if no NetGSM data found
    if (!hasNetgsmData) {
        let actPage = 0
        const pageSize = 1000
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
            if (actError || !chunk || chunk.length === 0) break

            chunk.forEach(act => {
                const outcome = (act.outcome || '').toLowerCase()
                const status = (act.status || '').toLowerCase()

                const isAnswered = status === 'completed' ||
                    outcome.includes('ulaşıldı') ||
                    outcome.includes('görüşüldü') ||
                    outcome.includes('success') ||
                    outcome.includes('olumlu')

                const duration = isAnswered ? 90 : 15
                const actDate = parseISO(act.created_at)
                allCallEvents.push({ date: actDate, duration, isAnswered })

                const repId = act.owner_id || act.user_id || 'unassigned'
                let repStat = repStatsMap.get(repId)
                if (repStat) {
                    repStat.totalCalls++
                    repStat.outboundCalls++
                    repStat.totalDurationSeconds += duration
                    if (isAnswered) repStat.answeredCalls++
                    else repStat.unansweredCalls++

                    if (!repStat.lastCallDate || new Date(act.created_at) > new Date(repStat.lastCallDate)) {
                        repStat.lastCallDate = act.created_at
                    }
                }

                if (callLogs.length < 200) {
                    callLogs.push({
                        id: act.id,
                        type: 'outbound',
                        date: act.created_at,
                        repName: (act.profiles as any)?.full_name || 'Atanmamış',
                        repId: act.owner_id,
                        customerName: (act.customers as any)?.full_name || 'Müşteri',
                        customerPhone: (act.customers as any)?.phone || '-',
                        durationSeconds: duration,
                        status: isAnswered ? 'Ulaşıldı' : 'Ulaşılamadı',
                        outcome: act.outcome || act.summary || (isAnswered ? 'Görüşüldü' : 'Ulaşılamadı'),
                        notes: act.notes || act.description || undefined,
                        recordingUrl: null
                    })
                }
            })

            if (chunk.length < pageSize) break
            actPage++
            if (actPage >= 10) break
        }
    }

    // 7. Aggregate Summary
    const totalCalls = allCallEvents.length
    let totalDurationSeconds = 0
    let answeredCallsCount = 0
    let totalAppointments = 0

    allCallEvents.forEach(ev => {
        totalDurationSeconds += ev.duration
        if (ev.isAnswered) answeredCallsCount++
    })

    // Rep Stats list
    const repPerformanceList: RepPerformanceItem[] = Array.from(repStatsMap.values()).map(rep => {
        const avgSec = rep.totalCalls > 0 ? Math.round(rep.totalDurationSeconds / rep.totalCalls) : 0
        const rate = rep.totalCalls > 0 ? Math.round((rep.answeredCalls / rep.totalCalls) * 100) : 0
        totalAppointments += rep.appointmentCount
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
    const appointmentRatePercentage = totalCalls > 0 ? Math.round((totalAppointments / totalCalls) * 100) : 0

    // 8. Hourly Distribution (08:00 - 20:00)
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

    // 9. Daily Trend
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

    const totalInbound = callLogs.filter(c => c.type === 'inbound').length
    const totalOutbound = Math.max(0, totalCalls - totalInbound)

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
            appointmentCount: totalAppointments,
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
