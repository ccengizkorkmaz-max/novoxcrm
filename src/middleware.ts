import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const i18nMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    // 1. Hostname Rewriting for Custom Domains
    const url = request.nextUrl
    let hostname = request.headers.get('host')!.replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`)

    // Handle Vercel preview URLs or localhost
    if (hostname.includes('localhost:3000')) {
        hostname = hostname.replace('localhost:3000', process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost')
    }

    const searchParams = request.nextUrl.searchParams.toString()
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`

    // Check if it's a custom domain (not the root domain)
    const isCustomDomain = hostname !== process.env.NEXT_PUBLIC_ROOT_DOMAIN &&
        hostname !== 'localhost' &&
        !hostname.endsWith('.vercel.app') // Optional: block vercel subdomains if needed

    if (isCustomDomain) {
        // Rewrite to /_sites/[site]
        // We will just rewrite and let the Page handle the lookup
        return NextResponse.rewrite(new URL(`/_sites/${hostname}${path}`, request.url))
    }

    // 2. Standard Middleware Flow
    // Run i18n middleware first
    const response = i18nMiddleware(request);

    // Then update session (Supabase)
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
