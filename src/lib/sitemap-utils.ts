
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
    '': '2026-03-15T00:00:00.000Z',                                // Homepage
    '/solutions': '2026-03-10T00:00:00.000Z',
    '/solutions/gayrimenkul-crm': '2026-03-10T00:00:00.000Z',
    '/solutions/insaat-crm': '2026-03-10T00:00:00.000Z',
    '/wiki': '2026-04-01T00:00:00.000Z',
    '/payment-plan-calculator': '2026-02-20T00:00:00.000Z',
    '/system-details': '2026-03-01T00:00:00.000Z',
    '/bir-bakista-novocrm': '2026-03-15T00:00:00.000Z',
    '/bir-bakista-novoxcrm': '2026-03-15T00:00:00.000Z',
    '/broker/apply': '2026-02-15T00:00:00.000Z',
    '/privacy-policy': '2026-02-01T00:00:00.000Z',
    '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi': '2026-04-15T00:00:00.000Z',
}

// Supported locales
const LOCALES = ['tr', 'en'] as const

/**
 * Generate sitemap URLs using the current request's hostname.
 * Each domain (novoxcrm.com, oikoscrm.com) gets its own sitemap
 * with URLs pointing to itself — essential for independent indexing.
 * 
 * Generates entries for BOTH /tr and /en locales as separate URLs,
 * with hreflang alternates linking them together.
 */
export async function getSitemapUrls(): Promise<MetadataRoute.Sitemap> {
    const host = await getHostFromHeaders()
    const baseUrl = getCanonicalBaseUrl(host)
    const supabase = await createClient()

    // 1. Base marketing routes — generate for EACH locale
    const marketingRoutes = LOCALES.flatMap((locale) =>
        Object.entries(STATIC_PAGE_DATES).map(([route, date]) => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: new Date(date),
            changeFrequency: 'weekly' as const,
            priority: route === '' ? 1 : 0.8,
            _path: route,  // internal: for alternate generation
        }))
    )

    // 2. Dynamic Wiki articles — for each locale
    const wikiRoutes = LOCALES.flatMap((locale) =>
        wikiArticles.map((article) => ({
            url: `${baseUrl}/${locale}/wiki/${article.slug}`,
            lastModified: new Date(parseTurkishDate(article.date)),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
            _path: `/wiki/${article.slug}`,
        }))
    )

    // 3. Public Broker Profiles (locale-independent — /p/slug)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('broker_slug, updated_at')
        .not('broker_slug', 'is', null)

    const profileRoutes = profiles?.map((profile) => ({
        url: `${baseUrl}/p/${profile.broker_slug}`,
        lastModified: new Date(profile.updated_at || '2026-03-01T00:00:00.000Z'),
        changeFrequency: 'daily' as const,
        priority: 0.7,
        _path: null as string | null,  // no locale alternates for /p/ routes
    })) || []

    // 4. Combine and add i18n alternates
    const allRoutes = [...marketingRoutes, ...wikiRoutes, ...profileRoutes]

    return allRoutes.map((route) => {
        const { _path, ...rest } = route

        // /p/ routes don't have locale alternates
        if (_path === null) {
            return rest as any
        }

        return {
            ...rest,
            alternates: {
                languages: {
                    tr: `${baseUrl}/tr${_path}`,
                    en: `${baseUrl}/en${_path}`,
                },
            },
        } as any
    })
}
