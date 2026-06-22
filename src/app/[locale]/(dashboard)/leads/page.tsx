import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import LeadsPageClient from './leads-client'

export default async function LeadsPage() {
    const supabase = await createClient()
    const t = await getTranslations('Dashboard')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // CRM mod kontrolü
    const { data: tenant } = await supabase
        .from('tenants')
        .select('crm_mode')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.crm_mode !== 'advance') {
        redirect('/crm') // Basic moddaysa CRM'e yönlendir
    }

    // Leads verisi
    const { data: leads } = await supabase
        .from('leads')
        .select('*, profiles!leads_assigned_to_fkey(full_name), projects(name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(200)

    // Takım üyeleri (atama için)
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)

    // Projeler
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

    return (
        <LeadsPageClient
            leads={leads || []}
            teamMembers={teamMembers || []}
            projects={projects || []}
            userRole={profile.role || 'user'}
        />
    )
}
