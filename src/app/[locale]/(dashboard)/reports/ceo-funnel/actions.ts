'use server'

import { createClient } from '@/lib/supabase/server'
import {
    startOfMonth,
    subMonths,
    subDays,
    startOfYear,
    subYears,
    endOfMonth,
    format,
    differenceInDays
} from 'date-fns'
import { tr } from 'date-fns/locale'

export type PeriodType = 'this_month' | 'last_month' | 'last_30_days' | 'last_90_days' | 'this_year' | 'all'

export interface CeoFunnelFilters {
    period?: PeriodType
    projectId?: string
}

export interface FunnelStageData {
    stageKey: string
    title: string
    description: string
    count: number
    potentialValue: number
    depositAmount: number
    wonRevenue: number
    probability: number
    weightedForecast: number
    color: string
    gradient: string
    conversionFromPrev: number
    conversionFromTop: number
}

export interface RevenueForecast {
    realizedRevenue: number
    securedDeposits: number
    activePipelineValue: number
    weightedForecastTotal: number
    conservativeScenario: number
    baseScenario: number
    optimisticScenario: number
    maxPotentialRevenue: number
}

export async function getCeoFunnelData(filters: CeoFunnelFilters = {}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Yetkisiz erişim. Lütfen oturum açın.' }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role, full_name')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        return { error: 'Kurum (tenant) bilgisi bulunamadı.' }
    }

    const tenantId = profile.tenant_id
    const period = filters.period || 'this_month'
    const selectedProjectId = filters.projectId && filters.projectId !== 'all' ? filters.projectId : null

    // 1. Fetch Projects for dropdown
    const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name')

    const projects = projectsData || []

    // 2. Determine Date Ranges
    const now = new Date()
    let currentStart: Date | null = null
    let currentEnd: Date | null = now
    let prevStart: Date | null = null
    let prevEnd: Date | null = null

    if (period === 'this_month') {
        currentStart = startOfMonth(now)
        prevStart = startOfMonth(subMonths(now, 1))
        prevEnd = currentStart
    } else if (period === 'last_month') {
        currentStart = startOfMonth(subMonths(now, 1))
        currentEnd = endOfMonth(subMonths(now, 1))
        prevStart = startOfMonth(subMonths(now, 2))
        prevEnd = endOfMonth(subMonths(now, 2))
    } else if (period === 'last_30_days') {
        currentStart = subDays(now, 30)
        prevStart = subDays(now, 60)
        prevEnd = currentStart
    } else if (period === 'last_90_days') {
        currentStart = subDays(now, 90)
        prevStart = subDays(now, 180)
        prevEnd = currentStart
    } else if (period === 'this_year') {
        currentStart = startOfYear(now)
        prevStart = startOfYear(subYears(now, 1))
        prevEnd = subYears(now, 1)
    } else {
        // all
        currentStart = null
        prevStart = null
    }

    // 3. Query all sales with units, projects, profiles, customers
    let salesQuery = supabase
        .from('sales')
        .select(`
            id,
            tenant_id,
            customer_id,
            unit_id,
            assigned_to,
            status,
            deposit_amount,
            final_price,
            currency,
            created_at,
            updated_at,
            contract_date,
            project_id,
            description,
            lead_origin,
            lost_reason,
            projects:project_id ( id, name ),
            profiles:assigned_to ( id, full_name, email ),
            customers:customer_id ( id, full_name, phone, source, created_at ),
            units:unit_id ( id, unit_number, price )
        `)
        .eq('tenant_id', tenantId)

    if (selectedProjectId) {
        salesQuery = salesQuery.eq('project_id', selectedProjectId)
    }

    const { data: rawSales, error: salesErr } = await salesQuery
    if (salesErr) {
        console.error('CeoFunnel sales fetch error:', salesErr)
        return { error: 'Satış verileri alınırken hata oluştu.' }
    }

    const allSales = rawSales || []

    // Helper to categorize sales status into standard pipeline stages
    const categorizeStatus = (status: string | null) => {
        const s = (status || '').toLowerCase().trim()
        if (['sold', 'contract', 'completed', 'won'].includes(s)) return 'won'
        if (['reservation', 'opsiyon - kapora bekleniyor', 'reserved'].includes(s)) return 'reservation'
        if (['proposal', 'teklif - kapora bekleniyor', 'negotiation'].includes(s)) return 'proposal'
        if (['meeting', 'presentation', 'sitevisit'].includes(s)) return 'meeting'
        if (['prospect', 'contacted'].includes(s)) return 'prospect'
        if (['lost', 'cancelled', 'transferred'].includes(s)) return 'lost'
        return 'lead'
    }

    // Helper to get deal monetary value (final_price or unit.price or deposit)
    const getDealValue = (sale: any) => {
        const fp = Number(sale.final_price || 0)
        if (fp > 0) return fp
        const up = Number((sale.units as any)?.price || 0)
        if (up > 0) return up
        const dep = Number(sale.deposit_amount || 0)
        return dep > 0 ? dep * 10 : 0 // fallback estimate if only deposit known
    }

    // Filter by period
    const filterByDateRange = (items: typeof allSales, start: Date | null, end: Date | null) => {
        if (!start) return items
        return items.filter(item => {
            const itemDate = new Date(item.created_at)
            if (end) return itemDate >= start && itemDate <= end
            return itemDate >= start
        })
    }

    const currentPeriodSales = filterByDateRange(allSales, currentStart, currentEnd)
    const prevPeriodSales = prevStart ? filterByDateRange(allSales, prevStart, prevEnd) : []

    // 4. Calculate Stage Statistics
    const stageDataMap: Record<string, {
        count: number
        potentialValue: number
        depositAmount: number
        wonRevenue: number
    }> = {
        lead: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        prospect: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        meeting: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        proposal: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        reservation: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        won: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
        lost: { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 },
    }

    currentPeriodSales.forEach(sale => {
        const cat = categorizeStatus(sale.status)
        const val = getDealValue(sale)
        const dep = Number(sale.deposit_amount || 0)

        if (stageDataMap[cat]) {
            stageDataMap[cat].count += 1
            stageDataMap[cat].potentialValue += val
            stageDataMap[cat].depositAmount += dep
            if (cat === 'won') {
                stageDataMap[cat].wonRevenue += val
            }
        }
    })

    // Stage Definitions with Win Probability Weights
    const stageDefs = [
        {
            stageKey: 'lead',
            title: '1. Yeni Lead & Aday',
            description: 'Sisteme yeni giren reklam ve organik potansiyel talepler',
            probability: 0.05, // %5 olasılık
            color: '#3b82f6',
            gradient: 'from-blue-500 to-indigo-600',
        },
        {
            stageKey: 'prospect',
            title: '2. Nitelikli / İletişim',
            description: 'İlk temas kurulan, bütçe ve ihtiyacı teyit edilmiş adaylar',
            probability: 0.15, // %15 olasılık
            color: '#6366f1',
            gradient: 'from-indigo-500 to-violet-600',
        },
        {
            stageKey: 'meeting',
            title: '3. Randevu & Sunum',
            description: 'Satış ofisi ziyareti, online veya birebir sunum yapılanlar',
            probability: 0.35, // %35 olasılık
            color: '#8b5cf6',
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            stageKey: 'proposal',
            title: '4. Teklif & Pazarlık',
            description: 'Ödeme planı ve fiyat teklifi iletilen müzakere süreci',
            probability: 0.60, // %60 olasılık
            color: '#ec4899',
            gradient: 'from-purple-500 to-pink-600',
        },
        {
            stageKey: 'reservation',
            title: '5. Opsiyon & Kapora',
            description: 'Ünite bloke edilmiş, kaporası alınmış sözleşme hazırlığı',
            probability: 0.85, // %85 olasılık
            color: '#f59e0b',
            gradient: 'from-pink-600 to-amber-500',
        },
        {
            stageKey: 'won',
            title: '6. Satış & Sözleşme',
            description: 'Kazanılan, sözleşmesi imzalanan kesinleşmiş satışlar',
            probability: 1.00, // %100 gerçekleşen
            color: '#10b981',
            gradient: 'from-emerald-500 to-teal-600',
        },
    ]

    const totalFunnelStarts = stageDataMap.lead.count || 1

    const funnelStages: FunnelStageData[] = stageDefs.map((def, idx) => {
        const currentData = stageDataMap[def.stageKey] || { count: 0, potentialValue: 0, depositAmount: 0, wonRevenue: 0 }
        const prevCount = idx === 0 ? currentData.count : stageDataMap[stageDefs[idx - 1].stageKey]?.count || 0
        const conversionFromPrev = prevCount > 0 ? Math.round((currentData.count / prevCount) * 100) : 0
        const conversionFromTop = totalFunnelStarts > 0 ? Math.round((currentData.count / totalFunnelStarts) * 100) : 0
        const weightedForecast = Math.round(currentData.potentialValue * def.probability)

        return {
            stageKey: def.stageKey,
            title: def.title,
            description: def.description,
            count: currentData.count,
            potentialValue: currentData.potentialValue,
            depositAmount: currentData.depositAmount,
            wonRevenue: currentData.wonRevenue,
            probability: Math.round(def.probability * 100),
            weightedForecast,
            color: def.color,
            gradient: def.gradient,
            conversionFromPrev: idx === 0 ? 100 : Math.min(conversionFromPrev, 100),
            conversionFromTop: idx === 0 ? 100 : Math.min(conversionFromTop, 100)
        }
    })

    // 5. Total Pipeline Values & Revenue Forecasting
    const totalPipelineCount = currentPeriodSales.length
    const wonCount = stageDataMap.won.count
    const wonRevenue = stageDataMap.won.wonRevenue
    const lostCount = stageDataMap.lost.count

    // Total Kapora (Deposits) across all pipeline records
    const totalDepositsCollected = currentPeriodSales.reduce((sum, s) => sum + Number(s.deposit_amount || 0), 0)
    const activeReservationDeposits = stageDataMap.reservation.depositAmount
    const wonDeposits = stageDataMap.won.depositAmount

    // Active pipeline potential (in-progress stages)
    const activePipelineValue =
        stageDataMap.proposal.potentialValue +
        stageDataMap.reservation.potentialValue +
        stageDataMap.meeting.potentialValue

    // Weighted Pipeline Forecast Total
    const weightedForecastTotal =
        wonRevenue +
        Math.round(stageDataMap.reservation.potentialValue * 0.85) +
        Math.round(stageDataMap.proposal.potentialValue * 0.60) +
        Math.round(stageDataMap.meeting.potentialValue * 0.35) +
        Math.round(stageDataMap.prospect.potentialValue * 0.15) +
        Math.round(stageDataMap.lead.potentialValue * 0.05)

    // 3 Scenarios Forecast
    const conservativeScenario =
        wonRevenue +
        Math.round(stageDataMap.reservation.potentialValue * 0.70) +
        Math.round(stageDataMap.proposal.potentialValue * 0.30)

    const baseScenario = weightedForecastTotal

    const optimisticScenario =
        wonRevenue +
        Math.round(stageDataMap.reservation.potentialValue * 0.95) +
        Math.round(stageDataMap.proposal.potentialValue * 0.80) +
        Math.round(stageDataMap.meeting.potentialValue * 0.50)

    const maxPotentialRevenue =
        wonRevenue +
        stageDataMap.reservation.potentialValue +
        stageDataMap.proposal.potentialValue +
        stageDataMap.meeting.potentialValue

    const revenueForecast: RevenueForecast = {
        realizedRevenue: wonRevenue,
        securedDeposits: totalDepositsCollected,
        activePipelineValue,
        weightedForecastTotal,
        conservativeScenario,
        baseScenario,
        optimisticScenario,
        maxPotentialRevenue
    }

    // Win Rate & Velocity
    const winRate = totalPipelineCount > 0 ? Math.round((wonCount / totalPipelineCount) * 1000) / 10 : 0
    const avgDealSize = wonCount > 0 ? Math.round(wonRevenue / wonCount) : 0

    const wonDeals = currentPeriodSales.filter(s => categorizeStatus(s.status) === 'won')
    let totalCloseDays = 0
    let closeDaysCount = 0
    wonDeals.forEach(s => {
        if (s.created_at) {
            const endDate = s.contract_date ? new Date(s.contract_date) : new Date(s.updated_at || s.created_at)
            const startDate = new Date(s.created_at)
            const days = Math.max(differenceInDays(endDate, startDate), 1)
            totalCloseDays += days
            closeDaysCount++
        }
    })
    const avgDaysToClose = closeDaysCount > 0 ? Math.round(totalCloseDays / closeDaysCount) : 14

    // 6. Previous Period Comparison
    const prevWonDeals = prevPeriodSales.filter(s => categorizeStatus(s.status) === 'won')
    const prevWonRevenue = prevWonDeals.reduce((sum, s) => sum + getDealValue(s), 0)
    const prevWonCount = prevWonDeals.length
    const prevTotalCount = prevPeriodSales.length
    const prevWinRate = prevTotalCount > 0 ? Math.round((prevWonCount / prevTotalCount) * 1000) / 10 : 0

    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return Math.round(((curr - prev) / prev) * 100)
    }

    const periodComparison = {
        totalLeads: {
            current: totalPipelineCount,
            prev: prevTotalCount,
            change: calcChange(totalPipelineCount, prevTotalCount)
        },
        wonRevenue: {
            current: wonRevenue,
            prev: prevWonRevenue,
            change: calcChange(wonRevenue, prevWonRevenue)
        },
        wonCount: {
            current: wonCount,
            prev: prevWonCount,
            change: calcChange(wonCount, prevWonCount)
        },
        winRate: {
            current: winRate,
            prev: prevWinRate,
            change: Math.round((winRate - prevWinRate) * 10) / 10
        },
        deposits: {
            current: totalDepositsCollected,
            prev: prevPeriodSales.reduce((sum, s) => sum + Number(s.deposit_amount || 0), 0),
            change: calcChange(
                totalDepositsCollected,
                prevPeriodSales.reduce((sum, s) => sum + Number(s.deposit_amount || 0), 0)
            )
        }
    }

    // 7. Historical 6-Month Timeline Trend
    const sixMonthTrend = []
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i)
        const mStart = startOfMonth(monthDate)
        const mEnd = i > 0 ? startOfMonth(subMonths(now, i - 1)) : now
        const monthLabel = format(monthDate, 'MMM yyyy', { locale: tr })

        const monthSales = allSales.filter(s => {
            const d = new Date(s.created_at)
            return d >= mStart && d < mEnd
        })

        const monthWon = monthSales.filter(s => categorizeStatus(s.status) === 'won')
        const monthWonRev = monthWon.reduce((sum, s) => sum + getDealValue(s), 0)
        const monthProposals = monthSales.filter(s => ['proposal', 'reservation'].includes(categorizeStatus(s.status)))
        const monthDeposits = monthSales.reduce((sum, s) => sum + Number(s.deposit_amount || 0), 0)

        sixMonthTrend.push({
            month: monthLabel,
            totalLeads: monthSales.length,
            wonCount: monthWon.length,
            proposalsCount: monthProposals.length,
            wonRevenueM: Math.round((monthWonRev / 1000000) * 100) / 100,
            wonRevenueRaw: monthWonRev,
            depositsCollected: monthDeposits
        })
    }

    // 8. Project-Based Funnel Breakdown
    const projectMap: Record<string, {
        id: string
        name: string
        totalLeads: number
        wonCount: number
        wonRevenue: number
        pipelineValue: number
        depositsCollected: number
        proposals: number
        reservations: number
    }> = {}

    currentPeriodSales.forEach(s => {
        const pId = s.project_id || 'unassigned'
        const pName = (s.projects as any)?.name || 'Projesiz / Genel'

        if (!projectMap[pId]) {
            projectMap[pId] = {
                id: pId,
                name: pName,
                totalLeads: 0,
                wonCount: 0,
                wonRevenue: 0,
                pipelineValue: 0,
                depositsCollected: 0,
                proposals: 0,
                reservations: 0
            }
        }

        projectMap[pId].totalLeads += 1
        const cat = categorizeStatus(s.status)
        const val = getDealValue(s)
        const dep = Number(s.deposit_amount || 0)
        projectMap[pId].depositsCollected += dep

        if (cat === 'won') {
            projectMap[pId].wonCount += 1
            projectMap[pId].wonRevenue += val
        } else if (cat === 'proposal') {
            projectMap[pId].proposals += 1
            projectMap[pId].pipelineValue += val
        } else if (cat === 'reservation') {
            projectMap[pId].reservations += 1
            projectMap[pId].pipelineValue += val
        }
    })

    const projectBreakdown = Object.values(projectMap)
        .map(p => ({
            ...p,
            winRate: p.totalLeads > 0 ? Math.round((p.wonCount / p.totalLeads) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.wonRevenue - a.wonRevenue)

    // 9. Sales Rep / Advisor Performance Matrix
    const repMap: Record<string, {
        id: string
        name: string
        email: string
        assignedLeads: number
        wonCount: number
        wonRevenue: number
        pipelineValue: number
        depositsCollected: number
        proposals: number
    }> = {}

    currentPeriodSales.forEach(s => {
        const repId = s.assigned_to || 'unassigned'
        const repName = (s.profiles as any)?.full_name || (s.assigned_to ? 'Atanmış Danışman' : 'Atanmamış / Havuz')
        const repEmail = (s.profiles as any)?.email || ''

        if (!repMap[repId]) {
            repMap[repId] = {
                id: repId,
                name: repName,
                email: repEmail,
                assignedLeads: 0,
                wonCount: 0,
                wonRevenue: 0,
                pipelineValue: 0,
                depositsCollected: 0,
                proposals: 0
            }
        }

        repMap[repId].assignedLeads += 1
        const cat = categorizeStatus(s.status)
        const val = getDealValue(s)
        const dep = Number(s.deposit_amount || 0)
        repMap[repId].depositsCollected += dep

        if (cat === 'won') {
            repMap[repId].wonCount += 1
            repMap[repId].wonRevenue += val
        } else if (cat === 'proposal' || cat === 'reservation') {
            repMap[repId].proposals += 1
            repMap[repId].pipelineValue += val
        }
    })

    const repPerformance = Object.values(repMap)
        .map(r => ({
            ...r,
            conversionRate: r.assignedLeads > 0 ? Math.round((r.wonCount / r.assignedLeads) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.wonRevenue - a.wonRevenue)

    // 10. Loss Analysis
    const lostSales = currentPeriodSales.filter(s => categorizeStatus(s.status) === 'lost')
    const lossReasonMap: Record<string, { reason: string; count: number; estimatedLossValue: number }> = {}

    lostSales.forEach(s => {
        const reason = (s.lost_reason || 'Belirtilmedi / Diğer').trim()
        if (!lossReasonMap[reason]) {
            lossReasonMap[reason] = { reason, count: 0, estimatedLossValue: 0 }
        }
        lossReasonMap[reason].count += 1
        lossReasonMap[reason].estimatedLossValue += getDealValue(s)
    })

    const lossBreakdown = Object.values(lossReasonMap)
        .sort((a, b) => b.count - a.count)

    // 11. Lead Source Attribution
    const sourceMap: Record<string, { source: string; leads: number; won: number; revenue: number; deposits: number }> = {}
    currentPeriodSales.forEach(s => {
        const src = (s.customers as any)?.source || s.lead_origin || 'Organik / Doğrudan'
        if (!sourceMap[src]) {
            sourceMap[src] = { source: src, leads: 0, won: 0, revenue: 0, deposits: 0 }
        }
        sourceMap[src].leads += 1
        sourceMap[src].deposits += Number(s.deposit_amount || 0)
        if (categorizeStatus(s.status) === 'won') {
            sourceMap[src].won += 1
            sourceMap[src].revenue += getDealValue(s)
        }
    })

    const sourceBreakdown = Object.values(sourceMap)
        .map(s => ({
            ...s,
            winRate: s.leads > 0 ? Math.round((s.won / s.leads) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)

    // 12. Top Whale Deals (Kritik Büyük Fırsatlar Radarı)
    const topWhaleDeals = currentPeriodSales
        .filter(s => !['lost', 'won'].includes(categorizeStatus(s.status)))
        .map(s => ({
            id: s.id,
            customerName: (s.customers as any)?.full_name || 'İsimsiz Müşteri',
            customerPhone: (s.customers as any)?.phone || '',
            projectName: (s.projects as any)?.name || 'Genel',
            unitNumber: (s.units as any)?.unit_number || '',
            advisorName: (s.profiles as any)?.full_name || 'Atanmamış',
            stage: s.status || 'Teklif',
            dealValue: getDealValue(s),
            depositAmount: Number(s.deposit_amount || 0),
            createdAt: s.created_at,
            daysActive: differenceInDays(now, new Date(s.created_at))
        }))
        .sort((a, b) => b.dealValue - a.dealValue)
        .slice(0, 8)

    // 13. Stalled Deals / Bottleneck Alerts (14+ days stagnant)
    const fourteenDaysAgo = subDays(now, 14)
    const stagnantDeals = currentPeriodSales
        .filter(s => {
            const cat = categorizeStatus(s.status)
            if (!['proposal', 'reservation', 'prospect'].includes(cat)) return false
            const lastTouch = new Date(s.updated_at || s.created_at)
            return lastTouch <= fourteenDaysAgo
        })
        .map(s => ({
            id: s.id,
            customerName: (s.customers as any)?.full_name || 'İsimsiz Müşteri',
            customerPhone: (s.customers as any)?.phone || '',
            projectName: (s.projects as any)?.name || 'Genel',
            advisorName: (s.profiles as any)?.full_name || 'Atanmamış',
            stage: s.status || 'Teklif',
            daysInactive: differenceInDays(now, new Date(s.updated_at || s.created_at)),
            value: getDealValue(s),
            depositAmount: Number(s.deposit_amount || 0)
        }))
        .sort((a, b) => b.daysInactive - a.daysInactive)
        .slice(0, 10)

    return {
        tenantName: profile.full_name,
        period,
        selectedProjectId,
        projects,
        kpi: {
            totalPipelineCount,
            activePipelineValue,
            wonCount,
            wonRevenue,
            lostCount,
            winRate,
            avgDealSize,
            avgDaysToClose,
            totalDepositsCollected,
            activeReservationDeposits,
            wonDeposits
        },
        revenueForecast,
        periodComparison,
        funnelStages,
        sixMonthTrend,
        projectBreakdown,
        repPerformance,
        lossBreakdown,
        sourceBreakdown,
        topWhaleDeals,
        stagnantDeals
    }
}
