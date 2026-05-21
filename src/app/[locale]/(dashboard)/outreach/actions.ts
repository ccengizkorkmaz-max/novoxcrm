'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveSegment, startWorkflowForLeads, processOutreachQueue } from '@/lib/outreach/engine'

// ─── Helpers ─────────────────────────────────────────────────

async function getAuthContext() {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await authClient.from('profiles').select('tenant_id, role, full_name').eq('id', user.id).single()
    // Use admin client for data ops to bypass RLS on joined tables
    const supabase = createAdminClient()
    return { supabase, user, profile, tenantId: profile?.tenant_id }
}

// ─── Segments ────────────────────────────────────────────────

export async function getSegments() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_segments').select('*').order('created_at', { ascending: false })
    return data || []
}

export async function createSegment(payload: { name: string; description?: string; filters: any }) {
    const { supabase, user, tenantId } = await getAuthContext()
    const { data, error } = await supabase.from('outreach_segments').insert({
        tenant_id: tenantId,
        name: payload.name,
        description: payload.description,
        filters: payload.filters,
        created_by: user.id,
    }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true, data }
}

export async function updateSegment(id: string, payload: { name?: string; description?: string; filters?: any }) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_segments')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function deleteSegment(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_segments').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function previewSegment(filters: any) {
    const { supabase, tenantId } = await getAuthContext()

    // Lead Qualifications source
    if (filters.source === 'lead_qualifications') {
        let query = supabase.from('lead_qualifications')
            .select('id, status, customers!inner(full_name, phone)', { count: 'exact', head: false })
            .eq('tenant_id', tenantId)
        if (filters.statuses?.length) query = query.in('status', filters.statuses)
        if (filters.exclude_statuses?.length) {
            for (const es of filters.exclude_statuses) {
                query = query.neq('status', es)
            }
        }
        if (filters.project_id) query = query.eq('project_id', filters.project_id)
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
        if (filters.unassigned) query = query.is('assigned_to', null)
        if (filters.date_from) query = query.gte('created_at', filters.date_from)
        if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')
        const { data, count } = await query.limit(10)
        return { count: count || 0, preview: data || [] }
    }

    // Default: Sales source
    let query = supabase.from('sales').select('id, customers!inner(full_name, phone)', { count: 'exact', head: false }).neq('status', 'Inbox')
    if (filters.statuses?.length) query = query.in('status', filters.statuses)
    if (filters.project_id) query = query.eq('project_id', filters.project_id)
    if (filters.unassigned) query = query.is('assigned_to', null)
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
    if (filters.date_from) query = query.gte('created_at', filters.date_from)
    if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')
    const { data, count } = await query.limit(10)
    return { count: count || 0, preview: data || [] }
}

// ─── Scripts ─────────────────────────────────────────────────

export async function getScripts() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_scripts').select('*').order('created_at', { ascending: false })
    return data || []
}

export async function createScript(payload: { name: string; description?: string; prompt: string; first_message?: string; voice?: string; max_duration_seconds?: number }) {
    const { supabase, tenantId } = await getAuthContext()
    const { data, error } = await supabase.from('outreach_scripts').insert({ tenant_id: tenantId, ...payload }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true, data }
}

export async function updateScript(id: string, payload: Partial<{ name: string; prompt: string; first_message: string; voice: string; max_duration_seconds: number; is_active: boolean }>) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_scripts').update(payload).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function deleteScript(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_scripts').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

// ─── Workflows ───────────────────────────────────────────────

export async function getWorkflows() {
    const { supabase } = await getAuthContext()
    const adminDb = createAdminClient()
    const { data } = await supabase.from('outreach_workflows')
        .select('*, outreach_segments(name), outreach_steps(*)')
        .order('created_at', { ascending: false })
    // Sort steps by step_order within each workflow
    if (data) {
        // Fetch execution stats for all workflows (paginated to avoid 1000 limit)
        const wfIds = data.map((w: any) => w.id)
        const execStats: any[] = []
        let from = 0
        let hasMore = true
        while (hasMore && execStats.length < 50000) {
            const { data: chunk, error } = await adminDb.from('outreach_executions')
                .select('workflow_id, status, started_at')
                .in('workflow_id', wfIds)
                .range(from, from + 999)
            if (error) {
                console.error('[getWorkflows] error fetching executions chunk:', error)
                break
            }
            if (!chunk || chunk.length === 0) {
                hasMore = false
            } else {
                execStats.push(...chunk)
                if (chunk.length < 1000) {
                    hasMore = false
                } else {
                    from += 1000
                }
            }
        }
        
        data.forEach((w: any) => {
            if (w.outreach_steps) {
                w.outreach_steps.sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
            }
            // Attach execution stats
            const wfExecs = execStats.filter((e: any) => e.workflow_id === w.id)
            w._exec_stats = {
                total: wfExecs.length,
                active: wfExecs.filter((e: any) => e.status === 'active' || e.status === 'waiting').length,
                completed: wfExecs.filter((e: any) => e.status === 'completed').length,
                failed: wfExecs.filter((e: any) => e.status === 'failed').length,
                last_run: wfExecs.length > 0
                    ? wfExecs.reduce((max: string, e: any) => e.started_at > max ? e.started_at : max, '')
                    : null
            }
        })
    }
    return data || []
}

export async function getWorkflow(id: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_workflows')
        .select('*, outreach_segments(*), outreach_steps(*), outreach_scripts(*)')
        .eq('id', id)
        .single()
    return data
}

export async function createWorkflow(payload: {
    name: string
    description?: string
    segment_id?: string
    working_hours_start?: string
    working_hours_end?: string
    working_days?: number[]
    default_script_id?: string
    is_auto_detect?: boolean
    auto_detect_days?: number
    max_leads_per_day?: number
    batch_size?: number
    batch_interval_seconds?: number
    conversion_goal_status?: string
    stop_on_customer_response?: boolean
    steps: Array<{
        step_order: number
        name?: string
        action_type: string
        config: any
        next_step_id_on_success?: string
        next_step_id_on_failure?: string
        on_success?: string
        on_failure?: string
    }>
}) {
    const { supabase, user, tenantId } = await getAuthContext()

    // Create workflow
    const { steps, ...workflowData } = payload
    console.log('[createWorkflow] workflowData:', JSON.stringify(workflowData, null, 2))
    console.log('[createWorkflow] steps count:', steps?.length)
    
    const { data: workflow, error } = await supabase.from('outreach_workflows').insert({
        tenant_id: tenantId,
        created_by: user.id,
        ...workflowData,
    }).select().single()

    console.log('[createWorkflow] workflow result:', workflow?.id, 'error:', error?.message)

    if (error || !workflow) return { error: error?.message || 'Failed to create workflow' }

    // Create steps
    if (steps?.length) {
        const stepsPayload = steps.map(s => ({ ...s, workflow_id: workflow.id }))
        console.log('[createWorkflow] stepsPayload:', JSON.stringify(stepsPayload, null, 2))
        const { error: stepsError } = await supabase.from('outreach_steps').insert(stepsPayload)
        console.log('[createWorkflow] stepsError:', stepsError?.message, stepsError?.details)
        if (stepsError) {
            console.error('Create steps error:', stepsError)
            // Cleanup workflow if steps fail
            await supabase.from('outreach_workflows').delete().eq('id', workflow.id)
            return { error: 'Failed to create workflow steps: ' + stepsError.message }
        }
    }

    revalidatePath('/outreach')
    return { success: true, data: workflow }
}

export async function updateWorkflow(id: string, payload: Partial<{
    name: string
    description: string
    segment_id: string
    working_hours_start: string
    working_hours_end: string
    working_days: number[]
    is_active: boolean
    is_auto_detect: boolean
    auto_detect_days: number
    max_leads_per_day: number
    stop_on_customer_response: boolean
}>) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_workflows')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function toggleWorkflow(id: string, isActive: boolean) {
    return updateWorkflow(id, { is_active: isActive })
}

export async function deleteWorkflow(id: string) {
    const { supabase } = await getAuthContext()
    // Steps cascade-deleted via FK
    const { error } = await supabase.from('outreach_workflows').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

// ─── Steps ───────────────────────────────────────────────────

export async function getSteps(workflowId: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_order', { ascending: true })
    return data || []
}

export async function addStep(workflowId: string, step: {
    step_order: number; name?: string; action_type: string; config: any;
    on_success?: string; on_failure?: string; on_no_answer?: string; on_busy?: string
}) {
    const { supabase } = await getAuthContext()
    const { data, error } = await supabase.from('outreach_steps')
        .insert({ workflow_id: workflowId, ...step })
        .select().single()
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true, data }
}

export async function updateStep(id: string, payload: Partial<{ 
    step_order: number; name: string; config: any; 
    on_success: string; on_failure: string; 
    next_step_id_on_success: string; next_step_id_on_failure: string;
    is_active: boolean 
}>) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_steps').update(payload).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function deleteStep(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_steps').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function reorderSteps(workflowId: string, stepIds: string[]) {
    const { supabase } = await getAuthContext()
    for (let i = 0; i < stepIds.length; i++) {
        await supabase.from('outreach_steps').update({ step_order: i + 1 }).eq('id', stepIds[i])
    }
    revalidatePath('/outreach')
    return { success: true }
}

// ─── Triggers ────────────────────────────────────────────────

export async function getTriggers() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_triggers')
        .select('*, outreach_workflows(name)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function createTrigger(payload: { workflow_id: string; event_type: string; event_config: any }) {
    const { supabase, tenantId } = await getAuthContext()
    const { error } = await supabase.from('outreach_triggers').insert({
        tenant_id: tenantId,
        ...payload
    })
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function deleteTrigger(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_triggers').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function toggleTrigger(id: string, isActive: boolean) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_triggers').update({ is_active: isActive }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

// ─── Executions ──────────────────────────────────────────────


export async function getExecutions(workflowId?: string, status?: string) {
    const { supabase } = await getAuthContext()
    let query = supabase.from('outreach_executions')
        .select('*, customers(full_name, phone), sales(status, projects(name)), outreach_workflows(name)')
        .order('started_at', { ascending: false })
        .limit(100)
    if (workflowId) query = query.eq('workflow_id', workflowId)
    if (status) query = query.eq('status', status)
    const { data } = await query
    return data || []
}

export async function getExecutionLogs(executionId: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_step_logs')
        .select('*, outreach_steps(name, action_type)')
        .eq('execution_id', executionId)
        .order('executed_at', { ascending: true })
    return data || []
}

export async function getDetailedCallLogs(limit: number = 50) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_step_logs')
        .select(`
            *,
            outreach_steps(name, action_type, config),
            outreach_executions(
                id, status, current_step_order,
                customers(id, full_name, phone, email),
                sales(id, status, projects(name)),
                outreach_workflows(name)
            )
        `)
        .in('channel', ['ai_call', 'whatsapp', 'sms'])
        .order('executed_at', { ascending: false })
        .limit(limit)
    return data || []
}

export async function pauseExecution(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_executions')
        .update({ status: 'paused', paused_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function resumeExecution(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_executions')
        .update({ status: 'active', paused_at: null, next_action_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function stopExecution(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_executions')
        .update({ status: 'stopped', completed_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function stopWorkflow(workflowId: string) {
    const { supabase, tenantId } = await getAuthContext()
    // Tüm aktif/bekleyen execution'ları durdur
    const { error, count } = await supabase.from('outreach_executions')
        .update({ status: 'stopped', completed_at: new Date().toISOString() })
        .eq('workflow_id', workflowId)
        .eq('tenant_id', tenantId)
        .in('status', ['active', 'waiting', 'pending'])
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true, stopped: count || 0 }
}

// ─── Launch Workflow ─────────────────────────────────────────

export async function launchWorkflow(workflowId: string) {
    const { tenantId } = await getAuthContext()
    if (!tenantId) return { error: 'No tenant' }

    const adminDb = createAdminClient()

    const { data: workflow } = await adminDb.from('outreach_workflows')
        .select('segment_id, max_leads_per_day')
        .eq('id', workflowId)
        .single()

    if (!workflow?.segment_id) return { error: 'No segment configured for this workflow' }

    const allLeadIds = await resolveSegment(workflow.segment_id)
    if (!allLeadIds.length) return { error: 'No matching leads found for this segment' }

    // Zaten işlenmiş olanları çıkar (completed, converted, active, waiting)
    const isLqSource = allLeadIds.length > 0 && allLeadIds[0].startsWith('lq:')
    const matchIds = isLqSource 
        ? allLeadIds.map(id => id.replace('lq:', ''))
        : allLeadIds

    const chunkArray = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const chunks = chunkArray(matchIds, 150);
    const existingPromises = chunks.map(chunk => 
        adminDb
            .from('outreach_executions')
            .select('customer_id, sale_id')
            .eq('workflow_id', workflowId)
            .in('status', ['active', 'waiting', 'completed', 'converted'])
            .in(isLqSource ? 'customer_id' : 'sale_id', chunk)
    );
    const results = await Promise.all(existingPromises);
    const existing = results.flatMap(r => r.data || []);

    const processedIds = new Set(
        existing.map(e => isLqSource ? e.customer_id : e.sale_id).filter(Boolean)
    );

    const remainingIds = allLeadIds.filter(id => {
        const matchId = isLqSource ? id.replace('lq:', '') : id
        return !processedIds.has(matchId)
    })

    if (!remainingIds.length) return { error: 'Tüm leadler zaten işlenmiş — yeni kayıt yok' }

    // Günlük limit uygula
    const limited = remainingIds.slice(0, workflow.max_leads_per_day || 50)

    const result = await startWorkflowForLeads(workflowId, limited, tenantId)

    // Hemen aramalara başla — cron'u bekleme
    if (result.started > 0) {
        processOutreachQueue().catch(err => 
            console.error('[Outreach] Queue processing error after launch:', err.message)
        )
    }

    revalidatePath('/outreach')
    return { success: true, ...result }
}

export async function getWhatsAppTemplates() {
    const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    let ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    if (!PHONE_ID || !ACCESS_TOKEN) return []
    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '')

    // WABA_ID varsa direkt API'den çek
    if (WABA_ID) {
        try {
            const res = await fetch(
                `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?fields=name,status,components&limit=100&access_token=${ACCESS_TOKEN}`
            )
            const data = await res.json()
            if (data.data) {
                return data.data
                    .filter((t: any) => t.status === 'APPROVED')
                    .map((t: any) => {
                        const body = t.components?.find((c: any) => c.type === 'BODY')?.text || ''
                        const params = (body.match(/\{\{[^}]+\}\}/g) || []).length
                        return { name: t.name, status: t.status, body, params }
                    })
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
            }
        } catch { /* fallthrough */ }
    }

    // Fallback: DB'deki kayıtlı şablon listesi
    const { tenantId } = await getAuthContext()
    const supabase = createAdminClient()
    const { data: tenant } = await supabase
        .from('tenants')
        .select('wa_template_list')
        .eq('id', tenantId)
        .single()

    if (tenant?.wa_template_list && Array.isArray(tenant.wa_template_list)) {
        return tenant.wa_template_list
    }

    // Son çare: hardcoded mevcut şablonlar
    return [
        { name: 'novo_talep_alindi', status: 'APPROVED', body: 'Merhaba {{1}}, talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.', params: 1 },
        { name: 'novo_izmir_versiyon_a', status: 'APPROVED', body: 'Merhaba {{customer_name}}, NOVO City İzmir projemiz için talep bırakmıştınız...', params: 1 },
    ]
}



// ─── Stats ───────────────────────────────────────────────────

export async function getOutreachStats() {
    const { supabase } = await getAuthContext()

    const [active, completed, converted, totalCalls, totalWhatsApp, totalSms] = await Promise.all([
        supabase.from('outreach_executions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('outreach_executions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('outreach_executions').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
        supabase.from('outreach_step_logs').select('id', { count: 'exact', head: true }).eq('channel', 'ai_call'),
        supabase.from('outreach_step_logs').select('id', { count: 'exact', head: true }).eq('channel', 'whatsapp'),
        supabase.from('outreach_step_logs').select('id', { count: 'exact', head: true }).eq('channel', 'sms'),
    ])

    return {
        activeExecutions: active.count || 0,
        completedExecutions: completed.count || 0,
        convertedExecutions: converted.count || 0,
        totalCalls: totalCalls.count || 0,
        totalWhatsApp: totalWhatsApp.count || 0,
        totalSms: totalSms.count || 0,
    }
}

// ─── Opt-outs ────────────────────────────────────────────────

export async function getOptouts() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_optouts')
        .select('*, customers(full_name)')
        .order('opted_out_at', { ascending: false })
    return data || []
}

export async function addOptout(customerId: string, phone: string, channel: string = 'all', reason?: string) {
    const { supabase, tenantId } = await getAuthContext()
    const { error } = await supabase.from('outreach_optouts').insert({
        tenant_id: tenantId, customer_id: customerId, phone, channel, reason,
    })
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function removeOptout(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_optouts').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

// ─── Workflow Monitor ────────────────────────────────────────

export async function getWorkflowMonitor(workflowId: string, page: number = 1) {
    const { tenantId } = await getAuthContext()
    if (!tenantId) return { error: 'No tenant' }

    const adminDb = createAdminClient()
    const PAGE_SIZE = 50

    // Get workflow info
    const { data: workflow } = await adminDb.from('outreach_workflows')
        .select('id, name, is_active, max_leads_per_day, total_executions, outreach_segments(name)')
        .eq('id', workflowId)
        .single()

    if (!workflow) return { error: 'Workflow not found' }

    // Get total counts by status (for header stats — always full, paginated to avoid 1000 limit)
    const allExecs: any[] = []
    let fromExec = 0
    let hasMoreExecs = true
    while (hasMoreExecs && allExecs.length < 50000) {
        const { data: chunk, error } = await adminDb.from('outreach_executions')
            .select('status, started_at')
            .eq('workflow_id', workflowId)
            .range(fromExec, fromExec + 999)
        if (error) {
            console.error('[getWorkflowMonitor] error fetching executions chunk:', error)
            break
        }
        if (!chunk || chunk.length === 0) {
            hasMoreExecs = false
        } else {
            allExecs.push(...chunk)
            if (chunk.length < 1000) {
                hasMoreExecs = false
            } else {
                fromExec += 1000
            }
        }
    }

    const statusCounts = { active: 0, waiting: 0, completed: 0, converted: 0, failed: 0 }
    allExecs.forEach((e: any) => {
        if (e.status in statusCounts) statusCounts[e.status as keyof typeof statusCounts]++
    })
    const totalCount = allExecs.length

    // Get paginated executions with customer info
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: executions } = await adminDb.from('outreach_executions')
        .select(`
            id, status, current_step_order, next_action_at, started_at, completed_at,
            customers(id, full_name, phone),
            outreach_workflows(name)
        `)
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .range(from, to)

    // Get step logs for this page's executions
    const executionIds = executions?.map(e => e.id) || []
    let logs: any[] = []
    if (executionIds.length > 0) {
        const { data: logData } = await adminDb.from('outreach_step_logs')
            .select('execution_id, channel, status, template_name, message_content, call_duration_seconds, call_outcome, call_summary, cost_amount, executed_at, completed_at')
            .in('execution_id', executionIds)
            .order('executed_at', { ascending: false })
        logs = logData || []
    }

    // Today's count
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount = allExecs?.filter((e: any) => new Date(e.started_at) >= todayStart).length || 0

    return {
        workflow,
        executions: executions || [],
        logs,
        stats: statusCounts,
        totalCount,
        todayCount,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
    }
}

export async function getWhatsAppResponses(filters: {
    search?: string
    workflowId?: string
    interestLevel?: string
    interestLevels?: string[]
    notified?: string
    page?: number
    limit?: number
}) {
    const { supabase, tenantId } = await getAuthContext()
    if (!tenantId) return { data: [], total: 0, stats: { total: 0, hot: 0, warm: 0, notified: 0 } }

    const page = filters.page || 1
    const limit = filters.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    let selectString = '*'
    if (filters.workflowId) {
        selectString = `
            *,
            customers!inner (
                id,
                full_name,
                phone,
                outreach_executions!inner (
                    id,
                    workflow_id
                )
            )
        `
    } else if (filters.search) {
        selectString = `
            *,
            customers!inner (
                id,
                full_name,
                phone
            )
        `
    }

    let query = supabase
        .from('whatsapp_conversations')
        .select(selectString, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('last_message_at', { ascending: false })

    let statsQuery = supabase
        .from('whatsapp_conversations')
        .select(selectString)
        .eq('tenant_id', tenantId)

    if (filters.workflowId) {
        query = query.eq('customers.outreach_executions.workflow_id', filters.workflowId)
        statsQuery = statsQuery.eq('customers.outreach_executions.workflow_id', filters.workflowId)
    }

    if (filters.search) {
        const cleanSearch = filters.search.trim()
        query = query.or(`full_name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`, { foreignTable: 'customers' })
        statsQuery = statsQuery.or(`full_name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`, { foreignTable: 'customers' })
    }

    if (filters.interestLevels && filters.interestLevels.length > 0 && !filters.interestLevels.includes('all')) {
        query = query.in('lead_score', filters.interestLevels)
        statsQuery = statsQuery.in('lead_score', filters.interestLevels)
    } else if (filters.interestLevel && filters.interestLevel !== 'all') {
        query = query.eq('lead_score', filters.interestLevel)
        statsQuery = statsQuery.eq('lead_score', filters.interestLevel)
    }

    if (filters.notified && filters.notified !== 'all') {
        const notifiedBool = filters.notified === 'yes'
        query = query.eq('hot_lead_notified', notifiedBool)
        statsQuery = statsQuery.eq('hot_lead_notified', notifiedBool)
    }

    // Sayfalanmış veriyi çek
    const { data: conversations, count, error } = await query.range(from, to)

    if (error) {
        console.error('[getWhatsAppResponses] error fetching conversations:', error)
        return { data: [], total: 0, stats: { total: 0, hot: 0, warm: 0, notified: 0 } }
    }

    if (!conversations || conversations.length === 0) {
        return { data: [], total: count || 0, stats: { total: 0, hot: 0, warm: 0, notified: 0 } }
    }

    // 4. İstatistikleri Filtrelenmiş Küme Üzerinden Hesapla (Sayfalamadan bağımsız)
    const { data: statsData } = await statsQuery
    const stats = {
        total: statsData?.length || 0,
        hot: statsData?.filter((c: any) => c.lead_score === 'hot').length || 0,
        warm: statsData?.filter((c: any) => c.lead_score === 'warm').length || 0,
        notified: statsData?.filter((c: any) => c.hot_lead_notified).length || 0
    }

    const resCustomerIds: string[] = conversations.map((c: any) => c.customer_id).filter(Boolean) as string[]

    // Müşteri kartvizit bilgilerini çek
    const { data: customersData } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .in('id', resCustomerIds)
    const customerMap = new Map<string, any>(customersData?.map((c: any) => [c.id, c]) || [])

    // lead_qualifications bilgilerini çek (call_notes gerekçeleri için)
    const { data: qualifications } = await supabase
        .from('lead_qualifications')
        .select('customer_id, call_notes, interest_level, status')
        .eq('tenant_id', tenantId)
        .in('customer_id', resCustomerIds)
    const qualMap = new Map<string, any>(qualifications?.map((q: any) => [q.customer_id, q]) || [])

    // Kampanya (Workflow) ilişkilerini bulmak için execution kayıtlarını çek (en yeniye göre sıralı)
    let execsQuery = supabase
        .from('outreach_executions')
        .select('customer_id, workflow_id, started_at')
        .eq('tenant_id', tenantId)
        .in('customer_id', resCustomerIds)
        .order('started_at', { ascending: false })
    
    if (filters.workflowId) {
        execsQuery = execsQuery.eq('workflow_id', filters.workflowId)
    }

    const { data: execsData } = await execsQuery
    
    const workflowIds: string[] = Array.from(new Set((execsData || []).map((e: any) => e.workflow_id).filter(Boolean) as string[]))
    
    let workflowMap = new Map<string, string>()
    if (workflowIds.length > 0) {
        const { data: workflowsData } = await supabase
            .from('outreach_workflows')
            .select('id, name')
            .in('id', workflowIds)
        workflowMap = new Map<string, string>(workflowsData?.map((w: any) => [w.id, w.name]) || [])
    }

function normalizeTurkish(str: string): string {
    return str
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

    // Her müşteri için en güncel workflow bilgisini eşle
    const customerWorkflowMap = new Map<string, { id: string; name: string }>()
    ;(execsData || []).forEach((exec: any) => {
        if (exec.customer_id && exec.workflow_id && !customerWorkflowMap.has(exec.customer_id)) {
            const wfName = workflowMap.get(exec.workflow_id) || 'Bilinmeyen Kampanya'
            customerWorkflowMap.set(exec.customer_id, { id: exec.workflow_id, name: wfName })
        }
    })

    const mergedData = conversations.map((conv: any) => {
        const customer = customerMap.get(conv.customer_id)
        const workflow = customerWorkflowMap.get(conv.customer_id)
        const qual = qualMap.get(conv.customer_id)

        let interestLevel = conv.lead_score || qual?.interest_level || 'unknown'
        const lastMsgNormalized = normalizeTurkish(conv.last_message_preview || '')
        if (lastMsgNormalized.includes('hayir tesekkurler')) {
            interestLevel = 'disqualified'
        } else if (lastMsgNormalized.includes('evet arayin')) {
            interestLevel = 'call_requested'
        }

        return {
            id: conv.id,
            customer_id: conv.customer_id,
            customer_name: customer?.full_name || 'Bilinmeyen Müşteri',
            customer_phone: customer?.phone || '-',
            workflow_id: workflow?.id || null,
            workflow_name: workflow?.name || '-',
            interest_level: interestLevel,
            call_notes: qual?.call_notes || '',
            last_message_preview: conv.last_message_preview || '-',
            last_message_at: conv.last_message_at || conv.updated_at || conv.created_at,
            hot_lead_notified: conv.hot_lead_notified || false,
            status: qual?.status || 'new'
        }
    })

    return {
        data: mergedData,
        total: count || 0,
        stats
    }
}

