import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't need auth check at all
function isPublicPath(pathWithoutLocale: string): boolean {
    return (
        pathWithoutLocale === '/' ||
        pathWithoutLocale === '/detayli-tanitim' ||
        pathWithoutLocale === '/sitemap.xml' ||
        pathWithoutLocale === '/robots.txt' ||
        pathWithoutLocale.startsWith('/api') ||
        pathWithoutLocale.startsWith('/payment-plan-calculator') ||
        pathWithoutLocale.startsWith('/solutions') ||
        pathWithoutLocale.startsWith('/cozum') ||
        pathWithoutLocale.startsWith('/system-details') ||
        pathWithoutLocale.startsWith('/wiki') ||
        pathWithoutLocale.startsWith('/ebooks') ||
        pathWithoutLocale.startsWith('/login') ||
        pathWithoutLocale.startsWith('/customerservices/login') ||
        pathWithoutLocale.startsWith('/auth') ||
        pathWithoutLocale.startsWith('/p/') ||
        pathWithoutLocale.startsWith('/ai') ||
        pathWithoutLocale.startsWith('/broker/apply') ||
        pathWithoutLocale.startsWith('/broker/login') ||
        pathWithoutLocale.startsWith('/tools') ||
        pathWithoutLocale.startsWith('/sehir') ||
        pathWithoutLocale.startsWith('/sektor') ||
        pathWithoutLocale.startsWith('/karsilastirma') ||
        pathWithoutLocale.startsWith('/gizlilik-sozlesmesi') ||
        pathWithoutLocale.startsWith('/mesafeli-satis-sozlesmesi') ||
        pathWithoutLocale.startsWith('/teslimat-ve-iade-sartlari') ||
        pathWithoutLocale.startsWith('/hakkimizda') ||
        pathWithoutLocale.startsWith('/industry-reports')
    )
}

export async function updateSession(request: NextRequest, response?: NextResponse) {
    // If a response is passed (from next-intl), use it. Otherwise create a new one.
    // Crucially, we must preserve the headers/status from the next-intl response if it exists.
    let internalResponse = response || NextResponse.next({
        request: {
            headers: new Headers(request.headers),
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return internalResponse
    }

    // Helper to strip locale from pathname for checks
    const pathname = request.nextUrl.pathname
    const hostHeader = request.headers.get('host')
    const pathWithoutLocale = pathname.replace(/^\/(tr|en)(\/|$)/, '/')

    // FAST PATH: For public/marketing routes without auth cookies, skip Supabase entirely
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))
    if (!hasAuthCookie && isPublicPath(pathWithoutLocale)) {
        return internalResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    // IMPORTANT: When next-intl response exists, reuse it to preserve headers.
                    // Creating a new NextResponse.next() drops next-intl's locale headers.
                    if (!response) {
                        internalResponse = NextResponse.next({
                            request: {
                                headers: new Headers(request.headers),
                            },
                        })
                    }
                    cookiesToSet.forEach(({ name, value, options }) =>
                        internalResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Handle Public Routes first
    if (!user && !isPublicPath(pathWithoutLocale)) {
        const isPortalRoute = pathWithoutLocale.startsWith('/customerservices')
        const isBrokerRoute = pathWithoutLocale.startsWith('/broker')
        const url = request.nextUrl.clone()
        if (hostHeader) url.host = hostHeader
        const targetPath = isPortalRoute ? '/customerservices/login' : isBrokerRoute ? '/broker/login' : '/login'
        // Prepend locale if present
        const localeMatch = pathname.match(/^\/(tr|en)(\/|$)/)
        const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
        url.pathname = `${localePrefix}${targetPath}`
        return NextResponse.redirect(url)
    }

    if (user) {
        // Only fetch profile for routes that actually need role-based redirection.
        // Dashboard sub-routes (except root '/') are used by authenticated staff and don't need redirection checks.
        const needsRoleCheck = 
            pathWithoutLocale === '/' || 
            pathWithoutLocale.startsWith('/customerservices') || 
            pathWithoutLocale.startsWith('/broker') ||
            pathWithoutLocale.startsWith('/dashboard') ||
            pathWithoutLocale.startsWith('/admin')

        if (!needsRoleCheck) {
            return internalResponse
        }

        // Fetch user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isPortalPath = pathWithoutLocale.startsWith('/customerservices')
        const isBrokerPath = pathWithoutLocale.startsWith('/broker')
        const isPublicPathCheck = pathWithoutLocale.startsWith('/p/')
        const isMarketingPath =
            pathWithoutLocale === '/' ||
            pathWithoutLocale === '/detayli-tanitim' ||
            pathWithoutLocale.startsWith('/payment-plan-calculator') ||
            pathWithoutLocale.startsWith('/solutions') ||
            pathWithoutLocale.startsWith('/system-details') ||
            pathWithoutLocale.startsWith('/ebooks') ||
            pathWithoutLocale.startsWith('/wiki') ||
            pathWithoutLocale.startsWith('/tools') ||
            pathWithoutLocale.startsWith('/sehir') ||
            pathWithoutLocale.startsWith('/karsilastirma') ||
            pathWithoutLocale.startsWith('/gizlilik-sozlesmesi') ||
            pathWithoutLocale.startsWith('/mesafeli-satis-sozlesmesi') ||
            pathWithoutLocale.startsWith('/teslimat-ve-iade-sartlari') ||
            pathWithoutLocale.startsWith('/hakkimizda') ||
            pathWithoutLocale.startsWith('/industry-reports')

        // If customer tries to access dashboard or broker portal, redirect to portal
        if (profile?.role === 'customer' && !isPortalPath && !isPublicPathCheck && !isBrokerPath && !pathWithoutLocale.startsWith('/auth') && !isMarketingPath) {
            const url = request.nextUrl.clone()
            if (hostHeader) url.host = hostHeader
            const targetPath = '/customerservices'
            const localeMatch = pathname.match(/^\/(tr|en)(\/|$)/)
            const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
            url.pathname = `${localePrefix}${targetPath}`
            return NextResponse.redirect(url)
        }

        // If employee tries to access portal, redirect to dashboard 
        const isInternalStaff = ['admin', 'owner', 'crm_manager', 'sales'].includes(profile?.role || '')
        const isBroker = profile?.role === 'broker'

        // 1. Redirect unauthorized users away from portal
        // If not internal staff, not broker, not customer, and on portal -> go home
        if (!isInternalStaff && !isBroker && profile?.role !== 'customer' && isPortalPath) {
            const url = request.nextUrl.clone()
            if (hostHeader) url.host = hostHeader
            const targetPath = '/'
            const localeMatch = pathname.match(/^\/(tr|en)(\/|$)/)
            const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
            // For root path, we don't need double slash if localePrefix is handled by i18n routing mostly,
            // but explicit redirect needs explicit path.
            // If tr (default), we might redirect to / (targetPath)
            // If en, we redirect to /en

            if (localeMatch && localeMatch[1] !== 'tr') {
                url.pathname = `/${localeMatch[1]}`
            } else {
                url.pathname = targetPath
            }
            return NextResponse.redirect(url)
        }

        // 2. BROKER RESTRICTIONS
        if (isBroker) {
            // If trying to access root, or CRM dashboard, or Portal -> Go to broker dashboard
            const isRestrictedForBroker =
                pathWithoutLocale === '/' ||
                pathWithoutLocale.startsWith('/dashboard') ||
                pathWithoutLocale.startsWith('/admin') ||
                pathWithoutLocale.startsWith('/sales') ||
                pathWithoutLocale.startsWith('/crm') ||
                pathWithoutLocale.startsWith('/customerservices')

            if (isRestrictedForBroker) {
                const url = request.nextUrl.clone()
                if (hostHeader) url.host = hostHeader
                const targetPath = '/broker'
                const localeMatch = pathname.match(/^\/(tr|en)(\/|$)/)
                const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
                url.pathname = `${localePrefix}${targetPath}`
                return NextResponse.redirect(url)
            }
        }

        // 3. INTERNAL STAFF RESTRICTIONS
        // If internal staff on root -> Dashboard
        // NOTE: We broadened the check. Any logged in user who is NOT a customer and NOT a broker
        // should likely go to the dashboard if they hit the root path.
        const isExcludedRole = profile?.role === 'customer' || profile?.role === 'broker'

        if (!isExcludedRole && pathWithoutLocale === '/') {
            const url = request.nextUrl.clone()
            if (hostHeader) url.host = hostHeader
            const targetPath = '/dashboard'
            const localeMatch = pathname.match(/^\/(tr|en)(\/|$)/)
            const localePrefix = localeMatch ? `/${localeMatch[1]}` : ''
            url.pathname = `${localePrefix}${targetPath}`
            return NextResponse.redirect(url)
        }
    }

    return internalResponse
}
