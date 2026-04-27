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

    // 3. Fetch Profiles (Users) for assignment - Role Based (moved up for parallel fetching)
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role, full_name, tenant_id')
        .eq('id', user.id)
        .single()

    const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner'

    // Run all queries in parallel for maximum speed
    const [customersResult, activitiesResult, profilesResult, t] = await Promise.all([
        // 1. Fetch Customers (limited to essential fields only)
        supabase
            .from('customers')
            .select('id, full_name')
            .order('full_name', { ascending: true })
            .limit(5000),

        // 2. Fetch Activities
        supabase
            .from('activities')
            .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
            .order('due_date', { ascending: true })
            .limit(5000),

        // 3. Profiles for filter dropdown — exclude brokers AND inactive users AND null names
        (async () => {
            let query = supabase
                .from('profiles')
                .select('id, full_name, role')
                .neq('role', 'broker')
                .not('full_name', 'is', null)
                .neq('full_name', '')
                .eq('is_active', true)
                .order('full_name')

            if (!isAdmin) {
                query = query.eq('id', user.id)
            }
            return query
        })(),

        // 4. Translations
        getTranslations('Activities'),
    ])

    const customers = customersResult.data || []
    const activities = activitiesResult.data || []
    let profiles = profilesResult.data || []

    // Filter out any profile that has a numeric-only or suspicious name (like "1")
    profiles = profiles.filter(p => {
        if (!p.full_name) return false
        // Remove entries that are just numbers
        if (/^\d+$/.test(p.full_name.trim())) return false
        return true
    })

    // Fallback: If profiles list is empty, add the current user manually
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
