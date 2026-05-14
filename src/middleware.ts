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
    // Run i18n middleware
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
