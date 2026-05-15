
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
 * Returns both www and non-www base URLs for the current domain.
 * Google has indexed both variants, so sitemap must include both.
 */
function getBaseUrls(host: string): string[] {
    const cleanHost = host.split(':')[0]
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
        return [`http://${host}`]
    }
    // Strip www if present to get the bare domain
    const bareDomain = cleanHost.replace(/^www\./, '')
    return [
        `https://${bareDomain}`,
        `https://www.${bareDomain}`,
    ]
}

/**
 * Generate sitemap URLs using the current request's hostname.
 * Each domain (novoxcrm.com, oikoscrm.com) gets its own sitemap
 * with URLs pointing to itself — essential for independent indexing.
 * 
 * Generates entries for ALL URL variants that Google has historically indexed:
 *  - domain.com/wiki/slug           (root, no www)
 *  - domain.com/tr/wiki/slug        (tr locale, no www)
 *  - domain.com/en/wiki/slug        (en locale, no www)
 *  - www.domain.com/wiki/slug       (root, www)
 *  - www.domain.com/tr/wiki/slug    (tr locale, www)
 *  - www.domain.com/en/wiki/slug    (en locale, www)
 */
export async function getSitemapUrls(): Promise<MetadataRoute.Sitemap> {
    const host = await getHostFromHeaders()
    const baseUrls = getBaseUrls(host)
    const canonicalBaseUrl = getCanonicalBaseUrl(host) // non-www for alternates
    const supabase = await createClient()

    // Helper: generate entries for a path across all base URLs and locales
    function generateVariants(
        path: string,
        date: Date,
        changeFreq: 'weekly' | 'monthly' | 'daily',
        priority: number
    ) {
        return baseUrls.flatMap((base) => {
            // Root URL (no locale prefix)
            const rootEntry = {
                url: `${base}${path || '/'}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _path: path,
            }
            // Locale-prefixed URLs
            const localeEntries = LOCALES.map((locale) => ({
                url: `${base}/${locale}${path}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _path: path,
            }))
            return [rootEntry, ...localeEntries]
        })
    }

    // ── 1. Marketing routes ──
    const marketingRoutes = Object.entries(STATIC_PAGE_DATES).flatMap(
        ([route, date]) => generateVariants(route, new Date(date), 'weekly', route === '' ? 1 : 0.8)
    )

    // ── 2. Wiki articles ──
    const wikiRoutes = wikiArticles.flatMap((article) =>
        generateVariants(
            `/wiki/${article.slug}`,
            new Date(parseTurkishDate(article.date)),
            'monthly',
            0.6
        )
    )

    // ── 3. Public Broker Profiles (no locale prefix, both www variants) ──
    const { data: profiles } = await supabase
        .from('profiles')
        .select('broker_slug, updated_at')
        .not('broker_slug', 'is', null)

    const profileRoutes = baseUrls.flatMap((base) =>
        (profiles || []).map((profile) => ({
            url: `${base}/p/${profile.broker_slug}`,
            lastModified: new Date(profile.updated_at || '2026-03-01T00:00:00.000Z'),
            changeFrequency: 'daily' as const,
            priority: 0.7,
            _path: null as string | null,
        }))
    )

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
                    tr: `${canonicalBaseUrl}/tr${_path}`,
                    en: `${canonicalBaseUrl}/en${_path}`,
                },
            },
        } as any
    })
}
