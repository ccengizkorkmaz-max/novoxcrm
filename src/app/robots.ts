
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: [
                '/',
                '/broker/apply',
                '/p/'
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
        sitemap: 'https://novoxcrm.com/sitemap.xml',
    }
}
