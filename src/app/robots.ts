
import { MetadataRoute } from 'next'
import { getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const host = await getHostFromHeaders()
    const baseUrl = getCanonicalBaseUrl(host)

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/broker/apply',
                    '/p',
                ],
                disallow: [
                    '/dashboard/',
                    '/admin/',
                    '/saas-admin/',
                    '/customerservices/',
                    '/broker/', // Blocks other broker pages, allowing apply above
                    '/api/',
                    '/_next/',
                ],
            },
            // Explicitly ALLOW Google's AI crawler — critical for AI search visibility
            {
                userAgent: 'Google-Extended',
                allow: ['/'],
            },
            // Allow Googlebot (standard)
            {
                userAgent: 'Googlebot',
                allow: ['/'],
            },
            // Allow Bing's AI features
            {
                userAgent: 'bingbot',
                allow: ['/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
