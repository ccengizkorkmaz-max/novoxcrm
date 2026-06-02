import { NextRequest, NextResponse } from 'next/server'
import { processOutreachQueue } from '@/lib/outreach/engine'

// Allow up to 5 minutes for polling loop (wait → reconcile → new batch)
export const maxDuration = 300
/**
 * OUTREACH CRON JOB
 * 
 * Processes due outreach executions. Should be called every 5-10 minutes.
 * 
 * Setup: Vercel Cron, UptimeRobot, cron-job.org, or Supabase pg_cron
 * 
 * Security: Protected by CRON_SECRET header
 */
export async function GET(req: NextRequest) {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.OUTREACH_CRON_SECRET || process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        console.log('[Outreach Cron] Starting queue processing...')
        const result = await processOutreachQueue()
        console.log(`[Outreach Cron] Processed ${result.processed} executions, reason: ${result.reason || 'ok'}`)

        return NextResponse.json({
            success: true,
            processed: result.processed,
            reason: result.reason || 'ok',
            timestamp: new Date().toISOString(),
            v: '2026-06-02a',
        })
    } catch (error: any) {
        console.error('[Outreach Cron] Error:', error.message)
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 })
    }
}

// Also support POST for webhook-based cron services
export async function POST(req: NextRequest) {
    return GET(req)
}
