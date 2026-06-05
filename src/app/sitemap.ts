
export const dynamic = 'force-dynamic'
import { MetadataRoute } from 'next'
import { getSitemapUrls } from '@/lib/sitemap-utils'

const URLS_PER_SITEMAP = 5000

/**
 * Generate sitemap index — splits large sitemap into 5000-URL chunks.
 * Next.js automatically creates /sitemap.xml as an index pointing to
 * /sitemap/0.xml, /sitemap/1.xml, etc.
 */
export async function generateSitemaps() {
    const allUrls = await getSitemapUrls()
    const totalSitemaps = Math.ceil(allUrls.length / URLS_PER_SITEMAP)

    return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const allUrls = await getSitemapUrls()
    const start = id * URLS_PER_SITEMAP
    const end = start + URLS_PER_SITEMAP

    return allUrls.slice(start, end)
}
