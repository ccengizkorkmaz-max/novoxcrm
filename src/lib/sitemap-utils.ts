
import { MetadataRoute } from 'next'
import { wikiArticles } from '@/data/wiki-data'
import { turkishCities } from '@/data/cities-data'
import { comparisons } from '@/data/comparisons-data'
import { sectors } from '@/data/sectors-data'
import { aiSolutions } from '@/data/ai-solutions-data'
import { reports } from '@/data/reports-data'
import { createClient } from '@supabase/supabase-js'
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
    '/tools/tapu-harci-hesaplayici': '2026-05-15T00:00:00.000Z',
    '/tools/serefiye-hesaplayici': '2026-05-15T00:00:00.000Z',
    '/tools/emlak-vergisi-hesaplayici': '2026-05-15T00:00:00.000Z',
    '/tools/konut-kredisi-karsilastirma': '2026-05-15T00:00:00.000Z',
    '/tools/broker-komisyon-hesaplayici': '2026-05-31T00:00:00.000Z',
    '/tools/damga-vergisi-hesaplayici': '2026-05-31T00:00:00.000Z',
    '/tools/insaat-maliyet-hesaplayici': '2026-05-31T00:00:00.000Z',
    '/tools/metrekare-birim-fiyat': '2026-05-31T00:00:00.000Z',
    '/tools/yatirim-getirisi-hesaplayici': '2026-05-31T00:00:00.000Z',
    '/tools/kira-getirisi-hesaplayici': '2026-05-31T00:00:00.000Z',
    '/industry-reports': '2026-05-31T00:00:00.000Z',
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
        `https://${bareDomain}`
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
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Helper: generate entries for a path across all base URLs and locales
    function generateVariants(
        path: string,
        date: Date,
        changeFreq: 'weekly' | 'monthly' | 'daily',
        priority: number
    ) {
        return baseUrls.flatMap((base) => {
            // Turkish URL (no prefix because localePrefix is 'as-needed' and defaultLocale is tr)
            const trEntry = {
                url: `${base}${path || '/'}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _path: path,
            }
            // English URL (with /en prefix)
            const enEntry = {
                url: `${base}/en${path}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _path: path,
            }
            return [trEntry, enEntry]
        })
    }

    // ── 1. Marketing routes ──
    const marketingRoutes = Object.entries(STATIC_PAGE_DATES).flatMap(
        ([route, date]) => generateVariants(route, new Date(date), 'weekly', route === '' ? 1 : 0.8)
    )

    // ── 1.1 AI Solutions routes ──
    const aiSolutionRoutes = aiSolutions.flatMap((sol) =>
        generateVariants(
            `/solutions/${sol.slug}`,
            new Date('2026-05-31T00:00:00.000Z'),
            'monthly',
            0.8
        )
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

    // ── 3. City pages (programmatic SEO) ──
    const cityRoutes = turkishCities.flatMap((city) =>
        generateVariants(
            `/sehir/${city.slug}`,
            new Date('2026-05-15T00:00:00.000Z'),
            'monthly',
            0.6
        )
    )

    // ── 3.1 Sector pages (programmatic SEO) ──
    const sectorRoutes = sectors.flatMap((sector) =>
        generateVariants(
            `/sektor/${sector.slug}`,
            new Date('2026-05-30T00:00:00.000Z'),
            'monthly',
            0.7
        )
    )

    // ── 3.2 City x Sector pages (programmatic SEO) ──
    const citySectorRoutes = turkishCities.flatMap((city) =>
        sectors.flatMap((sector) =>
            generateVariants(
                `/sehir/${city.slug}/${sector.slug}`,
                new Date('2026-05-31T00:00:00.000Z'),
                'monthly',
                0.5
            )
        )
    )

    // ── 4. Comparison pages ──
    const comparisonRoutes = comparisons.flatMap((comp) =>
        generateVariants(
            `/karsilastirma/${comp.slug}`,
            new Date('2026-05-20T00:00:00.000Z'),
            'monthly',
            0.7
        )
    )

    // ── 5. Public Broker Profiles (no locale prefix, both www variants) ──
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

    // ── 6. Benchmark Reports routes ──
    const reportRoutes = reports.flatMap((rep) =>
        generateVariants(
            `/industry-reports/${rep.slug}`,
            new Date('2026-05-31T00:00:00.000Z'),
            'monthly',
            0.7
        )
    )

    // ── 4. Combine and add i18n alternates ──
    const allRoutes = [
        ...marketingRoutes, 
        ...aiSolutionRoutes, 
        ...wikiRoutes, 
        ...cityRoutes, 
        ...sectorRoutes, 
        ...citySectorRoutes, 
        ...comparisonRoutes, 
        ...profileRoutes,
        ...reportRoutes
    ]

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
                    tr: `${canonicalBaseUrl}${_path || '/'}`,
                    en: `${canonicalBaseUrl}/en${_path}`,
                },
            },
        } as any
    })
}
