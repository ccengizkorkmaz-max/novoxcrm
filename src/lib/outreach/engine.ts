'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { makeOutboundCall, getTurkishNameTitle, normalizeToE164 } from '@/lib/vapi'
import { sendWhatsAppTemplate, sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendPoliSms, normalizePhone } from '@/lib/sms'

// ─── Eşzamanlı Arama Limiti ────────────────────────────────
// Vapi planı: max 10 eş zamanlı arama. 2 slot gelen aramalar için ayrılmış.
const MAX_CONCURRENT_CALLS = Number(process.env.MAX_CONCURRENT_CALLS) || 8

// ─── Types ───────────────────────────────────────────────────

export interface StepConfig {
    // AI Call
    script_id?: string
    script_prompt?: string
    first_message?: string
    max_duration_seconds?: number
    retry?: {
        enabled: boolean;
        interval_minutes: number;
        max_attempts: number;
        criteria?: {
            busy?: boolean;
            no_answer?: boolean;
            hung_up?: {
                enabled: boolean;
                max_seconds?: number;
            };
        };
    }
    time_window?: { start: string; end: string }
    // WhatsApp
    template_name?: string
    template_params?: string[]
    template_map?: Record<string, string>
    free_text?: string
    // SMS
    sms_template_key?: string
    custom_message?: string
    // Wait
    duration_value?: number
    duration_unit?: 'minutes' | 'hours' | 'days'
    specific_datetime?: string
    // Status Update
    new_status?: string
    add_tag?: string
    assign_to?: string
    add_note?: string
    // Notify
    notify_user_id?: string
    notify_message?: string
}

// ─── System Health & Early Warning ────────────────────────────

async function checkSystemHealth(tenantId: string): Promise<{ isHealthy: boolean; reason?: string }> {
    // Check ElevenLabs Quota
    const elApiKey = process.env.ELEVENLABS_API_KEY;
    if (elApiKey) {
        try {
            const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
                headers: { 'xi-api-key': elApiKey }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.character_count !== undefined && data.character_limit !== undefined) {
                    const ratio = data.character_limit > 0 ? data.character_count / data.character_limit : 0;
                    if (ratio >= 0.99) {
                        return { isHealthy: false, reason: `INSUFFICIENT_FUNDS: ElevenLabs character limit reached (${data.character_count}/${data.character_limit})` };
                    }
                }
            }
        } catch (e) {
            console.error('[SystemHealth] ElevenLabs check failed:', e);
        }
    }
    return { isHealthy: true };
}

async function handleCriticalSystemFailure(tenantId: string, reason: string, workflowId?: string) {
    const supabase = createAdminClient();
    console.error(`[CRITICAL] System failure detected: ${reason}`);

    // Pause workflow
    if (workflowId) {
        await supabase.from('outreach_workflows').update({ is_active: false }).eq('id', workflowId);
    } else {
        // Pause all workflows for this tenant as a precaution
        await supabase.from('outreach_workflows').update({ is_active: false }).eq('tenant_id', tenantId);
    }

    // Create system notification
    const { createNotification } = await import('@/lib/notifications/create');
    await createNotification({
        tenant_id: tenantId,
        type: 'Alert',
        category: 'System',
        title: '🚨 DİKKAT: Yapay Zeka Servisi Durduruldu',
        message: `Kredi veya bakiye sorunu nedeniyle çağrılar durduruldu. Hata: ${reason}`,
        link: '/settings',
    });

    // Find admin user to send WA message
    const { data: admins } = await supabase.from('profiles').select('phone').eq('tenant_id', tenantId).in('role', ['admin', 'owner', 'crm_manager']).limit(1);
    if (admins && admins.length > 0 && admins[0].phone) {
        const adminPhone = admins[0].phone;
        await sendWhatsAppMessage(adminPhone, `⚠️ DİKKAT: Novo CRM Outreach sistemi kredi/bakiye yetersizliği sebebiyle durduruldu.\nDetay: ${reason.substring(0, 100)}\nLütfen panelden kontrol ediniz.`);
    }
}

// ─── Engine: Process Due Executions ──────────────────────────

/**
 * Main cron entry point — finds all executions whose next_action_at has passed
 * and processes the current step for each.
 */
export async function processOutreachQueue() {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // ─── Vapi Call Reconciliation (ALWAYS runs, even when locked) ──────
    // Sync calls that ended on Vapi's side but webhook was never received.
    // This runs BEFORE the lock check so stuck calls are always resolved.
    {
        const { data: stuckCalls } = await supabase
            .from('outreach_step_logs')
            .select('id, external_id, execution_id')
            .eq('status', 'sent')
            .is('completed_at', null)
            .eq('channel', 'ai_call')
            .limit(50)

        if (stuckCalls?.length) {
            const vapiApiKey = process.env.VAPI_API_KEY
            let synced = 0
            for (const log of stuckCalls) {
                if (!log.external_id || !vapiApiKey) continue
                try {
                    const res = await fetch(`https://api.vapi.ai/call/${log.external_id}`, {
                        headers: { 'Authorization': `Bearer ${vapiApiKey}` },
                    })
                    if (!res.ok) continue
                    const vapiCall = await res.json()
                    if (vapiCall.status === 'ended') {
                        // Get execution metadata for handleVapiCallResult
                        const { data: exec } = await supabase
                            .from('outreach_executions')
                            .select('metadata')
                            .eq('id', log.execution_id)
                            .single()

                        // Use the same handler as webhook — this creates timeline activities,
                        // transcripts, recordings, lead scoring, and retry/advance logic
                        await handleVapiCallResult({
                            callId: log.external_id,
                            status: vapiCall.status || 'ended',
                            endedReason: vapiCall.endedReason,
                            transcript: vapiCall.transcript || vapiCall.artifact?.transcript,
                            summary: vapiCall.summary || vapiCall.analysis?.summary || vapiCall.artifact?.summary,
                            recordingUrl: vapiCall.recordingUrl || vapiCall.artifact?.recordingUrl,
                            duration: vapiCall.duration,
                            cost: vapiCall.cost || vapiCall.costBreakdown?.total,
                            analysis: vapiCall.analysis,
                            metadata: { ...(exec?.metadata || {}), execution_id: log.execution_id },
                        })
                        synced++
                    }
                } catch (e: any) {
                    console.warn(`[Outreach] Reconciliation error for ${log.external_id}: ${e.message}`)
                }
            }
            if (synced > 0) {
                console.log(`[Outreach] Vapi reconciliation: ${synced}/${stuckCalls.length} aramanın durumu senkronize edildi (timeline + retry dahil)`)
            }
        }
    }

    // ─── Ghost Record Cleanup (ALWAYS runs, even when locked) ──────
    // Ghost records: status='failed' but completed_at is NULL
    // These are harmless but pollute the dashboard. Auto-fix by setting completed_at.
    {
        const { data: ghosts, error: ghostErr } = await supabase
            .from('outreach_step_logs')
            .update({ completed_at: now })
            .eq('status', 'failed')
            .is('completed_at', null)
            .select('id')

        if (!ghostErr && ghosts && ghosts.length > 0) {
            console.log(`[Outreach] 🧹 ${ghosts.length} hayalet kayıt otomatik temizlendi (failed + completed_at=null)`)
        }
    }

    // ─── Global Lock: Eşzamanlı cron çalışmalarını engelle ─────
    // Tenants tablosunda ilk tenant'ın ai_outreach_settings alanında lock tutuyoruz
    const LOCK_TIMEOUT_MS = 2 * 60 * 1000 // 2 dakika (cron 1dk'da bir, lock bundan uzun olmalı)
    const { data: lockTenant } = await supabase.from('tenants').select('id, ai_outreach_settings').limit(1).single()

    if (lockTenant) {
        const settings = lockTenant.ai_outreach_settings || {}
        const lockTime = settings.queue_lock_at ? new Date(settings.queue_lock_at).getTime() : 0
        const lockAgeMs = lockTime > 0 ? Date.now() - lockTime : 0
        const isLocked = lockTime > 0 && lockAgeMs < LOCK_TIMEOUT_MS

        if (isLocked) {
            console.log(`[Outreach] Kuyruk zaten işleniyor (lock: ${settings.queue_lock_at}, yaş: ${Math.round(lockAgeMs / 1000)}s). Atlanıyor.`)
            return { processed: 0, reason: 'already_processing' }
        }

        // Stale lock kurtarma: 3+ dakikalık eski lock'u otomatik temizle ve devam et
        if (lockTime > 0 && lockAgeMs >= LOCK_TIMEOUT_MS) {
            console.warn(`[Outreach] ⚠️ Stale lock tespit edildi (${Math.round(lockAgeMs / 1000)}s eski). Otomatik kurtarma — kilit açılıp devam ediliyor.`)
        }

        // Lock al
        await supabase.from('tenants').update({
            ai_outreach_settings: { ...settings, queue_lock_at: now }
        }).eq('id', lockTenant.id)
    }

    // Lock temizleme helper — ALWAYS releases, even on error
    const releaseLock = async () => {
        try {
            if (lockTenant) {
                const { data: latest } = await supabase.from('tenants').select('ai_outreach_settings').eq('id', lockTenant.id).single()
                const settings = latest?.ai_outreach_settings || {}
                await supabase.from('tenants').update({
                    ai_outreach_settings: { ...settings, queue_lock_at: null }
                }).eq('id', lockTenant.id)
            }
        } catch (releaseErr: any) {
            console.error('[Outreach] Lock release failed:', releaseErr.message)
        }
    }

    try {

        // 1. Get all active workflows
        const { data: activeWorkflows, error: wfErr } = await supabase
            .from('outreach_workflows')
            .select('id')
            .eq('is_active', true)

        if (wfErr) {
            console.error('[Outreach] Error fetching active workflows:', wfErr.message)
            return { processed: 0, reason: 'active_workflows_fetch_error' }
        }

        if (!activeWorkflows || activeWorkflows.length === 0) {
            console.log('[Outreach] No active workflows.')
            return { processed: 0 }
        }

        // 2. Fetch due executions per workflow
        let dueExecutions: any[] = []
        for (const wf of activeWorkflows) {
            const { data: wfExecs, error: execErr } = await supabase
                .from('outreach_executions')
                .select(`
                    *,
                    outreach_workflows!inner(
                        id, working_hours_start, working_hours_end, working_days, timezone, is_active, conversion_goal_status, batch_size, batch_interval_seconds, computed_params
                    ),
                    customers(id, full_name, phone, email, communication_enabled),
                    leads(id, full_name, phone, email, status, notes, assigned_to),
                    sales(id, status, project_id, unit_id)
                `)
                .eq('workflow_id', wf.id)
                .in('status', ['active', 'waiting'])
                .lte('next_action_at', now)
                .order('next_action_at', { ascending: true })
                .limit(100)

            if (execErr) {
                console.error(`[Outreach] Error fetching executions for workflow ${wf.id}:`, execErr.message)
                continue
            }

            if (wfExecs && wfExecs.length > 0) {
                dueExecutions = dueExecutions.concat(wfExecs)
            }
        }

        if (!dueExecutions.length) {
            console.log('[Outreach] No due executions across all active workflows.')
            return { processed: 0 }
        }

        // ─── İki Aşamalı İşleme: Aramalar her zaman WA'dan ÖNCE ───
        // Adım 1 execution'ları (genelde ai_call) en önce, sonra diğerleri
        dueExecutions.sort((a: any, b: any) => {
            return (a.current_step_order || 0) - (b.current_step_order || 0)
        })



        // ─── Pessimistic Locking (Moved inside loop) ─────────
        // Batch locking here was removed to avoid locking records that are skipped or causing
        // concurrent runs to step on each other. We lock records atomically inside the loop instead.

        const tenantId = dueExecutions[0]?.tenant_id

        // ─── System Health Check (ElevenLabs vb.) ────────────
        if (tenantId) {
            const health = await checkSystemHealth(tenantId);
            if (!health.isHealthy) {
                await handleCriticalSystemFailure(tenantId, health.reason || 'Bilinmeyen sistem hatası');
                return { processed: 0, reason: 'system_health_failure' };
            }
        }

        // ─── Eşzamanlı arama limiti kontrolü ─────────────────
        // Get tenant-specific limit from first execution's tenant
        let maxConcurrent = MAX_CONCURRENT_CALLS
        if (tenantId) {
            const { data: tenantSettings } = await supabase
                .from('tenants')
                .select('ai_outreach_settings')
                .eq('id', tenantId)
                .single()
            maxConcurrent = tenantSettings?.ai_outreach_settings?.max_concurrent_calls || MAX_CONCURRENT_CALLS
        }

        // Check Vapi's REAL remaining concurrent call slots via API
        // This is the source of truth — DB records can become stale if webhooks fail
        let availableSlots = maxConcurrent
        let vapiApiSucceeded = false
        try {
            const vapiApiKey = process.env.VAPI_API_KEY
            if (vapiApiKey) {
                const vapiRes = await fetch('https://api.vapi.ai/call', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${vapiApiKey}` },
                })
                if (vapiRes.ok) {
                    const vapiCalls = await vapiRes.json()
                    // Count calls that are still active on Vapi's side
                    const vapiActiveCalls = Array.isArray(vapiCalls)
                        ? vapiCalls.filter((c: any) => ['queued', 'ringing', 'in-progress'].includes(c.status)).length
                        : 0
                    const vapiSlots = maxConcurrent - vapiActiveCalls
                    console.log(`[Outreach] Vapi API: ${vapiActiveCalls} aktif arama, ${vapiSlots}/${maxConcurrent} slot müsait`)
                    availableSlots = Math.max(0, vapiSlots)
                    vapiApiSucceeded = true
                } else {
                    console.warn(`[Outreach] Vapi API check failed (${vapiRes.status}), falling back to DB check`)
                }
            }
        } catch (vapiErr: any) {
            console.warn(`[Outreach] Vapi API check error: ${vapiErr.message}, falling back to DB check`)
        }

        // Fallback: check DB for active calls ONLY if Vapi API check failed
        if (!vapiApiSucceeded) {
            const activeThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString()
            const { count: activeCalls } = await supabase
                .from('outreach_step_logs')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'sent')
                .is('completed_at', null)
                .eq('channel', 'ai_call')
                .gte('executed_at', activeThreshold)
            availableSlots = maxConcurrent - (activeCalls || 0)
        }

        // Also keep activeThreshold for per-iteration DB check inside the loop
        const activeThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString()

        if (availableSlots <= 0) {
            console.log(`[Outreach] Eşzamanlı arama limiti doldu (${maxConcurrent}). Aramalar ertelenecek, WA/SMS adımları devam edecek.`)
            // Return yapmıyoruz — WA/SMS adımları yine de işlenebilir.
            // Loop içindeki per-step slot kontrolü (L498-502) ai_call'ları zaten skip edecek.
        }

        console.log(`[Outreach] ${dueExecutions.length} bekleyen, ${availableSlots}/${maxConcurrent} slot müsait`)

        let processed = 0
        let initiatedCallsCount = 0
        let waProcessedCount = 0
        const MAX_WA_PER_BATCH = 20 // WA batch limiti — aramaları engellemesini önler

        // Track batch counts per workflow
        const workflowBatchCounts = new Map<string, number>()
        // Track customers already processed in this batch to prevent parallel calls
        const processedCustomerIds = new Set<string>()

        for (const execution of dueExecutions) {
            // Enforce per-workflow batch_size limit
            const wfId = execution.workflow_id
            const batchSize = execution.outreach_workflows?.computed_params?.optimal_batch_size
                || execution.outreach_workflows?.batch_size || 100
            const currentCount = workflowBatchCounts.get(wfId) || 0
            if (currentCount >= batchSize) continue

            // ─── Same-customer dedup guard ─────────────────────
            // Prevent processing multiple executions for the same customer/lead in this batch
            // (this happens when restart creates duplicate executions)
            const targetId = execution.customer_id || execution.lead_id
            if (targetId && processedCustomerIds.has(targetId)) {
                console.log(`[Outreach] Target ${targetId} already processed in this batch. Skipping execution ${execution.id}`)
                continue
            }

            // ─── Individual Pessimistic Locking ───────────────────
            // Lock this specific execution by updating its next_action_at.
            // It must still have next_action_at <= now, ensuring no concurrent worker has processed it.
            const lockTime = new Date(Date.now() + 2 * 60 * 1000).toISOString()
            const { data: lockedExec, error: lockErr } = await supabase
                .from('outreach_executions')
                .update({ next_action_at: lockTime })
                .eq('id', execution.id)
                .lte('next_action_at', now)
                .select('id')
                .maybeSingle()

            if (lockErr || !lockedExec) {
                console.log(`[Outreach] Execution ${execution.id} already locked by another runner. Skipping.`)
                continue
            }


            // Check workflow still active
            if (!execution.outreach_workflows?.is_active) {
                await supabase.from('outreach_executions')
                    .update({ status: 'paused', paused_at: now })
                    .eq('id', execution.id)
                continue
            }

            // Check working hours
            if (!isWithinWorkingHours(execution.outreach_workflows)) {
                // Reschedule to next working hour
                const nextWindow = getNextWorkingTime(execution.outreach_workflows)
                await supabase.from('outreach_executions')
                    .update({ next_action_at: nextWindow })
                    .eq('id', execution.id)
                continue
            }

            // Check opt-out
            const phone = execution.customers?.phone || execution.leads?.phone
            if (phone) {
                const { data: optout } = await supabase
                    .from('outreach_optouts')
                    .select('id')
                    .eq('phone', normalizePhone(phone))
                    .in('channel', ['all'])
                    .limit(1)

                if (optout?.length) {
                    await supabase.from('outreach_executions')
                        .update({ status: 'opted_out', completed_at: now })
                        .eq('id', execution.id)
                    continue
                }
            }

            // Check customer communication toggle
            if (execution.customers && execution.customers.communication_enabled === false) {
                console.log(`[Outreach] ⛔ Customer ${execution.customer_id} communication disabled. Skipping execution ${execution.id}`)
                await supabase.from('outreach_executions')
                    .update({ status: 'opted_out', completed_at: now, metadata: { ...execution.metadata, reason: 'communication_disabled' } })
                    .eq('id', execution.id)
                continue
            }

            // Get current step
            const { data: step } = await supabase
                .from('outreach_steps')
                .select('*')
                .eq('workflow_id', execution.workflow_id)
                .eq('step_order', execution.current_step_order)
                .single()

            if (!step) {
                // No more steps → mark completed
                await supabase.from('outreach_executions')
                    .update({ status: 'completed', completed_at: now })
                    .eq('id', execution.id)
                continue
            }

            // ─── WA Batch Limiti ─────────────────────────────
            // Her cron çalışmasında max 20 WA. Aramalar sınırsız.
            if ((step.action_type === 'whatsapp' || step.action_type === 'sms') && waProcessedCount >= MAX_WA_PER_BATCH) {
                // WA limiti doldu — execution'ı unlock et, sonraki cron'a bırak
                await supabase.from('outreach_executions')
                    .update({ next_action_at: new Date(Date.now() + 60 * 1000).toISOString() })
                    .eq('id', execution.id)
                continue
            }

            // Handle webhook timeout for executions stuck in 'waiting' status
            if (execution.status === 'waiting') {
                console.log(`[Outreach] Execution ${execution.id} timed out waiting for webhook. Handling timeout...`)
                const pendingCallId = execution.metadata?.pending_call_id
                if (pendingCallId) {
                    const { data: logEntry } = await supabase
                        .from('outreach_step_logs')
                        .select('*')
                        .eq('execution_id', execution.id)
                        .eq('external_id', pendingCallId)
                        .maybeSingle()

                    if (logEntry && !logEntry.completed_at) {
                        await supabase.from('outreach_step_logs')
                            .update({
                                status: 'failed',
                                completed_at: now,
                                error_message: 'Webhook timeout (10 minutes passed)',
                                call_outcome: 'no_answer'
                            })
                            .eq('id', logEntry.id)
                    }
                }
                await handleRetryOrAdvance(execution, step, step.config || {}, 'no_answer')
                continue
            }

            // Check conversion goal
            if (execution.outreach_workflows?.conversion_goal_status === execution.sales?.status) {
                await supabase.from('outreach_executions')
                    .update({ status: 'completed', completed_at: now, metadata: { ...execution.metadata, goal_reached: true } })
                    .eq('id', execution.id)
                continue
            }

            // Prevent timeout by limiting max processed items per cron run
            if (processed >= 100) {
                console.log('[Outreach] Maksimum işlem limitine ulaşıldı (100), kalanlar sonraki dakikada işlenecek.')
                break
            }

            // Execute the step
            try {
                // Eşzamanlı limit kontrolü — her arama öncesi tekrar kontrol et
                if (step.action_type === 'ai_call') {
                    if (initiatedCallsCount >= availableSlots) {
                        console.log(`[Outreach] Bu tetiklemede başlatılabilecek maksimum arama limitine ulaşıldı (${availableSlots}), yeni aramalar erteleniyor.`)
                        continue
                    }
                    const { count: currentCalls } = await supabase
                        .from('outreach_step_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'sent')
                        .is('completed_at', null)
                        .eq('channel', 'ai_call')
                        .gte('executed_at', activeThreshold)
                    if ((currentCalls || 0) >= maxConcurrent) {
                        console.log(`[Outreach] Slot dolu, ${execution.id} erteleniyor`)
                        continue
                    }

                    // ─── Same-phone active call guard ─────────────────
                    // Check if there's already an active call to this phone number
                    const customerPhone = execution.customers?.phone || execution.leads?.phone
                    if (customerPhone) {
                        const { count: activeCallsToPhone } = await supabase
                            .from('outreach_step_logs')
                            .select('id', { count: 'exact', head: true })
                            .eq('status', 'sent')
                            .is('completed_at', null)
                            .eq('channel', 'ai_call')
                            .eq('execution_id', execution.id)
                        
                        // Check via customer_id or lead_id across all executions
                        const targetId = execution.customer_id || execution.lead_id
                        if (targetId) {
                            const targetKey = execution.customer_id ? 'customer_id' : 'lead_id'
                            const { data: activeExecsForCustomer } = await supabase
                                .from('outreach_step_logs')
                                .select(`id, outreach_executions!inner(${targetKey})`)
                                .eq(`outreach_executions.${targetKey}`, targetId)
                                .eq('status', 'sent')
                                .is('completed_at', null)
                                .eq('channel', 'ai_call')
                                .limit(1)
                            if (activeExecsForCustomer && activeExecsForCustomer.length > 0) {
                                console.log(`[Outreach] Target ${targetId} already has an active call. Skipping.`)
                                // Unlock: reset next_action_at to 2 minutes from now
                                await supabase.from('outreach_executions')
                                    .update({ next_action_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() })
                                    .eq('id', execution.id)
                                continue
                            }
                        }
                    }

                    // Aramalar arası gecikme — Vapi rate limit'i aşmamak için
                    if (processed > 0) await new Promise(r => setTimeout(r, 3000))
                }
                await executeStep(execution, step)
                processed++
                if (step.action_type === 'ai_call') {
                    initiatedCallsCount++
                }
                if (step.action_type === 'whatsapp' || step.action_type === 'sms') {
                    waProcessedCount++
                }
                const targetId = execution.customer_id || execution.lead_id
                if (targetId) processedCustomerIds.add(targetId)
                workflowBatchCounts.set(wfId, (workflowBatchCounts.get(wfId) || 0) + 1)
            } catch (err: any) {
                console.error(`[Outreach] Step execution error for ${execution.id}:`, err.message)
                // Log the error
                await supabase.from('outreach_step_logs').insert({
                    execution_id: execution.id,
                    step_id: step.id,
                    channel: step.action_type,
                    status: 'failed',
                    error_message: err.message,
                })

                // Critical failure check
                if (err.message.includes('INSUFFICIENT_FUNDS')) {
                    await handleCriticalSystemFailure(execution.tenant_id, err.message, execution.workflow_id);
                    return { processed, reason: 'critical_system_failure' };
                }
            }
        }

        // ─── Post-batch polling: DEVRE DIŞI ─────────────────────────────
        // Webhooklar + cron başı reconciliation yeterli. Polling kaldırıldı.
        // 40sn gereksiz bekleme vardı, bu süre kurtarıldı.
        const MAX_POLL_ROUNDS = 0 // Devre dışı — webhook-first yaklaşım
        const POLL_WAIT_MS = 20_000 // Kullanılmıyor ama referans için
        const vapiKeyForPoll = process.env.VAPI_API_KEY

        for (let round = 1; round <= MAX_POLL_ROUNDS && initiatedCallsCount > 0; round++) {
            console.log(`[Outreach] Polling round ${round}/${MAX_POLL_ROUNDS}: ${POLL_WAIT_MS / 1000}s bekleniyor...`)
            await new Promise(r => setTimeout(r, POLL_WAIT_MS))

            // Extend lock so other cron instances don't interfere
            if (tenantId) {
                const extendedLock = new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString()
                const { data: currentTenant } = await supabase.from('tenants')
                    .select('ai_outreach_settings')
                    .eq('id', tenantId)
                    .single()
                await supabase.from('tenants')
                    .update({ ai_outreach_settings: { ...currentTenant?.ai_outreach_settings, queue_lock_at: extendedLock } })
                    .eq('id', tenantId)
            }

            // Reconcile: check Vapi for ended calls
            let reconciledCount = 0
            if (vapiKeyForPoll) {
                const { data: pendingLogs } = await supabase
                    .from('outreach_step_logs')
                    .select('id, external_id, execution_id')
                    .eq('status', 'sent')
                    .is('completed_at', null)
                    .eq('channel', 'ai_call')
                    .limit(50)

                if (pendingLogs?.length) {
                    for (const log of pendingLogs) {
                        if (!log.external_id) continue
                        try {
                            const res = await fetch(`https://api.vapi.ai/call/${log.external_id}`, {
                                headers: { 'Authorization': `Bearer ${vapiKeyForPoll}` },
                            })
                            if (!res.ok) continue
                            const vapiCall = await res.json()
                            if (vapiCall.status === 'ended') {
                                const { data: exec } = await supabase
                                    .from('outreach_executions')
                                    .select('metadata')
                                    .eq('id', log.execution_id)
                                    .single()

                                await handleVapiCallResult({
                                    callId: log.external_id,
                                    status: 'ended',
                                    endedReason: vapiCall.endedReason,
                                    transcript: vapiCall.transcript || vapiCall.artifact?.transcript,
                                    summary: vapiCall.summary || vapiCall.analysis?.summary || vapiCall.artifact?.summary,
                                    recordingUrl: vapiCall.recordingUrl || vapiCall.artifact?.recordingUrl,
                                    duration: vapiCall.duration,
                                    cost: vapiCall.cost || vapiCall.costBreakdown?.total,
                                    analysis: vapiCall.analysis,
                                    metadata: { ...(exec?.metadata || {}), execution_id: log.execution_id },
                                })
                                reconciledCount++
                            }
                        } catch (e: any) {
                            console.warn(`[Outreach] Poll reconcile error: ${e.message}`)
                        }
                    }
                }
            }

            if (reconciledCount === 0) {
                console.log(`[Outreach] Polling round ${round}: hiçbir arama bitmemiş, döngü sonlandırılıyor`)
                break
            }

            console.log(`[Outreach] Polling round ${round}: ${reconciledCount} arama senkronize edildi, yeni batch başlatılıyor...`)

            // Re-query available slots from Vapi
            let newSlots = maxConcurrent
            try {
                const vapiRes = await fetch('https://api.vapi.ai/call', {
                    headers: { 'Authorization': `Bearer ${vapiKeyForPoll}` },
                })
                if (vapiRes.ok) {
                    const vapiCalls = await vapiRes.json()
                    const active = Array.isArray(vapiCalls)
                        ? vapiCalls.filter((c: any) => ['queued', 'ringing', 'in-progress'].includes(c.status)).length
                        : 0
                    newSlots = Math.max(0, maxConcurrent - active)
                }
            } catch { }

            if (newSlots <= 0) continue

            // Fetch next batch of due executions
            const newNow = new Date().toISOString()
            const { data: nextBatch } = await supabase
                .from('outreach_executions')
                .select(`
                id, workflow_id, customer_id, sale_id, lead_id, current_step_order, current_retry_count,
                status, metadata, tenant_id, next_action_at,
                outreach_workflows!inner(
                    id, working_hours_start, working_hours_end, working_days, timezone, is_active, conversion_goal_status, batch_size, batch_interval_seconds, computed_params
                ),
                customers(id, full_name, phone, email, communication_enabled),
                leads(id, full_name, phone, email, status, notes, assigned_to),
                sales(id, status, project_id, unit_id)
            `)
                .in('status', ['active', 'waiting'])
                .lte('next_action_at', newNow)
                .order('next_action_at', { ascending: true })
                .limit(newSlots)

            if (!nextBatch?.length) {
                console.log(`[Outreach] Polling round ${round}: yeni bekleyen execution yok`)
                break
            }

            let batchProcessed = 0
            for (const execution of nextBatch) {
                if (batchProcessed >= newSlots) break
                if (!(execution.outreach_workflows as any)?.is_active) continue

                const phone = (execution.customers as any)?.phone || (execution.leads as any)?.phone
                if (!phone) continue

                const { data: step } = await supabase
                    .from('outreach_steps')
                    .select('*')
                    .eq('workflow_id', execution.workflow_id)
                    .eq('step_order', execution.current_step_order)
                    .single()

                if (!step) continue
                if (step.action_type !== 'ai_call') continue

                try {
                    if (batchProcessed > 0) await new Promise(r => setTimeout(r, 3000))
                    await executeStep(execution, step)
                    batchProcessed++
                    processed++
                    initiatedCallsCount++
                } catch (err: any) {
                    console.error(`[Outreach] Poll batch error for ${execution.id}: ${err.message}`)
                }
            }
            console.log(`[Outreach] Polling round ${round}: ${batchProcessed} yeni arama başlatıldı (toplam: ${processed})`)
        }

        return { processed }

    } catch (outerError: any) {
        console.error('[Outreach] processOutreachQueue beklenmeyen hata:', outerError.message)
        return { processed: 0, reason: 'unexpected_error' }
    } finally {
        // ALWAYS release lock, even on unexpected errors, timeouts, or crashes
        await releaseLock()
    }
}

// ─── Step Executor ───────────────────────────────────────────

async function executeStep(execution: any, step: any) {
    const supabase = createAdminClient()
    const config: StepConfig = step.config || {}
    const customer = execution.customers || execution.leads
    const phone = customer?.phone

    switch (step.action_type) {
        case 'ai_call':
            await executeAiCall(execution, step, config, phone, customer)
            break
        case 'whatsapp':
            await executeWhatsApp(execution, step, config, phone, customer)
            break
        case 'sms':
            await executeSms(execution, step, config, phone, customer)
            break
        case 'wait':
            await executeWait(execution, step, config)
            break
        case 'status_update':
            await executeStatusUpdate(execution, step, config)
            break
        case 'notify':
            await executeNotify(execution, step, config)
            break
        case 'condition':
            await executeCondition(execution, step, config)
            break
        case 'ai_personalize':
            await executeAiPersonalize(execution, step, config)
            break
        default:
            await advanceToNextStep(execution, step, 'success')
    }
}

// ─── Channel Executors ───────────────────────────────────────

/**
 * Müşteri isminin sesli aramada telaffuz edilebilir olup olmadığını kontrol eder.
 * Sosyal medya kaynaklı leadlerde kullanıcı adları (ör: tknbzy48, MetinNKılıçeR MetinNKılıçeR)
 * AI tarafından anlamsız okunuyordu. Bu filtre ile geçersiz isimler tespit edilir.
 */
function isValidTurkishName(name: string | undefined | null): boolean {
    if (!name || name.trim().length === 0) return false;
    const trimmed = name.trim();
    // Rakam veya özel karakter içeriyorsa geçersiz (sosyal medya kullanıcı adı)
    if (/[0-9_@#$%^&*(){}\[\]|\\<>]/.test(trimmed)) return false;
    // 3 karakterden kısa isim geçersiz
    if (trimmed.length < 3) return false;
    // 50 karakterden uzun isim geçersiz
    if (trimmed.length > 50) return false;
    // Tekrar eden isim: "MetinNKılıçeR MetinNKılıçeR"
    const words = trimmed.split(/\s+/);
    if (words.length === 2 && words[0].toLowerCase() === words[1].toLowerCase()) return false;
    // Sadece ünsüzlerden oluşan anlamsız diziler (ör: tknbzy, fzt)
    const vowelRatio = (trimmed.match(/[aeıioöuüAEIİOÖUÜ]/g) || []).length / trimmed.replace(/\s/g, '').length;
    if (vowelRatio < 0.15) return false;
    return true;
}

async function executeAiCall(execution: any, step: any, config: StepConfig, phone: string, customer: any) {
    const supabase = createAdminClient()

    if (!phone) {
        await logAndAdvance(execution, step, 'skipped', 'ai_call', 'No phone number')
        return
    }

    // ─── AI Call Guard: Aktif arama devam ediyorsa tekrar arama başlatma ───
    // NOT: Bu guard retry'ları ENGELLEMEMELİ. Retry'lar aynı step'te tekrar arama
    // yapar — webhook gelince execution 'active'e döner ve guard geçer.
    // Sadece "execution waiting + henüz webhook gelmemiş" durumunu engeller.
    if (execution.status === 'waiting' && execution.metadata?.pending_call_id) {
        console.log(`[Outreach] ⛔ AI Call guard: Execution ${execution.id} zaten aktif arama bekliyor (${execution.metadata.pending_call_id}). Atlanıyor.`)
        return
    }

    // Normalize & validate phone
    let cleanPhone = normalizeToE164(phone)
    // E.164: max 15 digits including country code
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 16 || cleanPhone.includes('ifempty')) {
        await logAndAdvance(execution, step, 'skipped', 'ai_call', `Geçersiz telefon: ${phone}`)
        return
    }

    // Check channel-specific opt-out
    const { data: optout } = await supabase
        .from('outreach_optouts')
        .select('id')
        .eq('phone', normalizePhone(phone))
        .in('channel', ['ai_call', 'all'])
        .limit(1)

    if (optout?.length) {
        await logAndAdvance(execution, step, 'opted_out', 'ai_call')
        return
    }

    // Fetch script prompt from DB if script_id is set
    let scriptPrompt: string | undefined
    if (config.script_id && config.script_id !== 'default') {
        const { data: script } = await supabase
            .from('outreach_scripts')
            .select('prompt')
            .eq('id', config.script_id)
            .single()
        if (script?.prompt) {
            // Replace variables in the prompt
            scriptPrompt = script.prompt
                .replace(/\{customer_name\}/g, customer?.full_name || 'Müşteri')
                .replace(/\{project_name\}/g, execution.sales?.projects?.name || 'projemiz')
        }
    }

    const nameWithTitle = getTurkishNameTitle(customer?.full_name);
    const isOikosTenant = execution.tenant_id === '3de3c038-8ce7-44b1-b5ba-8b99d63301f4'
    const brandName = isOikosTenant ? 'Oikos' : 'Novo İnşaat'

    // Resolve Oikos-specific default prompt if no script prompt is fetched
    if (isOikosTenant && !scriptPrompt) {
        scriptPrompt = `Sen Oikos Green Valley projesinin yapay zeka satış asistanı Maya'sın.
Müşterimiz {customer_name}, Bodrum Gümüşlük'te yer alan Oikos Green Valley lüks taş evler projemizle ilgileniyor.
Amacın, müşterinin ilgisini doğrulamak, kısaca projenin lansman fiyat avantajını (12 milyon liradan başlayan fiyatlar ve peşin ödemede yüzde yirmi indirim) belirtmek ve daha fazla detay için bir satış temsilcisinin onu aramasına veya WhatsApp'tan katalog göndermemize onay vermesini sağlamaktır.
Konuşurken kibar ve profesyonel ol. Kısa cümleler kur. Müşteri onay verirse aramayı nezaketle sonlandır ve endCall aracını çağır.`
    }

    if (scriptPrompt) {
        scriptPrompt = scriptPrompt
            .replace(/\{customer_name\}/g, customer?.full_name || 'Müşteri')
            .replace(/\{project_name\}/g, execution.sales?.projects?.name || (isOikosTenant ? 'Oikos Green Valley' : 'projemiz'))
    }

    const resolvedFirstMessage = execution.metadata?.personalized_message ||
        (nameWithTitle
            ? `Merhaba ${nameWithTitle}, ben Maya, ${brandName} AI satış asistanıyım. Nasılsınız?`
            : `Merhaba, ben Maya, ${brandName} AI satış asistanıyım. Nasılsınız?`);

    let result
    // Only simulate if it's Oikos tenant AND the phone is one of the seeded mock numbers starting with +9053211100
    const isOikosMockCall = isOikosTenant && cleanPhone.startsWith('+9053211100')

    if (isOikosMockCall) {
        // Simulate Vapi Outbound Call
        result = {
            success: true,
            callId: 'mock_call_' + Math.random().toString(36).substring(2, 11)
        }

        // Schedule simulated webhook response after 6 seconds
        const mockCallId = result.callId
        setTimeout(async () => {
            try {
                const customerName = customer?.full_name || 'Müşteri'
                const mockTranscript = `
Assistant: Merhaba ${nameWithTitle || 'efendim'}, ben Oikos AI satış asistanıyım. Oikos Green Valley projemiz için bıraktığınız talebe istinaden aramıştım. Nasılsınız?
User: Teşekkürler, iyiyim. Siz nasılsınız?
Assistant: Ben de iyiyim, teşekkürler. Projemiz Gümüşlük'te, doğayla iç içe lüks bir yaşam sunuyor. Lansmana özel peşin ödemede yüzde yirmi indirimimiz var. Uygunluğunuzu sormak istemiştim.
User: Evet, Bodrum'da bir yer bakıyordum aslında. WhatsApp'tan detayları gönderebilir misiniz?
Assistant: Elbette! Bu telefon numaranıza WhatsApp üzerinden projenin fiyat listesini ve detaylı kataloğunu hemen iletiyorum. Ayrıca bir satış temsilcimiz de sizinle iletişime geçecek. İyi günler dilerim!
User: Tamamdır, bekliyorum. Teşekkürler, iyi günler.
Assistant: Görüşmek üzere, iyi günler dilerim.
                `.trim()

                await handleVapiCallResult({
                    callId: mockCallId,
                    status: 'ended',
                    endedReason: 'assistant-ended-call',
                    transcript: mockTranscript,
                    summary: `${customerName} Oikos Green Valley projesiyle ilgileniyor. Lansmana özel %20 peşin indirimini sordu, detaylı katalog ve fiyat listesinin WhatsApp üzerinden gönderilmesini talep etti.`,
                    duration: 48,
                    cost: 0.12,
                    analysis: {
                        structuredData: {
                            interested: true,
                            available: true,
                            callback_requested: false
                        }
                    },
                    metadata: {
                        execution_id: execution.id,
                        sale_id: execution.sale_id,
                        customer_id: execution.customer_id,
                        lead_id: execution.lead_id,
                        customer_name: customer?.full_name,
                        tenant_id: execution.tenant_id
                    }
                })

                console.log(`[Outreach Demo] Simulated Vapi Call Completed for execution ${execution.id}`)

                // Immediately trigger queue process to run the next step (WhatsApp sending)
                processOutreachQueue().catch(err => console.error('[Outreach Demo] Failed to auto-trigger next step:', err.message))

            } catch (e: any) {
                console.error('[Outreach Demo] Failed to simulate Vapi callback:', e.message)
            }
        }, 6000)
    } else {
        result = await makeOutboundCall({
            phoneNumber: cleanPhone,
            // Always use the default Vapi assistant, override with script prompt
            systemPrompt: scriptPrompt,
            firstMessage: resolvedFirstMessage,
            metadata: {
                execution_id: execution.id,
                sale_id: execution.sale_id,
                customer_id: execution.customer_id,
                lead_id: execution.lead_id,
                customer_name: customer?.full_name,
                tenant_id: execution.tenant_id,
            },
        })
    }

    // Log the attempt
    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        attempt_number: (execution.current_retry_count || 0) + 1,
        channel: 'ai_call',
        status: result.success ? 'sent' : 'failed',
        external_id: result.callId,
        error_message: result.error,
    })

    if (result.success) {
        console.log(`[Outreach] ✅ Arama başlatıldı: ${execution.customer_id} (${customer?.full_name}) → callId: ${result.callId}`)
        // Call initiated — wait for webhook to report result
        // Set execution to 'waiting' state with a 10-minute timeout
        const timeoutAt = new Date()
        timeoutAt.setMinutes(timeoutAt.getMinutes() + 10)

        await supabase.from('outreach_executions')
            .update({
                status: 'waiting',
                current_step_id: step.id,
                next_action_at: timeoutAt.toISOString(),
                metadata: {
                    ...execution.metadata,
                    pending_call_id: result.callId,
                },
            })
            .eq('id', execution.id)
    } else {
        console.error(`[Outreach] ❌ Arama başlatılamadı: ${execution.customer_id} (${customer?.full_name}) — Hata: ${result.error}`)
        // Critical failure check
        if (result.error && result.error.includes('INSUFFICIENT_FUNDS')) {
            throw new Error(`Critical System Failure: ${result.error}`);
        }
        // Vapi concurrency limit — erteleme yap, fail sayma
        if (result.error && (result.error.includes('concurrency') || result.error.includes('Concurrency'))) {
            console.log(`[Outreach] Vapi concurrency limit. ${execution.id} 2dk sonraya erteleniyor.`)
            await supabase.from('outreach_executions')
                .update({ next_action_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() })
                .eq('id', execution.id)
            return
        }
        // Call failed — check retry logic
        await handleRetryOrAdvance(execution, step, config, 'no_answer')
    }
}

async function executeWhatsApp(execution: any, step: any, config: StepConfig, phone: string, customer: any) {
    const supabase = createAdminClient()

    if (!phone) {
        await logAndAdvance(execution, step, 'skipped', 'whatsapp', 'No phone number')
        return
    }

    // ─── Step-Level Idempotency: Bu adım zaten başarıyla gönderilmiş mi? ───
    // Aynı execution + aynı step için 'sent' kaydı varsa tekrar gönderme
    const { count: alreadySentWA } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .eq('execution_id', execution.id)
        .eq('step_id', step.id)
        .eq('channel', 'whatsapp')
        .eq('status', 'sent')
    if (alreadySentWA && alreadySentWA > 0) {
        console.log(`[Outreach] ⛔ Step idempotency: Execution ${execution.id} step ${step.id} WA zaten başarıyla gönderilmiş. Atlanıyor.`)
        await advanceToNextStep(execution, step, 'success')
        return
    }

    // ─── Mükerrer WA Koruması (24 saat) ─────────────────────
    // Aynı müşteriye/adaye aynı şablonla son 24 saatte mesaj gitmişse ATLA
    // Activities tablosundan kontrol — execution sayısından bağımsız, slice(0,200) boşluğu yok
    const templateName24h = config.template_name || ''
    if (templateName24h && (execution.customer_id || execution.lead_id)) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        let query = supabase
            .from('activities')
            .select('id', { count: 'exact', head: true })
            .eq('type', 'Whatsapp')
            .ilike('description', `%${templateName24h}%`)
            .gte('created_at', twentyFourHoursAgo)
        if (execution.customer_id) {
            query = query.eq('customer_id', execution.customer_id)
        } else {
            query = query.eq('lead_id', execution.lead_id)
        }
        const { count: recentWA } = await query
        if (recentWA && recentWA > 0) {
            console.log(`[Outreach] ⛔ WA mükerrer koruma (24 saat): ${execution.customer_id || execution.lead_id} son 24 saatte zaten gönderilmiş. Atlanıyor.`)
            await advanceToNextStep(execution, step, 'success')
            return
        }
    }

    // ─── WA Template Circuit Breaker ─────────────────────────
    // Son 30 dakikada aynı workflow'ta 3+ ardışık template hatası varsa,
    // tüm WA gönderimlerini atla (Meta şablonu dondurmuş olabilir)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { count: recentFails } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'whatsapp')
        .eq('status', 'failed')
        .gte('executed_at', thirtyMinsAgo)
        .ilike('error_message', '%132015%')

    if (recentFails && recentFails >= 3) {
        console.warn(`[Outreach] 🚫 WA Circuit Breaker AÇIK: Son 30dk'da ${recentFails} template hatası. Şablon dondurulmuş olabilir. Gönderim atlanıyor.`)
        await logAndAdvance(execution, step, 'skipped', 'whatsapp', `Circuit breaker: WA template dondurulmuş (${recentFails} hata/30dk)`)
        return
    }

    let result: { success: boolean; error?: string; data?: any }
    let messageContent: string = ''

    const isOikosTenant = execution.tenant_id === '3de3c038-8ce7-44b1-b5ba-8b99d63301f4'
    const isOikosMockCall = isOikosTenant && phone.replace(/[^0-9+]/g, '').startsWith('+9053211100')

    if (config.template_name || config.template_map) {
        // Resolve template name — either static or project-based mapping
        let templateName = config.template_name || ''
        if (config.template_map) {
            let projectName = ''
            if (execution.customer_id) {
                // Fetch lead's project from lead_qualifications
                const { data: lq } = await supabase
                    .from('lead_qualifications')
                    .select('projects(name)')
                    .eq('customer_id', execution.customer_id)
                    .order('id', { ascending: false })
                    .limit(1)
                    .single()
                projectName = (lq as any)?.projects?.name || ''
            }
            templateName = config.template_map[projectName] || config.template_map['_default'] || config.template_name || ''
            console.log(`[Outreach] Template map: project="${projectName}" → template="${templateName}"`)
        }

        // If Oikos tenant and placing a real call, fallback to Novo's approved template to prevent Meta errors
        if (isOikosTenant && !isOikosMockCall) {
            templateName = 'novo_kampanya_genel_v2'
        }

        // Send template message (for messages outside 24h window)
        const params = (config.template_params || []).map((p: string) =>
            p.replace('{customer_name}', customer?.full_name || 'Değerli Müşterimiz')
                .replace('{project_name}', isOikosTenant ? 'Oikos Green Valley' : (execution.metadata?.project_name || 'Novo Gayrimenkul'))
        )

        // Ensure we have correct parameter counts for the fallback template
        if (isOikosTenant && !isOikosMockCall && params.length < 2) {
            params[0] = customer?.full_name || 'Değerli Müşterimiz'
            params[1] = 'Oikos Green Valley'
        }

        if (isOikosMockCall) {
            result = { success: true, data: { messages: [{ id: 'mock_wa_' + Math.random().toString(36).substring(7) }] } }
        } else {
            result = await sendWhatsAppTemplate(phone, templateName, params)
        }
        messageContent = `Template: ${templateName} [${params.join(', ')}]`
    } else if (config.free_text) {
        // Send free-text message (only works within 24h window)
        let text = execution.metadata?.personalized_message || config.free_text
        text = text
            .replace('{customer_name}', customer?.full_name || '')
            .replace('{project_name}', isOikosTenant ? 'Oikos Green Valley' : (execution.metadata?.project_name || ''))
        if (isOikosMockCall) {
            result = { success: true, data: { messages: [{ id: 'mock_wa_' + Math.random().toString(36).substring(7) }] } }
        } else {
            result = await sendWhatsAppMessage(phone, text)
        }
        messageContent = text
    } else {
        await logAndAdvance(execution, step, 'skipped', 'whatsapp', 'No template or text configured')
        return
    }

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel: 'whatsapp',
        status: result.success ? 'sent' : 'failed',
        message_content: messageContent,
        template_name: config.template_name,
        error_message: result.error,
        external_id: result.data?.messages?.[0]?.id,
    })

    if (result.success) {
        if (execution.customer_id) {
            await touchSaleTimestamp(execution.sale_id)
        } else {
            await touchLeadTimestamp(execution.lead_id)
        }

        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            lead_id: execution.lead_id,
            type: 'Whatsapp',
            topic: 'Sales',
            summary: `💬 WhatsApp Mesajı Gönderildi (${config.template_name || 'Serbest Metin'})`,
            description: messageContent,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: 'Medium',
        })

        await advanceToNextStep(execution, step, 'success')
    } else {
        // ─── WA Template/System hatası → hemen retry yerine 30dk sonraya ertele ───
        // Bu sayede WA hataları akışı/kuyruğu engellemez
        const isTemplateError = result.error?.includes('132015') || result.error?.includes('paused') || result.error?.includes('temporarily unavailable')
        const waRetryCount = execution.metadata?.wa_retry_count || 0
        const MAX_WA_RETRIES = 3

        if (isTemplateError && waRetryCount < MAX_WA_RETRIES) {
            // Şablon hatası → 30 dk sonra tekrar dene (kuyruğu bloklamadan)
            const retryAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
            await supabase.from('outreach_executions')
                .update({
                    next_action_at: retryAt,
                    metadata: { ...execution.metadata, wa_retry_count: waRetryCount + 1, last_wa_error: result.error }
                })
                .eq('id', execution.id)
            console.log(`[Outreach] WA template hatası, ${waRetryCount + 1}/${MAX_WA_RETRIES} deneme. 30dk sonra tekrar denenecek: ${execution.id}`)
        } else if (isTemplateError && waRetryCount >= MAX_WA_RETRIES) {
            // Max WA retry aşıldı → bu adımı atla, sonrakine geç
            console.log(`[Outreach] WA max retry aşıldı (${MAX_WA_RETRIES}), adım atlanıyor: ${execution.id}`)
            await advanceToNextStep(execution, step, 'failure')
        } else {
            // Diğer hatalar (telefon yok vb.) → normal retry/advance mantığı
            await handleRetryOrAdvance(execution, step, config, 'failure')
        }
    }
}

async function executeSms(execution: any, step: any, config: StepConfig, phone: string, customer: any) {
    const supabase = createAdminClient()

    if (!phone) {
        await logAndAdvance(execution, step, 'skipped', 'sms', 'No phone number')
        return
    }

    // ─── Step-Level Idempotency: Bu adım zaten başarıyla gönderilmiş mi? ───
    const { count: alreadySentSMS } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .eq('execution_id', execution.id)
        .eq('step_id', step.id)
        .eq('channel', 'sms')
        .eq('status', 'sent')
    if (alreadySentSMS && alreadySentSMS > 0) {
        console.log(`[Outreach] ⛔ Step idempotency: Execution ${execution.id} step ${step.id} SMS zaten başarıyla gönderilmiş. Atlanıyor.`)
        await advanceToNextStep(execution, step, 'success')
        return
    }

    const message = (execution.metadata?.personalized_message || config.custom_message || SMS_TEMPLATES[config.sms_template_key || 'default'] || '')
        .replace('{customer_name}', customer?.full_name || 'Sayın Müşterimiz')
        .replace('{project_name}', execution.metadata?.project_name || '')

    if (!message) {
        await logAndAdvance(execution, step, 'skipped', 'sms', 'No message configured')
        return
    }

    let result
    const isOikosDemo = execution.tenant_id === '3de3c038-8ce7-44b1-b5ba-8b99d63301f4'

    if (isOikosDemo) {
        result = { success: true, messageId: 'mock_sms_' + Math.random().toString(36).substring(7) }
    } else {
        // Get tenant's SMS credentials
        const { data: tenant } = await supabase
            .from('tenants')
            .select('sms_api_user, sms_api_password, sms_sender_id')
            .eq('id', execution.tenant_id)
            .single()

        const smsUser = tenant?.sms_api_user || process.env.POLI_SMS_USER
        const smsPass = tenant?.sms_api_password || process.env.POLI_SMS_PASS

        if (!smsUser || !smsPass) {
            await logAndAdvance(execution, step, 'skipped', 'sms', 'Tenant SMS credentials missing')
            return
        }

        result = await sendPoliSms({
            user: smsUser,
            pass: smsPass,
            message,
            contacts: [phone],
            header: tenant?.sms_sender_id || process.env.POLI_SMS_HEADER || 'NOVOEMLAK',
        })
    }

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel: 'sms',
        status: result.success ? 'sent' : 'failed',
        message_content: message,
        error_message: result.error,
        external_id: result.messageId,
    })

    if (result.success) {
        if (execution.customer_id) {
            await touchSaleTimestamp(execution.sale_id)
        } else {
            await touchLeadTimestamp(execution.lead_id)
        }
    }
    await advanceToNextStep(execution, step, result.success ? 'success' : 'failure')
}

async function executeWait(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()

    let nextActionAt: Date

    if (config.specific_datetime) {
        nextActionAt = new Date(config.specific_datetime)
    } else {
        const value = config.duration_value || 1
        const unit = config.duration_unit || 'hours'
        nextActionAt = new Date()

        switch (unit) {
            case 'minutes': nextActionAt.setMinutes(nextActionAt.getMinutes() + value); break
            case 'hours': nextActionAt.setHours(nextActionAt.getHours() + value); break
            case 'days': nextActionAt.setDate(nextActionAt.getDate() + value); break
        }
    }

    // Move to next step but schedule it for later
    const nextOrder = step.step_order + 1
    const { data: nextStep } = await supabase
        .from('outreach_steps')
        .select('id')
        .eq('workflow_id', execution.workflow_id)
        .eq('step_order', nextOrder)
        .single()

    await supabase.from('outreach_executions')
        .update({
            current_step_order: nextOrder,
            current_step_id: nextStep?.id || null,
            next_action_at: nextActionAt.toISOString(),
            status: 'active',
        })
        .eq('id', execution.id)

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel: 'wait',
        status: 'sent',
        message_content: `Waiting until ${nextActionAt.toISOString()}`,
    })
}

async function executeStatusUpdate(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()

    if (config.new_status) {
        if (execution.sale_id) {
            await supabase.from('sales')
                .update({ status: config.new_status })
                .eq('id', execution.sale_id)
        } else if (execution.lead_id) {
            const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost']
            let statusToUpdate = config.new_status.toLowerCase()
            if (statusToUpdate === 'prospect') statusToUpdate = 'qualified'
            if (validStatuses.includes(statusToUpdate)) {
                await supabase.from('leads')
                    .update({ status: statusToUpdate })
                    .eq('id', execution.lead_id)
            }
        }
    }

    if (config.add_note && (execution.customer_id || execution.lead_id)) {
        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            lead_id: execution.lead_id,
            user_id: execution.metadata?.created_by || null,
            owner_id: execution.metadata?.created_by || null,
            type: 'Note',
            topic: 'Sales',
            summary: 'Outreach Otomasyon Notu',
            description: config.add_note,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: 'Medium',
        })
    }

    await logAndAdvance(execution, step, 'sent', 'status_update')
}

async function executeNotify(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()
    const { createNotification } = await import('@/lib/notifications/create')
    const customer = execution.customers || execution.leads

    await createNotification({
        tenant_id: execution.tenant_id,
        user_id: config.notify_user_id || undefined,
        type: 'Info',
        category: 'CRM',
        title: '📢 Outreach Bildirim',
        message: (config.notify_message || 'Outreach workflow adımı tamamlandı.')
            .replace('{customer_name}', customer?.full_name || ''),
        link: execution.customer_id ? '/crm' : '/leads',
    })

    await logAndAdvance(execution, step, 'sent', 'notify')
}

async function executeCondition(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()
    const { field, operator, value } = config as any
    const sale = execution.sales
    const lead = execution.leads

    let isTrue = false
    const actualValue = sale?.[field] || lead?.[field]

    if (operator === 'eq') isTrue = String(actualValue) === String(value)
    else if (operator === 'neq') isTrue = String(actualValue) !== String(value)
    else if (operator === 'contains') isTrue = String(actualValue).toLowerCase().includes(String(value).toLowerCase())

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel: 'condition',
        status: 'sent',
        message_content: `Condition evaluated: ${field} ${operator} ${value} -> ${isTrue}`,
    })

    await advanceToNextStep(execution, step, isTrue ? 'condition_true' : 'condition_false')
}

async function executeAiPersonalize(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()
    const { instruction } = config as any
    const customer = execution.customers || execution.leads
    const sale = execution.sales

    // Fetch recent context for personalization
    let query = supabase
        .from('activities')
        .select('summary, description')
        .order('created_at', { ascending: false })
        .limit(3)

    if (execution.customer_id) {
        query = query.eq('customer_id', execution.customer_id)
    } else {
        query = query.eq('lead_id', execution.lead_id)
    }

    const { data: activities } = await query

    const context = activities?.map(a => `${a.summary}: ${a.description}`).join('\n') || 'Geçmiş görüşme kaydı yok.'

    // Call LLM

    try {
        const prompt = `Müşteri Adı: ${customer.full_name}\nBağlam:\n${context}\n\nTalimat: ${instruction}\n\nLütfen müşteri için samimi, profesyonel bir mesaj taslağı hazırla.`

        // Use Gemini for speed/cost
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/generate`, {
            method: 'POST',
            body: JSON.stringify({ prompt, type: 'personalization' })
        })
        const data = await response.json()
        const personalizedMessage = data.text || 'Merhaba, sizinle iletişime geçmek istedik.'

        // Store in metadata for next steps
        await supabase.from('outreach_executions')
            .update({
                metadata: {
                    ...execution.metadata,
                    personalized_message: personalizedMessage
                }
            })
            .eq('id', execution.id)

        await logAndAdvance(execution, step, 'sent', 'ai_personalize', `Personalized: ${personalizedMessage.substring(0, 50)}...`)
    } catch (err: any) {
        await logAndAdvance(execution, step, 'failed', 'ai_personalize', err.message)
    }
}

// ─── Retry & Advance Logic ──────────────────────────────────

async function handleRetryOrAdvance(execution: any, step: any, config: StepConfig, outcome: string, duration?: number) {
    const supabase = createAdminClient()
    const retry = config.retry

    let shouldRetry = false

    // KURAL: Müşteri telefonu açıp konuştuysa (success, callback_requested) → ASLA retry yapma.
    // Cevapsız veya meşgul → criteria toggle'larına göre retry yap.
    // Hemen kapatanlar → sadece toggle AÇIK ve süre eşiğin altındaysa retry yap.
    if (retry?.enabled && (execution.current_retry_count || 0) < (retry.max_attempts || 3)) {
        const criteria = retry.criteria

        if (outcome === 'success' || outcome === 'callback_requested') {
            // Müşteri ile konuşma yapıldı → ASLA retry yapma
            shouldRetry = false
        } else if (outcome === 'busy') {
            // Hat meşgul → criteria varsa toggle'a bak, yoksa default retry
            shouldRetry = criteria ? criteria.busy !== false : true
        } else if (outcome === 'no_answer') {
            // Cevapsız → criteria varsa toggle'a bak, yoksa default retry
            shouldRetry = criteria ? criteria.no_answer !== false : true
        } else if (outcome === 'hung_up') {
            // Hemen kapattı → sadece toggle AÇIK ve süre eşiğin altındaysa
            if (criteria?.hung_up?.enabled && duration !== undefined && duration !== null) {
                const maxSecs = criteria.hung_up.max_seconds || 10
                shouldRetry = duration <= maxSecs
            } else {
                shouldRetry = false
            }
        } else {
            // Bilinmeyen outcome → güvenli default
            shouldRetry = false
        }
    }

    if (shouldRetry) {
        // Schedule retry
        const retryAt = new Date()
        retryAt.setMinutes(retryAt.getMinutes() + (retry?.interval_minutes || 15))

        await supabase.from('outreach_executions')
            .update({
                current_retry_count: (execution.current_retry_count || 0) + 1,
                next_action_at: retryAt.toISOString(),
                status: 'active',
            })
            .eq('id', execution.id)
    } else {
        // Max retries reached or no retry → advance
        await advanceToNextStep(execution, step, outcome)
    }
}

async function touchSaleTimestamp(saleId: string | undefined) {
    if (!saleId) return
    const supabase = createAdminClient()
    await supabase.from('sales')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', saleId)
}

async function touchLeadTimestamp(leadId: string | undefined) {
    if (!leadId) return
    const supabase = createAdminClient()
    await supabase.from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', leadId)
}

async function advanceToNextStep(execution: any, step: any, outcome: string) {
    const supabase = createAdminClient()

    // Determine next action based on outcome
    let nextStepId = null

    if (outcome === 'condition_true') nextStepId = step.next_step_id_on_condition_true || step.next_step_id_on_success
    else if (outcome === 'condition_false') nextStepId = step.next_step_id_on_condition_false || step.next_step_id_on_failure
    else if (outcome === 'success') nextStepId = step.next_step_id_on_success
    else if (outcome === 'failure' || outcome === 'no_answer') nextStepId = step.next_step_id_on_failure

    if (nextStepId === 'stop') {
        await supabase.from('outreach_executions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', execution.id)
        return
    }

    // Determine next step order
    let nextStep: any = null
    if (nextStepId && nextStepId !== 'next') {
        const { data } = await supabase
            .from('outreach_steps')
            .select('*')
            .eq('id', nextStepId)
            .single()
        nextStep = data
    } else {
        const nextOrder = step.step_order + 1
        const { data } = await supabase
            .from('outreach_steps')
            .select('*')
            .eq('workflow_id', execution.workflow_id)
            .eq('step_order', nextOrder)
            .single()
        nextStep = data
    }

    if (!nextStep) {
        // No more steps
        await supabase.from('outreach_executions')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', execution.id)
        return
    }

    await supabase.from('outreach_executions')
        .update({
            current_step_order: nextStep.step_order,
            current_step_id: nextStep.id,
            current_retry_count: 0,
            next_action_at: new Date().toISOString(), // Execute immediately (or wait step will adjust)
            status: 'active',
        })
        .eq('id', execution.id)
}

async function logAndAdvance(execution: any, step: any, status: string, channel: string, error?: string) {
    const supabase = createAdminClient()

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel,
        status,
        error_message: error,
    })

    await advanceToNextStep(execution, step, status === 'sent' ? 'success' : 'failure')
}

// ─── Vapi Webhook Handler ────────────────────────────────────

/**
 * Called by the Vapi webhook when a call ends.
 * Updates the execution log and advances the workflow.
 */
export async function handleVapiCallResult(callData: {
    callId: string
    status: string
    endedReason?: string
    transcript?: string
    summary?: string
    recordingUrl?: string
    duration?: number
    cost?: number
    analysis?: any
    metadata?: Record<string, any>
}) {
    const supabase = createAdminClient()
    const executionId = callData.metadata?.execution_id

    if (!executionId) {
        console.warn('[Outreach] Vapi webhook without execution_id in metadata')
        return
    }

    // Determine call outcome and logStatus
    let outcome: string = 'no_answer'
    let logStatus: string = 'no_answer'

    const hasTranscript = !!(callData.transcript && callData.transcript.trim().length > 0)
    const transcriptText = callData.transcript || ''

    // Check if the customer actually spoke (presence of User: or Customer:)
    const customerSpoke = hasTranscript && (
        transcriptText.toLowerCase().includes('user:') ||
        transcriptText.toLowerCase().includes('customer:') ||
        transcriptText.toLowerCase().includes('user (customer):')
    )

    // Check for Turkish voicemail carrier messages
    const voicemailKeywords = [
        'sekreter',
        'en uzun kayıt',
        'mesajınız',
        'sinyal sesinden',
        'ulaşılamıyor',
        'telesekreter',
        'mesaj bırakın'
    ]
    const isVoicemail = customerSpoke && voicemailKeywords.some(keyword =>
        transcriptText.toLowerCase().includes(keyword)
    )

    if (callData.endedReason === 'customer-busy') {
        outcome = 'busy'
        logStatus = 'busy'
    } else if (callData.endedReason === 'customer-did-not-answer' || isVoicemail || (hasTranscript && !customerSpoke)) {
        outcome = 'no_answer'
        logStatus = 'no_answer'
    } else if (callData.endedReason === 'customer-ended-call' || callData.endedReason === 'assistant-ended-call' || customerSpoke) {
        // Customer answered and spoke (not voicemail)
        if (callData.duration && callData.duration > 30) {
            outcome = 'success'
            logStatus = 'answered'
        } else {
            // Customer picked up but hung up quickly
            outcome = 'hung_up'
            logStatus = 'answered' // MUST BE 'answered' to satisfy DB constraint
        }
    }

    // Check AI analysis for interest — but also verify availability
    const interested = callData.analysis?.structuredData?.interested
    const available = callData.analysis?.structuredData?.available
    const callbackRequested = callData.analysis?.structuredData?.callback_requested

    // Transkript bazlı "müsait değil" kontrolü (fallback when AI fields missing)
    const notAvailableKeywords = ['müsait değil', 'meşgulüm', 'uygun değil', 'daha sonra', 'sonra ara', 'şu an olmaz', 'devlet dairesi', 'toplantıda']
    const isNotAvailable = available === false ||
        callbackRequested === true ||
        notAvailableKeywords.some(kw => transcriptText.toLowerCase().includes(kw))

    if (interested === true && !isNotAvailable) {
        outcome = 'success'
        logStatus = 'converted'
    } else if (interested === true && isNotAvailable) {
        // Müşteri ilgili ama müsait değil — tekrar aranmalı
        outcome = 'callback_requested'
        logStatus = 'answered'
    }

    // Update the step log
    const { data: updatedLogs, error: updateErr } = await supabase.from('outreach_step_logs')
        .update({
            status: logStatus,
            call_duration_seconds: callData.duration,
            call_transcript: callData.transcript,
            call_recording_url: callData.recordingUrl,
            call_summary: callData.summary,
            call_outcome: outcome,
            cost_amount: callData.cost,
            completed_at: new Date().toISOString(),
        })
        .eq('execution_id', executionId)
        .eq('external_id', callData.callId)
        .select('*')

    if (updateErr) {
        console.error(`[Outreach] Error updating step log for call ${callData.callId}:`, updateErr.message)
    }

    const logEntry = updatedLogs?.[0]

    // Get execution, step and workflow with customers/leads and sales loaded
    const { data: execution } = await supabase
        .from('outreach_executions')
        .select('*, outreach_steps(*), outreach_workflows(*), customers(*), leads(*), sales(*)')
        .eq('id', executionId)
        .single()

    if (!execution) return
    const customer = execution.customers || execution.leads

    // Safety checks:
    // 1. If this is an old webhook from a call that isn't the active pending call anymore
    if (execution.metadata?.pending_call_id && execution.metadata.pending_call_id !== callData.callId) {
        console.log(`[Outreach] Webhook callId ${callData.callId} doesn't match execution pending_call_id ${execution.metadata.pending_call_id}. Skipping execution update.`)
        return
    }

    // 2. If the execution has already moved to a different step
    if (logEntry && execution.current_step_id !== logEntry.step_id) {
        console.log(`[Outreach] Webhook step mismatch. Log step: ${logEntry.step_id}, Execution current step: ${execution.current_step_id}. Skipping execution update.`)
        return
    }

    const step = execution.outreach_steps || execution.current_step_id
    const stepData = await supabase.from('outreach_steps')
        .select('*')
        .eq('id', execution.current_step_id)
        .single()

    // ─── Log call to customer timeline (all outcomes) ─────────
    const durationText = callData.duration ? `${Math.floor(callData.duration / 60)}dk ${callData.duration % 60}sn` : ''
    const transcriptBlock = callData.transcript
        ? `\n\n📝 Transkript:\n${callData.transcript}`
        : ''
    const recordingBlock = callData.recordingUrl
        ? `\n\n🎙️ Kayıt: ${callData.recordingUrl}`
        : ''

    if (logStatus === 'converted') {
        await supabase.from('outreach_executions')
            .update({ status: 'converted', completed_at: new Date().toISOString() })
            .eq('id', executionId)

        // Update lead status
        if (execution.sale_id) {
            await supabase.from('sales')
                .update({ status: 'Prospect' })
                .eq('id', execution.sale_id)
        } else if (execution.lead_id) {
            await supabase.from('leads')
                .update({ status: 'converted', converted_at: new Date().toISOString() })
                .eq('id', execution.lead_id)
        }

        // Create activity — converted
        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            lead_id: execution.lead_id,
            type: 'Call',
            topic: 'Sales',
            summary: `🤖 AI Arama — Müşteri İlgilendi ✅ (${durationText})`,
            description: `${callData.summary || 'Müşteri ilgi gösterdi.'}${transcriptBlock}${recordingBlock}\n\n[Call ID: ${callData.callId}]`,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: 'High',
        })
    } else {
        // Log non-converted calls too (answered, no_answer, busy, callback_requested)
        let answeredSummary = `🤖 AI Arama — Görüşme Yapıldı (${durationText})`
        if (logStatus === 'answered') {
            const interestedForLabel = callData.analysis?.structuredData?.interested
            if (interestedForLabel === false) {
                answeredSummary = `🤖 AI Arama — Görüşüldü, İlgilenmedi ❌ (${durationText})`
            } else if (interestedForLabel === undefined || interestedForLabel === null) {
                answeredSummary = `🤖 AI Arama — Görüşüldü (${durationText})`
            }
        }

        const summaryMap: Record<string, string> = {
            answered: answeredSummary,
            no_answer: '🤖 AI Arama — Cevap Vermedi',
            busy: '🤖 AI Arama — Hat Meşgul',
        }

        const priorityMap: Record<string, string> = {
            answered: 'Medium',
            no_answer: 'Low',
            busy: 'Low',
        }

        // Outcome-specific summaries
        let summary = summaryMap[logStatus] || `🤖 AI Arama — ${logStatus} (${durationText})`
        if (outcome === 'hung_up') {
            summary = `🤖 AI Arama — Açtı ama Kapattı 📵 (${durationText})`
        } else if (outcome === 'callback_requested') {
            summary = `🤖 AI Arama — Müsait Değil, Tekrar Aranacak 📞 (${durationText})`
        }

        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            lead_id: execution.lead_id,
            type: 'Call',
            topic: 'Sales',
            summary: summary,
            description: `${callData.summary || `Arama sonucu: ${outcome}`}${transcriptBlock}${recordingBlock}\n\n[Call ID: ${callData.callId}]`,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: outcome === 'callback_requested' ? 'Medium' : (priorityMap[logStatus] || 'Low'),
        })

        // Update sales/leads updated_at timestamp
        if (execution.customer_id) {
            await touchSaleTimestamp(execution.sale_id)
        } else {
            await touchLeadTimestamp(execution.lead_id)
        }

        // If the customer answered and we had a successful conversation, stop the execution if workflow is configured to do so
        const stopOnResponse = execution?.outreach_workflows?.stop_on_customer_response !== false
        if (outcome === 'success' && stopOnResponse) {
            console.log(`[Outreach] Successful call conversation: stopping execution ${executionId} (stop_on_customer_response=true)`)
            await supabase.from('outreach_executions')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', executionId)
        } else if (stepData?.data) {
            await handleRetryOrAdvance(execution, stepData.data, stepData.data.config || {}, outcome, callData.duration)
        }
    }

    // ─── AI Lead Scoring → lead_qualifications/leads güncelleme ─────
    const structuredData = callData.analysis?.structuredData
    if (structuredData?.lead_score) {
        const scoreMap: Record<string, string> = {
            hot: 'qualified',
            warm: 'follow_up',
            follow_up: 'follow_up',
            disqualified: 'disqualified',
        }
        const newStatus = scoreMap[structuredData.lead_score] || 'follow_up'

        const callNotes = `🤖 AI Skor: ${structuredData.lead_score.toUpperCase()}` +
            (structuredData.notes ? ` — ${structuredData.notes}` : '') +
            (structuredData.purpose ? ` | Amaç: ${structuredData.purpose}` : '') +
            (structuredData.investment_timeline ? ` | Zamanlama: ${structuredData.investment_timeline}` : '') +
            (structuredData.preferred_unit_type ? ` | Tip: ${structuredData.preferred_unit_type}` : '')

        let assignedTo = null

        if (execution.customer_id) {
            // Check if lead_qualifications record exists
            const { data: lqRecord } = await supabase
                .from('lead_qualifications')
                .select('id, assigned_to')
                .eq('customer_id', execution.customer_id)
                .limit(1)
                .single()

            if (lqRecord) {
                assignedTo = lqRecord.assigned_to
                await supabase
                    .from('lead_qualifications')
                    .update({
                        status: newStatus,
                        call_notes: callNotes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', lqRecord.id)
            } else {
                // Check if there is an assigned rep on sales or customer
                const saleAssignedTo = execution.sales?.assigned_to || execution.customers?.assigned_to || null
                assignedTo = saleAssignedTo

                // Create new lead qualification record
                await supabase
                    .from('lead_qualifications')
                    .insert({
                        tenant_id: execution.tenant_id,
                        customer_id: execution.customer_id,
                        status: newStatus,
                        source: 'ai_call',
                        project_id: execution.sales?.project_id || null,
                        interest_level: structuredData.lead_score,
                        call_notes: callNotes,
                        assigned_to: assignedTo,
                        sale_id: execution.sale_id || null,
                    })
            }
            console.log(`[Outreach] 📊 Lead scored: ${execution.customer_id} → ${structuredData.lead_score} (${newStatus})`)

            // --- AUTO CONVERT TO SALE (LEAD) ---
            if (structuredData.lead_score === 'hot' || structuredData.lead_score === 'warm' || structuredData.lead_score === 'call_requested') {
                try {
                    const { autoConvertQualificationToSale } = await import('@/lib/crm/auto-convert');
                    await autoConvertQualificationToSale(supabase, execution.tenant_id, execution.customer_id, structuredData.lead_score, structuredData.notes);
                } catch (autoErr) {
                    console.error('[Outreach Lead Scoring] Failed to auto convert qualification to sale:', autoErr);
                }
            }
        } else if (execution.lead_id) {
            const leadStatusMap: Record<string, string> = {
                hot: 'qualified',
                warm: 'contacted',
                follow_up: 'contacted',
                disqualified: 'lost'
            }
            const leadNewStatus = leadStatusMap[structuredData.lead_score] || 'contacted'
            assignedTo = execution.leads?.assigned_to || null
            
            const oldNotes = execution.leads?.notes ? execution.leads.notes + '\n\n' : ''
            const newNotes = oldNotes + `[Outreach AI Arama Skorlama: ${structuredData.lead_score.toUpperCase()}]\n${callNotes}`
            
            await supabase
                .from('leads')
                .update({
                    status: leadNewStatus,
                    notes: newNotes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', execution.lead_id)
                
            console.log(`[Outreach] 📊 Lead scored: ${execution.lead_id} → ${structuredData.lead_score} (${leadNewStatus})`)
        }

        // ─── AUTO COMMUNICATION OFF: do_not_contact → iletişim kapat ───
        const doNotContact = structuredData?.do_not_contact === true
        if (doNotContact) {
            if (execution.customer_id) {
                await supabase
                    .from('customers')
                    .update({ communication_enabled: false })
                    .eq('id', execution.customer_id)
                console.log(`[Outreach] 🔇 Communication disabled for customer ${execution.customer_id} — do_not_contact`)
            }

            // Opt-out kaydı + audit log
            const custPhone = customer?.phone
            const normalizedCustPhone = custPhone ? normalizePhone(custPhone) : null
            if (normalizedCustPhone) {
                await supabase.from('outreach_optouts').upsert({
                    phone: normalizedCustPhone,
                    channel: 'all',
                    reason: 'Müşteri aranmak istemediğini belirtti (AI tespit)',
                }, { onConflict: 'phone,channel' }).select()
            }
            await supabase.from('outreach_optout_logs').insert({
                tenant_id: execution.tenant_id,
                customer_id: execution.customer_id,
                lead_id: execution.lead_id,
                phone: normalizedCustPhone,
                channel: 'all',
                action: 'opted_out',
                reason: 'Müşteri aranmak istemediğini belirtti (AI outreach tespit)',
                performed_by_name: 'Maya AI',
                source: 'ai_call',
            })
        }

        // Activity log for scoring
        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            lead_id: execution.lead_id,
            type: 'Note',
            topic: 'Sales',
            summary: `📊 AI Lead Skor: ${structuredData.lead_score.toUpperCase()}`,
            description: [
                `Lead Skoru: ${structuredData.lead_score.toUpperCase()}`,
                structuredData.purpose ? `Amaç: ${structuredData.purpose}` : null,
                structuredData.investment_timeline ? `Zamanlama: ${structuredData.investment_timeline}` : null,
                structuredData.preferred_unit_type ? `Daire Tipi: ${structuredData.preferred_unit_type}` : null,
                structuredData.budget_mentioned ? 'Bütçe konuşuldu' : null,
                structuredData.wants_appointment ? '📅 Randevu istedi' : null,
                structuredData.wants_catalog ? '📋 Katalog istedi' : null,
                structuredData.rejection_reason ? `Red Sebebi: ${structuredData.rejection_reason}` : null,
                structuredData.notes ? `\nNotlar: ${structuredData.notes}` : null,
            ].filter(Boolean).join('\n'),
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: structuredData.lead_score === 'hot' ? 'High' : 'Medium',
        })

        // HOT/WARM Lead → WhatsApp notification to assigned rep + hot lead managers
        if (structuredData.lead_score === 'hot' || structuredData.lead_score === 'warm') {
            try {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('wa_phone_number_id, wa_access_token')
                    .eq('id', execution.tenant_id)
                    .single()

                if (tenant?.wa_phone_number_id && tenant?.wa_access_token && customer) {
                    const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                    const leadLabel = structuredData.lead_score === 'warm' ? '[ILIK LEAD - Outreach] ' : '[SICAK LEAD - Outreach] '
                    const params = [
                        customer.phone || '-',
                        customer.full_name || 'Müşteri',
                        new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                        leadLabel + (structuredData.notes || `AI arama sonucu ${structuredData.lead_score.toUpperCase()} olarak değerlendirildi`)
                    ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().substring(0, 500) : p)

                    // 1. Atanmış danışmana bildirim
                    if (assignedTo) {
                        const { data: rep } = await supabase
                            .from('profiles')
                            .select('phone, full_name')
                            .eq('id', assignedTo)
                            .single()

                        if (rep?.phone) {
                            await sendWhatsAppTemplate(
                                rep.phone.replace(/\D/g, ''),
                                'crm_operasyonel_durum_bildirimi',
                                params,
                                'tr',
                                tenant.wa_phone_number_id,
                                tenant.wa_access_token
                            )
                            console.log(`[Outreach] 🔥 ${structuredData.lead_score.toUpperCase()} lead bildirim → atanmış danışman: ${rep.full_name}`)
                        }
                    }

                    // 2. Tüm hot lead manager'lara bildirim
                    const { data: hotLeadManagers } = await supabase
                        .from('profiles')
                        .select('id, full_name, phone')
                        .eq('tenant_id', execution.tenant_id)
                        .eq('is_hot_lead_manager', true)
                        .eq('is_active', true)

                    if (hotLeadManagers && hotLeadManagers.length > 0) {
                        for (const manager of hotLeadManagers) {
                            // Atanmış danışman zaten bildirim aldıysa tekrar gönderme
                            if (manager.phone && manager.id !== assignedTo) {
                                try {
                                    await sendWhatsAppTemplate(
                                        manager.phone,
                                        'crm_operasyonel_durum_bildirimi',
                                        params,
                                        'tr',
                                        tenant.wa_phone_number_id,
                                        tenant.wa_access_token
                                    )
                                    console.log(`[Outreach] 🔥 Hot Lead Manager bildirimi gönderildi: ${manager.full_name} (${manager.phone})`)
                                } catch (sendErr: any) {
                                    console.error(`[Outreach] Hot Lead Manager bildirim hatası (${manager.full_name}):`, sendErr.message)
                                }
                            }
                        }
                    }
                }
            } catch (notifErr: any) {
                console.error('[Outreach] HOT lead notification error:', notifErr.message)
            }
        }

        // UNASSIGNED WARM/HOT Lead → Create follow-up task and notify admins
        if ((structuredData.lead_score === 'hot' || structuredData.lead_score === 'warm') && !assignedTo) {
            try {
                // Find primary owner/admin to assign the task
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('tenant_id', execution.tenant_id)
                    .in('role', ['admin', 'owner', 'crm_manager'])
                    .limit(1)

                const adminId = admins?.[0]?.id || null

                // Create follow-up activity (pending task)
                await supabase.from('activities').insert({
                    tenant_id: execution.tenant_id,
                    customer_id: execution.customer_id,
                    lead_id: execution.lead_id,
                    owner_id: adminId,
                    type: 'Call',
                    topic: 'Sales',
                    summary: `🚨 Atama Bekleyen İlgili Müşteri (${structuredData.lead_score.toUpperCase()})`,
                    description: `Müşteri yapay zeka aramasında sıcak ilgi gösterdi ancak şu an atanmış bir danışmanı bulunmamaktadır. Lütfen atama yapıp iletişime geçiniz.\nNotlar: ${structuredData.notes || '-'}`,
                    due_date: new Date().toISOString(),
                    status: 'Pending',
                    priority: 'High',
                })

                // Create system notification
                const { createNotification } = await import('@/lib/notifications/create')
                await createNotification({
                    tenant_id: execution.tenant_id,
                    user_id: adminId || undefined,
                    type: 'Alert',
                    category: 'CRM',
                    title: `🔥 Atanmamış Sıcak Fırsat (AI Arama)`,
                    message: `${customer?.full_name || 'Müşteri'} yapay zeka aramasında sıcak ilgi gösterdi ancak ataması yok.`,
                    link: execution.customer_id ? `/crm?customerId=${execution.customer_id}` : `/leads?leadId=${execution.lead_id}`,
                })

                console.log(`[Outreach] 🔔 Unassigned lead action created for ${execution.customer_id || execution.lead_id}`)
            } catch (err: any) {
                console.error('[Outreach] Error creating unassigned lead action:', err.message)
            }
        }

        // ─── FOLLOW-UP: Takip edilmeli → MAYA'ya görev ata ─────
        if (structuredData.lead_score === 'follow_up' || structuredData.callback_requested === true) {
            try {
                const MAYA_USER_ID = '8e800daf-42bf-411e-b3b0-a69563e3e126'
                const { parseCallbackDate } = await import('@/lib/utils/parse-callback-date')
                const callbackDueDate = parseCallbackDate(structuredData.callback_datetime)

                const customerName = customer?.full_name || 'Müşteri'

                await supabase.from('activities').insert({
                    tenant_id: execution.tenant_id,
                    customer_id: execution.customer_id,
                    lead_id: execution.lead_id,
                    owner_id: MAYA_USER_ID,
                    type: 'Call',
                    topic: 'Sales',
                    summary: `📞 MAYA Takip Görevi — ${customerName}`,
                    description: [
                        `Müşteri daha sonra aranmak istedi.`,
                        structuredData.callback_datetime ? `📅 İstenen Zaman: ${structuredData.callback_datetime}` : null,
                        structuredData.notes ? `📝 Notlar: ${structuredData.notes}` : null,
                        `🤖 AI Lead Skoru: ${structuredData.lead_score?.toUpperCase() || 'FOLLOW_UP'}`,
                    ].filter(Boolean).join('\n'),
                    due_date: callbackDueDate,
                    status: 'Pending',
                    priority: 'High',
                })

                console.log(`[Outreach] 📞 MAYA follow-up task created for ${customerName} (${execution.customer_id || execution.lead_id}) → due: ${callbackDueDate}`)
            } catch (followUpErr: any) {
                console.error('[Outreach] Error creating MAYA follow-up task:', followUpErr.message)
            }
        }

        // ─── KATALOG/DOKÜMAN: WhatsApp ile gönder veya Aybike'ye görev ata ─────
        if (structuredData.wants_catalog === true) {
            try {
                const AYBIKE_USER_ID = '2ab043ff-da77-46d0-9977-8d6fdf1973fc'
                const customerName = customer?.full_name || 'Müşteri'
                const projectName = structuredData.project_interested || ''
                const customerPhone = customer?.phone

                // Try to find project website_url from DB
                let projectUrl: string | null = null
                if (projectName) {
                    const { data: projects } = await supabase
                        .from('projects')
                        .select('name, website_url')
                        .eq('tenant_id', execution.tenant_id)

                    if (projects) {
                        const normalizedSearch = projectName.toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, '')
                        const match = projects.find(p => {
                            const normalizedName = p.name.toLowerCase().replace(/[^a-zçğıöşü0-9]/gi, '')
                            return normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)
                        })
                        projectUrl = match?.website_url || null
                    }
                }

                // Get tenant WA credentials
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('wa_phone_number_id, wa_access_token')
                    .eq('id', execution.tenant_id)
                    .single()

                const hasWa = tenant?.wa_phone_number_id && tenant?.wa_access_token && customerPhone

                if (hasWa && projectUrl) {
                    // ✅ Send project website link via WhatsApp
                    const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
                    const message = `Merhaba ${customerName} 👋\n\n` +
                        `${projectName ? `*${projectName}* projemize` : 'Projelerimize'} gösterdiğiniz ilgi için teşekkür ederiz.\n\n` +
                        `📋 Detaylı bilgi ve katalog için: ${projectUrl}\n\n` +
                        `Sorularınız için bize ulaşabilirsiniz.`

                    await sendWhatsAppMessage(
                        customerPhone,
                        message,
                        tenant.wa_phone_number_id,
                        tenant.wa_access_token
                    )
                    console.log(`[Outreach] 📄 WhatsApp catalog link sent to ${customerName} (${customerPhone}) → ${projectUrl}`)
                } else {
                    // ❌ No WA or no URL → Create task for Aybike
                    await supabase.from('activities').insert({
                        tenant_id: execution.tenant_id,
                        customer_id: execution.customer_id,
                        lead_id: execution.lead_id,
                        owner_id: AYBIKE_USER_ID,
                        type: 'Call',
                        topic: 'Sales',
                        summary: `📋 Doküman Talebi — ${customerName}`,
                        description: [
                            `Müşteri katalog/broşür/fiyat listesi talep etti.`,
                            projectName ? `🏗️ İlgilendiği Proje: ${projectName}` : null,
                            projectUrl ? `🔗 Proje Linki: ${projectUrl}` : '⚠️ Proje web sitesi bulunamadı — lütfen manuel gönderin.',
                            !customerPhone ? '⚠️ Müşteri telefon numarası eksik!' : null,
                            structuredData.notes ? `📝 Notlar: ${structuredData.notes}` : null,
                        ].filter(Boolean).join('\n'),
                        due_date: new Date().toISOString(),
                        status: 'Pending',
                        priority: 'High',
                    })

                    // Send WhatsApp notification to Aybike
                    if (tenant?.wa_phone_number_id && tenant?.wa_access_token) {
                        const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                        const { data: aybike } = await supabase.from('profiles').select('phone').eq('id', AYBIKE_USER_ID).single()
                        if (aybike?.phone) {
                            await sendWhatsAppTemplate(
                                aybike.phone,
                                'crm_operasyonel_durum_bildirimi',
                                [
                                    customerPhone || '-',
                                    customerName,
                                    new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
                                    `📋 Doküman Talebi — ${projectName || 'Genel'}: Müşteri katalog/broşür istedi. Lütfen CRM'den kontrol edin.`
                                ],
                                'tr',
                                tenant.wa_phone_number_id,
                                tenant.wa_access_token
                            )
                        }
                    }
                    console.log(`[Outreach] 📋 Catalog request task assigned to Aybike for ${customerName}`)
                }
            } catch (catalogErr: any) {
                console.error('[Outreach] Error handling catalog request:', catalogErr.message)
            }
        }
    }
}

// ─── Audience / Segment Resolver ─────────────────────────────

/**
 * Resolves a segment's filters into actual lead/sale IDs
 */
export async function resolveSegment(segmentId: string): Promise<string[]> {
    const supabase = createAdminClient()

    const { data: segment } = await supabase
        .from('outreach_segments')
        .select('*')
        .eq('id', segmentId)
        .single()

    if (!segment) return []
    const filters = segment.filters as any

    // Leads source (Advance CRM mode) → returns lead_id list prefixed with lead:
    if (filters.source === 'leads') {
        const allIds: string[] = []
        let from = 0
        let hasMore = true
        while (hasMore && allIds.length < 50000) {
            let query = supabase
                .from('leads')
                .select('id, phone')
                .eq('tenant_id', segment.tenant_id)
                .range(from, from + 999)
            if (filters.statuses?.length) query = query.in('status', filters.statuses)
            if (filters.exclude_statuses?.length) {
                for (const es of filters.exclude_statuses) {
                    query = query.neq('status', es)
                }
            }
            if (filters.assigned_to) {
                if (Array.isArray(filters.assigned_to)) {
                    query = query.in('assigned_to', filters.assigned_to)
                } else {
                    query = query.eq('assigned_to', filters.assigned_to)
                }
            }
            if (filters.unassigned) query = query.is('assigned_to', null)
            if (filters.date_from) query = query.gte('created_at', filters.date_from)
            if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')

            const { data: dbLeads, error } = await query
            if (error) {
                console.error('[resolveSegment] error fetching leads:', error)
                break
            }
            if (!dbLeads || dbLeads.length === 0) {
                hasMore = false
            } else {
                for (const l of dbLeads) {
                    if (l.phone) {
                        allIds.push(`lead:${l.id}`)
                    }
                }
                if (dbLeads.length < 1000) {
                    hasMore = false
                } else {
                    from += 1000
                }
            }
        }
        return allIds
    }

    // Lead Qualifications source → returns customer_id list
    if (filters.source === 'lead_qualifications' || filters.source === 'lead_qualification') {
        const allIds: string[] = []
        let from = 0
        let hasMore = true
        while (hasMore && allIds.length < 50000) {
            let query = supabase
                .from('lead_qualifications')
                .select('id, customer_id, customers!inner(phone)')
                .eq('tenant_id', segment.tenant_id)
                .range(from, from + 999)
            if (filters.statuses?.length) query = query.in('status', filters.statuses)
            if (filters.exclude_statuses?.length) {
                for (const es of filters.exclude_statuses) {
                    query = query.neq('status', es)
                }
            }
            if (filters.project_id) query = query.eq('project_id', filters.project_id)
            if (filters.assigned_to) {
                if (Array.isArray(filters.assigned_to)) {
                    query = query.in('assigned_to', filters.assigned_to)
                } else {
                    query = query.eq('assigned_to', filters.assigned_to)
                }
            }
            if (filters.unassigned) query = query.is('assigned_to', null)
            if (filters.date_from) query = query.gte('created_at', filters.date_from)
            if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')

            const { data: quals, error } = await query
            if (error) {
                console.error('[resolveSegment] error fetching quals:', error)
                break
            }
            if (!quals || quals.length === 0) {
                hasMore = false
            } else {
                for (const q of quals) {
                    allIds.push(`lq:${q.customer_id}`)
                }
                if (quals.length < 1000) {
                    hasMore = false
                } else {
                    from += 1000
                }
            }
        }
        return allIds
    }

    // Default: Sales source
    const allIds: string[] = []
    let from = 0
    let hasMore = true
    while (hasMore && allIds.length < 50000) {
        let query = supabase
            .from('sales')
            .select('id, customer_id, customers!inner(phone)')
            .eq('tenant_id', segment.tenant_id)
            .neq('status', 'Inbox')
            .range(from, from + 999)

        // Apply filters
        if (filters.statuses?.length) query = query.in('status', filters.statuses)
        if (filters.project_id) query = query.eq('project_id', filters.project_id)
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
        if (filters.unassigned) query = query.is('assigned_to', null)
        if (filters.date_from) query = query.gte('created_at', filters.date_from)
        if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')
        if (filters.days_inactive) {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() - filters.days_inactive)
            query = query.lte('updated_at', cutoff.toISOString())
        }

        const { data: sales, error } = await query
        if (error) {
            console.error('[resolveSegment] error fetching sales:', error)
            break
        }
        if (!sales || sales.length === 0) {
            hasMore = false
        } else {
            for (const s of sales) {
                allIds.push(s.id)
            }
            if (sales.length < 1000) {
                hasMore = false
            } else {
                from += 1000
            }
        }
    }
    return allIds
}

/**
 * Start a workflow for a list of sale/lead IDs
 */
export async function startWorkflowForLeads(workflowId: string, leadIds: string[], tenantId: string) {
    const supabase = createAdminClient()

    // Get first step
    const { data: firstStep } = await supabase
        .from('outreach_steps')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('step_order', 1)
        .single()

    if (!firstStep) throw new Error('Workflow has no steps')

    // Helper to chunk arrays
    const chunkArray = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    // Determine source
    const isLqSource = leadIds.length > 0 && leadIds[0].startsWith('lq:')
    const isLeadsSource = leadIds.length > 0 && leadIds[0].startsWith('lead:')

    let leads: { id: string; customer_id: string | null; lead_id: string | null }[] = []

    if (isLeadsSource) {
        // Leads source — IDs are leads(id) prefixed with 'lead:'
        const rawLeadIds = leadIds.map(id => id.replace('lead:', ''))
        const chunks = chunkArray(rawLeadIds, 150)
        const promises = chunks.map(chunk =>
            supabase
                .from('leads')
                .select('id, phone')
                .in('id', chunk)
                .not('phone', 'is', null)
        )
        const results = await Promise.all(promises)
        const dbLeads = results.flatMap(r => r.data || [])
        leads = dbLeads.map(l => ({ id: l.id, customer_id: null, lead_id: l.id }))
    } else if (isLqSource) {
        // Lead qualifications source — IDs are customer_ids
        const customerIds = leadIds.map(id => id.replace('lq:', ''))
        const chunks = chunkArray(customerIds, 150)
        const promises = chunks.map(chunk =>
            supabase
                .from('customers')
                .select('id, phone')
                .in('id', chunk)
                .not('phone', 'is', null)
        )
        const results = await Promise.all(promises)
        const customers = results.flatMap(r => r.data || [])
        leads = customers.map(c => ({ id: c.id, customer_id: c.id, lead_id: null }))
    } else {
        // Sales source — IDs are sale_ids
        const chunks = chunkArray(leadIds, 150)
        const promises = chunks.map(chunk =>
            supabase
                .from('sales')
                .select('id, customer_id')
                .in('id', chunk)
        )
        const results = await Promise.all(promises)
        const sales = results.flatMap(r => r.data || [])
        leads = sales.map(s => ({ id: s.id, customer_id: s.customer_id, lead_id: null }))
    }

    if (!leads.length) return { started: 0 }

    // Check for existing executions
    const targetKey = isLeadsSource ? 'lead_id' : 'customer_id'
    const leadIdList = leads.map(l => isLeadsSource ? l.lead_id : l.customer_id).filter(Boolean) as string[]
    const leadIdChunks = chunkArray(leadIdList, 150)

    const existingPromises = leadIdChunks.map(chunk =>
        supabase
            .from('outreach_executions')
            .select(targetKey)
            .eq('workflow_id', workflowId)
            .in('status', ['active', 'waiting', 'completed', 'converted', 'stopped'])
            .in(targetKey, chunk)
    )
    const existingResults = await Promise.all(existingPromises)
    const existing = existingResults.flatMap(r => r.data || [])

    const existingIds = new Set(existing?.map((e: any) => isLeadsSource ? e.lead_id : e.customer_id) || [])
    const newLeadsFiltered = leads.filter(l => !existingIds.has(isLeadsSource ? l.lead_id : l.customer_id))

    // In-batch deduplication: Collapse duplicate customer/lead IDs within this batch
    const seenIds = new Set<string>()
    const newLeads = newLeadsFiltered.filter(l => {
        const id = isLeadsSource ? l.lead_id : l.customer_id
        if (!id) return false
        if (seenIds.has(id)) return false
        seenIds.add(id)
        return true
    })

    if (!newLeads.length) return { started: 0, skipped: existingIds.size }

    // Create executions
    const executions = newLeads.map(lead => ({
        tenant_id: tenantId,
        workflow_id: workflowId,
        sale_id: (isLqSource || isLeadsSource) ? null : lead.id,
        customer_id: lead.customer_id,
        lead_id: lead.lead_id,
        current_step_id: firstStep.id,
        current_step_order: 1,
        status: 'active',
        next_action_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('outreach_executions').insert(executions)
    if (error) throw error

    // Update workflow stats
    await supabase.from('outreach_workflows')
        .update({ total_executions: (await supabase.from('outreach_executions').select('id', { count: 'exact', head: true }).eq('workflow_id', workflowId)).count || 0 })
        .eq('id', workflowId)

    return { started: newLeads.length, skipped: existingIds.size }
}

// ─── Helpers ─────────────────────────────────────────────────

function isWithinWorkingHours(workflow: any): boolean {
    const timezone = workflow.timezone || 'Europe/Istanbul'
    const now = new Date()

    // Get current time in workflow's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    })

    const parts = formatter.formatToParts(now)
    const partMap: Record<string, string> = {}
    parts.forEach(p => {
        partMap[p.type] = p.value
    })

    const hours = Number(partMap.hour)
    const minutes = Number(partMap.minute)
    const currentMinutes = hours * 60 + minutes

    // Day of week: Sunday is 0 in JS. We want 1=Mon...7=Sun.
    // Construct local date in that timezone to find day of week
    const y = Number(partMap.year)
    const m = Number(partMap.month) - 1
    const d = Number(partMap.day)
    const localDateInTz = new Date(y, m, d)
    const dayOfWeek = localDateInTz.getDay() || 7

    const [startH, startM] = (workflow.working_hours_start || '09:00').split(':').map(Number)
    const [endH, endM] = (workflow.working_hours_end || '19:00').split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    const workingDays: number[] = workflow.working_days || [1, 2, 3, 4, 5]

    return workingDays.includes(dayOfWeek) && currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

function getNextWorkingTime(workflow: any): string {
    const timezone = workflow.timezone || 'Europe/Istanbul'
    const [startH, startM] = (workflow.working_hours_start || '09:00').split(':').map(Number)
    const workingDays: number[] = workflow.working_days || [1, 2, 3, 4, 5]

    const now = new Date()

    // Get current date parts in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    })
    const parts = formatter.formatToParts(now)
    const partMap: Record<string, string> = {}
    parts.forEach(p => {
        partMap[p.type] = p.value
    })

    const y = Number(partMap.year)
    const m = Number(partMap.month)
    const d = Number(partMap.day)

    // Helper to get UTC time corresponding to y-m-d H:M:00 in target timezone
    const getUtcTimeForTz = (year: number, month: number, day: number, hour: number, minute: number) => {
        const guess = new Date(Date.UTC(year, month - 1, day, hour, minute))
        const checkParts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        }).formatToParts(guess)

        const checkMap: Record<string, string> = {}
        checkParts.forEach(p => checkMap[p.type] = p.value)

        const checkDate = new Date(Date.UTC(
            Number(checkMap.year),
            Number(checkMap.month) - 1,
            Number(checkMap.day),
            Number(checkMap.hour),
            Number(checkMap.minute)
        ))

        const diff = guess.getTime() - checkDate.getTime()
        return new Date(guess.getTime() + diff)
    }

    let candidate = getUtcTimeForTz(y, m, d, startH, startM)
    if (candidate <= now) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const tomParts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric'
        }).formatToParts(tomorrow)

        const tomMap: Record<string, string> = {}
        tomParts.forEach(p => tomMap[p.type] = p.value)

        candidate = getUtcTimeForTz(Number(tomMap.year), Number(tomMap.month), Number(tomMap.day), startH, startM)
    }

    // Skip non-working days
    let attempts = 0
    while (attempts < 7) {
        const candParts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric'
        }).formatToParts(candidate)

        const candMap: Record<string, string> = {}
        candParts.forEach(p => candMap[p.type] = p.value)

        const localDate = new Date(Number(candMap.year), Number(candMap.month) - 1, Number(candMap.day))
        const dayOfWeek = localDate.getDay() || 7

        if (workingDays.includes(dayOfWeek)) {
            break
        }

        candidate.setTime(candidate.getTime() + 24 * 60 * 60 * 1000)
        attempts++
    }

    return candidate.toISOString()
}

// ─── SMS Templates ───────────────────────────────────────────

const SMS_TEMPLATES: Record<string, string> = {
    default: 'Sayın {customer_name}, Novo Emlak\'tan arıyorduk. Detaylı bilgi için: 0850 XXX XX XX',
    coldLeadReminder: 'Sayın {customer_name}, {project_name} projesinde sınırlı sayıda ünite kalmıştır. Bilgi: 0850 XXX XX XX - Novo Emlak',
    appointmentOffer: 'Sayın {customer_name}, ücretsiz danışmanlık randevunuzu oluşturmak ister misiniz? Yanıt: RANDEVU - Novo Emlak',
    lastChance: 'Sayın {customer_name}, {project_name} projesinde kampanya son gün! Detay: 0850 XXX XX XX - Novo Emlak',
    missedCall: 'Sayın {customer_name}, sizi aradık ancak ulaşamadık. Bize dönmek için: 0850 XXX XX XX - Novo Emlak',
}
