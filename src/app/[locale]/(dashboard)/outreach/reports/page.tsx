import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { CallResultsPanel } from '../components/CallResultsPanel'

export default async function OutreachReportsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles').select('tenant_id, role').eq('id', user.id).single()

    const isManager = ['manager', 'owner', 'admin'].includes(profile?.role || '')
    if (!isManager) redirect('/')

    const tenantId = profile?.tenant_id

    const { data: detailedLogs } = await supabase.from('outreach_step_logs')
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
        .limit(100)

    return (
        <div className="flex flex-col gap-6 pb-8">
            <Suspense fallback={<div className="flex items-center justify-center h-40 text-muted-foreground">Yükleniyor...</div>}>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m7 11 4-4 4 4 6-6"/></svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Outreach Raporu</h1>
                            <p className="text-sm text-muted-foreground">
                                Tüm arama, WhatsApp ve SMS sonuçlarının detaylı analizi
                            </p>
                        </div>
                    </div>
                    <CallResultsPanel initialLogs={detailedLogs || []} />
                </div>
            </Suspense>
        </div>
    )
}
