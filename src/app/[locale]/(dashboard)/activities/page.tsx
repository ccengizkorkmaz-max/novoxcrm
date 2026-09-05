import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const adminSupabase = createAdminClient()

    // Get current user profile first (needed for role-based logic & tenant)
    const { data: currentUserProfile } = await adminSupabase
        .from('profiles')
        .select('id, role, full_name, tenant_id')
        .eq('id', user.id)
        .single()

    if (!currentUserProfile?.tenant_id) redirect('/login')

    const tenantId = currentUserProfile.tenant_id
    const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner' || currentUserProfile?.role === 'manager' || currentUserProfile?.role === 'crm_manager'

    // Build profiles query based on tenant
    let profilesQuery = adminSupabase
        .from('profiles')
        .select('id, full_name, role, phone')
        .eq('tenant_id', tenantId)
        .neq('role', 'broker')
        .eq('is_active', true)
        .or('is_external.is.null,is_external.eq.false')
        .not('full_name', 'is', null)
        .neq('full_name', '')
        .order('full_name')

    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    // Date range for activity filtering
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString()

    // 1. Incomplete / Planned activities (include any planned, pending, or due activities)
    let incompleteQuery = adminSupabase
        .from('activities')
        .select(`
            *,
            customers(id, full_name, phone, email, customer_type, company_name, company:companies(name)),
            leads(id, full_name, phone, email),
            owner:profiles!activities_owner_id_fkey(id, full_name, phone),
            projects:project_id(id, name)
        `)
        .eq('tenant_id', tenantId)
        .not('status', 'in', '("Completed","Cancelled")')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(3000)

    // 2. Completed & Cancelled activities (last 1500)
    let completedQuery = adminSupabase
        .from('activities')
        .select(`
            *,
            customers(id, full_name, phone, email, customer_type, company_name, company:companies(name)),
            leads(id, full_name, phone, email),
            owner:profiles!activities_owner_id_fkey(id, full_name, phone),
            projects:project_id(id, name)
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['Completed', 'Cancelled'])
        .gte('created_at', ninetyDaysAgoISO)
        .order('created_at', { ascending: false })
        .limit(1500)

    // Role-based activity restrictions
    if (!isAdmin) {
        incompleteQuery = incompleteQuery.or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        completedQuery = completedQuery.or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
    }

    // Run all queries in parallel
    const [customers, activities, profilesResult, t, projects, meetingsResult] = await Promise.all([
        // Customers
        adminSupabase
            .from('customers')
            .select('id, full_name, phone, email, customer_type, company_name, company:companies(name)')
            .eq('tenant_id', tenantId)
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
        adminSupabase
            .from('projects')
            .select('id, name, address, city, district, latitude, longitude')
            .eq('tenant_id', tenantId)
            .order('name')
            .then(r => r.data || []),

        // Meetings for live links & room matching
        adminSupabase
            .from('meetings')
            .select('id, title, status, scheduled_at, daily_room_name, customer_id, project_id, host_user_id')
            .eq('tenant_id', tenantId)
            .order('scheduled_at', { ascending: false })
            .limit(500)
            .then(r => r.data || [], () => [])
    ])

    // Filter out suspicious profile names
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
            role: currentUserProfile?.role || 'user',
            phone: ''
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
