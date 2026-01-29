
import { MetadataRoute } from 'next'
import { wikiArticles } from '@/data/wiki-data'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://novoxcrm.com' // Using the actual domain
    const supabase = await createClient()

    // 1. Base marketing routes
    const routes = [
        '',
        '/solutions',
        '/solutions/gayrimenkul-crm',
        '/solutions/insaat-crm',
        '/wiki',
        '/payment-plan-calculator',
        '/system-details',
        '/broker/apply',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Wiki articles
    const wikiRoutes = wikiArticles.map((article) => ({
        url: `${baseUrl}/wiki/${article.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }))

    // 3. Public Broker Profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('broker_slug, updated_at')
        .not('broker_slug', 'is', null)

    const profileRoutes = profiles?.map((profile) => ({
        url: `${baseUrl}/p/${profile.broker_slug}`,
        lastModified: new Date(profile.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
    })) || []

    return [...routes, ...wikiRoutes, ...profileRoutes]
}
