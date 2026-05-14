import { createClient } from '@/lib/supabase/server'
import { resolveBrand, DEFAULT_BRAND, type BrandConfig } from '@/lib/brand-config'

// Known platform hostnames (not custom domains)
const PLATFORM_HOSTS = [
    'novoxcrm.com',
    'www.novoxcrm.com',
    'localhost',
    'novocrm-rho.vercel.app',
]

/**
 * Resolve tenant brand config from the request hostname.
 * If the hostname is a custom domain, look up the tenant and return their brand config.
 * If it's a platform host, return the default Novo CRM branding.
 */
export async function resolveBrandFromHost(hostname: string): Promise<BrandConfig> {
    const cleanHost = hostname.split(':')[0] // remove port

    // Platform hosts always get default branding
    if (PLATFORM_HOSTS.includes(cleanHost) || cleanHost.endsWith('.vercel.app')) {
        return DEFAULT_BRAND
    }

    try {
        const supabase = await createClient()
        const { data: tenant } = await supabase
            .from('tenants')
            .select('brand_config, name')
            .eq('custom_domain', cleanHost)
            .single()

        if (tenant?.brand_config) {
            return resolveBrand(tenant.brand_config)
        }

        // Tenant found but no brand_config set - use tenant name as appName
        if (tenant?.name) {
            return {
                ...DEFAULT_BRAND,
                appName: tenant.name,
            }
        }
    } catch {
        // DB error - fall back to default
    }

    return DEFAULT_BRAND
}

/**
 * Get just the brand name for metadata purposes (lighter query).
 * Returns the appName from tenant's brand_config, or tenant name, or 'Novo CRM'.
 */
export async function getBrandNameFromHost(hostname: string): Promise<string> {
    const cleanHost = hostname.split(':')[0]

    if (PLATFORM_HOSTS.includes(cleanHost) || cleanHost.endsWith('.vercel.app')) {
        return 'Novo CRM'
    }

    try {
        const supabase = await createClient()
        const { data: tenant } = await supabase
            .from('tenants')
            .select('brand_config, name')
            .eq('custom_domain', cleanHost)
            .single()

        if (tenant?.brand_config?.appName) {
            return tenant.brand_config.appName
        }
        if (tenant?.name) {
            return tenant.name
        }
    } catch {
        // fall back
    }

    return 'Novo CRM'
}
