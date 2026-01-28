
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/admin/',
                '/saas-admin/',
                '/customerservices/',
                '/broker/',
                '/api/',
                '/_next/',
            ],
        },
        sitemap: 'https://novoxcrm.com/sitemap.xml',
    }
}
