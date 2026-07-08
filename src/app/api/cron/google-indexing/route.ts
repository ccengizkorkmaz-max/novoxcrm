import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import path from 'path'
import fs from 'fs'

// Data files for URL generation
import { wikiArticles } from '@/data/wiki-data'
import { turkishCities } from '@/data/cities-data'
import { comparisons } from '@/data/comparisons-data'
import { sectors } from '@/data/sectors-data'
import { aiSolutions } from '@/data/ai-solutions-data'
import { reports } from '@/data/reports-data'

// Vercel Serverless timeout limit (5 minutes)
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const DAILY_QUOTA = 200
const RATE_LIMIT_MS = 600
const DOMAINS = ['https://novoxcrm.com', 'https://oikoscrm.com']

interface UrlEntry {
    url: string;
    priority: number;
    category: string;
}

// Re-usable prioritized URL list builder matching scripts/submit-indexing-full.ts
function buildUrlList(): UrlEntry[] {
    const entries: UrlEntry[] = [];

    for (const domain of DOMAINS) {
        // ── Priority 1: Core Marketing Pages (highest value) ──
        const corePages = [
            '', '/solutions', '/solutions/gayrimenkul-crm', '/solutions/insaat-crm',
            '/wiki', '/system-details', '/bir-bakista-novocrm',
            '/broker/apply', '/payment-plan-calculator',
            '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
            '/tools/tapu-harci-hesaplayici', '/tools/serefiye-hesaplayici',
            '/tools/emlak-vergisi-hesaplayici', '/tools/konut-kredisi-karsilastirma',
            '/tools/broker-komisyon-hesaplayici', '/tools/damga-vergisi-hesaplayici',
            '/tools/insaat-maliyet-hesaplayici', '/tools/metrekare-birim-fiyat',
            '/tools/yatirim-getirisi-hesaplayici', '/tools/kira-getirisi-hesaplayici',
            '/industry-reports', '/login',
        ];
        for (const page of corePages) {
            entries.push({ url: `${domain}${page || '/'}`, priority: 100, category: 'Core' });
            entries.push({ url: `${domain}/en${page}`, priority: 90, category: 'Core EN' });
        }

        // ── Priority 2: AI Solutions ──
        for (const sol of aiSolutions) {
            entries.push({ url: `${domain}/solutions/${sol.slug}`, priority: 85, category: 'AI Solution' });
            entries.push({ url: `${domain}/en/solutions/${sol.slug}`, priority: 80, category: 'AI Solution EN' });
        }

        // ── Priority 3: Wiki Articles ──
        for (const article of wikiArticles) {
            entries.push({ url: `${domain}/wiki/${article.slug}`, priority: 70, category: 'Wiki' });
            entries.push({ url: `${domain}/en/wiki/${article.slug}`, priority: 65, category: 'Wiki EN' });
        }

        // ── Priority 4: Industry Reports ──
        for (const rep of reports) {
            entries.push({ url: `${domain}/industry-reports/${rep.slug}`, priority: 75, category: 'Report' });
            entries.push({ url: `${domain}/en/industry-reports/${rep.slug}`, priority: 70, category: 'Report EN' });
        }

        // ── Priority 5: Comparisons ──
        for (const comp of comparisons) {
            entries.push({ url: `${domain}/karsilastirma/${comp.slug}`, priority: 60, category: 'Comparison' });
            entries.push({ url: `${domain}/en/karsilastirma/${comp.slug}`, priority: 55, category: 'Comparison EN' });
        }

        // ── Priority 6: Sectors ──
        for (const sector of sectors) {
            entries.push({ url: `${domain}/sektor/${sector.slug}`, priority: 55, category: 'Sector' });
            entries.push({ url: `${domain}/en/sektor/${sector.slug}`, priority: 50, category: 'Sector EN' });
        }

        // ── Priority 7: Cities ──
        for (const city of turkishCities) {
            entries.push({ url: `${domain}/sehir/${city.slug}`, priority: 45, category: 'City' });
            entries.push({ url: `${domain}/en/sehir/${city.slug}`, priority: 40, category: 'City EN' });
        }

        // ── Priority 8: City x Sector (programmatic SEO) ──
        for (const city of turkishCities) {
            for (const sector of sectors) {
                entries.push({
                    url: `${domain}/sehir/${city.slug}/${sector.slug}`,
                    priority: 20,
                    category: 'City×Sector'
                });
                entries.push({
                    url: `${domain}/en/sehir/${city.slug}/${sector.slug}`,
                    priority: 15,
                    category: 'City×Sector EN'
                });
            }
        }
    }

    // Sort by priority descending
    entries.sort((a, b) => b.priority - a.priority);
    return entries;
}

export async function GET(req: NextRequest) {
    // 1. Authorization Check
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // 2. Load Google Service Account key
    const keyFilePath = path.join(process.cwd(), 'google-indexer-key.json')
    if (!fs.existsSync(keyFilePath)) {
        return NextResponse.json({ error: 'Google Service Account key file not found.' }, { status: 500 })
    }

    try {
        // Fetch a valid tenant ID to associate with system log entry (required by schema)
        const { data: tenant, error: tenantErr } = await adminSupabase
            .from('tenants')
            .select('id')
            .limit(1)
            .single()

        if (tenantErr || !tenant) {
            throw new Error('No tenant found in the database to associate logs: ' + (tenantErr?.message || 'unknown'))
        }

        // 3. Resolve current offset from latest system logs entry
        const { data: latestLog, error: logErr } = await adminSupabase
            .from('system_logs')
            .select('details')
            .eq('action_type', 'GOOGLE_INDEXING')
            .eq('status', 'Success')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (logErr) {
            console.error('[Indexing Cron] Error fetching latest log:', logErr.message)
        }

        const prevOffset = (latestLog?.details as any)?.next_offset || 0
        const allUrls = buildUrlList()
        const totalUrls = allUrls.length

        // Loop back offset to 0 if we reached the end or have bad offset
        const currentOffset = prevOffset >= totalUrls ? 0 : prevOffset
        const batchUrls = allUrls.slice(currentOffset, currentOffset + DAILY_QUOTA)

        if (batchUrls.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No URLs to submit.',
                offset: currentOffset,
                total: totalUrls
            })
        }

        console.log(`[Indexing Cron] Submitting batch from offset ${currentOffset} to ${currentOffset + batchUrls.length} (total urls: ${totalUrls})`)

        // 4. Authenticate Google API
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        })
        const authClient = await auth.getClient()
        const indexing = google.indexing({ version: 'v3', auth: authClient as any })

        // 5. Publish to Indexing API
        let successCount = 0;
        let failCount = 0;
        const successes: string[] = []
        const failures: { url: string; error: string }[] = []

        for (const entry of batchUrls) {
            try {
                await indexing.urlNotifications.publish({
                    requestBody: { url: entry.url, type: 'URL_UPDATED' },
                })
                successCount++
                successes.push(entry.url)
            } catch (error: any) {
                const errMsg = error.response?.data?.error?.message || error.message
                failCount++
                failures.push({ url: entry.url, error: errMsg })

                // Stop if quota is exceeded
                if (errMsg.includes('quota') || errMsg.includes('rate') || error.response?.status === 429) {
                    console.error('[Indexing Cron] Daily Google API quota exceeded. Stopping batch early.')
                    break
                }
            }
            // Small delay to protect rate limit (100 req per minute = ~600ms per request)
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS))
        }

        const nextOffset = currentOffset + successCount + failCount

        // 6. Record execution in system logs
        const { error: insertErr } = await adminSupabase
            .from('system_logs')
            .insert({
                tenant_id: tenant.id,
                action_type: 'GOOGLE_INDEXING',
                entity_type: 'System',
                status: 'Success',
                message: `Google Indexing Cron: Submitted ${successCount} successfully, ${failCount} failed.`,
                details: {
                    prev_offset: currentOffset,
                    next_offset: nextOffset,
                    submitted_count: successCount + failCount,
                    success_count: successCount,
                    fail_count: failCount,
                    total_urls: totalUrls,
                    successes,
                    failures
                }
            })

        if (insertErr) {
            console.error('[Indexing Cron] Failed to insert system log:', insertErr.message)
        }

        return NextResponse.json({
            success: true,
            message: `Batch complete: ${successCount} succeeded, ${failCount} failed.`,
            meta: {
                previous_offset: currentOffset,
                next_offset: nextOffset,
                total_urls: totalUrls,
                success_count: successCount,
                fail_count: failCount
            }
        })

    } catch (error: any) {
        console.error('[Indexing Cron] Server Error:', error.message)

        // Write error details to system logs
        try {
            const { data: tenant } = await adminSupabase
                .from('tenants')
                .select('id')
                .limit(1)
                .single()

            if (tenant) {
                await adminSupabase.from('system_logs').insert({
                    tenant_id: tenant.id,
                    action_type: 'GOOGLE_INDEXING',
                    entity_type: 'System',
                    status: 'Error',
                    message: `Google Indexing Cron Error: ${error.message}`,
                    details: {
                        error: error.message,
                        stack: error.stack
                    }
                })
            }
        } catch (logErr: any) {
            console.error('[Indexing Cron] Failed to log exception to system_logs:', logErr.message)
        }

        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    return GET(req)
}
