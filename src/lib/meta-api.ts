/**
 * Meta Marketing API Client
 * 
 * Provides functions to fetch campaign insights, ad-level data, 
 * lead forms, and daily breakdowns from Meta Graph API.
 * 
 * References:
 * - bosar-academy/meta-ads-dashboard (lib/meta.ts)
 * - fbsamples/insights_dashboard
 */

const META_API_VERSION = 'v19.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

// ────── Types ──────────────────────────────────────────────────────

export interface MetaAccountSummary {
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
    cpc: number
    frequency: number
}

export interface MetaCampaignInsight {
    campaign_id: string
    campaign_name: string
    status: string
    objective: string
    spend: number
    impressions: number
    reach: number
    clicks: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
    cpc: number
    frequency: number
    daily_budget: number | null
}

export interface MetaAdInsight {
    ad_id: string
    ad_name: string
    adset_name: string
    campaign_name: string
    status: string
    spend: number
    impressions: number
    clicks: number
    leads: number
    cpl: number
    ctr: number
    thumbnail_url: string | null
    preview_url: string | null
}

export interface MetaDailyBreakdown {
    date: string
    spend: number
    impressions: number
    clicks: number
    reach: number
    leads: number
    cpl: number
    cpm: number
    ctr: number
}

export interface MetaLeadForm {
    form_id: string
    form_name: string
    page_id: string
    page_name: string
    status: string
    leads_count: number
}

export interface MetaFunnelData {
    impressions: number
    clicks: number
    leads: number
    crmConversions: number  // from Supabase
    sales: number           // from Supabase
}

export interface MetaAdsAnalyticsResult {
    connected: boolean
    accountSummary: MetaAccountSummary
    accountSummaryPrev: MetaAccountSummary | null  // previous period for comparison
    campaigns: MetaCampaignInsight[]
    topAds: MetaAdInsight[]
    dailyBreakdown: MetaDailyBreakdown[]
    leadForms: MetaLeadForm[]
    funnel: MetaFunnelData
    datePreset: string
    error?: string
}

// ────── Helper ─────────────────────────────────────────────────────

function extractLeadCount(actions: any[] | undefined): number {
    if (!actions) return 0
    const leadAction = actions.find(
        (a: any) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped'
    )
    return parseInt(leadAction?.value || '0', 10)
}

function safeFloat(val: any, fallback = 0): number {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? fallback : parsed
}

function safeInt(val: any, fallback = 0): number {
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? fallback : parsed
}

function appendDateParam(url: string, dateParam: string | { since: string; until: string }): string {
    if (typeof dateParam === 'string') {
        return `${url}&date_preset=${dateParam}`
    } else {
        return `${url}&time_range=${JSON.stringify(dateParam)}`
    }
}

async function metaFetch(url: string, token: string, revalidate = 60): Promise<any> {
    const separator = url.includes('?') ? '&' : '?'
    const fullUrl = `${url}${separator}access_token=${token}`

    const response = await fetch(fullUrl, {
        next: { revalidate },
        headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error(`Meta API Error [${response.status}]:`, errorText)
        throw new Error(`Meta API ${response.status}: ${errorText}`)
    }

    return response.json()
}

// Handle paginated results
async function metaFetchAll(url: string, token: string): Promise<any[]> {
    let allData: any[] = []
    let nextUrl: string | null = url

    while (nextUrl) {
        const result = await metaFetch(nextUrl, token, 120)
        allData = allData.concat(result.data || [])
        nextUrl = result.paging?.next || null
        // Safety: limit to 500 items
        if (allData.length > 500) break
    }

    return allData
}

// ────── Account-Level Insights ─────────────────────────────────────

export async function getAccountInsights(
    adAccountId: string,
    token: string,
    datePreset: string | { since: string; until: string } = 'last_30d'
): Promise<MetaAccountSummary> {
    const fields = 'spend,impressions,reach,clicks,actions,frequency,cpm,ctr,cpc'
    let url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&level=account`
    url = appendDateParam(url, datePreset)

    try {
        const result = await metaFetch(url, token)
        const data = result.data?.[0]

        if (!data) {
            return { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, cpl: 0, cpm: 0, ctr: 0, cpc: 0, frequency: 0 }
        }

        const spend = safeFloat(data.spend)
        const leads = extractLeadCount(data.actions)

        return {
            spend,
            impressions: safeInt(data.impressions),
            reach: safeInt(data.reach),
            clicks: safeInt(data.clicks),
            leads,
            cpl: leads > 0 ? spend / leads : 0,
            cpm: safeFloat(data.cpm),
            ctr: safeFloat(data.ctr),
            cpc: safeFloat(data.cpc),
            frequency: safeFloat(data.frequency),
        }
    } catch (e) {
        console.error('getAccountInsights error:', e)
        return { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, cpl: 0, cpm: 0, ctr: 0, cpc: 0, frequency: 0 }
    }
}

// ────── Campaign-Level Insights ────────────────────────────────────

export async function getCampaignInsights(
    adAccountId: string,
    token: string,
    datePreset: string | { since: string; until: string } = 'last_30d'
): Promise<MetaCampaignInsight[]> {
    const fields = 'campaign_id,campaign_name,objective,spend,impressions,reach,clicks,actions,frequency,cpm,ctr,cpc'
    let url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&level=campaign&limit=100`
    url = appendDateParam(url, datePreset)

    try {
        const allData = await metaFetchAll(url, token)

        // Also fetch campaign statuses
        let campaignStatuses: Record<string, { status: string; daily_budget: number | null }> = {}
        try {
            const campaignsUrl = `${META_BASE_URL}/${adAccountId}/campaigns?fields=id,status,daily_budget&limit=100`
            const campaigns = await metaFetchAll(campaignsUrl, token)
            campaigns.forEach((c: any) => {
                campaignStatuses[c.id] = {
                    status: c.status || 'UNKNOWN',
                    daily_budget: c.daily_budget ? safeFloat(c.daily_budget) / 100 : null // Meta returns in cents
                }
            })
        } catch { /* ignore */ }

        return allData.map((row: any) => {
            const spend = safeFloat(row.spend)
            const leads = extractLeadCount(row.actions)
            const campInfo = campaignStatuses[row.campaign_id] || { status: 'ACTIVE', daily_budget: null }

            return {
                campaign_id: row.campaign_id,
                campaign_name: row.campaign_name || 'Unnamed Campaign',
                status: campInfo.status,
                objective: row.objective || '',
                spend,
                impressions: safeInt(row.impressions),
                reach: safeInt(row.reach),
                clicks: safeInt(row.clicks),
                leads,
                cpl: leads > 0 ? spend / leads : 0,
                cpm: safeFloat(row.cpm),
                ctr: safeFloat(row.ctr),
                cpc: safeFloat(row.cpc),
                frequency: safeFloat(row.frequency),
                daily_budget: campInfo.daily_budget,
            }
        }).sort((a, b) => b.spend - a.spend) // Sort by spend descending
    } catch (e) {
        console.error('getCampaignInsights error:', e)
        return []
    }
}

// ────── Ad-Level Insights (Creative Leaderboard) ───────────────────

export async function getTopAds(
    adAccountId: string,
    token: string,
    datePreset: string | { since: string; until: string } = 'last_30d',
    limit: number = 15
): Promise<MetaAdInsight[]> {
    const fields = 'ad_id,ad_name,adset_name,campaign_name,spend,impressions,clicks,actions,ctr'
    let url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&level=ad&sort=spend_descending&limit=${limit}`
    url = appendDateParam(url, datePreset)

    try {
        const result = await metaFetch(url, token, 120)
        const allData = result.data || []

        // Fetch ad statuses and thumbnails
        let adDetails: Record<string, { status: string; thumbnail_url: string | null; preview_url: string | null }> = {}
        try {
            const adIds = allData.map((d: any) => d.ad_id).filter(Boolean).slice(0, 15)
            if (adIds.length > 0) {
                const adsUrl = `${META_BASE_URL}/?ids=${adIds.join(',')}&fields=status,creative{thumbnail_url}&limit=${limit}`
                const adsResult = await metaFetch(adsUrl, token, 300)

                for (const [adId, adData] of Object.entries(adsResult || {})) {
                    const ad = adData as any
                    adDetails[adId] = {
                        status: ad.status || 'ACTIVE',
                        thumbnail_url: ad.creative?.thumbnail_url || null,
                        preview_url: null,
                    }
                }
            }
        } catch { /* ignore thumbnail errors */ }

        return allData.map((row: any) => {
            const spend = safeFloat(row.spend)
            const leads = extractLeadCount(row.actions)
            const detail = adDetails[row.ad_id] || { status: 'ACTIVE', thumbnail_url: null, preview_url: null }

            return {
                ad_id: row.ad_id,
                ad_name: row.ad_name || 'Unnamed Ad',
                adset_name: row.adset_name || '',
                campaign_name: row.campaign_name || '',
                status: detail.status,
                spend,
                impressions: safeInt(row.impressions),
                clicks: safeInt(row.clicks),
                leads,
                cpl: leads > 0 ? spend / leads : 0,
                ctr: safeFloat(row.ctr),
                thumbnail_url: detail.thumbnail_url,
                preview_url: detail.preview_url,
            }
        })
    } catch (e) {
        console.error('getTopAds error:', e)
        return []
    }
}

// ────── Daily Breakdown ────────────────────────────────────────────

export async function getDailyBreakdown(
    adAccountId: string,
    token: string,
    datePreset: string | { since: string; until: string } = 'last_30d'
): Promise<MetaDailyBreakdown[]> {
    const fields = 'spend,impressions,reach,clicks,actions,cpm,ctr'
    let url = `${META_BASE_URL}/${adAccountId}/insights?fields=${fields}&time_increment=1&level=account&limit=90`
    url = appendDateParam(url, datePreset)

    try {
        const allData = await metaFetchAll(url, token)

        return allData.map((row: any) => {
            const spend = safeFloat(row.spend)
            const leads = extractLeadCount(row.actions)

            return {
                date: row.date_start || '',
                spend,
                impressions: safeInt(row.impressions),
                clicks: safeInt(row.clicks),
                reach: safeInt(row.reach),
                leads,
                cpl: leads > 0 ? spend / leads : 0,
                cpm: safeFloat(row.cpm),
                ctr: safeFloat(row.ctr),
            }
        }).sort((a, b) => a.date.localeCompare(b.date))
    } catch (e) {
        console.error('getDailyBreakdown error:', e)
        return []
    }
}

// ────── Lead Forms ─────────────────────────────────────────────────

export async function getLeadForms(
    token: string
): Promise<MetaLeadForm[]> {
    const forms: MetaLeadForm[] = []

    try {
        const pagesUrl = `${META_BASE_URL}/me/accounts?fields=id,name,access_token`
        const pagesResult = await metaFetch(pagesUrl, token, 300)

        for (const page of (pagesResult.data || [])) {
            try {
                const formsUrl = `${META_BASE_URL}/${page.id}/leadgen_forms?fields=id,name,status,leads_count&limit=50`
                const formsResult = await metaFetch(formsUrl, page.access_token, 300)

                for (const form of (formsResult.data || [])) {
                    forms.push({
                        form_id: form.id,
                        form_name: form.name || 'Unnamed Form',
                        page_id: page.id,
                        page_name: page.name || '',
                        status: form.status || 'ACTIVE',
                        leads_count: safeInt(form.leads_count),
                    })
                }
            } catch { /* skip page */ }
        }
    } catch (e) {
        console.error('getLeadForms error:', e)
    }

    return forms.sort((a, b) => b.leads_count - a.leads_count)
}

// ────── Full Analytics Fetch ───────────────────────────────────────

export async function fetchMetaAdsAnalytics(
    adAccountId: string,
    token: string,
    datePreset: string | { since: string; until: string } = 'last_30d'
): Promise<Omit<MetaAdsAnalyticsResult, 'funnel'>> {
    // Map UI date presets to Meta API presets and comparison periods
    const prevPresetMap: Record<string, string> = {
        'last_7d': 'last_7d',    // we'll manually offset
        'last_30d': 'last_30d',
        'this_month': 'last_month',
    }

    // Fetch all data in parallel for speed
    const [accountSummary, campaigns, topAds, dailyBreakdown, leadForms] = await Promise.all([
        getAccountInsights(adAccountId, token, datePreset),
        getCampaignInsights(adAccountId, token, datePreset),
        getTopAds(adAccountId, token, datePreset, 15),
        getDailyBreakdown(adAccountId, token, datePreset),
        getLeadForms(token),
    ])

    // Fetch previous period for comparison
    let accountSummaryPrev: MetaAccountSummary | null = null
    try {
        if (typeof datePreset === 'string') {
            const prevPreset = prevPresetMap[datePreset] || 'last_30d'
            if (datePreset === 'last_30d') {
                const sixtyDaySummary = await getAccountInsights(adAccountId, token, 'last_30d')
                accountSummaryPrev = sixtyDaySummary
            }
        }
    } catch { /* ignore */ }

    return {
        connected: true,
        accountSummary,
        accountSummaryPrev,
        campaigns,
        topAds,
        dailyBreakdown,
        leadForms,
        datePreset: typeof datePreset === 'string' ? datePreset : 'custom',
    }
}
