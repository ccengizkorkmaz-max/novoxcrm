/**
 * SEO Constants — Multi-Domain Configuration
 * 
 * Both novoxcrm.com and oikoscrm.com serve the same product with different branding.
 * Each domain is self-canonical (self-referencing) so both can be indexed independently.
 * 
 * - novoxcrm.com  → Brand: "Novo CRM"  (200+ indexed pages, current authority)
 * - oikoscrm.com  → Brand: "Oikos CRM" (building authority, future primary)
 * 
 * Google treats them as separate sites with similar content but different branding.
 * Brand searches ("Oikos CRM") will surface oikoscrm.com results.
 * Generic searches ("gayrimenkul crm") will surface whichever has more authority.
 * 
 * FUTURE MIGRATION:
 * When oikoscrm.com has enough authority to become the sole domain:
 *   1. Set up 301 redirects from novoxcrm.com → oikoscrm.com
 *   2. Submit change-of-address in Google Search Console
 *   3. Keep novoxcrm.com redirecting for at least 1 year
 */

/** All known platform domains (for validation, sitemap generation, etc.) */
export const PLATFORM_DOMAINS = ['novoxcrm.com', 'oikoscrm.com'] as const

/**
 * Returns the canonical base URL for the current request.
 * Each domain is self-canonical — returns the URL based on the actual host.
 * In localhost/dev, returns the local URL for testing.
 */
export function getCanonicalBaseUrl(host: string): string {
    const cleanHost = host.split(':')[0]
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
        return `http://${host}`
    }
    // Each domain is its own canonical
    return `https://${cleanHost}`
}
