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
    differenceInDays,
    addMonths
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { isSameDayTurkey } from '@/lib/utils'

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

export interface MonthlyCashflowItem {
    monthKey: string
    monthLabel: string
    shortLabel: string
    dueAmount: number
    paidAmount: number
    pendingAmount: number
    count: number
    isCurrentMonth: boolean
}

export interface UpcomingInstallmentItem {
    id: string
    contractId: string
    contractNumber: string
    customerName: string
    projectName: string
    paymentType: string
    dueDate: string
    amount: number
    paidAmount: number
    currency: string
    status: string
    isOverdue: boolean
    daysOverdue?: number
}

export interface ContractCashflowData {
    totalContractsCount: number
    totalContractedValue: number
    totalCollectedCash: number
    totalRemainingReceivables: number
    collectionProgress: number
    thisMonthDue: number
    thisMonthCollected: number
    thisMonthPending: number
    thisMonthCollectionRate: number
    overdueReceivables: number
    overdueCount: number
    forwardCashflow: MonthlyCashflowItem[]
    upcomingInstallments: UpcomingInstallmentItem[]
    topOverdueInstallments: UpcomingInstallmentItem[]
}

export interface SalesActivitiesData {
    todayTotal: number
    todayCompleted: number
    todayCalls: number
    todayMeetings: number
    todayVisits: number
    periodTotal: number
    periodCompleted: number
    periodCalls: number
    periodMeetings: number
    periodVisits: number
    completionRate: number
    conversionLeadToMeeting: number
    conversionMeetingToWon: number
    repEfforts: Array<{
        repId: string
        repName: string
        callsCount: number
        meetingsCount: number
        proposalsCount: number
        wonCount: number
        wonRevenue: number
        closingRatio: number
    }>
    neglectedHotDeals: Array<{
        id: string
        customerName: string
        advisorName: string
        stage: string
        dealValue: number
        daysSinceLastActivity: number
        lastActivityDate: string | null
    }>
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

    // 3. Query all sales with units, projects, profiles, customers (Chunked Pagination to bypass 1000 row limit)
    const allSales: any[] = []
    let salesPage = 0
    const CHUNK_SIZE = 1000

    while (true) {
        let query = supabase
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
            query = query.eq('project_id', selectedProjectId)
        }

        const { data, error: salesErr } = await query
            .order('id', { ascending: true })
            .range(salesPage * CHUNK_SIZE, (salesPage + 1) * CHUNK_SIZE - 1)

        if (salesErr) {
            console.error('CeoFunnel sales fetch error:', salesErr)
            if (salesPage === 0) {
                return { error: 'Satış verileri alınırken hata oluştu.' }
            }
            break
        }

        if (!data || data.length === 0) break
        allSales.push(...data)
        if (data.length < CHUNK_SIZE) break
        salesPage++
    }

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

    // -------------------------------------------------------------
    // 14. Contracted Cashflow & Payment Plan Projections (Chunked pagination to bypass 1000 limit)
    // -------------------------------------------------------------
    const allContracts: any[] = []
    let contractsPage = 0

    while (true) {
        let query = supabase
            .from('contracts')
            .select(`
                id,
                contract_number,
                contract_date,
                amount,
                final_amount,
                total_amount,
                currency,
                status,
                project_id,
                projects:project_id ( id, name ),
                customers:contract_customers (
                    customer:customers ( id, full_name, phone )
                ),
                payments:payment_plans (
                    id,
                    payment_type,
                    due_date,
                    amount,
                    paid_amount,
                    currency,
                    status,
                    paid_date,
                    notes
                )
            `)
            .eq('tenant_id', tenantId)
            .neq('status', 'Cancelled')

        if (selectedProjectId) {
            query = query.eq('project_id', selectedProjectId)
        }

        const { data, error: contractsErr } = await query
            .order('id', { ascending: true })
            .range(contractsPage * CHUNK_SIZE, (contractsPage + 1) * CHUNK_SIZE - 1)

        if (contractsErr) {
            console.error('CeoFunnel contracts fetch error:', contractsErr)
            break
        }

        if (!data || data.length === 0) break
        allContracts.push(...data)
        if (data.length < CHUNK_SIZE) break
        contractsPage++
    }
    let totalContractedValue = 0
    let totalCollectedCash = 0
    const allPaymentItems: Array<{
        item: any
        contract: any
    }> = []

    allContracts.forEach(c => {
        const val = Number(c.final_amount || c.total_amount || c.amount || 0)
        totalContractedValue += val

        const payments = (c.payments as any[]) || []
        payments.forEach(p => {
            const pAmount = Number(p.amount || 0)
            const pPaid = Number(p.paid_amount || 0)
            const actualPaid = p.status === 'Paid' ? (pPaid > 0 ? pPaid : pAmount) : pPaid
            totalCollectedCash += actualPaid
            allPaymentItems.push({ item: p, contract: c })
        })
    })

    const totalRemainingReceivables = Math.max(0, totalContractedValue - totalCollectedCash)
    const collectionProgress = totalContractedValue > 0 ? Math.round((totalCollectedCash / totalContractedValue) * 100) : 0

    // This month cashflow
    const thisMonthKey = format(now, 'yyyy-MM')
    let thisMonthDue = 0
    let thisMonthCollected = 0

    // Overdue receivables
    const todayStr = format(now, 'yyyy-MM-dd')
    let overdueReceivables = 0
    let overdueCount = 0
    const topOverdueInstallments: UpcomingInstallmentItem[] = []
    const upcomingInstallments: UpcomingInstallmentItem[] = []

    allPaymentItems.forEach(({ item: p, contract: c }) => {
        const pAmount = Number(p.amount || 0)
        const pPaid = Number(p.paid_amount || 0)
        const actualPaid = p.status === 'Paid' ? (pPaid > 0 ? pPaid : pAmount) : pPaid
        const remaining = Math.max(0, pAmount - actualPaid)
        const dueDate = p.due_date ? String(p.due_date).slice(0, 10) : ''

        if (dueDate.startsWith(thisMonthKey)) {
            thisMonthDue += pAmount
            thisMonthCollected += actualPaid
        }

        const isOverdue = (p.status === 'Overdue' || (dueDate && dueDate < todayStr)) && p.status !== 'Paid' && remaining > 0
        if (isOverdue) {
            overdueReceivables += remaining
            overdueCount += 1
            const daysOverdue = dueDate ? differenceInDays(now, new Date(dueDate)) : 0
            const cust = (c.customers as any[])?.[0]?.customer
            topOverdueInstallments.push({
                id: p.id,
                contractId: c.id,
                contractNumber: c.contract_number || 'Sözleşme',
                customerName: cust?.full_name || 'Müşteri',
                projectName: (c.projects as any)?.name || 'Proje',
                paymentType: p.payment_type || 'Taksit',
                dueDate,
                amount: remaining,
                paidAmount: actualPaid,
                currency: p.currency || 'TRY',
                status: 'Overdue',
                isOverdue: true,
                daysOverdue
            })
        } else if (dueDate && dueDate >= todayStr && p.status !== 'Paid' && remaining > 0) {
            const cust = (c.customers as any[])?.[0]?.customer
            upcomingInstallments.push({
                id: p.id,
                contractId: c.id,
                contractNumber: c.contract_number || 'Sözleşme',
                customerName: cust?.full_name || 'Müşteri',
                projectName: (c.projects as any)?.name || 'Proje',
                paymentType: p.payment_type || 'Taksit',
                dueDate,
                amount: remaining,
                paidAmount: actualPaid,
                currency: p.currency || 'TRY',
                status: p.status || 'Pending',
                isOverdue: false
            })
        }
    })

    topOverdueInstallments.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))
    upcomingInstallments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    const thisMonthPending = Math.max(0, thisMonthDue - thisMonthCollected)
    const thisMonthCollectionRate = thisMonthDue > 0 ? Math.round((thisMonthCollected / thisMonthDue) * 100) : 0

    // Forward 12-Month Cashflow Forecast
    const forwardCashflow: MonthlyCashflowItem[] = []
    const startMonth = startOfMonth(now)

    for (let i = 0; i < 12; i++) {
        const mDate = addMonths(startMonth, i)
        const mKey = format(mDate, 'yyyy-MM')
        const mLabel = format(mDate, 'MMMM yyyy', { locale: tr })
        const sLabel = format(mDate, 'MMM yy', { locale: tr })

        let mDue = 0
        let mPaid = 0
        let mCount = 0

        allPaymentItems.forEach(({ item: p }) => {
            const dueDate = p.due_date ? String(p.due_date).slice(0, 10) : ''
            if (dueDate.startsWith(mKey)) {
                const pAmount = Number(p.amount || 0)
                const pPaid = Number(p.paid_amount || 0)
                const actualPaid = p.status === 'Paid' ? (pPaid > 0 ? pPaid : pAmount) : pPaid
                mDue += pAmount
                mPaid += actualPaid
                mCount += 1
            }
        })

        forwardCashflow.push({
            monthKey: mKey,
            monthLabel: mLabel,
            shortLabel: sLabel,
            dueAmount: mDue,
            paidAmount: mPaid,
            pendingAmount: Math.max(0, mDue - mPaid),
            count: mCount,
            isCurrentMonth: i === 0
        })
    }

    const contractCashflow: ContractCashflowData = {
        totalContractsCount: allContracts.length,
        totalContractedValue,
        totalCollectedCash,
        totalRemainingReceivables,
        collectionProgress,
        thisMonthDue,
        thisMonthCollected,
        thisMonthPending,
        thisMonthCollectionRate,
        overdueReceivables,
        overdueCount,
        forwardCashflow,
        upcomingInstallments: upcomingInstallments.slice(0, 8),
        topOverdueInstallments: topOverdueInstallments.slice(0, 6)
    }

    // -------------------------------------------------------------
    // 15. Sales Activities & Operational Pulse (Chunked pagination to bypass 1000 limit)
    // -------------------------------------------------------------
    const allActivities: any[] = []
    let activitiesPage = 0

    while (true) {
        let query = supabase
            .from('activities')
            .select(`
                id,
                type,
                status,
                due_date,
                completed_at,
                created_at,
                owner_id,
                customer_id,
                project_id,
                outcome,
                summary,
                profiles:owner_id ( id, full_name ),
                customers:customer_id ( id, full_name, phone )
            `)
            .eq('tenant_id', tenantId)

        if (selectedProjectId) {
            query = query.eq('project_id', selectedProjectId)
        }

        const { data, error: activitiesErr } = await query
            .order('id', { ascending: true })
            .range(activitiesPage * CHUNK_SIZE, (activitiesPage + 1) * CHUNK_SIZE - 1)

        if (activitiesErr) {
            console.error('CeoFunnel activities fetch error:', activitiesErr)
            break
        }

        if (!data || data.length === 0) break
        allActivities.push(...data)
        if (data.length < CHUNK_SIZE) break
        activitiesPage++
    }

    let todayTotal = 0
    let todayCompleted = 0
    let todayCalls = 0
    let todayMeetings = 0
    let todayVisits = 0

    allActivities.forEach(act => {
        const isTodayAct = (act.due_date && isSameDayTurkey(act.due_date, now)) || (act.completed_at && isSameDayTurkey(act.completed_at, now))
        if (isTodayAct) {
            todayTotal += 1
            if (act.status === 'Completed') todayCompleted += 1
            const t = (act.type || '').toLowerCase()
            if (['call', 'phone'].includes(t)) todayCalls += 1
            else if (['meeting', 'officemeeting', 'onlinemeeting'].includes(t)) todayMeetings += 1
            else if (['visit', 'site visit', 'sitevisit'].includes(t)) todayVisits += 1
        }
    })

    // Period activities
    const periodActivities = allActivities.filter(act => {
        const d = act.due_date || act.created_at
        if (!d) return false
        const actDate = new Date(d)
        if (currentStart && actDate < currentStart) return false
        if (currentEnd && actDate > currentEnd) return false
        return true
    })

    const periodTotal = periodActivities.length
    const periodCompleted = periodActivities.filter(a => a.status === 'Completed').length
    const periodCalls = periodActivities.filter(a => ['call', 'phone'].includes((a.type || '').toLowerCase())).length
    const periodMeetings = periodActivities.filter(a => ['meeting', 'officemeeting', 'onlinemeeting'].includes((a.type || '').toLowerCase())).length
    const periodVisits = periodActivities.filter(a => ['visit', 'site visit', 'sitevisit'].includes((a.type || '').toLowerCase())).length
    const completionRate = periodTotal > 0 ? Math.round((periodCompleted / periodTotal) * 100) : 0

    // Rep activity matrix
    const repActivityMap: Record<string, {
        repId: string
        repName: string
        callsCount: number
        meetingsCount: number
        proposalsCount: number
        wonCount: number
        wonRevenue: number
    }> = {}

    // Prepopulate from existing repPerformance
    repPerformance.forEach(rp => {
        repActivityMap[rp.id] = {
            repId: rp.id,
            repName: rp.name,
            callsCount: 0,
            meetingsCount: 0,
            proposalsCount: rp.proposals,
            wonCount: rp.wonCount,
            wonRevenue: rp.wonRevenue
        }
    })

    periodActivities.forEach(act => {
        const rId = act.owner_id || 'unassigned'
        const rName = (act.profiles as any)?.full_name || 'Atanmamış'
        if (!repActivityMap[rId]) {
            repActivityMap[rId] = {
                repId: rId,
                repName: rName,
                callsCount: 0,
                meetingsCount: 0,
                proposalsCount: 0,
                wonCount: 0,
                wonRevenue: 0
            }
        }
        const t = (act.type || '').toLowerCase()
        if (['call', 'phone'].includes(t)) repActivityMap[rId].callsCount += 1
        else if (['meeting', 'officemeeting', 'onlinemeeting', 'visit', 'site visit'].includes(t)) repActivityMap[rId].meetingsCount += 1
    })

    const repEfforts = Object.values(repActivityMap)
        .map(r => ({
            ...r,
            closingRatio: r.meetingsCount > 0 ? Math.round((r.wonCount / r.meetingsCount) * 100) : 0
        }))
        .sort((a, b) => b.wonRevenue - a.wonRevenue)

    // Neglected Hot Deals (High Value Deals in proposal/reservation with no activity in 5+ days)
    const customerLastActivityMap: Record<string, string> = {}
    allActivities.forEach(a => {
        if (a.customer_id) {
            const dateStr = a.completed_at || a.due_date || a.created_at
            if (dateStr) {
                if (!customerLastActivityMap[a.customer_id] || customerLastActivityMap[a.customer_id] < dateStr) {
                    customerLastActivityMap[a.customer_id] = dateStr
                }
            }
        }
    })

    const fiveDaysAgo = subDays(now, 5)
    const neglectedHotDeals = currentPeriodSales
        .filter(s => {
            const cat = categorizeStatus(s.status)
            if (!['proposal', 'reservation'].includes(cat)) return false
            const lastAct = customerLastActivityMap[s.customer_id]
            if (!lastAct) return true
            return new Date(lastAct) < fiveDaysAgo
        })
        .map(s => {
            const lastAct = customerLastActivityMap[s.customer_id] || null
            const daysSince = lastAct ? differenceInDays(now, new Date(lastAct)) : differenceInDays(now, new Date(s.created_at))
            return {
                id: s.id,
                customerName: (s.customers as any)?.full_name || 'İsimsiz Müşteri',
                advisorName: (s.profiles as any)?.full_name || 'Atanmamış',
                stage: s.status || 'Teklif',
                dealValue: getDealValue(s),
                daysSinceLastActivity: daysSince,
                lastActivityDate: lastAct
            }
        })
        .sort((a, b) => b.dealValue - a.dealValue)
        .slice(0, 6)

    const salesActivities: SalesActivitiesData = {
        todayTotal,
        todayCompleted,
        todayCalls,
        todayMeetings,
        todayVisits,
        periodTotal,
        periodCompleted,
        periodCalls,
        periodMeetings,
        periodVisits,
        completionRate,
        conversionLeadToMeeting: stageDataMap.lead.count > 0 ? Math.round((stageDataMap.meeting.count / stageDataMap.lead.count) * 100) : 0,
        conversionMeetingToWon: stageDataMap.meeting.count > 0 ? Math.round((stageDataMap.won.count / stageDataMap.meeting.count) * 100) : 0,
        repEfforts,
        neglectedHotDeals
    }

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
        stagnantDeals,
        contractCashflow,
        salesActivities
    }
}
