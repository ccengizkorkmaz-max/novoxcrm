import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveSegment, startWorkflowForLeads } from '@/lib/outreach/engine'

/**
 * OUTREACH DAILY CRON
 * 
 * Her gün çalışma saatlerinde aktif workflow'ları kontrol eder ve
 * henüz aranmamış lead'ler için yeni execution oluşturur.
 * 
 * Security: Protected by CRON_SECRET Authorization header
 * 
 * Vercel Cron: vercel.json'a ekle:
 * { "cron": "0 9,12,15 * * 1-5" }  // Her hafta içi 09:00, 12:00, 15:00
 */
export async function GET(req: NextRequest) {
    // Auth check — Authorization header (Vercel cron uyumlu)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.OUTREACH_CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date()
    const currentDay = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon...7=Sun
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    console.log(`[Cron] Outreach daily check: day=${currentDay}, time=${currentTime}`)

    // Get all active workflows with segments
    const { data: workflows } = await supabase
        .from('outreach_workflows')
        .select('id, name, segment_id, max_leads_per_day, working_hours_start, working_hours_end, working_days, tenant_id')
        .eq('is_active', true)
        .not('segment_id', 'is', null)

    if (!workflows || workflows.length === 0) {
        return NextResponse.json({ message: 'No active workflows', processed: 0 })
    }

    const results: any[] = []

    for (const wf of workflows) {
        try {
            // Check working day
            const workingDays = wf.working_days || [1, 2, 3, 4, 5]
            if (!workingDays.includes(currentDay)) {
                results.push({ workflow: wf.name, status: 'skipped', reason: 'Çalışma günü değil' })
                continue
            }

            // Check working hours
            const startTime = (wf.working_hours_start || '09:00').substring(0, 5)
            const endTime = (wf.working_hours_end || '19:00').substring(0, 5)
            if (currentTime < startTime || currentTime > endTime) {
                results.push({ workflow: wf.name, status: 'skipped', reason: `Çalışma saati dışı (${startTime}-${endTime})` })
                continue
            }

            // Check how many already processed today
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            
            const { count: todayCount } = await supabase
                .from('outreach_executions')
                .select('id', { count: 'exact', head: true })
                .eq('workflow_id', wf.id)
                .gte('started_at', todayStart.toISOString())

            const maxPerDay = wf.max_leads_per_day || 50
            const remaining = maxPerDay - (todayCount || 0)

            if (remaining <= 0) {
                results.push({ workflow: wf.name, status: 'skipped', reason: `Günlük limit dolu (${todayCount}/${maxPerDay})` })
                continue
            }

            // Resolve segment to get all matching lead IDs
            const allLeadIds = await resolveSegment(wf.segment_id!)

            if (allLeadIds.length === 0) {
                results.push({ workflow: wf.name, status: 'skipped', reason: 'Segmentte kayıt yok' })
                continue
            }

            // Exclude already processed leads (any status except 'failed')
            const isLqSource = allLeadIds.length > 0 && allLeadIds[0].startsWith('lq:')
            const isLeadsSource = allLeadIds.length > 0 && allLeadIds[0].startsWith('lead:')
            const matchIds = isLqSource 
                ? allLeadIds.map(id => id.replace('lq:', ''))
                : isLeadsSource
                ? allLeadIds.map(id => id.replace('lead:', ''))
                : allLeadIds

            const chunkArray = <T>(arr: T[], size: number): T[][] => {
                const chunks: T[][] = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            const chunks = chunkArray(matchIds, 150);
            const targetField = isLqSource ? 'customer_id' : isLeadsSource ? 'lead_id' : 'sale_id'
            const existingPromises = chunks.map(chunk => 
                supabase
                    .from('outreach_executions')
                    .select('customer_id, sale_id, lead_id')
                    .eq('workflow_id', wf.id)
                    .in('status', ['active', 'waiting', 'completed', 'converted'])
                    .in(targetField, chunk)
            );
            const dbResults = await Promise.all(existingPromises);
            const existingExecs = dbResults.flatMap(r => r.data || []);

            const processedIds = new Set(
                existingExecs.map(e => isLqSource ? e.customer_id : isLeadsSource ? e.lead_id : e.sale_id).filter(Boolean)
            );

            const newLeadIds = allLeadIds.filter(id => {
                const matchId = isLqSource ? id.replace('lq:', '') : isLeadsSource ? id.replace('lead:', '') : id
                return !processedIds.has(matchId)
            });

            if (newLeadIds.length === 0) {
                results.push({ workflow: wf.name, status: 'completed', reason: 'Tüm lead\'ler zaten işlendi' })
                continue
            }

            // Take only remaining daily quota
            const batch = newLeadIds.slice(0, remaining)

            // Start workflow for this batch
            const result = await startWorkflowForLeads(wf.id, batch, wf.tenant_id)

            results.push({
                workflow: wf.name,
                status: 'processed',
                started: result.started,
                skipped: result.skipped,
                totalRemaining: newLeadIds.length - batch.length,
            })

            console.log(`[Cron] ${wf.name}: ${result.started} yeni lead başlatıldı, ${newLeadIds.length - batch.length} kalan`)

        } catch (err: any) {
            console.error(`[Cron] ${wf.name} error:`, err.message)
            results.push({ workflow: wf.name, status: 'error', error: err.message })
        }
    }

    return NextResponse.json({
        timestamp: now.toISOString(),
        day: currentDay,
        time: currentTime,
        workflowsChecked: workflows.length,
        results,
    })
}
