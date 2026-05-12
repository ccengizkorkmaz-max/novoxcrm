'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveSegment, startWorkflowForLeads } from '@/lib/outreach/engine'

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
    const { data } = await supabase.from('outreach_workflows')
        .select('*, outreach_segments(name), outreach_steps(*)')
        .order('created_at', { ascending: false })
    // Sort steps by step_order within each workflow
    if (data) {
        data.forEach((w: any) => {
            if (w.outreach_steps) {
                w.outreach_steps.sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
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

    const { data: workflow } = await (await createClient()).from('outreach_workflows')
        .select('segment_id, max_leads_per_day')
        .eq('id', workflowId)
        .single()

    if (!workflow?.segment_id) return { error: 'No segment configured for this workflow' }

    const saleIds = await resolveSegment(workflow.segment_id)
    if (!saleIds.length) return { error: 'No matching leads found for this segment' }

    // Limit to max_leads_per_day
    const limited = saleIds.slice(0, workflow.max_leads_per_day || 50)

    const result = await startWorkflowForLeads(workflowId, limited, tenantId)
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

// ─── Event Triggers ──────────────────────────────────────────

export async function getTriggers() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_event_triggers')
        .select('*, outreach_workflows(name)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function createTrigger(payload: { workflow_id: string; event_type: string; event_config: any }) {
    const { supabase, tenantId } = await getAuthContext()
    const { data, error } = await supabase.from('outreach_event_triggers').insert({
        tenant_id: tenantId,
        ...payload
    }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true, data }
}

export async function toggleTrigger(id: string, isActive: boolean) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_event_triggers').update({ is_active: isActive }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}

export async function deleteTrigger(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('outreach_event_triggers').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/outreach')
    return { success: true }
}
