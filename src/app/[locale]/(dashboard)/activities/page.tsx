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

    // Batch fetch helper — Supabase limits rows per query (default 1000)
    async function fetchAll(query: any) {
        const batchSize = 1000
        let allData: any[] = []
        let from = 0
        let hasMore = true
        while (hasMore) {
            const { data, error } = await query.range(from, from + batchSize - 1)
            if (error || !data || data.length === 0) {
                hasMore = false
            } else {
                allData = allData.concat(data)
                from += batchSize
                if (data.length < batchSize) hasMore = false
            }
        }
        return allData
    }

    // Run queries in parallel for speed
    const [customers, activities, profilesResult, t] = await Promise.all([
        // 1. Customers
        fetchAll(
            supabase
                .from('customers')
                .select('id, full_name')
                .order('full_name', { ascending: true })
                .order('id', { ascending: true })
        ),

        // 2. Activities — all records via batching
        fetchAll(
            supabase
                .from('activities')
                .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
                .order('due_date', { ascending: true })
                .order('id', { ascending: true })
        ),

        // 3. Profiles for filter dropdown
        (async () => {
            let query = supabase
                .from('profiles')
                .select('id, full_name, role')
                .neq('role', 'broker')
                .not('full_name', 'is', null)
                .neq('full_name', '')
                .order('full_name')

            if (!isAdmin) {
                query = query.eq('id', user.id)
            }

            const { data } = await query
            return data || []
        })(),

        // 4. Translations
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
