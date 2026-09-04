import { createClient } from '@/lib/supabase/server'
import { ActivitiesView } from './activities-view'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

export default async function ActivitiesPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get current user profile first (needed for role-based logic)
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role, full_name, tenant_id')
        .eq('id', user.id)
        .single()

    const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner'

    // Build profiles query based on role
    let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('role', 'broker')
        .eq('is_active', true)
        .or('is_external.is.null,is_external.eq.false')
        .not('full_name', 'is', null)
        .neq('full_name', '')
        .order('full_name')

    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    // Build queries for activities
    // Only fetch activities from the last 90 days to avoid loading thousands of stale overdue records
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString()

    let incompleteQuery = supabase
        .from('activities')
        .select('*, customers(id, full_name, phone, email, customer_type, company_name, company:companies(name)), leads(id, full_name, phone, email), owner:profiles!activities_owner_id_fkey(id, full_name, phone)')
        .in('type', ['Call', 'Meeting', 'Task', 'OfficeMeeting', 'OnlineMeeting', 'Site Visit', 'Whatsapp', 'Email'])
        .not('status', 'in', '("Completed","Cancelled")')
        .gte('due_date', ninetyDaysAgoISO)
        .order('due_date', { ascending: false })
        .limit(3000)

    let completedQuery = supabase
        .from('activities')
        .select('*, customers(id, full_name, phone, email, customer_type, company_name, company:companies(name)), leads(id, full_name, phone, email), owner:profiles!activities_owner_id_fkey(id, full_name, phone)')
        .in('type', ['Call', 'Meeting', 'Task', 'OfficeMeeting', 'OnlineMeeting', 'Site Visit', 'Whatsapp', 'Email'])
        .in('status', ['Completed', 'Cancelled'])
        .order('created_at', { ascending: false })
        .limit(500)

    // Satış temsilcileri (admin veya owner olmayanlar) yalnızca kendilerine atanan ya da kendilerinin yarattığı aktiviteleri görür
    if (!isAdmin) {
        incompleteQuery = incompleteQuery.or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        completedQuery = completedQuery.or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
    }

    // Run all queries in parallel
    const [customers, activities, profilesResult, t, projects, meetingsResult] = await Promise.all([
        // Customers — include customer_type and company info for proper combobox display
        supabase
            .from('customers')
            .select('id, full_name, phone, email, customer_type, company_name, company:companies(name)')
            .order('full_name', { ascending: true })
            .limit(3000)
            .then(r => r.data || []),

        // Activities
        Promise.all([
            incompleteQuery.then(r => r.data || []),
            completedQuery.then(r => r.data || [])
        ]).then(([incomplete, completed]) => [...incomplete, ...completed]),

        // Profiles for filter dropdown
        profilesQuery.then(r => r.data || []),

        // Translations
        getTranslations('Activities'),

        // Projects
        supabase
            .from('projects')
            .select('id, name')
            .order('name')
            .then(r => r.data || []),

        // Meetings for live links & room matching
        supabase
            .from('meetings')
            .select('id, title, status, scheduled_at, daily_room_name, customer_id, project_id, host_user_id')
            .order('scheduled_at', { ascending: false })
            .limit(500)
            .then(r => r.data || [], () => [])
    ])

    // Filter out suspicious profile names (like "1")
    let profiles = profilesResult.filter((p: any) => {
        if (!p.full_name) return false
        if (/^\d+$/.test(p.full_name.trim())) return false
        return true
    })

    // Fallback: If profiles list is empty, add current user
    if (profiles.length === 0) {
        profiles = [{
            id: user.id,
            full_name: currentUserProfile?.full_name || user.email?.split('@')[0] || 'Mevcut Kullanıcı',
            role: currentUserProfile?.role || 'user'
        }]
    }

    return (
        <div className="flex flex-col gap-4 min-h-screen pb-10">
            <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Aktiviteler yükleniyor...</div>}>
                <ActivitiesView
                    initialActivities={activities}
                    customers={customers}
                    profiles={profiles}
                    projects={projects}
                    meetings={meetingsResult}
                    user={user}
                />
            </Suspense>
        </div>
    )
}
