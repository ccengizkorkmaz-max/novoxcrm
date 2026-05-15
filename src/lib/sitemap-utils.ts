
import { MetadataRoute } from 'next'
import { wikiArticles } from '@/data/wiki-data'
import { createClient } from '@/lib/supabase/server'
import { getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'

/**
 * Parse Turkish date format "27 Ocak 2026" to ISO date string
 */
function parseTurkishDate(dateStr: string): string {
    const months: Record<string, string> = {
        'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04',
        'Mayıs': '05', 'Haziran': '06', 'Temmuz': '07', 'Ağustos': '08',
        'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12',
    }
    const parts = dateStr.split(' ')
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0')
        const month = months[parts[1]] || '01'
        const year = parts[2]
        return `${year}-${month}-${day}T00:00:00.000Z`
    }
    return '2026-01-20T00:00:00.000Z' // fallback
}

// Static dates for marketing pages — update these when you actually change the page content
const STATIC_PAGE_DATES: Record<string, string> = {
    '': '2026-03-15T00:00:00.000Z',                     // Homepage
    '/solutions': '2026-03-10T00:00:00.000Z',
    '/solutions/gayrimenkul-crm': '2026-03-10T00:00:00.000Z',
    '/solutions/insaat-crm': '2026-03-10T00:00:00.000Z',
    '/wiki': '2026-04-01T00:00:00.000Z',
    '/payment-plan-calculator': '2026-02-20T00:00:00.000Z',
    '/system-details': '2026-03-01T00:00:00.000Z',
    '/bir-bakista-novocrm': '2026-03-15T00:00:00.000Z',
    '/broker/apply': '2026-02-15T00:00:00.000Z',
}

/**
 * Generate sitemap URLs using the current request's hostname.
 * Each domain (novoxcrm.com, oikoscrm.com) gets its own sitemap
 * with URLs pointing to itself — essential for independent indexing.
 */
export async function getSitemapUrls(): Promise<MetadataRoute.Sitemap> {
    const host = await getHostFromHeaders()
    const baseUrl = getCanonicalBaseUrl(host)
    const supabase = await createClient()

    // 1. Base marketing routes (with locale prefix /tr for canonical)
    const routes = Object.entries(STATIC_PAGE_DATES).map(([route, date]) => ({
        url: `${baseUrl}/tr${route}`,
        lastModified: new Date(date),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Wiki articles — use the article's actual publish date
    const wikiRoutes = wikiArticles.map((article) => ({
        url: `${baseUrl}/tr/wiki/${article.slug}`,
        lastModified: new Date(parseTurkishDate(article.date)),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    // 3. Public Broker Profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('broker_slug, updated_at')
        .not('broker_slug', 'is', null)

    const profileRoutes = profiles?.map((profile) => ({
        url: `${baseUrl}/p/${profile.broker_slug}`,
        lastModified: new Date(profile.updated_at || '2026-03-01T00:00:00.000Z'),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    })) || []

    // 4. Combine and add i18n alternates
    const allRoutes = [...routes, ...wikiRoutes, ...profileRoutes]

    return allRoutes.map((route) => {
        // Extract path after /tr or /p
        const path = route.url.replace(baseUrl, '').replace(/^\/tr/, '')
        return {
            ...route,
            alternates: {
                languages: {
                    tr: `${baseUrl}/tr${path}`,
                    en: `${baseUrl}/en${path}`,
                },
            },
        } as any
    })
}
