'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { resolveSegment, startWorkflowForLeads, processOutreachQueue } from '@/lib/outreach/engine'
import { simulateWorkflow, type WorkflowComputedParams } from '@/lib/outreach/workflow-simulator'

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

    // Leads source (Advance CRM mode)
    if (filters.source === 'leads') {
        let query = supabase.from('leads')
            .select('id, status, full_name, phone', { count: 'exact', head: false })
            .eq('tenant_id', tenantId)
        if (filters.statuses?.length) query = query.in('status', filters.statuses)
        if (filters.exclude_statuses?.length) {
            for (const es of filters.exclude_statuses) {
                query = query.neq('status', es)
            }
        }
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
        if (filters.unassigned) query = query.is('assigned_to', null)
        if (filters.date_from) query = query.gte('created_at', filters.date_from)
        if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')

        const { data, count } = await query.limit(200)
        const preview = data?.map(d => ({
            id: d.id,
            status: d.status,
            customers: {
                full_name: d.full_name,
                phone: d.phone
            }
        })) || []
        return { count: count || 0, preview: preview.slice(0, 10) }
    }

    // Lead Qualifications source
    if (filters.source === 'lead_qualifications') {
        let query = supabase.from('lead_qualifications')
            .select('id, status, customers!inner(full_name, phone, tags, city, profile_data)', { count: 'exact', head: false })
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
        // Extended filters
        if (filters.tags?.length) query = query.contains('customers.tags', filters.tags)
        if (filters.city) query = query.ilike('customers.city', `%${filters.city}%`)
        const { data, count } = await query.limit(10)
        return { count: count || 0, preview: data || [] }
    }

    // Default: Sales source — determine if we need demand joins
    const needsDemandJoin = !!(filters.demand_filters?.room_count || filters.demand_filters?.min_price || 
        filters.demand_filters?.max_price || filters.demand_filters?.property_type || filters.demand_filters?.investment_purpose)
    
    const selectFields = needsDemandJoin 
        ? 'id, customers!inner(full_name, phone, tags, city, profile_data), customer_demands(room_count, min_price, max_price, property_type, investment_purpose)'
        : 'id, customers!inner(full_name, phone, tags, city, profile_data)'

    let query = supabase.from('sales').select(selectFields, { count: 'exact', head: false })
        .eq('tenant_id', tenantId).neq('status', 'Inbox')
    
    if (filters.statuses?.length) query = query.in('status', filters.statuses)
    if (filters.project_id) query = query.eq('project_id', filters.project_id)
    if (filters.unassigned) query = query.is('assigned_to', null)
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
    if (filters.date_from) query = query.gte('created_at', filters.date_from)
    if (filters.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')
    
    // Extended customer filters
    if (filters.tags?.length) query = query.contains('customers.tags', filters.tags)
    if (filters.city) query = query.ilike('customers.city', `%${filters.city}%`)

    const { data, count } = await query.limit(200)

    // Client-side filtering for profile_data and demand_filters (JSONB fields can't be easily filtered in Supabase)
    let filteredData = data || []
    let adjustedCount = count || 0

    if (filters.profile_data && Object.keys(filters.profile_data).length > 0) {
        const beforeLen = filteredData.length
        filteredData = filteredData.filter((item: any) => {
            const pd = item.customers?.profile_data
            if (!pd) return false
            for (const [key, filterValue] of Object.entries(filters.profile_data)) {
                const actualValue = pd[key]
                if (actualValue === undefined || actualValue === null) return false
                // Numeric comparison (children_count): filter means "at least this many"
                if (typeof filterValue === 'number') {
                    if (typeof actualValue !== 'number' || actualValue < filterValue) return false
                    continue
                }
                // String comparison: case-insensitive contains (e.g. "BMW" matches "BMW X5")
                if (typeof filterValue === 'string' && typeof actualValue === 'string') {
                    if (!actualValue.toLowerCase().includes(filterValue.toLowerCase())) return false
                    continue
                }
                // Fallback: exact match
                if (actualValue !== filterValue) return false
            }
            return true
        })
        // Estimate adjusted count based on filter ratio
        if (beforeLen > 0) {
            adjustedCount = Math.round(adjustedCount * (filteredData.length / beforeLen))
        }
    }

    if (needsDemandJoin && filters.demand_filters) {
        const df = filters.demand_filters
        const beforeLen = filteredData.length
        filteredData = filteredData.filter((item: any) => {
            const demands = Array.isArray(item.customer_demands) ? item.customer_demands : [item.customer_demands].filter(Boolean)
            if (demands.length === 0) return false
            return demands.some((d: any) => {
                if (df.room_count?.length && (!d.room_count || !df.room_count.some((rc: string) => d.room_count?.includes(rc)))) return false
                if (df.min_price && (!d.max_price || d.max_price < df.min_price)) return false
                if (df.max_price && (!d.min_price || d.min_price > df.max_price)) return false
                if (df.property_type && d.property_type !== df.property_type) return false
                if (df.investment_purpose && d.investment_purpose !== df.investment_purpose) return false
                return true
            })
        })
        if (beforeLen > 0) {
            adjustedCount = Math.round(adjustedCount * (filteredData.length / beforeLen))
        }
    }

    return { count: adjustedCount, preview: filteredData.slice(0, 10) }
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
                .select('workflow_id, status, started_at, current_step_order, current_retry_count')
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
            const wfExecs = execStats.filter((e: any) => e.workflow_id === w.id)
            const called = wfExecs.filter((e: any) => (e.current_step_order || 1) > 1 || (e.current_retry_count || 0) > 0).length
            w._exec_stats = {
                total: wfExecs.length,
                active: wfExecs.filter((e: any) => e.status === 'active' || e.status === 'waiting').length,
                completed: wfExecs.filter((e: any) => e.status === 'completed' || e.status === 'stopped').length,
                converted: wfExecs.filter((e: any) => e.status === 'converted').length,
                failed: wfExecs.filter((e: any) => e.status === 'failed').length,
                called,
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
    start_date?: string
    end_date?: string
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
        const stepsPayload = steps.map(s => ({ ...s, workflow_id: workflow.id, is_active: true }))
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
    start_date: string
    end_date: string
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
    on_success?: string; on_failure?: string; on_no_answer?: string; on_busy?: string;
    next_step_id_on_success?: string; next_step_id_on_failure?: string;
}) {
    const { supabase } = await getAuthContext()
    const { data, error } = await supabase.from('outreach_steps')
        .insert({ workflow_id: workflowId, is_active: true, ...step })
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
        .select('*, customers(full_name, phone), leads(full_name, phone), sales(status, projects(name)), outreach_workflows(name)')
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

export async function getDetailedCallLogs(limit: number = 200) {
    const { supabase, tenantId } = await getAuthContext()
    const { data } = await supabase.from('outreach_step_logs')
        .select(`
            *,
            outreach_steps(name, action_type, config),
            outreach_executions!inner(
                id, status, current_step_order, tenant_id,
                customers(id, full_name, phone, email),
                leads(id, full_name, phone, email),
                sales(id, status, projects(name)),
                outreach_workflows(name)
            )
        `)
        .eq('outreach_executions.tenant_id', tenantId)
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

    // ─── Race Condition Guard: Çalışan akış tekrar başlatılamaz ───
    const { count: activeCount } = await adminDb.from('outreach_executions')
        .select('id', { count: 'exact', head: true })
        .eq('workflow_id', workflowId)
        .in('status', ['active', 'waiting'])
    if (activeCount && activeCount > 0) {
        return { error: `Bu akis zaten calisiyor (${activeCount} aktif islem). Once durdurun.` }
    }

    // ─── Resume Guard: Durdurulan execution'ları kaldığı yerden devam ettir ───
    const { data: stoppedExecs, count: stoppedCount } = await adminDb.from('outreach_executions')
        .select('id', { count: 'exact' })
        .eq('workflow_id', workflowId)
        .eq('status', 'stopped')
        .limit(5000)
    
    let resumed = 0
    if (stoppedExecs && stoppedExecs.length > 0) {
        const stoppedIds = stoppedExecs.map(e => e.id)
        // Chunk updates to avoid hitting Supabase limits
        const chunkArray = <T>(arr: T[], size: number): T[][] => {
            const chunks: T[][] = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        }
        const idChunks = chunkArray(stoppedIds, 200)
        for (const chunk of idChunks) {
            const { count } = await adminDb.from('outreach_executions')
                .update({ 
                    status: 'active', 
                    completed_at: null,
                    next_action_at: new Date().toISOString()
                })
                .in('id', chunk)
                .eq('status', 'stopped') // Extra safety: only resume still-stopped
            resumed += count || 0
        }
        console.log(`[Outreach] ▶️ Resume: ${resumed} durdurulan execution tekrar aktif edildi`)
    }

    const { data: workflow } = await adminDb.from('outreach_workflows')
        .select('segment_id, max_leads_per_day, working_hours_start, working_hours_end, outreach_steps(*)')
        .eq('id', workflowId)
        .single()

    if (!workflow?.segment_id) {
        if (resumed > 0) {
            revalidatePath('/outreach')
            return { success: true, started: 0, resumed, skipped: 0 }
        }
        return { error: 'No segment configured for this workflow' }
    }

    const allLeadIds = await resolveSegment(workflow.segment_id)
    if (!allLeadIds.length && resumed === 0) return { error: 'No matching leads found for this segment' }

    const chunkArray2 = <T>(arr: T[], size: number): T[][] => {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    // Partition IDs by type to fetch sales mapping if needed
    const saleItemIds = allLeadIds.filter(id => !id.startsWith('lq:') && !id.startsWith('lead:'))
    let salesMap: Record<string, string> = {}
    if (saleItemIds.length > 0) {
        const chunks = chunkArray2(saleItemIds, 150)
        const promises = chunks.map(chunk =>
            adminDb
                .from('sales')
                .select('id, customer_id')
                .in('id', chunk)
        )
        const results = await Promise.all(promises)
        const dbSales = results.flatMap(r => r.data || [])
        dbSales.forEach(s => {
            if (s.customer_id) salesMap[s.id] = s.customer_id
        })
    }

    // Helper to get normalized target ID & type for deduplication
    const getNormalizedId = (id: string): { type: 'customer' | 'lead'; targetId: string } | null => {
        if (id.startsWith('lead:')) return { type: 'lead', targetId: id.replace('lead:', '') }
        if (id.startsWith('lq:')) return { type: 'customer', targetId: id.replace('lq:', '') }
        const cid = salesMap[id]
        return cid ? { type: 'customer', targetId: cid } : null
    }

    // Check existing executions for customer_ids and lead_ids
    const checkCustomerIds = [...new Set(allLeadIds.map(id => getNormalizedId(id)).filter(x => x?.type === 'customer').map(x => x!.targetId))]
    const checkLeadIds = [...new Set(allLeadIds.map(id => getNormalizedId(id)).filter(x => x?.type === 'lead').map(x => x!.targetId))]

    const processedCustomerIds = new Set<string>()
    const processedLeadIds = new Set<string>()

    if (checkCustomerIds.length > 0) {
        const chunks = chunkArray2(checkCustomerIds, 150)
        const promises = chunks.map(chunk =>
            adminDb
                .from('outreach_executions')
                .select('customer_id')
                .eq('workflow_id', workflowId)
                .in('status', ['active', 'waiting', 'completed', 'converted', 'stopped'])
                .in('customer_id', chunk)
        )
        const results = await Promise.all(promises)
        results.flatMap(r => r.data || []).forEach(e => {
            if (e.customer_id) processedCustomerIds.add(e.customer_id)
        })
    }

    if (checkLeadIds.length > 0) {
        const chunks = chunkArray2(checkLeadIds, 150)
        const promises = chunks.map(chunk =>
            adminDb
                .from('outreach_executions')
                .select('lead_id')
                .eq('workflow_id', workflowId)
                .in('status', ['active', 'waiting', 'completed', 'converted', 'stopped'])
                .in('lead_id', chunk)
        )
        const results = await Promise.all(promises)
        results.flatMap(r => r.data || []).forEach(e => {
            if (e.lead_id) processedLeadIds.add(e.lead_id)
        })
    }

    // Filter remaining IDs
    const seenIds = new Set<string>()
    const remainingIds = allLeadIds.filter(id => {
        const norm = getNormalizedId(id)
        if (!norm) return false
        if (norm.type === 'customer' && processedCustomerIds.has(norm.targetId)) return false
        if (norm.type === 'lead' && processedLeadIds.has(norm.targetId)) return false
        if (seenIds.has(norm.targetId)) return false
        seenIds.add(norm.targetId)
        return true
    })

    if (!remainingIds.length) {
        revalidatePath('/outreach')
        if (resumed > 0) {
            return { success: true, started: 0, resumed, skipped: 0, message: `${resumed} durdurulan islem devam ettiriliyor.` }
        }
        return { success: true, started: 0, skipped: 0, message: 'Kuyruk tetiklendi, cron dongusunde aramalar devam edecek.' }
    }

    // ─── Auto-Tuning: Simülasyon çalıştır ve computed_params kaydet ───
    let computedParams: WorkflowComputedParams | null = null
    try {
        // Tenant'ın max concurrent lines ayarını al
        const { data: tenantData } = await adminDb.from('tenants')
            .select('ai_outreach_settings')
            .eq('id', tenantId)
            .single()
        const maxLines = tenantData?.ai_outreach_settings?.max_concurrent_calls || 5

        const wfSteps = (workflow.outreach_steps || []).sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))

        computedParams = simulateWorkflow({
            segmentSize: remainingIds.length + resumed,
            maxConcurrentLines: maxLines,
            steps: wfSteps.map((s: any) => ({
                type: s.action_type,
                retry: s.config?.retry,
                wait_minutes: s.config?.wait_minutes,
                config: s.config,
            })),
            workingHoursStart: parseInt(workflow.working_hours_start || '9'),
            workingHoursEnd: parseInt(workflow.working_hours_end || '18'),
            cronIntervalMinutes: 1,
            maxLeadsPerDay: workflow.max_leads_per_day || 100,
        })

        // computed_params'ı workflow'a kaydet
        await adminDb.from('outreach_workflows')
            .update({ computed_params: computedParams })
            .eq('id', workflowId)

        console.log(`[Outreach] Simulasyon: ${remainingIds.length + resumed} kisi, ~${computedParams.estimated_completion_minutes}dk, batch=${computedParams.optimal_batch_size}`)
    } catch (simErr: any) {
        console.warn('[Outreach] Simulasyon hatasi (non-blocking):', simErr.message)
    }

    // Günlük limit uygula (resume edilenler limit dışı — zaten kuyruktaydılar)
    const limited = remainingIds.slice(0, workflow.max_leads_per_day || 50)

    const result = await startWorkflowForLeads(workflowId, limited, tenantId)

    // Proactively run the queue process so that campaigns start running immediately!
    try {
        processOutreachQueue().catch((err: any) => console.error('[launchWorkflow] processQueue background error:', err.message))
    } catch (e: any) {
        console.error('[launchWorkflow] processQueue error:', e.message)
    }

    revalidatePath('/outreach')
    return { success: true, ...result, resumed, computed_params: computedParams }
}

// ─── Workflow Simülasyonu (UI Preview) ───────────────────────

export async function simulateWorkflowAction(workflowId: string): Promise<{ data?: WorkflowComputedParams; error?: string }> {
    const { tenantId } = await getAuthContext()
    if (!tenantId) return { error: 'No tenant' }

    const adminDb = createAdminClient()

    const { data: workflow } = await adminDb.from('outreach_workflows')
        .select('segment_id, working_hours_start, working_hours_end, max_leads_per_day, outreach_steps(*)')
        .eq('id', workflowId)
        .single()

    if (!workflow?.segment_id) return { error: 'Segment tanımlı değil' }

    // Segment büyüklüğünü hesapla
    const allLeadIds = await resolveSegment(workflow.segment_id)

    // Tenant max lines
    const { data: tenantData } = await adminDb.from('tenants')
        .select('ai_outreach_settings')
        .eq('id', tenantId)
        .single()
    const maxLines = tenantData?.ai_outreach_settings?.max_concurrent_calls || 5

    const wfSteps = (workflow.outreach_steps || []).sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))

    const result = simulateWorkflow({
        segmentSize: allLeadIds.length,
        maxConcurrentLines: maxLines,
        steps: wfSteps.map((s: any) => ({
            type: s.action_type,
            retry: s.config?.retry,
            wait_minutes: s.config?.wait_minutes,
            config: s.config,
        })),
        workingHoursStart: parseInt(workflow.working_hours_start || '9'),
        workingHoursEnd: parseInt(workflow.working_hours_end || '18'),
        cronIntervalMinutes: 1,
        maxLeadsPerDay: workflow.max_leads_per_day || 100,
    })

    // computed_params'ı workflow'a kaydet
    await adminDb.from('outreach_workflows')
        .update({ computed_params: result })
        .eq('id', workflowId)

    return { data: result }
}

export async function getWhatsAppTemplates() {
    const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    let ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    if (ACCESS_TOKEN) {
        ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '')
    }

    // 1. WABA_ID ve ACCESS_TOKEN varsa Meta API'den çek (maksimum 2.5 saniye bekle)
    if (WABA_ID && ACCESS_TOKEN) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2500)

            const res = await fetch(
                `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?fields=name,status,components&limit=100&access_token=${ACCESS_TOKEN}`,
                { 
                    next: { revalidate: 60 },
                    signal: controller.signal
                }
            )
            clearTimeout(timeoutId)
            const data = await res.json()
            if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                return data.data
                    .filter((t: any) => t.status === 'APPROVED')
                    .map((t: any) => {
                        const body = t.components?.find((c: any) => c.type === 'BODY')?.text || ''
                        const params = (body.match(/\{\{[^}]+\}\}/g) || []).length
                        return { name: t.name, status: t.status, body, params }
                    })
                    .sort((a: any, b: any) => a.name.localeCompare(b.name))
            }
        } catch (err: any) {
            console.error('[getWhatsAppTemplates] Meta API error or timeout:', err.message)
        }
    }

    // 2. Fallback: DB'deki kayıtlı şablon listesi
    try {
        const { tenantId } = await getAuthContext()
        if (tenantId) {
            const supabase = createAdminClient()
            const { data: tenant } = await supabase
                .from('tenants')
                .select('wa_template_list')
                .eq('id', tenantId)
                .single()

            if (tenant?.wa_template_list && Array.isArray(tenant.wa_template_list) && tenant.wa_template_list.length > 0) {
                return tenant.wa_template_list
            }
        }
    } catch {
        /* Auth/DB error ignore, return fallback list */
    }

    // 3. Son çare: Yaygın ve aktif Meta onaylı varsayılan şablonlar
    return [
        { name: 'novo_talep_alindi', status: 'APPROVED', body: 'Merhaba {{1}}, {{2}} hakkındaki talebiniz alınmıştır.', params: 2 },
        { name: 'novo_izmir_versiyon_a', status: 'APPROVED', body: 'Merhaba {{customer_name}}, NOVO City İzmir projemiz için talep bırakmıştınız...', params: 1 },
        { name: 'novo_izmir_versiyon_b', status: 'APPROVED', body: 'Merhaba {{customer_name}}, NOVO City İzmir Projemizde ön lansman fiyatları aktif...', params: 1 },
        { name: 'novo_kampanya_genel_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Şirketler Grubu projeleri hakkında bilgi...', params: 1 },
        { name: 'novo_kampanya_izmir_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo City Izmir projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'novo_kampanya_etili_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Park 1 Etili projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'novo_kampanya_kocaeli_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Park 4 Kocaeli projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'novo_kampanya_vista_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Park Vista projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'novo_kampanya_montenegro_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Park Montenegro projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'novo_kampanya_yalova_v2', status: 'APPROVED', body: 'Merhaba {{1}} 👋 Novo Park 2 Yalova projemiz hakkinda bilgi almistiniz.', params: 1 },
        { name: 'hot_lead_notification', status: 'APPROVED', body: '👤 Müşteri: {{1}}\n📞 Telefon: {{2}}\n⏰ Zaman: {{3}}\n📋 Özet: {{4}}', params: 4 },
        { name: 'novo_takip_cicek_butonlu', status: 'APPROVED', body: 'Merhaba {{1}}, Novo İnşaat’tan Maya ben. Kampanya dönemi başlattık...', params: 1 },
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
    const { supabase, user, profile, tenantId } = await getAuthContext()
    const { error } = await supabase.from('outreach_optouts').insert({
        tenant_id: tenantId, customer_id: customerId || null, phone, channel, reason,
    })
    if (error) return { error: error.message }

    // Audit log
    await supabase.from('outreach_optout_logs').insert({
        tenant_id: tenantId,
        customer_id: customerId || null,
        phone,
        channel,
        action: 'opted_out',
        reason: reason || 'Manuel eklendi',
        performed_by: user.id,
        performed_by_name: profile?.full_name || user.email,
        source: 'manual',
    })

    revalidatePath('/outreach')
    return { success: true }
}

export async function removeOptout(id: string) {
    const { supabase, user, profile, tenantId } = await getAuthContext()
    
    // Silmeden önce kaydı al (log için)
    const { data: existing } = await supabase.from('outreach_optouts').select('*').eq('id', id).single()
    
    const { error } = await supabase.from('outreach_optouts').delete().eq('id', id)
    if (error) return { error: error.message }

    // Audit log
    if (existing) {
        await supabase.from('outreach_optout_logs').insert({
            tenant_id: tenantId,
            customer_id: existing.customer_id || null,
            phone: existing.phone,
            channel: existing.channel,
            action: 'opted_in',
            reason: `Opt-out kaldırıldı (önceki sebep: ${existing.reason || '-'})`,
            performed_by: user.id,
            performed_by_name: profile?.full_name || user.email,
            source: 'manual',
        })
    }

    revalidatePath('/outreach')
    return { success: true }
}

export async function getOptoutLogs(limit: number = 50) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_optout_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    return data || []
}

// ─── Workflow Monitor ────────────────────────────────────────

export async function getWorkflowMonitor(workflowId: string, page: number = 1) {
    const { tenantId } = await getAuthContext()
    if (!tenantId) return { error: 'No tenant' }

    const adminDb = createAdminClient()
    const PAGE_SIZE = 50

    // Get workflow info
    const { data: workflow } = await adminDb.from('outreach_workflows')
        .select('id, name, is_active, max_leads_per_day, total_executions, computed_params, outreach_segments(name)')
        .eq('id', workflowId)
        .single()

    if (!workflow) return { error: 'Workflow not found' }

    // Detect which channels this workflow uses from its steps
    const { data: steps } = await adminDb.from('outreach_steps')
        .select('action_type')
        .eq('workflow_id', workflowId)
    const workflowChannels = new Set<string>()
    steps?.forEach((s: any) => {
        if (['ai_call', 'whatsapp', 'sms'].includes(s.action_type)) {
            workflowChannels.add(s.action_type)
        }
    })

    // 1. Get currently active phone calls (AI calls where status = 'sent' and completed_at is null)
    // We fetch these across the entire table to show at the top of the monitor
    // Only show calls from the last 15 minutes to avoid showing stale/stuck records
    const activeThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: activeLogs } = await adminDb.from('outreach_step_logs')
        .select(`
            execution_id, channel, status, template_name, message_content, call_duration_seconds, call_outcome, call_summary, cost_amount, executed_at, completed_at,
            outreach_executions (
                id, workflow_id, status, current_step_order, next_action_at, started_at, completed_at, current_retry_count,
                customers(id, full_name, phone),
                outreach_workflows(name)
            )
        `)
        .eq('channel', 'ai_call')
        .eq('status', 'sent')
        .is('completed_at', null)
        .gte('executed_at', activeThreshold)

    const activeExecutions: any[] = []
    const activeLogData: any[] = []
    const activeIds = new Set<string>()

    if (activeLogs) {
        activeLogs.forEach((l: any) => {
            const exec = l.outreach_executions
            if (exec && exec.id && exec.workflow_id === workflowId) {
                activeExecutions.push(exec)
                activeIds.add(exec.id)
                activeLogData.push({
                    execution_id: l.execution_id,
                    channel: l.channel,
                    status: l.status,
                    template_name: l.template_name,
                    message_content: l.message_content,
                    call_duration_seconds: l.call_duration_seconds,
                    call_outcome: l.call_outcome,
                    call_summary: l.call_summary,
                    cost_amount: l.cost_amount,
                    executed_at: l.executed_at,
                    completed_at: l.completed_at
                })
            }
        })
    }

    // 2. Get total counts by status (always full, paginated to avoid 1000 limit)
    const allExecs: any[] = []
    let fromExec = 0
    let hasMoreExecs = true
    while (hasMoreExecs && allExecs.length < 50000) {
        const { data: chunk, error } = await adminDb.from('outreach_executions')
            .select('status, customer_id, lead_id, started_at, current_step_order, current_retry_count')
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

    // De-duplicate: for each customer/lead, keep only the LATEST execution
    const customerLatest = new Map<string, any>()
    allExecs.forEach((e: any) => {
        const targetId = e.customer_id || e.lead_id
        if (!targetId) return
        const existing = customerLatest.get(targetId)
        if (!existing || (e.started_at && e.started_at > (existing.started_at || ''))) {
            customerLatest.set(targetId, e)
        }
    })

    const statusCounts = { 
        active: 0, 
        waiting: 0, 
        completed: 0, 
        converted: 0, 
        failed: 0,
        stopped: 0,
        // Detailed breakdowns — will be recalculated after call log fetch
        firstCallPending: 0,
        secondCallPending: 0,
        inWaitStep: 0,
        whatsappPending: 0,
        calledAtLeastOnce: 0,
        activeCallsCount: activeExecutions.length
    }

    // First pass: count statuses only
    customerLatest.forEach((e: any) => {
        if (e.status in statusCounts) {
            statusCounts[e.status as keyof typeof statusCounts]++
        }
    })
    const totalCount = customerLatest.size

    // 3. Get paginated executions with customer info
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data: executions } = await adminDb.from('outreach_executions')
        .select(`
            id, status, current_step_order, next_action_at, started_at, completed_at, current_retry_count,
            customers(id, full_name, phone),
            leads(id, full_name, phone),
            outreach_workflows(name)
        `)
        .eq('workflow_id', workflowId)
        .order('current_step_order', { ascending: false })
        .order('current_retry_count', { ascending: false })
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

    // Today's count — based on unique customers
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    let todayCount = 0
    customerLatest.forEach((e: any) => {
        if (e.started_at && new Date(e.started_at) >= todayStart) todayCount++
    })

    // 3.5 Get channel-specific stats from step logs
    // Fetch ALL communication logs for this workflow (ai_call, whatsapp, sms)
    const allChannelLogs: any[] = []
    let clPage = 0
    while (true) {
        const { data: clData, error: clErr } = await adminDb.from('outreach_step_logs')
            .select('execution_id, channel, status, external_id, call_summary, call_recording_url, call_outcome, outreach_executions!inner(workflow_id, customer_id, lead_id)')
            .eq('outreach_executions.workflow_id', workflowId)
            .in('channel', ['ai_call', 'whatsapp', 'sms'])
            .range(clPage * 1000, (clPage + 1) * 1000 - 1)
        if (clErr || !clData || clData.length === 0) break
        allChannelLogs.push(...clData)
        if (clData.length < 1000) break
        clPage++
    }

    // ── AI Call Stats ──
    const allCallLogs = allChannelLogs.filter(l => l.channel === 'ai_call' && l.external_id)
    const calledCustomerIds = new Set<string>()
    const spokeCustomerIds = new Set<string>()
    const pickedUpCustomerIds = new Set<string>()
    allCallLogs.forEach((l: any) => {
        const custId = (l.outreach_executions as any)?.customer_id || (l.outreach_executions as any)?.lead_id
        if (!custId) return
        calledCustomerIds.add(custId)
        if (l.call_summary) spokeCustomerIds.add(custId)
        else if (l.call_recording_url) pickedUpCustomerIds.add(custId)
    })

    const callStats = {
        totalRealCalls: allCallLogs.length,
        uniqueCalledCustomers: calledCustomerIds.size,
        spokeCustomers: spokeCustomerIds.size,
        pickedUpBriefCustomers: pickedUpCustomerIds.size,
    }

    // ── WhatsApp Stats ──
    const waLogs = allChannelLogs.filter(l => l.channel === 'whatsapp')
    const waSentCustomers = new Set<string>()
    const waFailedCount = waLogs.filter(l => l.status === 'failed').length
    waLogs.filter(l => l.status === 'sent').forEach((l: any) => {
        const custId = (l.outreach_executions as any)?.customer_id || (l.outreach_executions as any)?.lead_id
        if (custId) waSentCustomers.add(custId)
    })
    const waStats = {
        waTotalSent: waLogs.filter(l => l.status === 'sent').length,
        waUniqueSent: waSentCustomers.size,
        waTotalFailed: waFailedCount,
    }

    // ── SMS Stats ──
    const smsLogs = allChannelLogs.filter(l => l.channel === 'sms')
    const smsSentCustomers = new Set<string>()
    smsLogs.filter(l => l.status === 'sent').forEach((l: any) => {
        const custId = (l.outreach_executions as any)?.customer_id || (l.outreach_executions as any)?.lead_id
        if (custId) smsSentCustomers.add(custId)
    })
    const smsStats = {
        smsTotalSent: smsLogs.filter(l => l.status === 'sent').length,
        smsUniqueSent: smsSentCustomers.size,
        smsTotalFailed: smsLogs.filter(l => l.status === 'failed').length,
    }

    // Now calculate queue breakdowns using call logs AND actual step definitions
    // Build step_order → action_type map for this workflow
    const { data: allSteps } = await adminDb.from('outreach_steps')
        .select('step_order, action_type')
        .eq('workflow_id', workflowId)
        .order('step_order', { ascending: true })
    
    const stepTypeMap = new Map<number, string>()
    allSteps?.forEach((s: any) => stepTypeMap.set(s.step_order, s.action_type))

    let completedCalled = 0
    customerLatest.forEach((e: any) => {
        const cId = e.customer_id || e.lead_id
        const wasCalled = cId && calledCustomerIds.has(cId)
        const currentStepType = stepTypeMap.get(e.current_step_order)

        if (e.status === 'active' || e.status === 'waiting') {
            if (currentStepType === 'ai_call' && !wasCalled) {
                statusCounts.firstCallPending++
            } else if (currentStepType === 'ai_call' && wasCalled) {
                statusCounts.secondCallPending++
            } else if (currentStepType === 'wait') {
                statusCounts.inWaitStep++
            } else if (currentStepType === 'whatsapp') {
                statusCounts.whatsappPending++
            } else if (!wasCalled && !currentStepType) {
                // Fallback: henüz başlamamış
                statusCounts.firstCallPending++
            }
        } else if (e.status === 'completed' || e.status === 'converted' || e.status === 'stopped' || e.status === 'failed') {
            completedCalled++
        }
    })
    statusCounts.calledAtLeastOnce = calledCustomerIds.size

    // Combine active executions and paginated executions (preventing duplication)
    let combinedExecutions = executions || []
    let combinedLogs = logs || []

    if (page === 1) {
        const filteredPaginated = combinedExecutions.filter(e => !activeIds.has(e.id))
        combinedExecutions = [...activeExecutions, ...filteredPaginated]
        
        // Remove duplicate logs
        const logIdSet = new Set(combinedLogs.map(l => `${l.execution_id}-${l.channel}-${l.status}`))
        const uniqueActiveLogs = activeLogData.filter(l => !logIdSet.has(`${l.execution_id}-${l.channel}-${l.status}`))
        combinedLogs = [...uniqueActiveLogs, ...combinedLogs]
    }

    // ─── Cron Health Check ───────────────────────────────────
    // Son cron çalışmasını tespit etmek için en son step_log'a bak
    let cronHealth: { status: 'ok' | 'warning' | 'error'; lastRunAt: string | null; message: string } = {
        status: 'error', lastRunAt: null, message: 'Cron verisi bulunamadı'
    }
    try {
        // Tenant'ın queue_lock_at değeri son cron çalışmasını gösterir
        const { data: tenantData } = await adminDb.from('tenants')
            .select('ai_outreach_settings')
            .eq('id', tenantId)
            .single()
        const lockAt = tenantData?.ai_outreach_settings?.queue_lock_at

        // Ayrıca en son step_log'un zamanına da bakalım (daha güvenilir)
        const { data: latestLog } = await adminDb.from('outreach_step_logs')
            .select('executed_at')
            .order('executed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const lastActivity = latestLog?.executed_at || lockAt
        if (lastActivity) {
            const ageMs = Date.now() - new Date(lastActivity).getTime()
            const ageMinutes = Math.floor(ageMs / 60000)
            cronHealth.lastRunAt = lastActivity

            if (ageMinutes <= 2) {
                cronHealth.status = 'ok'
                cronHealth.message = `Son aktivite: ${ageMinutes < 1 ? 'az önce' : ageMinutes + 'dk önce'}`
            } else if (ageMinutes <= 10) {
                cronHealth.status = 'warning'
                cronHealth.message = `Son aktivite ${ageMinutes}dk önce — cron yavaşlamış olabilir`
            } else {
                cronHealth.status = 'error'
                cronHealth.message = `Son aktivite ${ageMinutes}dk önce — cron çalışmıyor olabilir!`
            }
        }
    } catch (_) { /* non-blocking */ }

    return {
        workflow,
        executions: combinedExecutions,
        logs: combinedLogs,
        stats: { ...statusCounts, ...callStats, ...waStats, ...smsStats, completedCalled },
        channels: Array.from(workflowChannels),
        totalCount,
        todayCount,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(totalCount / PAGE_SIZE),
        cronHealth,
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

// ─── System Health & Admin Reset ─────────────────────────────

export async function getSystemHealth() {
    const { supabase, tenantId, profile } = await getAuthContext()
    if (!['admin', 'owner', 'crm_manager'].includes(profile?.role || '')) {
        return { error: 'Yetkisiz erişim' }
    }

    const now = new Date().toISOString()
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    // 1. Stuck step logs: status=sent/in_progress AND completed_at IS NULL
    const { count: stuckCallsTotal } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'in_progress'])
        .is('completed_at', null)
        .eq('channel', 'ai_call')

    // 2. Stuck step logs older than 15 minutes (truly stuck)
    const { count: stuckCallsOld } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['sent', 'in_progress'])
        .is('completed_at', null)
        .eq('channel', 'ai_call')
        .lt('executed_at', fifteenMinsAgo)

    // 3. Failed logs without completed_at (ghost records)
    const { count: ghostFailed } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .is('completed_at', null)

    // 4. Queue lock status
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, ai_outreach_settings')
        .eq('id', tenantId)
        .single()

    const lockAt = tenant?.ai_outreach_settings?.queue_lock_at
    const lockAgeMs = lockAt ? Date.now() - new Date(lockAt).getTime() : 0
    const isLockStuck = lockAt && lockAgeMs > 3 * 60 * 1000 // 3 dakikadan eski lock = takılı (engine timeout ile aynı)

    // 5. Waiting executions (should resolve via webhook but might be stuck)
    const { count: waitingExecs } = await supabase
        .from('outreach_executions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'waiting')
        .eq('tenant_id', tenantId)

    // 6. Active executions due in past (should have been processed)
    const { count: overduExecs } = await supabase
        .from('outreach_executions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'waiting'])
        .lte('next_action_at', now)
        .eq('tenant_id', tenantId)

    // 7. WA Template Circuit Breaker durumu
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { count: waTemplateErrors } = await supabase
        .from('outreach_step_logs')
        .select('id', { count: 'exact', head: true })
        .eq('channel', 'whatsapp')
        .eq('status', 'failed')
        .gte('executed_at', thirtyMinsAgo)
        .ilike('error_message', '%132015%')

    const isTemplateBlocked = (waTemplateErrors || 0) >= 3
    const hasIssues = (stuckCallsOld || 0) > 0 || isLockStuck || (ghostFailed || 0) > 0 || isTemplateBlocked

    return {
        stuckCallsTotal: stuckCallsTotal || 0,
        stuckCallsOld: stuckCallsOld || 0,
        ghostFailed: ghostFailed || 0,
        queueLock: lockAt || null,
        queueLockAge: lockAgeMs,
        isLockStuck: !!isLockStuck,
        waitingExecs: waitingExecs || 0,
        overdueExecs: overduExecs || 0,
        waTemplateErrors: waTemplateErrors || 0,
        isTemplateBlocked,
        hasIssues,
        checkedAt: now,
    }
}

export async function resetOutreachSystem(options: { clearStuckCalls?: boolean; releaseLock?: boolean; resetWaiting?: boolean }) {
    const { supabase, tenantId, profile } = await getAuthContext()
    if (!['admin', 'owner', 'crm_manager'].includes(profile?.role || '')) {
        return { error: 'Yetkisiz erişim' }
    }

    const now = new Date().toISOString()
    const results: string[] = []

    if (options.clearStuckCalls) {
        // Clear all sent/in_progress step logs without completed_at
        const { data: d1 } = await supabase
            .from('outreach_step_logs')
            .update({ status: 'failed', completed_at: now, error_message: 'Admin tarafından manuel temizlendi' })
            .in('status', ['sent', 'in_progress'])
            .is('completed_at', null)
            .select('id')

        // Also fix failed logs without completed_at
        const { data: d2 } = await supabase
            .from('outreach_step_logs')
            .update({ completed_at: now })
            .eq('status', 'failed')
            .is('completed_at', null)
            .select('id')

        results.push(`${(d1?.length || 0) + (d2?.length || 0)} takılı arama kaydı temizlendi`)
    }

    if (options.releaseLock) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, ai_outreach_settings')
            .eq('id', tenantId)
            .single()

        if (tenant) {
            await supabase.from('tenants').update({
                ai_outreach_settings: { ...(tenant.ai_outreach_settings || {}), queue_lock_at: null }
            }).eq('id', tenant.id)
            results.push('Kuyruk kilidi serbest bırakıldı')
        }
    }

    if (options.resetWaiting) {
        const { data: d3 } = await supabase
            .from('outreach_executions')
            .update({ status: 'active', next_action_at: now })
            .eq('status', 'waiting')
            .eq('tenant_id', tenantId)
            .select('id')

        results.push(`${d3?.length || 0} bekleyen execution aktife alındı`)
    }

    revalidatePath('/outreach')
    return { success: true, results }
}

// ─── Workflow Execution Log ──────────────────────────────────

export async function getWorkflowLog(workflowId: string) {
    const { supabase, tenantId } = await getAuthContext()
    if (!tenantId) return { error: 'No tenant' }

    // Tüm execution'ları çek (tarih bazlı sıralı — eskiden yeniye)
    const { data: executions } = await supabase.from('outreach_executions')
        .select('id, status, created_at, completed_at')
        .eq('workflow_id', workflowId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })
        .limit(2000)

    if (!executions || executions.length === 0) {
        return { runs: [] }
    }

    // Execution'ları "çalıştırma oturumları"na grupla
    // Aynı dakika içinde oluşturulan execution'lar = 1 çalıştırma
    const SESSION_GAP_MS = 60 * 1000
    interface RunSession {
        startedAt: string
        lastActivityAt: string | null
        totalLeads: number
        completed: number
        stopped: number
        failed: number
        active: number
        waiting: number
        converted: number
        status: 'running' | 'completed' | 'stopped' | 'mixed'
    }

    const runs: RunSession[] = []
    let currentRun: RunSession | null = null
    let currentRunStart: number = 0

    for (const exec of executions) {
        const createdMs = new Date(exec.created_at).getTime()

        if (!currentRun || createdMs - currentRunStart > SESSION_GAP_MS) {
            if (currentRun) runs.push(currentRun)
            currentRunStart = createdMs
            currentRun = {
                startedAt: exec.created_at,
                lastActivityAt: exec.completed_at,
                totalLeads: 0, completed: 0, stopped: 0, failed: 0,
                active: 0, waiting: 0, converted: 0, status: 'running',
            }
        }

        currentRun.totalLeads++
        if (exec.status === 'completed') currentRun.completed++
        else if (exec.status === 'stopped') currentRun.stopped++
        else if (exec.status === 'failed') currentRun.failed++
        else if (exec.status === 'active') currentRun.active++
        else if (exec.status === 'waiting') currentRun.waiting++
        else if (exec.status === 'converted') currentRun.converted++
        else currentRun.completed++

        if (exec.completed_at) {
            if (!currentRun.lastActivityAt || new Date(exec.completed_at) > new Date(currentRun.lastActivityAt)) {
                currentRun.lastActivityAt = exec.completed_at
            }
        }
    }
    if (currentRun) runs.push(currentRun)

    // Her oturumun durumunu belirle
    for (const run of runs) {
        if (run.active > 0 || run.waiting > 0) run.status = 'running'
        else if (run.stopped > 0 && run.completed === 0) run.status = 'stopped'
        else if (run.stopped > 0 && run.completed > 0) run.status = 'mixed'
        else run.status = 'completed'
    }

    runs.reverse() // En yeniden eskiye

    return { runs }
}

export async function getLeadSourceAnalytics() {
    const { supabase, tenantId } = await getAuthContext()
    
    // 1. Fetch all leads for this tenant
    const { data: leads, error: leadsErr } = await supabase
        .from('leads')
        .select('id, status, source')
        .eq('tenant_id', tenantId)

    if (leadsErr) {
        console.error('Error fetching leads for analytics:', leadsErr)
        return []
    }

    // 2. Fetch all opportunities for this tenant
    const { data: opportunities, error: oppsErr } = await supabase
        .from('opportunities')
        .select('lead_id, value_try')
        .eq('tenant_id', tenantId)
        .not('lead_id', 'is', null)

    if (oppsErr) {
        console.error('Error fetching opportunities for analytics:', oppsErr)
    }

    // Map opportunity values by lead_id
    const oppValueMap: Record<string, number> = {}
    if (opportunities) {
        for (const opp of opportunities) {
            if (opp.lead_id) {
                oppValueMap[opp.lead_id] = (oppValueMap[opp.lead_id] || 0) + Number(opp.value_try || 0)
            }
        }
    }

    // Aggregate by source
    const sourceStats: Record<string, {
        source: string
        totalLeads: number
        convertedLeads: number
        lostLeads: number
        activeLeads: number
        revenue: number
    }> = {}

    for (const lead of leads || []) {
        const src = lead.source || 'Bilinmeyen'
        if (!sourceStats[src]) {
            sourceStats[src] = {
                source: src,
                totalLeads: 0,
                convertedLeads: 0,
                lostLeads: 0,
                activeLeads: 0,
                revenue: 0
            }
        }

        const stats = sourceStats[src]
        stats.totalLeads++
        
        if (lead.status === 'converted') {
            stats.convertedLeads++
        } else if (lead.status === 'lost') {
            stats.lostLeads++
        } else {
            stats.activeLeads++
        }

        // Add revenue from linked opportunity
        const oppVal = oppValueMap[lead.id] || 0
        stats.revenue += oppVal
    }

    // Convert to array and calculate rates
    const result = Object.values(sourceStats).map(s => {
        const conversionRate = s.totalLeads > 0 
            ? Math.round((s.convertedLeads / s.totalLeads) * 100) 
            : 0
        return {
            ...s,
            conversionRate
        }
    })

    // Sort by totalLeads descending
    return result.sort((a, b) => b.totalLeads - a.totalLeads)
}

export async function getWorkflowDiagnosticInfo(workflowId: string) {
    const { supabase, tenantId } = await getAuthContext()
    const adminDb = createAdminClient()

    // 1. Fetch workflow & segment & steps
    const { data: workflow, error: wfError } = await adminDb.from('outreach_workflows')
        .select('*, outreach_segments(*), outreach_steps(*)')
        .eq('id', workflowId)
        .eq('tenant_id', tenantId)
        .single()

    if (wfError || !workflow) {
        return { error: wfError?.message || 'Workflow bulunamadı' }
    }

    // 2. Resolve Segment
    let totalSegmentCount = 0
    let unexecutedCount = 0
    let executedCount = 0
    let resolvedLeadIds: string[] = []

    if (workflow.segment_id) {
        try {
            resolvedLeadIds = await resolveSegment(workflow.segment_id)
            totalSegmentCount = resolvedLeadIds.length
        } catch (err: any) {
            console.error('[Diagnostic] Segment resolve error:', err.message)
        }
    }

    // 3. Fetch Executions count and status
    let execList: any[] = []
    let from = 0
    let hasMore = true
    while (hasMore) {
        const { data: chunk, error: execsErr } = await adminDb.from('outreach_executions')
            .select('customer_id, sale_id, lead_id, status, started_at')
            .eq('workflow_id', workflowId)
            .range(from, from + 999)

        if (execsErr) {
            console.error('[Diagnostic] Fetch executions error:', execsErr.message)
            hasMore = false
        } else if (!chunk || chunk.length === 0) {
            hasMore = false
        } else {
            execList = execList.concat(chunk)
            if (chunk.length < 1000) {
                hasMore = false
            } else {
                from += 1000
            }
        }
    }
    executedCount = execList.length

    const isLqSource = resolvedLeadIds.length > 0 && resolvedLeadIds[0].startsWith('lq:')
    const isLeadsSource = resolvedLeadIds.length > 0 && resolvedLeadIds[0].startsWith('lead:')

    // Set of executed IDs
    const executedIds = new Set(
        execList.map(e => isLqSource ? e.customer_id : isLeadsSource ? e.lead_id : e.sale_id).filter(Boolean)
    )

    const remainingIds = resolvedLeadIds.filter(id => {
        const matchId = isLqSource ? id.replace('lq:', '') : isLeadsSource ? id.replace('lead:', '') : id
        return !executedIds.has(matchId)
    })

    unexecutedCount = remainingIds.length

    const statusCounts: Record<string, number> = {
        active: 0, waiting: 0, paused: 0, completed: 0, stopped: 0, converted: 0, opted_out: 0
    }
    execList.forEach(e => {
        if (e.status && statusCounts[e.status] !== undefined) {
            statusCounts[e.status]++
        }
    })

    // 4. Calculate Quota and Next Run Time
    const timezone = workflow.timezone || 'Europe/Istanbul'
    const now = new Date()

    // Get now in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false
    })
    
    let partMap: Record<string, string> = {}
    try {
        const parts = formatter.formatToParts(now)
        parts.forEach(p => partMap[p.type] = p.value)
    } catch (e: any) {
        console.error('[Diagnostic] Date format error:', e.message)
        // Fallback to UTC
        partMap = {
            year: String(now.getUTCFullYear()),
            month: String(now.getUTCMonth() + 1),
            day: String(now.getUTCDate()),
            hour: String(now.getUTCHours()),
            minute: String(now.getUTCMinutes())
        }
    }

    const y = Number(partMap.year)
    const m = Number(partMap.month)
    const d = Number(partMap.day)

    // Get local midnight in target timezone translated to UTC
    const getUtcTimeForTz = (year: number, month: number, day: number, hour: number, minute: number) => {
        try {
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
        } catch (e) {
            // Fallback: today UTC midnight
            const fallback = new Date()
            fallback.setUTCHours(0, 0, 0, 0)
            return fallback
        }
    }

    const todayStart = getUtcTimeForTz(y, m, d, 0, 0)

    const todayStartedCount = execList.filter(e => new Date(e.started_at) >= todayStart).length
    const maxPerDay = workflow.max_leads_per_day || 50
    const quotaLeftToday = Math.max(0, maxPerDay - todayStartedCount)

    // Determine tomorrow/next run
    const tomorrowLocal = new Date(y, m - 1, d + 1)
    const tomorrowDayOfWeek = tomorrowLocal.getDay() || 7
    const workingDays = workflow.working_days || [1, 2, 3, 4, 5]
    const isTomorrowWorkingDay = workingDays.includes(tomorrowDayOfWeek)

    // Steps sorted
    const sortedSteps = (workflow.outreach_steps || []).sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))

    return {
        success: true,
        workflow: {
            id: workflow.id,
            name: workflow.name,
            is_active: workflow.is_active,
            max_leads_per_day: workflow.max_leads_per_day,
            working_hours_start: workflow.working_hours_start,
            working_hours_end: workflow.working_hours_end,
            working_days: workflow.working_days,
            timezone: workflow.timezone
        },
        segment: {
            name: workflow.outreach_segments?.name || 'Segment Tanımlı Değil',
            filters: workflow.outreach_segments?.filters || {}
        },
        stats: {
            totalSegmentCount,
            executedCount,
            unexecutedCount,
            statusCounts,
            todayStartedCount,
            quotaLeftToday
        },
        schedule: {
            isTomorrowWorkingDay,
            timezone,
            currentTimeLocal: `${String(partMap.hour).padStart(2, '0')}:${String(partMap.minute).padStart(2, '0')}`,
            currentDateLocal: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        },
        steps: sortedSteps.map((s: any) => ({
            id: s.id,
            step_order: s.step_order,
            name: s.name,
            action_type: s.action_type,
            config: s.config
        }))
    }
}


