
export const dynamic = 'force-dynamic'
import { MetadataRoute } from 'next'
import { getSitemapUrls } from '@/lib/sitemap-utils'

const URLS_PER_SITEMAP = 5000

/**
 * Generate sitemap index — returns static IDs for sitemap chunks.
 * We estimate ~19,000 URLs based on known data arrays (cities×sectors×locales×domains).
 * This avoids calling getSitemapUrls() at build time which requires request context.
 */
export async function generateSitemaps() {
    // Static estimate: ~19,000 URLs → 4 sitemaps of 5000 each
    const ESTIMATED_TOTAL = 19000
    const totalSitemaps = Math.ceil(ESTIMATED_TOTAL / URLS_PER_SITEMAP)

    return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const allUrls = await getSitemapUrls()
    const start = id * URLS_PER_SITEMAP
    const end = start + URLS_PER_SITEMAP

    return allUrls.slice(start, end)
}
