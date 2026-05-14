import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Resolve tenant from custom domain header set by middleware.
 * Returns tenant_id if the request is coming from a verified custom domain.
 * Returns null if it's a standard platform request.
 */
export async function resolveTenantFromDomain(): Promise<string | null> {
    const headersList = await headers()
    const customDomain = headersList.get('x-custom-domain')

    if (!customDomain) return null

    const supabase = await createClient()
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('custom_domain', customDomain)
        .eq('domain_verified', true)
        .single()

    return tenant?.id || null
}

/**
 * Get the custom domain header value (if any).
 * Useful for conditional rendering or branding.
 */
export async function getCustomDomainHeader(): Promise<string | null> {
    const headersList = await headers()
    return headersList.get('x-custom-domain') || null
}
