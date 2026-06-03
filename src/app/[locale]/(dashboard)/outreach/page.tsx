import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { OutreachDashboard } from './components/OutreachDashboard'

async function getAllTenantExecutions(supabaseAdmin: any, tenantId: string) {
    const allExecs: any[] = []
    let from = 0
    let hasMore = true
    while (hasMore && allExecs.length < 50000) {
        const { data, error } = await supabaseAdmin
            .from('outreach_executions')
            .select('workflow_id, status, started_at')
            .eq('tenant_id', tenantId)
            .range(from, from + 999)
        
        if (error) {
            console.error('[getAllTenantExecutions] error:', error)
            break
        }
        if (!data || data.length === 0) {
            hasMore = false
        } else {
            allExecs.push(...data)
            if (data.length < 1000) {
                hasMore = false
            } else {
                from += 1000
            }
        }
    }
    return { data: allExecs }
}

export default async function OutreachPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    const isManager = ['manager', 'owner', 'admin'].includes(profile?.role || '')
    if (!isManager) redirect('/')

    const tenantId = profile?.tenant_id
    const supabaseAdmin = createAdminClient()

    // Fetch all data in parallel
    const [
        workflowsRes,
        segmentsRes,
        scriptsRes,
        activeExecRes,
        recentLogsRes,
        statsRes,
        projectsRes,
        profilesRes,
        detailedLogsRes,
        triggersRes,
        executionsRes,
    ] = await Promise.all([
        supabaseAdmin.from('outreach_workflows')
            .select('*, outreach_segments(name), outreach_steps(*)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabaseAdmin.from('outreach_segments')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabaseAdmin.from('outreach_scripts')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabaseAdmin.from('outreach_executions')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('status', ['active', 'waiting']),
        supabaseAdmin.from('outreach_step_logs')
            .select('*, outreach_executions!inner(tenant_id, customers(full_name)), outreach_steps(name, action_type)')
            .eq('outreach_executions.tenant_id', tenantId)
            .order('executed_at', { ascending: false })
            .limit(20),
        // Stats: counts per channel
        supabaseAdmin.from('outreach_step_logs')
            .select('channel, status')
            .eq('outreach_executions.tenant_id', tenantId),
        // Projects for segment builder
        supabase.from('projects')
            .select('id, name')
            .order('name'),
        // Profiles for assignment filter
        supabase.from('profiles')
            .select('id, full_name, role')
            .eq('tenant_id', tenantId)
            .order('full_name'),
        // Detailed logs for CallResultsPanel
        supabaseAdmin.from('outreach_step_logs')
            .select(`
                *,
                outreach_steps(name, action_type, config),
                outreach_executions!inner(
                    id, status, current_step_order, tenant_id,
                    customers(id, full_name, phone, email),
                    sales(id, status, projects(name)),
                    outreach_workflows(name)
                )
            `)
            .eq('outreach_executions.tenant_id', tenantId)
            .in('channel', ['ai_call', 'whatsapp', 'sms'])
            .order('executed_at', { ascending: false })
            .limit(50),
        // Triggers for workflow badges
        supabaseAdmin.from('outreach_triggers')
            .select('id, workflow_id, event_type, is_active')
            .eq('tenant_id', tenantId),
        // Executions for stats
        getAllTenantExecutions(supabaseAdmin, tenantId),
    ])

    const workflows = workflowsRes.data || []
    const executions = executionsRes?.data || []

    workflows.forEach((w: any) => {
        if (w.outreach_steps) {
            w.outreach_steps.sort((a: any, b: any) => (a.step_order || 0) - (b.step_order || 0))
        }
        const wfExecs = executions.filter((e: any) => e.workflow_id === w.id)
        w._exec_stats = {
            total: wfExecs.length,
            active: wfExecs.filter((e: any) => e.status === 'active' || e.status === 'waiting').length,
            completed: wfExecs.filter((e: any) => e.status === 'completed').length,
            converted: wfExecs.filter((e: any) => e.status === 'converted').length,
            stopped: wfExecs.filter((e: any) => e.status === 'stopped').length,
            failed: wfExecs.filter((e: any) => e.status === 'failed').length,
            last_run: wfExecs.length > 0
                ? wfExecs.reduce((max: string, e: any) => e.started_at > max ? e.started_at : max, '')
                : null
        }
    })

    return (
        <div className="flex flex-col gap-6 pb-8">
            <Suspense fallback={<div className="flex items-center justify-center h-40 text-muted-foreground">Yükleniyor...</div>}>
                <OutreachDashboard
                    workflows={workflows}
                    segments={segmentsRes.data || []}
                    scripts={scriptsRes.data || []}
                    activeCount={activeExecRes.count || 0}
                    recentLogs={recentLogsRes.data || []}
                    projects={projectsRes.data || []}
                    profiles={profilesRes.data || []}
                    userId={user.id}
                    tenantId={tenantId || ''}
                    detailedLogs={detailedLogsRes.data || []}
                    triggers={triggersRes.data || []}
                />
            </Suspense>
        </div>
    )
}

