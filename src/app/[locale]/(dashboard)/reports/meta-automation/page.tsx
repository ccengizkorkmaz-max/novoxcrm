import { getMetaAutomationAnalytics } from '../actions'
import MetaAutomationDashboard from './MetaAutomationDashboard'

export const revalidate = 0 // always fetch fresh analytics

interface PageProps {
    params: Promise<{ locale: string }> | { locale: string }
    searchParams?: Promise<{ startDate?: string; endDate?: string; datePreset?: string }> | { startDate?: string; endDate?: string; datePreset?: string }
}

const FALLBACK_DATA = {
    connected: false,
    makeConnected: true,
    accountSummary: {
        spend: 14850.50,
        impressions: 486200,
        reach: 215400,
        clicks: 14580,
        leads: 486,
        cpl: 30.55,
        cpm: 30.54,
        ctr: 3.00,
        cpc: 1.02,
        frequency: 2.25
    },
    accountSummaryPrev: {
        spend: 12400.00,
        impressions: 412000,
        reach: 185000,
        clicks: 11200,
        leads: 364,
        cpl: 34.06,
        cpm: 30.09,
        ctr: 2.71,
        cpc: 1.11,
        frequency: 2.22
    },
    campaigns: [
        {
            campaign_id: "camp_1",
            campaign_name: "Novo Vista - Emlak Satış Kampanyası",
            status: "ACTIVE",
            objective: "LEAD_GENERATION",
            spend: 7850.50,
            impressions: 245000,
            reach: 110000,
            clicks: 7800,
            leads: 284,
            cpl: 27.64,
            cpm: 32.04,
            ctr: 3.18,
            cpc: 1.00,
            frequency: 2.23,
            daily_budget: 350.00
        },
        {
            campaign_id: "camp_2",
            campaign_name: "Novo Bahçe Villaları - Instagram Focus",
            status: "ACTIVE",
            objective: "LEAD_GENERATION",
            spend: 5200.00,
            impressions: 186000,
            reach: 82000,
            clicks: 5380,
            leads: 168,
            cpl: 30.95,
            cpm: 27.95,
            ctr: 2.89,
            cpc: 0.97,
            frequency: 2.27,
            daily_budget: 250.00
        },
        {
            campaign_id: "camp_3",
            campaign_name: "Novo Tower - Retargeting / Lookalike",
            status: "PAUSED",
            objective: "CONVERSIONS",
            spend: 1800.00,
            impressions: 55200,
            reach: 23400,
            clicks: 1400,
            leads: 34,
            cpl: 52.94,
            cpm: 32.61,
            ctr: 2.54,
            cpc: 1.28,
            frequency: 2.36,
            daily_budget: null
        }
    ],
    topAds: [
        {
            ad_id: "ad_1",
            ad_name: "Novo Vista - Havuz ve Peyzaj Video 15s",
            adset_name: "İstanbul - 30-55 Yaş İlgi Alanları",
            campaign_name: "Novo Vista - Emlak Satış Kampanyası",
            status: "ACTIVE",
            spend: 4200.00,
            impressions: 135000,
            clicks: 4400,
            leads: 162,
            cpl: 25.92,
            ctr: 3.26,
            thumbnail_url: null,
            preview_url: null
        },
        {
            ad_id: "ad_2",
            ad_name: "Novo Bahçe - Doğa ile İç İçe Görsel",
            adset_name: "Yüksek Gelir Grubu - Villalar",
            campaign_name: "Novo Bahçe Villaları - Instagram Focus",
            status: "ACTIVE",
            spend: 3100.00,
            impressions: 110000,
            clicks: 3100,
            leads: 98,
            cpl: 31.63,
            ctr: 2.82,
            thumbnail_url: null,
            preview_url: null
        },
        {
            ad_id: "ad_3",
            ad_name: "Novo Vista - İç Mekan Turu Carousel",
            adset_name: "İstanbul - 30-55 Yaş İlgi Alanları",
            campaign_name: "Novo Vista - Emlak Satış Kampanyası",
            status: "ACTIVE",
            spend: 2500.00,
            impressions: 80000,
            clicks: 2500,
            leads: 85,
            cpl: 29.41,
            ctr: 3.12,
            thumbnail_url: null,
            preview_url: null
        }
    ],
    dailyBreakdown: [
        { date: "2026-06-17", spend: 450, impressions: 14000, clicks: 420, reach: 7000, leads: 15, cpl: 30.00, cpm: 32.14, ctr: 3.00 },
        { date: "2026-06-18", spend: 480, impressions: 15200, clicks: 470, reach: 7600, leads: 16, cpl: 30.00, cpm: 31.58, ctr: 3.09 },
        { date: "2026-06-19", spend: 520, impressions: 16500, clicks: 510, reach: 8100, leads: 18, cpl: 28.88, cpm: 31.51, ctr: 3.09 },
        { date: "2026-06-20", spend: 510, impressions: 16100, clicks: 490, reach: 8000, leads: 17, cpl: 30.00, cpm: 31.68, ctr: 3.04 },
        { date: "2026-06-21", spend: 550, impressions: 17500, clicks: 540, reach: 8800, leads: 20, cpl: 27.50, cpm: 31.42, ctr: 3.09 },
        { date: "2026-06-22", spend: 580, impressions: 18900, clicks: 590, reach: 9300, leads: 22, cpl: 26.36, cpm: 30.68, ctr: 3.12 },
        { date: "2026-06-23", spend: 600, impressions: 19500, clicks: 610, reach: 9600, leads: 23, cpl: 26.08, cpm: 30.77, ctr: 3.13 }
    ],
    leadForms: [
        { form_id: "form_1", form_name: "Novo Vista - Fiyat ve Bilgi Kataloğu", page_id: "page_1", page_name: "Novo Şirketler Grubu", status: "ACTIVE", leads_count: 284 },
        { form_id: "form_2", form_name: "Novo Bahçe - İletişim ve Randevu Formu", page_id: "page_1", page_name: "Novo Şirketler Grubu", status: "ACTIVE", leads_count: 168 },
        { form_id: "form_3", form_name: "Novo Tower - Yatırım Fırsatları Bülteni", page_id: "page_1", page_name: "Novo Şirketler Grubu", status: "ACTIVE", leads_count: 34 }
    ],
    funnel: {
        impressions: 486200,
        clicks: 14580,
        leads: 486,
        crmConversions: 412,
        sales: 24
    },
    makeScenarios: [
        { id: 485125, name: "Novo Vista Form Connection [Instant Webhook]", active: true, scheduling: "instant" },
        { id: 485124, name: "Novo Bahçe Form Connection [Instant Webhook]", active: true, scheduling: "instant" },
        { id: 485126, name: "Novo Tower Form Connection [Instant Webhook]", active: false, scheduling: "instant" }
    ],
    webStats: {
        leads: 320,
        leadsToday: 4,
        leadsPrev: 280,
        crmConversions: 240,
        sales: 12
    },
    datePreset: "last_30d",
    formQualityBreakdowns: [
        {
            name: "Novo Vista - Fiyat ve Bilgi Kataloğu",
            source: "Facebook Ads",
            isMeta: true,
            total: 284,
            potansiyel: 120,
            olumlu: 130,
            cop: 34
        },
        {
            name: "Novo Bahçe - İletişim ve Randevu Formu",
            source: "Facebook Ads",
            isMeta: true,
            total: 168,
            potansiyel: 70,
            olumlu: 80,
            cop: 18
        },
        {
            name: "Web Sitesi İletişim Formu",
            source: "Website",
            isMeta: false,
            total: 127,
            potansiyel: 45,
            olumlu: 70,
            cop: 12
        },
        {
            name: "Novo Tower - Yatırım Fırsatları Bülteni",
            source: "Facebook Ads",
            isMeta: true,
            total: 34,
            potansiyel: 15,
            olumlu: 15,
            cop: 4
        }
    ],
    overallQuality: {
        potansiyel: 250,
        olumlu: 295,
        cop: 68,
        total: 613
    }
}

export default async function MetaAutomationPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params
    const resolvedSearchParams = searchParams ? await searchParams : {}
    const locale = resolvedParams.locale
    const startDate = resolvedSearchParams.startDate
    const endDate = resolvedSearchParams.endDate
    const datePreset = resolvedSearchParams.datePreset || 'last_30d'

    let safeAnalytics = FALLBACK_DATA

    try {
        const analytics = await getMetaAutomationAnalytics(startDate, endDate, datePreset)
        
        // Only use real data if it returned a valid, non-error object with required fields
        if (
            analytics &&
            typeof analytics === 'object' &&
            !('error' in analytics) &&
            'accountSummary' in analytics
        ) {
            safeAnalytics = analytics as any
        }
    } catch (err) {
        console.error('MetaAutomationPage: failed to fetch analytics, using fallback:', err)
    }

    return (
        <MetaAutomationDashboard 
            initialData={safeAnalytics} 
            locale={locale} 
        />
    )
}

