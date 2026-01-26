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

        // If customer tries to access dashboard or broker portal, redirect to portal
        if (profile?.role === 'customer' && !isPortalPath && !isPublicPath && !isBrokerPath && !request.nextUrl.pathname.startsWith('/auth')) {
            const url = request.nextUrl.clone()
            url.pathname = '/customerservices'
            return NextResponse.redirect(url)
        }

        // If employee tries to access portal, redirect to dashboard 
        const isEmployee = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'sales' || profile?.role === 'broker'

        if (!isEmployee && profile?.role !== 'customer' && isPortalPath) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    return response
}
