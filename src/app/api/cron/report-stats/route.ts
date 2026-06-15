import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

/**
 * REPORT STATS REFRESH CRON
 * 
 * Calls the Supabase refresh_report_daily_stats() function to update
 * today's and yesterday's aggregated report data.
 * 
 * Should be called every 5 minutes via:
 * - Vercel Cron
 * - External cron service (UptimeRobot, cron-job.org)
 * - Supabase pg_cron (if enabled)
 * 
 * GET /api/cron/report-stats
 */
export async function GET(req: NextRequest) {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const adminSupabase = createAdminClient()

        // Call the PostgreSQL function to refresh today & yesterday
        const { data, error } = await adminSupabase.rpc('refresh_report_daily_stats')

        if (error) {
            console.error('[Report Cron] Error:', error.message)
            return NextResponse.json({
                success: false,
                error: error.message,
            }, { status: 500 })
        }

        console.log(`[Report Cron] Refreshed ${data} day-tenant rows`)

        return NextResponse.json({
            success: true,
            refreshed_rows: data,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Report Cron] Error:', error.message)
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    return GET(req)
}
