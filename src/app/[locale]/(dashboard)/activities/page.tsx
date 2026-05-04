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
        .not('full_name', 'is', null)
        .neq('full_name', '')
        .order('full_name')

    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    // Run all queries in parallel — NO MORE fetchAll while-loops!
    // Limit activities and customers to reasonable amounts instead of fetching ALL records
    const [customers, activities, profilesResult, t] = await Promise.all([
        // Customers — only id and full_name, limit to 3000 (was fetching ALL via while-loop)
        supabase
            .from('customers')
            .select('id, full_name')
            .order('full_name', { ascending: true })
            .limit(3000)
            .then(r => r.data || []),

        // Activities — limit to 2000 most recent (was fetching ALL via while-loop)
        supabase
            .from('activities')
            .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
            .order('due_date', { ascending: true })
            .limit(2000)
            .then(r => r.data || []),

        // Profiles for filter dropdown
        profilesQuery.then(r => r.data || []),

        // Translations
        getTranslations('Activities'),
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
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <ActivitiesView
                    initialActivities={activities}
                    customers={customers}
                    profiles={profiles}
                    user={user}
                />
            </Suspense>
        </div>
    )
}
