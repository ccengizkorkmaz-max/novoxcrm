import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SegmentsPageClient } from './client'

export default async function SegmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles').select('tenant_id, role').eq('id', user.id).single()

    const isManager = ['manager', 'owner', 'admin'].includes(profile?.role || '')
    if (!isManager) redirect('/')

    const tenantId = profile?.tenant_id

    const [segmentsRes, projectsRes, profilesRes, tenantRes] = await Promise.all([
        supabase.from('outreach_segments').select('*')
            .eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name, role')
            .eq('tenant_id', tenantId).order('full_name'),
        supabase.from('tenants').select('crm_mode').eq('id', tenantId).single()
    ])

    return (
        <div className="flex flex-col gap-6 pb-8">
            <Suspense fallback={<div className="flex items-center justify-center h-40 text-muted-foreground">Yükleniyor...</div>}>
                <SegmentsPageClient
                    segments={segmentsRes.data || []}
                    projects={projectsRes.data || []}
                    profiles={profilesRes.data || []}
                    tenantId={tenantId || ''}
                    crmMode={tenantRes.data?.crm_mode || 'basic'}
                />
            </Suspense>
        </div>
    )
}
