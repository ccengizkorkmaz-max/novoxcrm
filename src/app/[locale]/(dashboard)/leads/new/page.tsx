import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewLeadFormClient from './new-lead-client'

interface PageProps {
    params: Promise<{
        locale: string
    }>
}

export default async function NewLeadPage({ params }: PageProps) {
    const { locale } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/${locale}/login`)

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect(`/${locale}/login`)

    // Check CRM Mode
    const { data: tenant } = await supabase
        .from('tenants')
        .select('crm_mode')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.crm_mode !== 'advance') {
        redirect(`/${locale}/crm`) // Redirect to basic CRM if not in advance mode
    }

    // Fetch Team Members
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .or('is_external.is.null,is_external.eq.false')
        .order('full_name')

    // Fetch Projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

    return (
        <div className="p-4 sm:p-6">
            <NewLeadFormClient
                teamMembers={teamMembers || []}
                projects={projects || []}
            />
        </div>
    )
}
