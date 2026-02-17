
import { MetadataRoute } from 'next'
import { getSitemapUrls } from '@/lib/sitemap-utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return getSitemapUrls()
}
