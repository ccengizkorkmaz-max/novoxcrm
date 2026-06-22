import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OpportunitiesPageClient from './opportunities-client'

export default async function OpportunitiesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // CRM mod kontrolü + pipeline stages
    const { data: tenant } = await supabase
        .from('tenants')
        .select('crm_mode, pipeline_stages')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.crm_mode !== 'advance') {
        redirect('/crm')
    }

    // Fetch projects for reservation dialog
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

    // Opportunities verisi
    const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*, customers(id, full_name, phone), profiles!opportunities_assigned_to_fkey(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(200)

    // Pipeline aşamaları
    const pipelineStages = tenant?.pipeline_stages || [
        { key: 'prospect', label: 'Aday', color: '#6366f1', order: 1 },
        { key: 'qualified', label: 'Nitelikli', color: '#8b5cf6', order: 2 },
        { key: 'reservation', label: 'Opsiyon', color: '#06b6d4', order: 3 },
        { key: 'proposal', label: 'Teklif', color: '#f59e0b', order: 4 },
        { key: 'negotiation', label: 'Müzakere', color: '#f97316', order: 5 },
        { key: 'won', label: 'Kazanıldı', color: '#22c55e', order: 6 },
        { key: 'lost', label: 'Kaybedildi', color: '#ef4444', order: 7 },
    ]

    return (
        <OpportunitiesPageClient
            opportunities={opportunities || []}
            pipelineStages={pipelineStages}
            userRole={profile.role || 'user'}
            projects={projects || []}
        />
    )
}
