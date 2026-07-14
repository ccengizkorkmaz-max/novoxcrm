import { NextRequest, NextResponse } from 'next/server'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'
import { getSitemapUrls } from '@/lib/sitemap-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const host = request.headers.get('host') || 'oikoscrm.com'
    const canonicalBaseUrl = getCanonicalBaseUrl(host)
    
    // Dynamically calculate the number of sitemaps needed based on 5000 URLs limit per sitemap
    const allUrls = await getSitemapUrls()
    const sitemapsCount = Math.max(1, Math.ceil(allUrls.length / 5000))
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    for (let i = 0; i < sitemapsCount; i++) {
        xml += `  <sitemap>\n`
        xml += `    <loc>${canonicalBaseUrl}/sitemap/${i}.xml</loc>\n`
        xml += `  </sitemap>\n`
    }
    xml += `</sitemapindex>`

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
    })
}
