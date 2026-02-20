
import { NextResponse } from 'next/server'
import { getSitemapUrls } from '@/lib/sitemap-utils'

// Force dynamic rendering since we depend on external data/sitemap logic
export const dynamic = 'force-dynamic'

async function handler(request: Request) {
    try {
        // 1. Get API Key from environment variable
        const apiKey = process.env.INDEXNOW_KEY
        if (!apiKey) {
            console.error('IndexNow Key missing in environment variables')
            return NextResponse.json(
                { error: 'IndexNow API Key is not configured in .env' },
                { status: 500 }
            )
        }

        // 2. Determine URLs to submit
        let urlsToSubmit: string[] = []

        // Check if user provided specific URLs in body
        let manualUrls = []
        if (request.method === 'POST') {
            const body = await request.json().catch(() => ({}))
            manualUrls = body.urls
        }


        if (Array.isArray(manualUrls) && manualUrls.length > 0) {
            urlsToSubmit = manualUrls
        } else {
            // Otherwise, fetch all URLs from sitemap logic
            console.log('Fetching sitemap URLs...')
            try {
                const sitemap = await getSitemapUrls()
                // Convert sitemap items to array of URL strings
                if (Array.isArray(sitemap)) {
                    // The getSitemapUrls returns an array of objects with a 'url' property
                    // We need to cast it properly or access it safely
                    urlsToSubmit = sitemap.map((item: any) => item.url).filter(Boolean)
                }
            } catch (err) {
                console.error('Error generating sitemap URLs:', err)
                return NextResponse.json({ error: 'Failed to generate sitemap URLs' }, { status: 500 })
            }
        }

        if (urlsToSubmit.length === 0) {
            return NextResponse.json({ message: 'No URLs found to submit.' }, { status: 200 })
        }

        console.log(`Submitting ${urlsToSubmit.length} URLs to IndexNow...`)

        // 3. Batch submit (limit is 10,000 URLs per request)
        const BATCH_SIZE = 10000
        const results = []

        for (let i = 0; i < urlsToSubmit.length; i += BATCH_SIZE) {
            const batch = urlsToSubmit.slice(i, i + BATCH_SIZE)

            const payload = {
                host: 'novocrm.com',
                key: apiKey,
                // Assuming the key file is hosted at root as [API_KEY].txt or similar
                // If not, keyLocation is optional if host matches site verified in Bing Webmaster Tools
                // but recommended. Let's assume standard implementation.
                keyLocation: `https://novocrm.com/${apiKey}.txt`,
                urlList: batch
            }

            try {
                const response = await fetch('https://api.indexnow.org/indexnow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: JSON.stringify(payload),
                })

                results.push({
                    batchIndex: i / BATCH_SIZE,
                    count: batch.length,
                    status: response.status,
                    statusText: response.statusText
                })

                if (!response.ok) {
                    const text = await response.text()
                    console.error(`IndexNow Error (Batch ${i}):`, text)
                }

            } catch (fetchError) {
                console.error(`IndexNow Fetch Error (Batch ${i}):`, fetchError)
                results.push({
                    batchIndex: i / BATCH_SIZE,
                    error: String(fetchError)
                })
            }
        }

        return NextResponse.json({
            success: true,
            totalUrls: urlsToSubmit.length,
            results
        })

    } catch (error: any) {
        console.error('IndexNow handler error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export { handler as GET, handler as POST }
