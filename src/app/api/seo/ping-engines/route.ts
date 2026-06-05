
import { NextResponse } from 'next/server'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'
import { getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export const dynamic = 'force-dynamic'

/**
 * POST /api/seo/ping-engines
 * 
 * Pings Google and Bing with the sitemap URL to trigger faster re-crawling.
 * Also triggers IndexNow submission for Bing/Yandex/Seznam.
 * 
 * Call this after deployments or significant content changes.
 */
export async function POST() {
    try {
        const host = await getHostFromHeaders()
        const baseUrl = getCanonicalBaseUrl(host)
        const sitemapUrl = `${baseUrl}/sitemap.xml`

        const results: Record<string, any> = {}

        // 1. Google Ping
        try {
            const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
            const googleRes = await fetch(googlePingUrl, { method: 'GET' })
            results.google = {
                status: googleRes.status,
                ok: googleRes.ok,
                message: googleRes.ok ? 'Sitemap submitted to Google' : await googleRes.text()
            }
        } catch (err: any) {
            results.google = { error: err.message }
        }

        // 2. Bing Ping (webmaster API)
        try {
            const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
            const bingRes = await fetch(bingPingUrl, { method: 'GET' })
            results.bing = {
                status: bingRes.status,
                ok: bingRes.ok,
                message: bingRes.ok ? 'Sitemap submitted to Bing' : await bingRes.text()
            }
        } catch (err: any) {
            results.bing = { error: err.message }
        }

        // 3. IndexNow (Bing + Yandex + Seznam simultaneously)
        const indexNowKey = process.env.INDEXNOW_KEY
        if (indexNowKey) {
            try {
                const cleanHost = host.split(':')[0].replace(/^www\./, '')
                // Submit the sitemap URL itself via IndexNow — engines will re-crawl it
                const indexNowPayload = {
                    host: cleanHost,
                    key: indexNowKey,
                    keyLocation: `https://${cleanHost}/${indexNowKey}.txt`,
                    urlList: [
                        `${baseUrl}/`,
                        `${baseUrl}/sitemap.xml`,
                        `${baseUrl}/tr`,
                        `${baseUrl}/en`,
                    ]
                }

                const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    body: JSON.stringify(indexNowPayload),
                })

                results.indexNow = {
                    status: indexNowRes.status,
                    ok: indexNowRes.ok || indexNowRes.status === 202,
                    message: 'Key pages submitted to IndexNow (Bing/Yandex/Seznam)'
                }
            } catch (err: any) {
                results.indexNow = { error: err.message }
            }
        } else {
            results.indexNow = { skipped: true, message: 'INDEXNOW_KEY not configured' }
        }

        return NextResponse.json({
            success: true,
            sitemapUrl,
            timestamp: new Date().toISOString(),
            results
        })

    } catch (error: any) {
        console.error('Ping engines error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Also support GET for easy manual triggering
export { POST as GET }
