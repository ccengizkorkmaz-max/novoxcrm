
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
    '/login': '2026-02-01T00:00:00.000Z',
}

// Supported locales
const LOCALES = ['tr', 'en'] as const

/**
 * Generate sitemap URLs using the current request's hostname.
 * Each domain (novoxcrm.com, oikoscrm.com) gets its own sitemap
 * with URLs pointing to itself — essential for independent indexing.
 * 
 * Generates entries for:
 *  1. Root URLs (no locale prefix): /wiki/slug, /solutions, etc.
 *  2. /tr locale URLs: /tr/wiki/slug
 *  3. /en locale URLs: /en/wiki/slug
 * 
 * This matches how Google has historically indexed the site with
 * all three URL variants (root + /tr + /en).
 */
export async function getSitemapUrls(): Promise<MetadataRoute.Sitemap> {
    const host = await getHostFromHeaders()
    const baseUrl = getCanonicalBaseUrl(host)
    const supabase = await createClient()

    // ── 1. Marketing routes — root (no prefix) + each locale ──
    const marketingRoutes = Object.entries(STATIC_PAGE_DATES).flatMap(([route, date]) => {
        const rootEntry = {
            url: `${baseUrl}${route || '/'}`,
            lastModified: new Date(date),
            changeFrequency: 'weekly' as const,
            priority: route === '' ? 1 : 0.8,
            _path: route,
        }
        const localeEntries = LOCALES.map((locale) => ({
            url: `${baseUrl}/${locale}${route}`,
            lastModified: new Date(date),
            changeFrequency: 'weekly' as const,
            priority: route === '' ? 1 : 0.8,
            _path: route,
        }))
        return [rootEntry, ...localeEntries]
    })

    // ── 2. Wiki articles — root + each locale ──
    const wikiRoutes = wikiArticles.flatMap((article) => {
        const date = new Date(parseTurkishDate(article.date))
        const rootEntry = {
            url: `${baseUrl}/wiki/${article.slug}`,
            lastModified: date,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
            _path: `/wiki/${article.slug}`,
        }
        const localeEntries = LOCALES.map((locale) => ({
            url: `${baseUrl}/${locale}/wiki/${article.slug}`,
            lastModified: date,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
            _path: `/wiki/${article.slug}`,
        }))
        return [rootEntry, ...localeEntries]
    })

    // ── 3. Public Broker Profiles (no locale prefix) ──
    const { data: profiles } = await supabase
        .from('profiles')
        .select('broker_slug, updated_at')
        .not('broker_slug', 'is', null)

    const profileRoutes = profiles?.map((profile) => ({
        url: `${baseUrl}/p/${profile.broker_slug}`,
        lastModified: new Date(profile.updated_at || '2026-03-01T00:00:00.000Z'),
        changeFrequency: 'daily' as const,
        priority: 0.7,
        _path: null as string | null,
    })) || []

    // ── 4. Combine and add i18n alternates ──
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
