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
        .order('scheduled_at', { ascending: true })

    // Fetch profiles for assignment
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name')

    // Fetch projects for selection
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
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
