import { createClient } from '@/lib/supabase/server'
import { resolveBrand, DEFAULT_BRAND, type BrandConfig } from '@/lib/brand-config'
import { headers } from 'next/headers'

/**
 * Safely get the hostname from request headers.
 * Returns 'novoxcrm.com' during static generation when headers() is unavailable.
 */
export async function getHostFromHeaders(): Promise<string> {
    try {
        const headerList = await headers()
        return headerList.get('host') || 'novoxcrm.com'
    } catch {
        // headers() throws during static generation - return default
        return 'novoxcrm.com'
    }
}

// Known platform hostnames (not custom domains)
const PLATFORM_HOSTS = [
    'novoxcrm.com',
    'www.novoxcrm.com',
    'localhost',
    'novocrm-rho.vercel.app',
]

/**
 * Domains approved for full white-label marketing pages.
 * ONLY these custom domains will have their brand name shown on marketing pages.
 * All other custom domains will show "Novo CRM" on marketing pages
 * and will only get a custom login page (handled by middleware).
 */
const MARKETING_WHITELABEL_DOMAINS = [
    'oikoscrm.com',
    'www.oikoscrm.com',
]

/**
 * Resolve tenant brand config from the request hostname.
 * ONLY returns custom brand for approved white-label marketing domains.
 * Other custom domains always get default Novo CRM branding on marketing pages.
 */
export async function resolveBrandFromHost(hostname: string): Promise<BrandConfig> {
    const cleanHost = hostname.split(':')[0] // remove port

    // Platform hosts always get default branding
    if (PLATFORM_HOSTS.includes(cleanHost) || cleanHost.endsWith('.vercel.app')) {
        return DEFAULT_BRAND
    }

    // ONLY approved white-label domains get custom marketing branding
    if (!MARKETING_WHITELABEL_DOMAINS.includes(cleanHost)) {
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
 * ONLY returns custom brand name for approved white-label marketing domains.
 * All other custom domains return 'Novo CRM'.
 */
export async function getBrandNameFromHost(hostname: string): Promise<string> {
    const cleanHost = hostname.split(':')[0]

    if (PLATFORM_HOSTS.includes(cleanHost) || cleanHost.endsWith('.vercel.app')) {
        return 'Novo CRM'
    }

    // ONLY approved white-label domains get custom brand name
    if (!MARKETING_WHITELABEL_DOMAINS.includes(cleanHost)) {
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
