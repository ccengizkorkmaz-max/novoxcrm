import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MeetingsDashboard } from './components/MeetingsDashboard'

export default async function MeetingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // Fetch meetings
    const { data: meetings } = await supabase
        .from('meetings')
        .select(`
            *,
            customer:customers(id, full_name, phone, email),
            project:projects(id, name),
            host:profiles!meetings_host_user_id_fkey(id, full_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('scheduled_at', { ascending: true })

    // Fetch profiles for assignment - Sadece aktif ve dış broker olmayan iç temsilciler
    const { data: rawProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_external, is_active')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .neq('role', 'broker')
        .or('is_external.is.null,is_external.eq.false')
        .order('full_name')

    const profiles = (rawProfiles || []).filter(p => 
        p.role !== 'broker' && 
        p.is_external !== true && 
        p.is_active !== false &&
        Boolean(p.full_name?.trim())
    )

    // Fetch projects for selection
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

    return (
        <MeetingsDashboard
            meetings={meetings || []}
            profiles={profiles || []}
            projects={projects || []}
            currentUserId={user.id}
            currentUserName={profile.full_name || 'Kullanıcı'}
        />
    )
}
