
import { MetadataRoute } from 'next'
import { wikiArticles } from '@/data/wiki-data'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://novoxcrm.com' // Using the actual domain

    // Base marketing routes
    const routes = [
        '',
        '/solutions',
        '/wiki',
        '/payment-plan-calculator',
        '/broker/apply',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Dynamic Wiki articles
    const wikiRoutes = wikiArticles.map((article) => ({
        url: `${baseUrl}/wiki/${article.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    return [...routes, ...wikiRoutes]
}
