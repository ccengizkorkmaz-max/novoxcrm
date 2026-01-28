import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        return response
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
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Handle Public Routes first
    const isPublicRoute =
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/payment-plan-calculator') ||
        request.nextUrl.pathname.startsWith('/solutions') ||
        request.nextUrl.pathname.startsWith('/system-details') ||
        request.nextUrl.pathname.startsWith('/wiki') ||
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/customerservices/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/p/') ||
        request.nextUrl.pathname.startsWith('/broker/apply')

    if (!user && !isPublicRoute) {
        const isPortalRoute = request.nextUrl.pathname.startsWith('/customerservices')
        const url = request.nextUrl.clone()
        url.pathname = isPortalRoute ? '/customerservices/login' : '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Fetch user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const isPortalPath = request.nextUrl.pathname.startsWith('/customerservices')
        const isBrokerPath = request.nextUrl.pathname.startsWith('/broker')
        const isPublicPath = request.nextUrl.pathname.startsWith('/p/')
        const isMarketingPath =
            request.nextUrl.pathname === '/' ||
            request.nextUrl.pathname.startsWith('/payment-plan-calculator') ||
            request.nextUrl.pathname.startsWith('/solutions') ||
            request.nextUrl.pathname.startsWith('/system-details') ||
            request.nextUrl.pathname.startsWith('/wiki')

        // If customer tries to access dashboard or broker portal, redirect to portal
        if (profile?.role === 'customer' && !isPortalPath && !isPublicPath && !isBrokerPath && !request.nextUrl.pathname.startsWith('/auth') && !isMarketingPath) {
            const url = request.nextUrl.clone()
            url.pathname = '/customerservices'
            return NextResponse.redirect(url)
        }

        // If employee tries to access portal, redirect to dashboard 
        const isInternalStaff = ['admin', 'owner', 'sales'].includes(profile?.role || '')
        const isBroker = profile?.role === 'broker'

        // 1. Redirect unauthorized users away from portal
        // If not internal staff, not broker, not customer, and on portal -> go home
        if (!isInternalStaff && !isBroker && profile?.role !== 'customer' && isPortalPath) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // 2. BROKER RESTRICTIONS
        if (isBroker) {
            // If trying to access root, or CRM dashboard, or Portal -> Go to broker dashboard
            const isRestrictedForBroker =
                request.nextUrl.pathname === '/' ||
                request.nextUrl.pathname.startsWith('/dashboard') ||
                request.nextUrl.pathname.startsWith('/admin') ||
                request.nextUrl.pathname.startsWith('/sales') ||
                request.nextUrl.pathname.startsWith('/crm') ||
                request.nextUrl.pathname.startsWith('/customerservices')

            if (isRestrictedForBroker) {
                const url = request.nextUrl.clone()
                url.pathname = '/broker'
                return NextResponse.redirect(url)
            }
        }

        // 3. INTERNAL STAFF RESTRICTIONS
        // If internal staff on root -> Dashboard
        if (isInternalStaff && request.nextUrl.pathname === '/') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}
