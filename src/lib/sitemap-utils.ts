import { MetadataRoute } from 'next'
import { wikiArticles } from '@/data/wiki-data'
import { turkishCities } from '@/data/cities-data'
import { comparisons } from '@/data/comparisons-data'
import { sectors } from '@/data/sectors-data'
import { aiSolutions } from '@/data/ai-solutions-data'
import { reports } from '@/data/reports-data'
import { useCases } from '@/data/use-cases-data'
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
    '/cozum': '2026-03-10T00:00:00.000Z',
    '/cozum/gayrimenkul-crm': '2026-03-10T00:00:00.000Z',
    '/cozum/insaat-crm': '2026-03-10T00:00:00.000Z',
    '/wiki': '2026-04-01T00:00:00.000Z',
    '/payment-plan-calculator': '2026-02-20T00:00:00.000Z',
    '/system-details': '2026-03-01T00:00:00.000Z',
    '/bir-bakista-novocrm': '2026-03-15T00:00:00.000Z',
    '/bir-bakista-novoxcrm': '2026-03-15T00:00:00.000Z',
    '/privacy-policy': '2026-02-01T00:00:00.000Z',
    '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi': '2026-04-15T00:00:00.000Z',
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
 * Maps standard Next.js pathnames to localized pathnames dynamically.
 */
function getLocalizedPath(path: string, locale: 'tr' | 'en'): string {
    const pathnames: Record<string, { tr: string; en: string }> = {
        '/cozum': {
            tr: '/cozum',
            en: '/solutions'
        },
        '/cozum/insaat-crm': {
            tr: '/cozum/insaat-crm',
            en: '/solutions/insaat-crm'
        },
        '/cozum/gayrimenkul-crm': {
            tr: '/cozum/gayrimenkul-crm',
            en: '/solutions/gayrimenkul-crm'
        },
        '/payment-plan-calculator': {
            tr: '/araclar/odeme-plani-hesaplayici',
            en: '/tools/payment-plan-calculator'
        },
        '/system-details': {
            tr: '/guvenlik-ve-altyapi',
            en: '/security-and-infrastructure'
        }
    }

    if (pathnames[path]) {
        return pathnames[path][locale]
    }

    // Dynamic cozum/[slug] checks
    if (path.startsWith('/cozum/')) {
        const slug = path.split('/')[2]
        if (locale === 'tr') {
            return `/cozum/${slug}`
        } else {
            const slugMap: Record<string, string> = {
                'ai-sesli-arama': 'voice-ai-real-estate',
                'ai-outreach-otomasyonu': 'ai-outreach-automation',
                'whatsapp-entegrasyonu': 'omnichannel-inbox',
                'ai-whatsapp-ajani': 'ai-whatsapp-agent',
                'broker-yonetimi': 'broker-management',
                'ai-broker-eslestirme': 'ai-broker-matching',
                'satis-sonrasi-hizmetler': 'after-sales-services',
                'stok-yonetimi': 'inventory-management',
                'odeme-plani': 'payment-plan',
                'musteri-portali': 'customer-portal'
            }
            const enSlug = slugMap[slug] || slug
            return `/solutions/${enSlug}`
        }
    }

    return path
}

/**
 * Generate sitemap URLs using the current request's hostname.
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
        priority: number,
        isTrOnly = false
    ) {
        return baseUrls.flatMap((base) => {
            const trPath = getLocalizedPath(path, 'tr')
            
            // Turkish URL (no prefix because localePrefix is 'as-needed' and defaultLocale is tr)
            const trEntry = {
                url: `${base}${trPath || '/'}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _rootPath: path,
            }
            
            // If it's TR-only, don't output the /en variant to sitemap
            if (isTrOnly) {
                return [trEntry]
            }

            const enPath = getLocalizedPath(path, 'en')
            // English URL (with /en prefix)
            const enEntry = {
                url: `${base}/en${enPath}`,
                lastModified: date,
                changeFrequency: changeFreq,
                priority,
                _rootPath: path,
            }
            return [trEntry, enEntry]
        })
    }

    // ── 1. Marketing routes ──
    const marketingRoutes = Object.entries(STATIC_PAGE_DATES).flatMap(
        ([route, date]) => {
            const isTrOnly = [
                '/cozum/gayrimenkul-crm',
                '/cozum/insaat-crm',
                '/wiki',
                '/bir-bakista-novocrm',
                '/bir-bakista-novoxcrm',
                '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
                '/hakkimizda'
            ].includes(route) || route.startsWith('/tools/') || route === '/industry-reports'

            return generateVariants(route, new Date(date), 'weekly', route === '' ? 1 : 0.8, isTrOnly)
        }
    )

    // ── 1.1 AI Solutions routes ──
    const aiSolutionRoutes = aiSolutions.flatMap((sol) =>
        generateVariants(
            `/cozum/${sol.slug}`,
            new Date('2026-05-31T00:00:00.000Z'),
            'monthly',
            0.8,
            true // TR-only content
        )
    )

    // ── 1.2 Use Case / Çözüm routes ──
    const useCaseRoutes = useCases.flatMap((uc) =>
        generateVariants(
            `/cozum/${uc.slug}`,
            new Date('2026-06-01T00:00:00.000Z'),
            'monthly',
            0.8,
            true // TR-only content
        )
    )

    // ── 2. Wiki articles ──
    const wikiRoutes = wikiArticles.flatMap((article) =>
        generateVariants(
            `/wiki/${article.slug}`,
            new Date(parseTurkishDate(article.date)),
            'monthly',
            0.6,
            true // TR-only content
        )
    )

    // ── 3. City pages (programmatic SEO) ──
    const cityRoutes = turkishCities.flatMap((city) =>
        generateVariants(
            `/sehir/${city.slug}`,
            new Date('2026-05-15T00:00:00.000Z'),
            'monthly',
            0.6,
            true // TR-only content
        )
    )

    // ── 3.1 Sector pages (programmatic SEO) ──
    const sectorRoutes = sectors.flatMap((sector) =>
        generateVariants(
            `/sektor/${sector.slug}`,
            new Date('2026-05-30T00:00:00.000Z'),
            'monthly',
            0.7,
            true // TR-only content
        )
    )

    // ── 3.2 City x Sector pages (programmatic SEO) ──
    const citySectorRoutes = turkishCities.flatMap((city) =>
        sectors.flatMap((sector) =>
            generateVariants(
                `/sehir/${city.slug}/${sector.slug}`,
                new Date('2026-05-31T00:00:00.000Z'),
                'monthly',
                0.5,
                true // TR-only content
            )
        )
    )

    // ── 4. Comparison pages ──
    const comparisonRoutes = comparisons.flatMap((comp) =>
        generateVariants(
            `/karsilastirma/${comp.slug}`,
            new Date('2026-05-20T00:00:00.000Z'),
            'monthly',
            0.7,
            true // TR-only content
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
            _rootPath: null as string | null,
        }))
    )

    // ── 6. Benchmark Reports routes ──
    const reportRoutes = reports.flatMap((rep) =>
        generateVariants(
            `/industry-reports/${rep.slug}`,
            new Date('2026-05-31T00:00:00.000Z'),
            'monthly',
            0.7,
            true // TR-only content
        )
    )

    // ── 4. Combine and add i18n alternates ──
    const allRoutes = [
        ...marketingRoutes, 
        ...aiSolutionRoutes, 
        ...useCaseRoutes,
        ...wikiRoutes, 
        ...cityRoutes, 
        ...sectorRoutes, 
        ...citySectorRoutes, 
        ...comparisonRoutes, 
        ...profileRoutes,
        ...reportRoutes
    ]

    return allRoutes.map((route) => {
        const { _rootPath, ...rest } = route

        // /p/ routes don't have locale alternates
        if (_rootPath === null) {
            return rest as any
        }

        // Determine if this path is TR-only content
        const isTrOnlyPath = 
            _rootPath.startsWith('/cozum/') ||
            _rootPath.startsWith('/wiki') ||
            _rootPath.startsWith('/tools/') ||
            _rootPath.startsWith('/sehir/') ||
            _rootPath.startsWith('/sektor/') ||
            _rootPath.startsWith('/karsilastirma/') ||
            _rootPath.startsWith('/industry-reports') ||
            [
                '/cozum/gayrimenkul-crm',
                '/cozum/insaat-crm',
                '/bir-bakista-novocrm',
                '/bir-bakista-novoxcrm',
                '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
                '/hakkimizda'
            ].includes(_rootPath)

        const trUrlPath = getLocalizedPath(_rootPath, 'tr')
        const enUrlPath = getLocalizedPath(_rootPath, 'en')

        if (isTrOnlyPath) {
            return {
                ...rest,
                alternates: {
                    languages: {
                        tr: `${canonicalBaseUrl}${trUrlPath || '/'}`,
                    },
                },
            } as any
        }

        return {
            ...rest,
            alternates: {
                languages: {
                    tr: `${canonicalBaseUrl}${trUrlPath || '/'}`,
                    en: `${canonicalBaseUrl}/en${enUrlPath}`,
                },
            },
        } as any
    })
}
