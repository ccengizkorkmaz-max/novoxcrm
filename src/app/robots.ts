
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
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
        sitemap: 'https://novoxcrm.com/sitemap.xml',
    }
}
