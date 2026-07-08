'use server'

import { createClient } from '@/lib/supabase/server'

export type PeriodKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'all_time'

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
        case 'all_time': {
            // Go back 2 years to cover all possible data
            const allStart = new Date(now.getFullYear() - 2, 0, 1)
            return { from: allStart.toISOString().split('T')[0], to: today }
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

    // Fetch all available stats data (no date limit to support 'all_time')
    let { data: stats } = await supabase
        .from('report_daily_stats')
        .select('stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, whatsapp_breakdown, calls_breakdown, updated_at')
        .eq('tenant_id', tenantId)
        .order('stat_date', { ascending: true })

    // Auto-refresh/Self-healing check:
    // If stats is empty, or today's row is missing, or the latest row's updated_at is older than 10 minutes, trigger the refresh RPC.
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    let hasTodayRow = false
    let latestUpdate: Date | null = null
    
    if (stats && stats.length > 0) {
        hasTodayRow = stats.some(s => s.stat_date === todayStr)
        const timestamps = stats.map(s => s.updated_at ? new Date(s.updated_at).getTime() : 0)
        const maxTimestamp = Math.max(...timestamps)
        if (maxTimestamp > 0) {
            latestUpdate = new Date(maxTimestamp)
        }
    }

    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)
    const shouldRefresh = !stats || stats.length === 0 || !hasTodayRow || !latestUpdate || latestUpdate < tenMinutesAgo

    if (shouldRefresh) {
        try {
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const adminSupabase = createAdminClient()
            await adminSupabase.rpc('refresh_report_daily_stats')
            
            // Re-fetch stats after refresh
            const { data: refreshedStats } = await supabase
                .from('report_daily_stats')
                .select('stat_date, whatsapp_count, outbound_call_count, inbound_call_count, cold_count, warm_count, hot_count, whatsapp_breakdown, calls_breakdown, updated_at')
                .eq('tenant_id', tenantId)
                .order('stat_date', { ascending: true })
            
            if (refreshedStats) {
                stats = refreshedStats
            }
        } catch (err) {
            console.error('[Performance Analytics] Failed to auto-refresh stats:', err)
        }
    }

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
        { key: 'last_month', label: 'Geçen Ay' },
        { key: 'all_time', label: 'Tüm Zamanlar' }
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

// ─── CDR: Telefon Detay Kayıtları ──────────────────────────

export interface CallCDRRecord {
    id: string
    type: 'manuel' | 'ai_outbound' | 'ai_inbound'
    date: string
    customer_name: string | null
    phone: string | null
    created_by: string | null
    summary: string | null
    status: string | null
    duration_seconds: number | null
    interest_level: string | null
    call_source: string | null
}

export async function getCallCDR(period: PeriodKey, page: number = 1, pageSize: number = 50): Promise<{ records: CallCDRRecord[]; total: number }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { records: [], total: 0 }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { records: [], total: 0 }

    const range = getDateRange(period)
    const fromTs = `${range.from}T00:00:00`
    const toTs = `${range.to}T23:59:59`
    const offset = (page - 1) * pageSize

    // 1. Manuel aramalar (activities) — tüm type='Call' kayıtları (dashboard ile uyumlu)
    const { data: manualCalls, count: manualCount } = await supabase
        .from('activities')
        .select('id, created_at, summary, description, status, customer_id, customer:customers(full_name, phone), creator:profiles!user_id(full_name)', { count: 'exact' })
        .eq('type', 'Call')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', fromTs)
        .lte('created_at', toTs)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    // 2. AI Outbound (lead_qualifications) — with caller profile and customer_id for workflow lookup
    const { data: aiOutbound, count: aiOutCount } = await supabase
        .from('lead_qualifications')
        .select('id, last_call_at, interest_level, call_duration_seconds, call_notes, customer_id, customer:customers(full_name, phone), caller:profiles!last_call_by(full_name)', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)
        .not('last_call_at', 'is', null)
        .gte('last_call_at', fromTs)
        .lte('last_call_at', toTs)
        .order('last_call_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    // 3. AI Inbound (inbound_calls)
    const { data: inboundCalls, count: inboundCount } = await supabase
        .from('inbound_calls')
        .select('id, started_at, caller_phone, duration_seconds, summary, customer:customers(full_name)', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)
        .gte('started_at', fromTs)
        .lte('started_at', toTs)
        .order('started_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    // 4. Outreach workflow names — tenant seviyesinde çek, customer_id → workflow_name map
    // NOT: .in('customer_id', devArray) PostgREST URL limitine takılıyordu
    let workflowMap = new Map<string, string>()  // customer_id -> workflow_name
    const { data: allExecutions } = await supabase
        .from('outreach_executions')
        .select('customer_id, outreach_workflows(name)')
        .eq('tenant_id', profile.tenant_id)
        .not('customer_id', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10000)
    
    if (allExecutions) {
        for (const exec of allExecutions) {
            if (exec.customer_id && !workflowMap.has(exec.customer_id)) {
                const wfName = (exec.outreach_workflows as any)?.name
                if (wfName) workflowMap.set(exec.customer_id, wfName)
            }
        }
    }

    // Build dedup set: customer_id + date combos from lead_qualifications to avoid double-counting
    const lqDedupSet = new Set<string>()
    for (const c of aiOutbound || []) {
        if (c.customer_id && c.last_call_at) {
            const dateKey = new Date(c.last_call_at).toISOString().split('T')[0]
            lqDedupSet.add(`${c.customer_id}_${dateKey}`)
        }
    }

    const records: CallCDRRecord[] = []

    // Map activities — skip AI entries already in lead_qualifications, use workflowMap for source
    for (const c of manualCalls || []) {
        const isAI = (c.summary || '').includes('🤖') || (c.summary || '').toLowerCase().includes('ai arama')
        const custId = (c as any).customer_id
        const actDate = new Date(c.created_at).toISOString().split('T')[0]
        
        // Skip if this is an AI activity that's already represented in lead_qualifications
        if (isAI && custId && lqDedupSet.has(`${custId}_${actDate}`)) {
            continue
        }

        let cName = (c.customer as any)?.full_name || null
        let cPhone = (c.customer as any)?.phone || null

        if (!cName && (c as any).description) {
            const bracketMatch = (c as any).description.match(/\[([^\]]+)\]/)
            if (bracketMatch) {
                const parts = bracketMatch[1].split(',').map((s: string) => s.trim())
                if (parts[0] && !parts[0].match(/^\d/)) cName = parts[0]
            }
        }
        if (!cPhone && (c as any).description) {
            const phoneMatch = (c as any).description.match(/Telefon:\s*(\+?\d[\d\s-]{8,})/)?.[1]
            if (phoneMatch) cPhone = phoneMatch.replace(/[\s-]/g, '')
        }

        // Determine call source — check outreach workflow first
        const creatorName = (c.creator as any)?.full_name || null
        const workflowName = custId ? workflowMap.get(custId) : null
        
        let callSource: string
        if (workflowName) {
            callSource = `Outreach (${workflowName})`
        } else if (isAI) {
            callSource = `Manuel AI Arama${creatorName ? ` (${creatorName})` : ''}`
        } else {
            callSource = `Manuel Arama${creatorName ? ` (${creatorName})` : ''}`
        }

        records.push({
            id: c.id,
            type: 'manuel',
            date: c.created_at,
            customer_name: cName,
            phone: cPhone,
            created_by: creatorName,
            summary: c.summary,
            status: c.status,
            duration_seconds: null,
            interest_level: null,
            call_source: callSource,
        })
    }

    // Map AI outbound
    for (const c of aiOutbound || []) {
        const callerName = (c.caller as any)?.full_name || null
        const workflowName = c.customer_id ? workflowMap.get(c.customer_id) : null
        
        let callSource: string
        if (workflowName) {
            callSource = `Outreach (${workflowName})`
        } else if (callerName) {
            callSource = `Manuel AI Arama (${callerName})`
        } else {
            callSource = 'AI Arama'
        }

        records.push({
            id: c.id,
            type: 'ai_outbound',
            date: c.last_call_at!,
            customer_name: (c.customer as any)?.full_name || null,
            phone: (c.customer as any)?.phone || null,
            created_by: callerName || 'Maya AI',
            summary: c.call_notes,
            status: c.interest_level === 'hot' ? 'Hot Lead' : c.interest_level === 'warm' ? 'Ilık Lead' : 'Tamamlandı',
            duration_seconds: c.call_duration_seconds,
            interest_level: c.interest_level,
            call_source: callSource,
        })
    }

    // Map AI inbound
    for (const c of inboundCalls || []) {
        records.push({
            id: c.id,
            type: 'ai_inbound',
            date: c.started_at,
            customer_name: (c.customer as any)?.full_name || null,
            phone: c.caller_phone,
            created_by: 'Maya AI (Gelen)',
            summary: c.summary,
            status: 'Karşılandı',
            duration_seconds: c.duration_seconds,
            interest_level: null,
            call_source: 'Gelen Arama',
        })
    }

    // Sort all by date desc
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const total = (manualCount || 0) + (aiOutCount || 0) + (inboundCount || 0)
    return { records: records.slice(0, pageSize), total }
}

// ─── CDR: Telefon Excel/CSV Export (Tüm Kayıtlar) ──────────

export async function getCallCDRExport(period: PeriodKey): Promise<CallCDRRecord[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const range = getDateRange(period)
    const fromTs = `${range.from}T00:00:00`
    const toTs = `${range.to}T23:59:59`

    // 1. Manuel aramalar — tümü (dashboard ile uyumlu — filtresiz) — sayfa sayfa tümünü çek
    const manualCalls = await fetchAllRows<any>(
        async (offset, limit) => {
            return await supabase
                .from('activities')
                .select('id, created_at, summary, description, status, customer_id, customer:customers(full_name, phone), creator:profiles!user_id(full_name)')
                .eq('type', 'Call')
                .eq('tenant_id', profile.tenant_id)
                .gte('created_at', fromTs)
                .lte('created_at', toTs)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
        }
    )

    // 2. AI Outbound — tümü with caller and customer_id — sayfa sayfa tümünü çek
    const aiOutbound = await fetchAllRows<any>(
        async (offset, limit) => {
            return await supabase
                .from('lead_qualifications')
                .select('id, last_call_at, interest_level, call_duration_seconds, call_notes, customer_id, customer:customers(full_name, phone), caller:profiles!last_call_by(full_name)')
                .eq('tenant_id', profile.tenant_id)
                .not('last_call_at', 'is', null)
                .gte('last_call_at', fromTs)
                .lte('last_call_at', toTs)
                .order('last_call_at', { ascending: false })
                .range(offset, offset + limit - 1)
        }
    )

    // 3. AI Inbound — tümü — sayfa sayfa tümünü çek
    const inboundCalls = await fetchAllRows<any>(
        async (offset, limit) => {
            return await supabase
                .from('inbound_calls')
                .select('id, started_at, caller_phone, duration_seconds, summary, customer:customers(full_name)')
                .eq('tenant_id', profile.tenant_id)
                .gte('started_at', fromTs)
                .lte('started_at', toTs)
                .order('started_at', { ascending: false })
                .range(offset, offset + limit - 1)
        }
    )

    // Outreach workflow names — tenant seviyesinde çek
    let workflowMap = new Map<string, string>()
    const { data: allExecutions } = await supabase
        .from('outreach_executions')
        .select('customer_id, outreach_workflows(name)')
        .eq('tenant_id', profile.tenant_id)
        .not('customer_id', 'is', null)
        .order('started_at', { ascending: false })
        .limit(10000)
    if (allExecutions) {
        for (const exec of allExecutions) {
            if (exec.customer_id && !workflowMap.has(exec.customer_id)) {
                const wfName = (exec.outreach_workflows as any)?.name
                if (wfName) workflowMap.set(exec.customer_id, wfName)
            }
        }
    }

    // Dedup: AI calls appear in BOTH activities and lead_qualifications
    const lqDedupSet = new Set<string>()
    for (const c of aiOutbound || []) {
        if (c.customer_id && c.last_call_at) {
            const dateKey = new Date(c.last_call_at).toISOString().split('T')[0]
            lqDedupSet.add(`${c.customer_id}_${dateKey}`)
        }
    }

    const records: CallCDRRecord[] = []

    for (const c of manualCalls || []) {
        const isAI = (c.summary || '').includes('🤖') || (c.summary || '').toLowerCase().includes('ai arama')
        const custId = (c as any).customer_id
        const actDate = new Date(c.created_at).toISOString().split('T')[0]
        if (isAI && custId && lqDedupSet.has(`${custId}_${actDate}`)) continue

        let cName = (c.customer as any)?.full_name || null
        let cPhone = (c.customer as any)?.phone || null
        if (!cName && (c as any).description) {
            const bracketMatch = (c as any).description.match(/\[([^\]]+)\]/)
            if (bracketMatch) {
                const parts = bracketMatch[1].split(',').map((s: string) => s.trim())
                if (parts[0] && !parts[0].match(/^\d/)) cName = parts[0]
            }
        }
        if (!cPhone && (c as any).description) {
            const phoneMatch = (c as any).description.match(/Telefon:\s*(\+?\d[\d\s-]{8,})/)?.[1]
            if (phoneMatch) cPhone = phoneMatch.replace(/[\s-]/g, '')
        }

        const creatorName = (c.creator as any)?.full_name || null
        const workflowName = custId ? workflowMap.get(custId) : null
        let callSource: string
        if (workflowName) {
            callSource = `Outreach (${workflowName})`
        } else if (isAI) {
            callSource = `Manuel AI Arama${creatorName ? ` (${creatorName})` : ''}`
        } else {
            callSource = `Manuel Arama${creatorName ? ` (${creatorName})` : ''}`
        }

        records.push({
            id: c.id, type: 'manuel', date: c.created_at,
            customer_name: cName, phone: cPhone,
            created_by: creatorName,
            summary: c.summary, status: c.status,
            duration_seconds: null, interest_level: null,
            call_source: callSource,
        })
    }

    for (const c of aiOutbound || []) {
        const callerName = (c.caller as any)?.full_name || null
        const workflowName = c.customer_id ? workflowMap.get(c.customer_id) : null
        let callSource = workflowName ? `Outreach (${workflowName})` : callerName ? `Manuel AI Arama (${callerName})` : 'AI Arama'
        records.push({
            id: c.id, type: 'ai_outbound', date: c.last_call_at!,
            customer_name: (c.customer as any)?.full_name || null,
            phone: (c.customer as any)?.phone || null,
            created_by: callerName || 'Maya AI', summary: c.call_notes,
            status: c.interest_level === 'hot' ? 'Hot Lead' : c.interest_level === 'warm' ? 'Ilık Lead' : 'Tamamlandı',
            duration_seconds: c.call_duration_seconds, interest_level: c.interest_level,
            call_source: callSource,
        })
    }

    for (const c of inboundCalls || []) {
        records.push({
            id: c.id, type: 'ai_inbound', date: c.started_at,
            customer_name: (c.customer as any)?.full_name || null,
            phone: c.caller_phone, created_by: 'Maya AI (Gelen)',
            summary: c.summary, status: 'Karşılandı',
            duration_seconds: c.duration_seconds, interest_level: null,
            call_source: 'Gelen Arama',
        })
    }

    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return records
}

// ─── CDR: Telefon Özet Kırılımı (Summary Breakdown) ────────

export interface CallSummaryBreakdown {
    categories: { key: string; label: string; emoji: string; color: string; count: number }[]
    total: number
}

// Helper function to page through all rows from Supabase to bypass the 1000 max rows limit
async function fetchAllRows<T>(
    fetchFn: (offset: number, limit: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
    const allData: T[] = []
    const limit = 1000
    let offset = 0
    let hasMore = true
    let iterations = 0 // Safe guard against infinite loops
    
    while (hasMore && iterations < 50) {
        const { data, error } = await fetchFn(offset, limit)
        if (error || !data || data.length === 0) {
            hasMore = false
            break
        }
        allData.push(...data)
        if (data.length < limit) {
            hasMore = false
        } else {
            offset += limit
        }
        iterations++
    }
    return allData
}

export async function getCallSummaryBreakdown(period: PeriodKey): Promise<CallSummaryBreakdown> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { categories: [], total: 0 }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { categories: [], total: 0 }

    const range = getDateRange(period)
    const fromTs = `${range.from}T00:00:00`
    const toTs = `${range.to}T23:59:59`

    const counts: Record<string, number> = {}
    let useFallback = true

    // 1. Try to read cumulative daily statistics from report_daily_stats table (specialized summary_breakdown)
    try {
        const { data: statsRows, error: statsErr } = await supabase
            .from('report_daily_stats')
            .select('summary_breakdown')
            .eq('tenant_id', profile.tenant_id)
            .gte('stat_date', range.from)
            .lte('stat_date', range.to)

        if (!statsErr && statsRows && statsRows.length > 0) {
            let hasCumulativeData = false
            for (const row of statsRows) {
                const breakdown = (row as any).summary_breakdown
                if (breakdown && typeof breakdown === 'object' && Object.keys(breakdown).length > 0) {
                    hasCumulativeData = true
                    for (const [cat, cnt] of Object.entries(breakdown)) {
                        counts[cat] = (counts[cat] || 0) + (Number(cnt) || 0)
                    }
                }
            }
            if (hasCumulativeData) {
                useFallback = false
            }
        }
    } catch (e) {
        console.warn('[Analytics] Failed to fetch summary_breakdown from report_daily_stats:', e)
    }

    // 2. Graceful Fallback: Fetch raw calls page-by-page if cumulative data is not populated yet
    if (useFallback) {
        // 1. Manuel aramalar — sayfa sayfa tümünü çek
        const manualCalls = await fetchAllRows<{ summary: string | null; created_at: string; customer_id: string | null }>(
            async (offset, limit) => {
                return await supabase
                    .from('activities')
                    .select('summary, created_at, customer_id')
                    .eq('type', 'Call')
                    .eq('tenant_id', profile.tenant_id)
                    .gte('created_at', fromTs)
                    .lte('created_at', toTs)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1)
            }
        )

        // 2. AI Outbound — sayfa sayfa tümünü çek
        const aiOutbound = await fetchAllRows<{ interest_level: string | null; call_notes: string | null; last_call_at: string | null; customer_id: string | null }>(
            async (offset, limit) => {
                return await supabase
                    .from('lead_qualifications')
                    .select('interest_level, call_notes, last_call_at, customer_id')
                    .eq('tenant_id', profile.tenant_id)
                    .not('last_call_at', 'is', null)
                    .gte('last_call_at', fromTs)
                    .lte('last_call_at', toTs)
                    .order('last_call_at', { ascending: false })
                    .range(offset, offset + limit - 1)
            }
        )

        // 3. AI Inbound — sayfa sayfa tümünü çek
        const inboundCalls = await fetchAllRows<{ summary: string | null }>(
            async (offset, limit) => {
                return await supabase
                    .from('inbound_calls')
                    .select('summary')
                    .eq('tenant_id', profile.tenant_id)
                    .gte('started_at', fromTs)
                    .lte('started_at', toTs)
                    .order('started_at', { ascending: false })
                    .range(offset, offset + limit - 1)
            }
        )

        // Build dedup set: customer_id + date combos from lead_qualifications to avoid double-counting
        const lqDedupSet = new Set<string>()
        for (const c of aiOutbound || []) {
            if (c.customer_id && c.last_call_at) {
                const dateKey = new Date(c.last_call_at).toISOString().split('T')[0]
                lqDedupSet.add(`${c.customer_id}_${dateKey}`)
            }
        }

        // Manual calls — categorize from summary text (skip AI activities already in lead_qualifications)
        for (const c of manualCalls || []) {
            const summaryText = c.summary || ''
            const isAI = summaryText.includes('🤖') || summaryText.toLowerCase().includes('ai arama')
            const custId = (c as any).customer_id
            const actDate = new Date(c.created_at).toISOString().split('T')[0]
            
            if (isAI && custId && lqDedupSet.has(`${custId}_${actDate}`)) {
                continue
            }

            const cat = categorizeCallSummary(summaryText, 'manuel')
            counts[cat] = (counts[cat] || 0) + 1
        }

        // AI outbound — categorize from call_notes / interest_level
        for (const c of aiOutbound || []) {
            const summary = c.call_notes || ''
            const cat = categorizeCallSummary(summary, 'ai_outbound', c.interest_level)
            counts[cat] = (counts[cat] || 0) + 1
        }

        // AI inbound — categorize from summary
        for (const c of inboundCalls || []) {
            const cat = categorizeCallSummary(c.summary || '', 'ai_inbound')
            counts[cat] = (counts[cat] || 0) + 1
        }
    }

    // Define category metadata
    const categoryMeta: Record<string, { label: string; emoji: string; color: string }> = {
        'gorusme_tamamlandi': { label: 'Görüşme Tamamlandı', emoji: '✅', color: 'bg-emerald-500' },
        'musteri_ilgilendi': { label: 'Müşteri İlgilendi', emoji: '🔥', color: 'bg-red-500' },
        'skor_hot': { label: 'Skor: HOT', emoji: '🔥', color: 'bg-red-500' },
        'skor_warm': { label: 'Skor: WARM', emoji: '🟠', color: 'bg-amber-500' },
        'skor_follow_up': { label: 'Skor: FOLLOW UP', emoji: '📞', color: 'bg-blue-500' },
        'skor_disqualified': { label: 'Skor: DISQUALIFIED', emoji: '⛔', color: 'bg-slate-500' },
        'cevap_vermedi': { label: 'Cevap Vermedi', emoji: '📵', color: 'bg-orange-500' },
        'hat_mesgul': { label: 'Hat Meşgul', emoji: '🔴', color: 'bg-rose-500' },
        'acti_ama_kapatti': { label: 'Açtı ama Kapattı', emoji: '📵', color: 'bg-pink-500' },
        'musait_degil': { label: 'Müsait Değil / Tekrar Aranacak', emoji: '🔄', color: 'bg-sky-500' },
        'gorusuldu_ilgilenmedi': { label: 'Görüşüldü, İlgilenmedi', emoji: '❌', color: 'bg-gray-500' },
        'gelen_karsilandi': { label: 'Gelen Arama Karşılandı', emoji: '📥', color: 'bg-indigo-500' },
        'manuel_arama': { label: 'Manuel Arama', emoji: '📞', color: 'bg-blue-400' },
        'diger': { label: 'Diğer', emoji: '📋', color: 'bg-slate-400' },
    }

    // Build sorted result
    const categories = Object.entries(counts)
        .map(([key, count]) => {
            const meta = categoryMeta[key] || { label: key, emoji: '📋', color: 'bg-slate-400' }
            return { key, label: meta.label, emoji: meta.emoji, color: meta.color, count }
        })
        .sort((a, b) => b.count - a.count)

    const total = categories.reduce((sum, c) => sum + c.count, 0)

    return { categories, total }
}

function categorizeCallSummary(summary: string, type: 'manuel' | 'ai_outbound' | 'ai_inbound', interestLevel?: string | null): string {
    const s = summary.toLowerCase()

    // AI inbound calls
    if (type === 'ai_inbound') {
        return 'gelen_karsilandi'
    }

    // AI outbound — check patterns from engine.ts summary mapping
    if (type === 'ai_outbound' || s.includes('ai arama') || s.includes('🤖')) {
        // Skor-based from call_notes or summary
        if (s.includes('skor: hot') || s.includes('skor hot') || interestLevel === 'hot') return 'skor_hot'
        if (s.includes('skor: warm') || s.includes('skor warm') || interestLevel === 'warm') return 'skor_warm'
        if (s.includes('skor: follow') || s.includes('skor follow') || interestLevel === 'follow_up') return 'skor_follow_up'
        if (s.includes('skor: disqualified') || s.includes('skor disqualified') || interestLevel === 'disqualified') return 'skor_disqualified'

        // Outcome-based from activities.summary (engine.ts summaryMap)
        if (s.includes('müşteri ilgilendi') || s.includes('ilgilendi ✅')) return 'musteri_ilgilendi'
        if (s.includes('görüşüldü, ilgilenmedi') || s.includes('ilgilenmedi ❌')) return 'gorusuldu_ilgilenmedi'
        if (s.includes('görüşme tamamlandı') || s.includes('görüşüldü') || s.includes('görüşme yapıldı')) return 'gorusme_tamamlandi'
        if (s.includes('cevap vermedi')) return 'cevap_vermedi'
        if (s.includes('hat meşgul') || s.includes('meşgul')) return 'hat_mesgul'
        if (s.includes('açtı ama kapattı') || s.includes('kapattı')) return 'acti_ama_kapatti'
        if (s.includes('müsait değil') || s.includes('tekrar aranacak') || s.includes('callback')) return 'musait_degil'

        // If it's an AI call but doesn't match known patterns
        if (interestLevel === 'cold') return 'skor_disqualified'
        return 'gorusme_tamamlandi'
    }

    // Manuel arama
    if (type === 'manuel') {
        // Check if summary contains outcome info
        if (s.includes('görüşme tamamlandı') || s.includes('görüşüldü')) return 'gorusme_tamamlandi'
        if (s.includes('cevap vermedi') || s.includes('ulaşılamadı')) return 'cevap_vermedi'
        if (s.includes('meşgul')) return 'hat_mesgul'
        if (s.includes('ilgilendi') || s.includes('ilgili')) return 'musteri_ilgilendi'
        if (s.includes('ilgilenmedi') || s.includes('ilgilenmiyor')) return 'gorusuldu_ilgilenmedi'
        return 'manuel_arama'
    }

    return 'diger'
}

// ─── CDR: WhatsApp Detay Kayıtları ─────────────────────────

export interface WhatsAppCDRRecord {
    id: string
    date: string
    customer_name: string | null
    phone: string | null
    created_by: string | null
    template: string | null
    summary: string | null
    description: string | null
}

export async function getWhatsAppCDR(period: PeriodKey, page: number = 1, pageSize: number = 50): Promise<{ records: WhatsAppCDRRecord[]; total: number }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { records: [], total: 0 }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { records: [], total: 0 }

    const range = getDateRange(period)
    const fromTs = `${range.from}T00:00:00`
    const toTs = `${range.to}T23:59:59`
    const offset = (page - 1) * pageSize

    const { data, count } = await supabase
        .from('activities')
        .select('id, created_at, summary, description, customer:customers(full_name, phone), creator:profiles!user_id(full_name)', { count: 'exact' })
        .eq('type', 'Whatsapp')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', fromTs)
        .lte('created_at', toTs)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    const records: WhatsAppCDRRecord[] = (data || []).map(r => {
        // Extract template name from summary: "💬 WhatsApp Mesajı Gönderildi (template_name)"
        const tmplMatch = r.summary?.match(/\(([^)]+)\)/)
        
        // Customer name from relation or fallback from description
        let customerName = (r.customer as any)?.full_name || null
        let customerPhone = (r.customer as any)?.phone || null

        if (!customerName && r.description) {
            // Pattern 1: "Template: xxx [Müşteri Adı, Şirket]" — parametre listesi
            const bracketMatch = r.description.match(/\[([^\]]+)\]/)
            if (bracketMatch) {
                const parts = bracketMatch[1].split(',').map((s: string) => s.trim())
                if (parts[0] && !parts[0].match(/^\d/) && parts[0] !== 'Değerli Müşterimiz') {
                    customerName = parts[0]
                }
            }
            // Pattern 2: Serbest metin — "Merhaba X Hanım/Bey" veya direkt mesaj
        }

        if (!customerPhone && r.description) {
            // Telefon numarası bulmaya çalış (5xx veya 90xxx pattern)
            const phoneMatch = r.description.match(/(\+?90?\s?)?([05]\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})/)?.[0]
            if (phoneMatch) customerPhone = phoneMatch.replace(/[\s-]/g, '')
        }

        return {
            id: r.id,
            date: r.created_at,
            customer_name: customerName,
            phone: customerPhone,
            created_by: (r.creator as any)?.full_name || 'Sistem',
            template: tmplMatch?.[1] || 'Bilinmiyor',
            summary: r.summary,
            description: r.description?.substring(0, 200) || null,
        }
    })

    return { records, total: count || 0 }
}
