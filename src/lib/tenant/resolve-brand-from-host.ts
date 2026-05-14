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
 * Static brand mapping for approved white-label marketing domains.
 * ONLY these domains will show custom branding on marketing pages.
 * All other custom domains will show "Novo CRM" and only get a custom login page.
 * 
 * This is intentionally static (not DB-driven) for:
 * 1. Reliability - no DB dependency for marketing page rendering
 * 2. Performance - zero latency brand resolution
 * 3. Security - prevents random tenants from hijacking marketing pages
 */
const WHITELABEL_BRAND_MAP: Record<string, { brandName: string; brandConfig: BrandConfig }> = {
    'oikoscrm.com': {
        brandName: 'Oikos CRM',
        brandConfig: {
            ...DEFAULT_BRAND,
            appName: 'Oikos CRM',
        },
    },
    'www.oikoscrm.com': {
        brandName: 'Oikos CRM',
        brandConfig: {
            ...DEFAULT_BRAND,
            appName: 'Oikos CRM',
        },
    },
}

/**
 * Resolve tenant brand config from the request hostname.
 * Uses static mapping for approved white-label domains.
 * All other domains get default Novo CRM branding.
 */
export async function resolveBrandFromHost(hostname: string): Promise<BrandConfig> {
    const cleanHost = hostname.split(':')[0] // remove port

    // Check static white-label mapping first
    const whitelabel = WHITELABEL_BRAND_MAP[cleanHost]
    if (whitelabel) {
        return whitelabel.brandConfig
    }

    // Everything else gets default branding
    return DEFAULT_BRAND
}

/**
 * Get just the brand name for metadata purposes.
 * Uses static mapping - no DB query needed.
 */
export async function getBrandNameFromHost(hostname: string): Promise<string> {
    const cleanHost = hostname.split(':')[0]

    // Check static white-label mapping
    const whitelabel = WHITELABEL_BRAND_MAP[cleanHost]
    if (whitelabel) {
        return whitelabel.brandName
    }

    // Default for all other domains
    return 'Novo CRM'
}
