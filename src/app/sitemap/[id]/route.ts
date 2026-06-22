import { NextRequest, NextResponse } from 'next/server'
import { getSitemapUrls } from '@/lib/sitemap-utils'

export const dynamic = 'force-dynamic'

const URLS_PER_SITEMAP = 5000

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const idStr = params.id.replace('.xml', '')
    const id = parseInt(idStr, 10)
    
    if (isNaN(id)) {
        return new NextResponse('Invalid ID', { status: 400 })
    }

    const allUrls = await getSitemapUrls()
    const start = id * URLS_PER_SITEMAP
    const end = start + URLS_PER_SITEMAP
    const urls = allUrls.slice(start, end)

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`
    
    for (const entry of urls) {
        xml += `  <url>\n`
        xml += `    <loc>${entry.url}</loc>\n`
        if (entry.lastModified) {
            const dateStr = typeof entry.lastModified === 'string' 
                ? entry.lastModified 
                : (entry.lastModified as Date).toISOString()
            xml += `    <lastmod>${dateStr}</lastmod>\n`
        }
        if (entry.changeFrequency) {
            xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`
        }
        if (entry.priority !== undefined) {
            xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`
        }
        if (entry.alternates?.languages) {
            for (const [lang, altUrl] of Object.entries(entry.alternates.languages)) {
                xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${altUrl}"/>\n`
            }
        }
        xml += `  </url>\n`
    }
    xml += `</urlset>`

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
    })
}
