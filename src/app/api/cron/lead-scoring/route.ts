import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchScoreLeads } from '@/lib/outreach/ai-lead-scoring'

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all active tenants
    const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(20)

    if (!tenants || tenants.length === 0) {
        return NextResponse.json({ message: 'No tenants found' })
    }

    const results: Record<string, { scored: number; total: number }> = {}

    for (const tenant of tenants) {
        try {
            const result = await batchScoreLeads(tenant.id, 30)
            results[tenant.id] = result
        } catch (e: any) {
            console.error(`[Lead Scoring Cron] Tenant ${tenant.id} failed:`, e.message)
            results[tenant.id] = { scored: 0, total: 0 }
        }
    }

    return NextResponse.json({
        message: 'Lead scoring cron completed',
        results,
        timestamp: new Date().toISOString()
    })
}
