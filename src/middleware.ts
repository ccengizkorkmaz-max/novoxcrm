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
        pathWithoutLocale.startsWith('/wiki') ||
        pathWithoutLocale.startsWith('/ebooks') ||
        pathWithoutLocale.startsWith('/p/') ||
        pathWithoutLocale.startsWith('/broker/apply') ||
        pathWithoutLocale.startsWith('/tools') ||
        pathWithoutLocale.startsWith('/sehir') ||
        pathWithoutLocale.startsWith('/sektor') ||
        pathWithoutLocale.startsWith('/karsilastirma') ||
        pathWithoutLocale.startsWith('/industry-reports')
    ) {
        return true
    }

    return false
}

export async function middleware(request: NextRequest) {
    // Skip i18n and auth for shared public report pages
    if (request.nextUrl.pathname.startsWith('/shared/')) {
        return NextResponse.next()
    }

    // Run i18n middleware
    const response = i18nMiddleware(request);

    // Then update session (Supabase)
    const finalResponse = await updateSession(request, response)

    // Add Vercel-CDN-Cache-Control for public marketing paths to prevent serverless function invocation spikes
    if (isCacheableMarketingPath(request.nextUrl.pathname)) {
        finalResponse.headers.set(
            'Vercel-CDN-Cache-Control',
            'public, s-maxage=86400, stale-while-revalidate=604800'
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
