import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { OutreachDashboard } from './components/OutreachDashboard'

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
    ] = await Promise.all([
        supabase.from('outreach_workflows')
            .select('*, outreach_segments(name)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabase.from('outreach_segments')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabase.from('outreach_scripts')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false }),
        supabase.from('outreach_executions')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .in('status', ['active', 'waiting']),
        supabase.from('outreach_step_logs')
            .select('*, outreach_executions!inner(tenant_id, customers(full_name)), outreach_steps(name, action_type)')
            .eq('outreach_executions.tenant_id', tenantId)
            .order('executed_at', { ascending: false })
            .limit(20),
        // Stats: counts per channel
        supabase.from('outreach_step_logs')
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
    ])

    return (
        <div className="flex flex-col gap-6 pb-8">
            <Suspense fallback={<div className="flex items-center justify-center h-40 text-muted-foreground">Yükleniyor...</div>}>
                <OutreachDashboard
                    workflows={workflowsRes.data || []}
                    segments={segmentsRes.data || []}
                    scripts={scriptsRes.data || []}
                    activeCount={activeExecRes.count || 0}
                    recentLogs={recentLogsRes.data || []}
                    projects={projectsRes.data || []}
                    profiles={profilesRes.data || []}
                    userId={user.id}
                    tenantId={tenantId || ''}
                />
            </Suspense>
        </div>
    )
}
