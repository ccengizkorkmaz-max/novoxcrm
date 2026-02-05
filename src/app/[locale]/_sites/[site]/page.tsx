
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginPage from '@/app/[locale]/login/page'

// This page handles requests rewritten from middleware: /_sites/[site]
export default async function CustomDomainPage({ params }: { params: { site: string, locale: string } }) {
    const domain = decodeURIComponent(params.site)
    const supabase = await createClient()

    // 1. Verify if this domain belongs to a tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('custom_domain', domain)
        .single()

    if (!tenant) {
        return notFound() // or redirect to main site
    }

    // 2. Render Login Page (or distinct landing page)
    // We can reuse the existing Login Page but pass the tenant context implicitly via headers or props if needed
    // For now, we simply render the Login Page. 
    // Ideally, the Login Page should detect the custom domain context to show specific branding.
    return <LoginPage params={{ locale: params.locale }} />
}
