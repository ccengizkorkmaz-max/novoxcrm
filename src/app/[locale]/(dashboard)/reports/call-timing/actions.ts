'use server'

import { createClient } from '@/lib/supabase/server'

// Saat Bazlı Cevaplama Analizi
export async function getCallTimingAnalysis(tenantId: string, days: number = 30) {
    const supabase = await createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // All AI call logs within the period
    const { data: logs } = await supabase
        .from('outreach_step_logs')
        .select('executed_at, status, call_outcome, call_duration')
        .eq('channel', 'ai_call')
        .gte('executed_at', since)
        .not('executed_at', 'is', null)
        .order('executed_at', { ascending: true })

    if (!logs || logs.length === 0) {
        return { hourly: [], daily: [], totalCalls: 0, goldenHours: [] as string[], avoidHours: [] as string[], bestDay: null as string | null, bestDayRate: 0 }
    }

    // Hourly analysis
    const hourlyMap = new Map<number, { total: number; answered: number; noAnswer: number; busy: number }>()
    for (let h = 8; h <= 20; h++) {
        hourlyMap.set(h, { total: 0, answered: 0, noAnswer: 0, busy: 0 })
    }

    // Daily analysis (0=Sun ... 6=Sat)
    const dailyMap = new Map<number, { total: number; answered: number }>()
    for (let d = 0; d <= 6; d++) {
        dailyMap.set(d, { total: 0, answered: 0 })
    }

    const answeredOutcomes = ['answered', 'completed', 'interested', 'follow_up', 'hot']

    for (const log of logs) {
        const date = new Date(log.executed_at)
        const hour = parseInt(date.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false }))
        const dayOfWeek = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })).getDay()

        const isAnswered = answeredOutcomes.includes(log.call_outcome || '') || log.status === 'completed'
        const isBusy = log.call_outcome === 'busy'
        const isNoAnswer = log.call_outcome === 'no_answer'

        // Hourly
        if (hour >= 8 && hour <= 20) {
            const h = hourlyMap.get(hour) || { total: 0, answered: 0, noAnswer: 0, busy: 0 }
            h.total++
            if (isAnswered) h.answered++
            if (isNoAnswer) h.noAnswer++
            if (isBusy) h.busy++
            hourlyMap.set(hour, h)
        }

        // Daily
        const d = dailyMap.get(dayOfWeek) || { total: 0, answered: 0 }
        d.total++
        if (isAnswered) d.answered++
        dailyMap.set(dayOfWeek, d)
    }

    // Convert to arrays
    const hourly = Array.from(hourlyMap.entries()).map(([hour, stats]) => ({
        hour,
        label: `${hour.toString().padStart(2, '0')}:00`,
        ...stats,
        answerRate: stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0
    }))

    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const daily = Array.from(dailyMap.entries()).map(([day, stats]) => ({
        day,
        label: dayNames[day],
        ...stats,
        answerRate: stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0
    }))

    // Find golden hours (top 3 answer rate with minimum 3 calls)
    const goldenHours = hourly
        .filter(h => h.total >= 3)
        .sort((a, b) => b.answerRate - a.answerRate)
        .slice(0, 3)
        .map(h => h.label)

    // Find avoid hours (bottom 3 answer rate with minimum 3 calls)
    const avoidHours = hourly
        .filter(h => h.total >= 3)
        .sort((a, b) => a.answerRate - b.answerRate)
        .slice(0, 3)
        .map(h => h.label)

    // Best day
    const bestDay = daily
        .filter(d => d.total >= 3)
        .sort((a, b) => b.answerRate - a.answerRate)[0]

    return {
        hourly,
        daily,
        totalCalls: logs.length,
        goldenHours,
        avoidHours,
        bestDay: bestDay?.label || null,
        bestDayRate: bestDay?.answerRate || 0
    }
}
