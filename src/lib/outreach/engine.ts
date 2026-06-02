'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { makeOutboundCall, getTurkishNameTitle } from '@/lib/vapi'
import { sendWhatsAppTemplate, sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendPoliSms, normalizePhone } from '@/lib/sms'

// ─── Eşzamanlı Arama Limiti ────────────────────────────────
const MAX_CONCURRENT_CALLS = Number(process.env.MAX_CONCURRENT_CALLS) || 5

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
    const { data: admins } = await supabase.from('profiles').select('phone').eq('tenant_id', tenantId).in('role', ['admin', 'owner']).limit(1);
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

    // ─── Global Lock: Eşzamanlı cron çalışmalarını engelle ─────
    // Tenants tablosunda ilk tenant'ın ai_outreach_settings alanında lock tutuyoruz
    const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 dakika
    const { data: lockTenant } = await supabase.from('tenants').select('id, ai_outreach_settings').limit(1).single()
    
    if (lockTenant) {
        const settings = lockTenant.ai_outreach_settings || {}
        const lockTime = settings.queue_lock_at ? new Date(settings.queue_lock_at).getTime() : 0
        const isLocked = lockTime > 0 && (Date.now() - lockTime) < LOCK_TIMEOUT_MS

        if (isLocked) {
            console.log(`[Outreach] Kuyruk zaten işleniyor (lock: ${settings.queue_lock_at}). Atlanıyor.`)
            return { processed: 0, reason: 'already_processing' }
        }

        // Lock al
        await supabase.from('tenants').update({
            ai_outreach_settings: { ...settings, queue_lock_at: now }
        }).eq('id', lockTenant.id)
    }

    // Lock temizleme helper
    const releaseLock = async () => {
        if (lockTenant) {
            const { data: latest } = await supabase.from('tenants').select('ai_outreach_settings').eq('id', lockTenant.id).single()
            const settings = latest?.ai_outreach_settings || {}
            await supabase.from('tenants').update({
                ai_outreach_settings: { ...settings, queue_lock_at: null }
            }).eq('id', lockTenant.id)
        }
    }

    try {

    // ─── Vapi Call Reconciliation ──────────────────────────
    // Sync calls that ended on Vapi's side but webhook was never received.
    // Uses handleVapiCallResult to ensure timeline activities, transcripts,
    // recordings, lead scoring, and retry/advance logic all run properly.
    {
        const { data: stuckCalls } = await supabase
            .from('outreach_step_logs')
            .select('id, external_id, execution_id')
            .eq('status', 'sent')
            .is('completed_at', null)
            .eq('channel', 'ai_call')
            .limit(20)

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
                            transcript: vapiCall.transcript,
                            summary: vapiCall.summary,
                            recordingUrl: vapiCall.recordingUrl,
                            duration: vapiCall.duration,
                            cost: vapiCall.cost,
                            analysis: vapiCall.analysis,
                            metadata: exec?.metadata || { execution_id: log.execution_id },
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

    // Find executions that are due, sorted by next_action_at ascending to prevent starvation
    const { data: dueExecutions, error } = await supabase
        .from('outreach_executions')
        .select(`
            *,
            outreach_workflows!inner(
                id, working_hours_start, working_hours_end, working_days, timezone, is_active, conversion_goal_status, batch_size, batch_interval_seconds
            ),
            customers(id, full_name, phone, email),
            sales(id, status, project_id, unit_id)
        `)
        .in('status', ['active', 'waiting'])
        .lte('next_action_at', now)
        .order('next_action_at', { ascending: true })
        .limit(1000)

    if (error || !dueExecutions?.length) {
        console.log(`[Outreach] No due executions. Error: ${error?.message || 'none'}`)
        await releaseLock()
        return { processed: 0 }
    }



    // ─── Pessimistic Locking (Moved inside loop) ─────────
    // Batch locking here was removed to avoid locking records that are skipped or causing
    // concurrent runs to step on each other. We lock records atomically inside the loop instead.

    const tenantId = dueExecutions[0]?.tenant_id

    // ─── System Health Check (ElevenLabs vb.) ────────────
    if (tenantId) {
        const health = await checkSystemHealth(tenantId);
        if (!health.isHealthy) {
            await handleCriticalSystemFailure(tenantId, health.reason || 'Bilinmeyen sistem hatası');
            await releaseLock()
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
            } else {
                console.warn(`[Outreach] Vapi API check failed (${vapiRes.status}), falling back to DB check`)
            }
        }
    } catch (vapiErr: any) {
        console.warn(`[Outreach] Vapi API check error: ${vapiErr.message}, falling back to DB check`)
    }

    // Fallback: also check DB for active calls (in case Vapi API check failed)
    if (availableSlots === maxConcurrent) {
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
        console.log(`[Outreach] Eşzamanlı arama limiti doldu (${maxConcurrent}). Bekleniyor...`)
        await releaseLock()
        return { processed: 0, reason: 'concurrency_limit' }
    }

    console.log(`[Outreach] ${dueExecutions.length} bekleyen, ${availableSlots}/${maxConcurrent} slot müsait`)

    let processed = 0
    let initiatedCallsCount = 0

    // Track batch counts per workflow
    const workflowBatchCounts = new Map<string, number>()
    // Track customers already processed in this batch to prevent parallel calls
    const processedCustomerIds = new Set<string>()

    for (const execution of dueExecutions) {
        // Enforce per-workflow batch_size limit
        const wfId = execution.workflow_id
        const batchSize = execution.outreach_workflows?.batch_size || 100
        const currentCount = workflowBatchCounts.get(wfId) || 0
        if (currentCount >= batchSize) continue

        // ─── Same-customer dedup guard ─────────────────────
        // Prevent processing multiple executions for the same customer in this batch
        // (this happens when restart creates duplicate executions)
        const customerId = execution.customer_id
        if (customerId && processedCustomerIds.has(customerId)) {
            console.log(`[Outreach] Customer ${customerId} already processed in this batch. Skipping execution ${execution.id}`)
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
        const phone = execution.customers?.phone
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

        // Get current step
        const { data: step } = await supabase
            .from('outreach_steps')
            .select('*')
            .eq('workflow_id', execution.workflow_id)
            .eq('step_order', execution.current_step_order)
            .eq('is_active', true)
            .single()

        if (!step) {
            // No more steps → mark completed
            await supabase.from('outreach_executions')
                .update({ status: 'completed', completed_at: now })
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
                const customerPhone = execution.customers?.phone
                if (customerPhone) {
                    const { count: activeCallsToPhone } = await supabase
                        .from('outreach_step_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'sent')
                        .is('completed_at', null)
                        .eq('channel', 'ai_call')
                        .eq('execution_id', execution.id)
                    // More broadly, check via customer_id across all executions
                    if (customerId) {
                        const { data: activeExecsForCustomer } = await supabase
                            .from('outreach_step_logs')
                            .select('id, outreach_executions!inner(customer_id)')
                            .eq('outreach_executions.customer_id', customerId)
                            .eq('status', 'sent')
                            .is('completed_at', null)
                            .eq('channel', 'ai_call')
                            .limit(1)
                        if (activeExecsForCustomer && activeExecsForCustomer.length > 0) {
                            console.log(`[Outreach] Customer ${customerId} already has an active call. Skipping.`)
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
            if (customerId) processedCustomerIds.add(customerId)
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
                await releaseLock()
                return { processed, reason: 'critical_system_failure' };
            }
        }
    }

    await releaseLock()
    return { processed }

    } catch (outerError: any) {
        console.error('[Outreach] processOutreachQueue beklenmeyen hata:', outerError.message)
        await releaseLock()
        return { processed: 0, reason: 'unexpected_error' }
    }
}

// ─── Step Executor ───────────────────────────────────────────

async function executeStep(execution: any, step: any) {
    const supabase = createAdminClient()
    const config: StepConfig = step.config || {}
    const customer = execution.customers
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

    // Normalize & validate phone
    let cleanPhone = phone.replace(/[^0-9+]/g, '') // Remove non-numeric except +
    if (cleanPhone.startsWith('0')) cleanPhone = '+90' + cleanPhone.substring(1)
    if (!cleanPhone.startsWith('+')) cleanPhone = '+90' + cleanPhone
    // E.164: max 15 digits including country code
    if (cleanPhone.length < 10 || cleanPhone.length > 16 || cleanPhone.includes('ifempty')) {
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
    const resolvedFirstMessage = execution.metadata?.personalized_message || (nameWithTitle ? `Merhaba ${nameWithTitle}, size Novo İnşaat'tan ulaşıyorum. Ben Çiçek, nasılsınız?` : "Merhaba, size Novo İnşaat'tan ulaşıyorum. Ben Çiçek, nasılsınız?");

    const result = await makeOutboundCall({
        phoneNumber: cleanPhone,
        // Always use the default Vapi assistant, override with script prompt
        systemPrompt: scriptPrompt,
        firstMessage: resolvedFirstMessage,
        metadata: {
            execution_id: execution.id,
            sale_id: execution.sale_id,
            customer_id: execution.customer_id,
            customer_name: customer?.full_name,
            tenant_id: execution.tenant_id,
        },
    })

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
        // Critical failure check
        if (result.error && result.error.includes('INSUFFICIENT_FUNDS')) {
            throw new Error(`Critical System Failure: ${result.error}`);
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

    let result: { success: boolean; error?: string; data?: any }
    let messageContent: string = ''

    if (config.template_name || config.template_map) {
        // Resolve template name — either static or project-based mapping
        let templateName = config.template_name || ''
        if (config.template_map) {
            // Fetch lead's project from lead_qualifications
            const { data: lq } = await supabase
                .from('lead_qualifications')
                .select('projects(name)')
                .eq('customer_id', execution.customer_id)
                .order('id', { ascending: false })
                .limit(1)
                .single()
            const projectName = (lq as any)?.projects?.name || ''
            templateName = config.template_map[projectName] || config.template_map['_default'] || config.template_name || ''
            console.log(`[Outreach] Template map: project="${projectName}" → template="${templateName}"`)
        }

        // Send template message (for messages outside 24h window)
        const params = (config.template_params || []).map((p: string) =>
            p.replace('{customer_name}', customer?.full_name || '')
                .replace('{project_name}', execution.metadata?.project_name || '')
        )
        result = await sendWhatsAppTemplate(phone, templateName, params)
        messageContent = `Template: ${templateName} [${params.join(', ')}]`
    } else if (config.free_text) {
        // Send free-text message (only works within 24h window)
        let text = execution.metadata?.personalized_message || config.free_text
        text = text
            .replace('{customer_name}', customer?.full_name || '')
            .replace('{project_name}', execution.metadata?.project_name || '')
        result = await sendWhatsAppMessage(phone, text)
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
        await touchSaleTimestamp(execution.sale_id)

        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
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
        await handleRetryOrAdvance(execution, step, config, 'failure')
    }
}

async function executeSms(execution: any, step: any, config: StepConfig, phone: string, customer: any) {
    const supabase = createAdminClient()

    if (!phone) {
        await logAndAdvance(execution, step, 'skipped', 'sms', 'No phone number')
        return
    }

    const message = (execution.metadata?.personalized_message || config.custom_message || SMS_TEMPLATES[config.sms_template_key || 'default'] || '')
        .replace('{customer_name}', customer?.full_name || 'Sayın Müşterimiz')
        .replace('{project_name}', execution.metadata?.project_name || '')

    if (!message) {
        await logAndAdvance(execution, step, 'skipped', 'sms', 'No message configured')
        return
    }

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

    const result = await sendPoliSms({
        user: smsUser,
        pass: smsPass,
        message,
        contacts: [phone],
        header: tenant?.sms_sender_id || process.env.POLI_SMS_HEADER || 'NOVOEMLAK',
    })

    await supabase.from('outreach_step_logs').insert({
        execution_id: execution.id,
        step_id: step.id,
        channel: 'sms',
        status: result.success ? 'sent' : 'failed',
        message_content: message,
        error_message: result.error,
        external_id: result.messageId,
    })

    if (result.success) await touchSaleTimestamp(execution.sale_id)
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

    if (config.new_status && execution.sale_id) {
        await supabase.from('sales')
            .update({ status: config.new_status })
            .eq('id', execution.sale_id)
    }

    if (config.add_note && execution.customer_id) {
        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
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

    await createNotification({
        tenant_id: execution.tenant_id,
        user_id: config.notify_user_id || undefined,
        type: 'Info',
        category: 'CRM',
        title: '📢 Outreach Bildirim',
        message: (config.notify_message || 'Outreach workflow adımı tamamlandı.')
            .replace('{customer_name}', execution.customers?.full_name || ''),
        link: '/crm',
    })

    await logAndAdvance(execution, step, 'sent', 'notify')
}

async function executeCondition(execution: any, step: any, config: StepConfig) {
    const supabase = createAdminClient()
    const { field, operator, value } = config as any
    const sale = execution.sales

    let isTrue = false
    const actualValue = sale?.[field]

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
    const customer = execution.customers
    const sale = execution.sales

    // Fetch recent context for personalization
    const { data: activities } = await supabase
        .from('activities')
        .select('summary, description')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(3)

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

    if (retry?.enabled && (execution.current_retry_count || 0) < (retry.max_attempts || 3)) {
        if (retry.criteria) {
            const criteria = retry.criteria
            if (outcome === 'busy') {
                shouldRetry = criteria.busy !== false;
            } else if (outcome === 'no_answer') {
                if (duration !== undefined && duration !== null && duration > 0) {
                    // Call answered but hung up quickly (duration <= 30 seconds)
                    if (criteria.hung_up?.enabled) {
                        const maxSecs = criteria.hung_up.max_seconds || 10;
                        shouldRetry = duration <= maxSecs;
                    } else {
                        // If hung_up is disabled or not set, we do not retry answered calls
                        shouldRetry = false;
                    }
                } else {
                    // Unanswered call (no duration)
                    shouldRetry = criteria.no_answer !== false;
                }
            } else if (outcome === 'success') {
                shouldRetry = false; // Never retry successful conversations
            } else {
                shouldRetry = true; // Fallback for other steps/channels
            }
        } else {
            // Default legacy behavior: retry anything that is not a success
            shouldRetry = outcome !== 'success';
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

/**
 * Update sales.updated_at so the lead exits "inactive" segments
 * after being contacted via any channel.
 */
async function touchSaleTimestamp(saleId: string | undefined) {
    if (!saleId) return
    const supabase = createAdminClient()
    await supabase.from('sales')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', saleId)
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
            .update({ status: 'stopped', completed_at: new Date().toISOString() })
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

    // Determine call outcome
    let outcome: string = 'no_answer'
    let logStatus: string = 'no_answer'

    const hasTranscript = !!(callData.transcript && callData.transcript.trim().length > 0)

    if (callData.endedReason === 'customer-ended-call' || callData.endedReason === 'assistant-ended-call' || hasTranscript) {
        if (hasTranscript || (callData.duration && callData.duration > 30)) {
            // Real conversation happened
            outcome = 'success'
            logStatus = 'answered'
        } else if (callData.duration && callData.duration > 5) {
            // Customer picked up but hung up quickly (mid-conversation cut)
            outcome = 'failure'
            logStatus = 'hung_up'
        } else {
            outcome = 'failure'
            logStatus = 'hung_up'
        }
    } else if (callData.endedReason === 'customer-did-not-answer') {
        outcome = 'no_answer'
        logStatus = 'no_answer'
    } else if (callData.endedReason === 'customer-busy') {
        outcome = 'busy'
        logStatus = 'busy'
    }

    // Check AI analysis for interest
    const interested = callData.analysis?.structuredData?.interested
    if (interested === true) {
        outcome = 'success'
        logStatus = 'converted'
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

    // Get execution, step and workflow
    const { data: execution } = await supabase
        .from('outreach_executions')
        .select('*, outreach_steps(*), outreach_workflows(*)')
        .eq('id', executionId)
        .single()

    if (!execution) return

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

        // Update lead status to Prospect (Fırsat)
        if (execution.sale_id) {
            await supabase.from('sales')
                .update({ status: 'Prospect' })
                .eq('id', execution.sale_id)
        }

        // Create activity — converted
        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            type: 'Call',
            topic: 'Sales',
            summary: `🤖 AI Arama — Müşteri İlgilendi ✅ (${durationText})`,
            description: `${callData.summary || 'Müşteri ilgi gösterdi.'}${transcriptBlock}${recordingBlock}\n\n[Call ID: ${callData.callId}]`,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: 'High',
        })
    } else {
        // Log non-converted calls too (answered, no_answer, busy)
        // For answered calls, check AI analysis to distinguish interested vs not
        let answeredSummary = `🤖 AI Arama — Görüşme Yapıldı (${durationText})`
        if (logStatus === 'answered') {
            const interested = callData.analysis?.structuredData?.interested
            if (interested === false) {
                answeredSummary = `🤖 AI Arama — Görüşüldü, İlgilenmedi ❌ (${durationText})`
            } else if (interested === undefined || interested === null) {
                // No AI analysis available — keep neutral
                answeredSummary = `🤖 AI Arama — Görüşüldü (${durationText})`
            }
        }

        const summaryMap: Record<string, string> = {
            answered: answeredSummary,
            hung_up: `🤖 AI Arama — Açtı ama Kapattı 📵 (${durationText})`,
            no_answer: '🤖 AI Arama — Cevap Vermedi',
            busy: '🤖 AI Arama — Hat Meşgul',
        }

        const priorityMap: Record<string, string> = {
            answered: 'Medium',
            hung_up: 'Medium',
            no_answer: 'Low',
            busy: 'Low',
        }

        await supabase.from('activities').insert({
            tenant_id: execution.tenant_id,
            customer_id: execution.customer_id,
            type: 'Call',
            topic: 'Sales',
            summary: summaryMap[logStatus] || `🤖 AI Arama — ${logStatus} (${durationText})`,
            description: `${callData.summary || `Arama sonucu: ${logStatus}`}${transcriptBlock}${recordingBlock}\n\n[Call ID: ${callData.callId}]`,
            due_date: new Date().toISOString(),
            status: 'Completed',
            priority: priorityMap[logStatus] || 'Low',
        })

        // Update sales.updated_at so lead exits "inactive" segments
        await touchSaleTimestamp(execution.sale_id)

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

    // ─── AI Lead Scoring → lead_qualifications güncelleme ─────
    const structuredData = callData.analysis?.structuredData
    if (structuredData?.lead_score) {
        const scoreMap: Record<string, string> = {
            hot: 'qualified',
            warm: 'follow_up',
            follow_up: 'follow_up',
            disqualified: 'disqualified',
        }
        const newStatus = scoreMap[structuredData.lead_score] || 'follow_up'

        // Update lead_qualifications if this customer has a record there
        const { data: lqRecord } = await supabase
            .from('lead_qualifications')
            .select('id, assigned_to')
            .eq('customer_id', execution.customer_id)
            .limit(1)
            .single()

        if (lqRecord) {
            await supabase
                .from('lead_qualifications')
                .update({
                    status: newStatus,
                    call_notes: `🤖 AI Skor: ${structuredData.lead_score.toUpperCase()}` +
                        (structuredData.notes ? ` — ${structuredData.notes}` : '') +
                        (structuredData.purpose ? ` | Amaç: ${structuredData.purpose}` : '') +
                        (structuredData.investment_timeline ? ` | Zamanlama: ${structuredData.investment_timeline}` : '') +
                        (structuredData.preferred_unit_type ? ` | Tip: ${structuredData.preferred_unit_type}` : ''),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', lqRecord.id)

            console.log(`[Outreach] 📊 Lead scored: ${execution.customer_id} → ${structuredData.lead_score} (${newStatus})`)

            // Activity log for scoring
            await supabase.from('activities').insert({
                tenant_id: execution.tenant_id,
                customer_id: execution.customer_id,
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

            // HOT Lead → WhatsApp notification to assigned rep
            if (structuredData.lead_score === 'hot' && lqRecord.assigned_to) {
                try {
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('full_name, phone')
                        .eq('id', execution.customer_id)
                        .single()

                    const { data: rep } = await supabase
                        .from('profiles')
                        .select('phone, full_name')
                        .eq('id', lqRecord.assigned_to)
                        .single()

                    if (rep?.phone && customer) {
                        const { data: tenant } = await supabase
                            .from('tenants')
                            .select('wa_phone_number_id, wa_access_token')
                            .eq('id', execution.tenant_id)
                            .single()

                        if (tenant?.wa_phone_number_id && tenant?.wa_access_token) {
                            const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                            await sendWhatsAppTemplate(
                                rep.phone.replace(/\D/g, ''),
                                'crm_operasyonel_durum_bildirimi',
                                [
                                    customer.phone || '-',
                                    customer.full_name || 'Müşteri',
                                    new Date().toLocaleString('tr-TR'),
                                    structuredData.notes || 'AI arama sonucu HOT olarak değerlendirildi'
                                ].map(p => typeof p === 'string' ? p.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() : p),
                                'tr',
                                tenant.wa_phone_number_id,
                                tenant.wa_access_token
                            )
                            console.log(`[Outreach] 🔥 HOT lead bildirim gönderildi → ${rep.full_name}`)
                        }
                    }
                } catch (notifErr: any) {
                    console.error('[Outreach] HOT lead notification error:', notifErr.message)
                }
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

    // Lead Qualifications source → returns customer_id list
    if (filters.source === 'lead_qualifications' || filters.source === 'lead_qualification') {
        const allIds: string[] = []
        let from = 0
        let hasMore = true
        while (hasMore && allIds.length < 50000) {
            let query = supabase
                .from('lead_qualifications')
                .select('id, customer_id, customers!inner(phone)')
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
 * Start a workflow for a list of sale IDs
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

    // Determine source: lead_qualifications (prefixed with 'lq:') vs sales
    const isLqSource = leadIds.length > 0 && leadIds[0].startsWith('lq:')

    let leads: { id: string; customer_id: string }[] = []

    if (isLqSource) {
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
        leads = customers.map(c => ({ id: c.id, customer_id: c.id }))
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
        leads = sales || []
    }

    if (!leads.length) return { started: 0 }

    // Check for existing active executions
    const leadIdList = leads.map(l => l.customer_id)
    const leadIdChunks = chunkArray(leadIdList, 150)
    const existingPromises = leadIdChunks.map(chunk =>
        supabase
            .from('outreach_executions')
            .select('customer_id')
            .eq('workflow_id', workflowId)
            .in('status', ['active', 'waiting', 'completed', 'converted', 'stopped'])
            .in('customer_id', chunk)
    )
    const existingResults = await Promise.all(existingPromises)
    const existing = existingResults.flatMap(r => r.data || [])

    const existingIds = new Set(existing?.map(e => e.customer_id) || [])
    const newLeads = leads.filter(l => !existingIds.has(l.customer_id))

    if (!newLeads.length) return { started: 0, skipped: existingIds.size }

    // Create executions
    const executions = newLeads.map(lead => ({
        tenant_id: tenantId,
        workflow_id: workflowId,
        sale_id: isLqSource ? null : lead.id,
        customer_id: lead.customer_id,
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
