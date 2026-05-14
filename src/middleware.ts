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

function isPlatformHost(hostname: string): boolean {
    return PLATFORM_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))
}

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get('host')?.split(':')[0] || ''

    // Custom Domain Resolution
    // If the hostname is NOT a known platform host, it might be a tenant custom domain
    if (hostname && !isPlatformHost(hostname)) {
        // Inject custom domain as a header for downstream server components
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-custom-domain', hostname)
        
        // Create a new request with the custom domain header
        const modifiedRequest = new NextRequest(request.url, {
            headers: requestHeaders,
        })
        
        // Run i18n middleware with modified request
        const response = i18nMiddleware(modifiedRequest)
        
        // Pass custom domain header to the response for server-side reading
        if (response) {
            response.headers.set('x-custom-domain', hostname)
        }
        
        return await updateSession(modifiedRequest, response)
    }

    // Standard flow for platform hosts
    const response = i18nMiddleware(request);
    return await updateSession(request, response)
}


export const config = {
    matcher: [
        // Match all pathnames except for
        // - … if they start with `/api`, `/_next` or `/_vercel`
        // - … the ones containing a dot (e.g. `favicon.ico`)
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
}
