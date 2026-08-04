import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const i18nMiddleware = createMiddleware(routing);

// Known platform hostnames (not custom domains)
const PLATFORM_HOSTS = [
    'localhost',
    '127.0.0.1',
    'novoxcrm.com',
    'www.novoxcrm.com',
    'novocrm.app',
    'vercel.app',
]

function isCacheableMarketingPath(pathname: string): boolean {
    const pathWithoutLocale = pathname.replace(/^\/(tr|en)(\/|$)/, '/')

    // Exact match public marketing pages
    if (
        pathWithoutLocale === '/' ||
        pathWithoutLocale === '/detayli-tanitim' ||
        pathWithoutLocale === '/sitemap.xml' ||
        pathWithoutLocale === '/robots.txt' ||
        pathWithoutLocale === '/gizlilik-sozlesmesi' ||
        pathWithoutLocale === '/mesafeli-satis-sozlesmesi' ||
        pathWithoutLocale === '/teslimat-ve-iade-sartlari' ||
        pathWithoutLocale === '/hakkimizda' ||
        pathWithoutLocale === '/payment-plan-calculator' ||
        pathWithoutLocale === '/system-details'
    ) {
        return true
    }

    // Prefix match public marketing sections
    if (
        pathWithoutLocale.startsWith('/solutions') ||
        pathWithoutLocale.startsWith('/cozum') ||
        pathWithoutLocale.startsWith('/wiki') ||
        pathWithoutLocale.startsWith('/ebooks') ||
        pathWithoutLocale.startsWith('/p/') ||
        pathWithoutLocale.startsWith('/broker/apply') ||
        pathWithoutLocale.startsWith('/tools') ||
        pathWithoutLocale.startsWith('/sehir') ||
        pathWithoutLocale.startsWith('/sektor') ||
        pathWithoutLocale.startsWith('/karsilastirma') ||
        pathWithoutLocale.startsWith('/industry-reports') ||
        pathWithoutLocale.startsWith('/teklif/')
    ) {
        return true
    }

    return false
}

const ALLOWED_AGENT_SLUGS = new Set([
    'bunyamin', 'bunyamin-sarac', 
    'serkan', 'serkan-genc', 
    'burak', 'burak-aydin', 
    'elif', 'elif-kaya', 
    'emre', 'emre-yildirim', 
    'sevgi', 'sevgi-simsek', 
    'zeynep', 'zeynep-celik', 
    'selin', 'selin-korkmaz', 
    'ahmet', 'ahmet-yilmaz', 
    'cihan', 'cihan-ekmen', 
    'halim', 'halim-peker', 
    'nurcan', 'nurcan-findikgil'
])

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]?.toLowerCase()
    
    // Dynamic Agent Slug Rewrite
    if (firstSegment && ALLOWED_AGENT_SLUGS.has(firstSegment)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `/tr/temsilci/${firstSegment}`
        return NextResponse.rewrite(redirectUrl)
    }
    if (pathSegments.length >= 2 && ['tr', 'en'].includes(firstSegment)) {
        const secondSegment = pathSegments[1]?.toLowerCase()
        if (secondSegment && ALLOWED_AGENT_SLUGS.has(secondSegment)) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = `/${firstSegment}/temsilci/${secondSegment}`
            return NextResponse.rewrite(redirectUrl)
        }
    }
    // 1. Permanent redirect for /broker/apply to Turkish localized form /broker/basvuru
    if (pathname === '/broker/apply' || pathname === '/tr/broker/apply') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/broker/basvuru'
        return NextResponse.redirect(redirectUrl, 308)
    }

    // 2. 301 Redirects for old solutions paths to new cozum paths
    if (pathname.startsWith('/solutions') || pathname.startsWith('/en/solutions')) {
        const isEn = pathname.startsWith('/en/solutions')
        const pathSuffix = isEn ? pathname.slice(13) : pathname.slice(10)
        
        const redirectMap: Record<string, string> = {
            '': '/cozum',
            '/': '/cozum',
            '/insaat-crm': '/cozum/insaat-crm',
            '/gayrimenkul-crm': '/cozum/gayrimenkul-crm',
            '/ai-sesli-arama': '/cozum/ai-sesli-arama',
            '/ai-outreach-otomasyonu': '/cozum/ai-outreach-otomasyonu',
            '/ai-whatsapp-agent': '/cozum/ai-whatsapp-ajani',
            '/ai-lead-qualification': '/cozum/ai-lead-qualification',
            '/ai-broker-matching': '/cozum/ai-broker-eslestirme',
            '/ai-satis-asistani': '/cozum/ai-satis-asistani',
            '/ai-musteri-analizi': '/cozum/ai-musteri-analizi',
            '/ai-satis-copilot': '/cozum/ai-satis-copilot',
            '/ai-emlak-agent': '/cozum/ai-emlak-agent',
            '/voice-ai-real-estate': '/cozum/ai-sesli-arama',
            '/ai-outreach-automation': '/cozum/ai-outreach-otomasyonu',
            '/omnichannel-inbox': '/cozum/whatsapp-entegrasyonu',
        }

        const cleanSuffix = pathSuffix.replace(/\/$/, '')
        const targetPath = redirectMap[pathSuffix] || redirectMap[cleanSuffix]
        
        if (targetPath) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = targetPath
            return NextResponse.redirect(redirectUrl, 301)
        }
    }

    if (pathname.startsWith('/en/')) {
        const pathWithoutEn = pathname.slice(3) // removes '/en'
        // Define paths that are Turkish-only and should be redirected
        if (
            pathWithoutEn.startsWith('/solutions/') ||
            pathWithoutEn.startsWith('/cozum/') ||
            pathWithoutEn.startsWith('/wiki') ||
            pathWithoutEn.startsWith('/tools/') ||
            pathWithoutEn.startsWith('/sehir/') ||
            pathWithoutEn.startsWith('/sektor/') ||
            pathWithoutEn.startsWith('/karsilastirma/') ||
            pathWithoutEn.startsWith('/industry-reports') ||
            pathWithoutEn === '/hakkimizda'
        ) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = pathWithoutEn
            return NextResponse.redirect(redirectUrl, 301)
        }
    }

    // Skip i18n and auth for shared public report pages, guest meeting pages, and document short links
    if (
        request.nextUrl.pathname.startsWith('/shared/') || 
        request.nextUrl.pathname.startsWith('/meeting/') ||
        request.nextUrl.pathname.startsWith('/d/')
    ) {
        return NextResponse.next()
    }

    // Run i18n middleware
    const response = i18nMiddleware(request);

    // Then update session (Supabase)
    const finalResponse = await updateSession(request, response)

    // Add build version header for production diagnostics and caching mismatch checks
    finalResponse.headers.set(
        'x-build-version',
        process.env.VERCEL_GIT_COMMIT_SHA || 'development'
    )

    // Add Vercel-CDN-Cache-Control for public marketing paths to prevent serverless function invocation spikes
    if (isCacheableMarketingPath(request.nextUrl.pathname)) {
        // Lower s-maxage to 60 seconds so updates propagate rapidly to CDN, while keeping long stale revalidation
        finalResponse.headers.set(
            'Vercel-CDN-Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=600'
        )
    }

    return finalResponse
}


export const config = {
    matcher: [
        // Match all pathnames except for
        // - … if they start with `/api`, `/_next` or `/_vercel`
        // - … the ones containing a dot (e.g. `favicon.ico`)
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
}
