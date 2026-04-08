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

    // 1. Fetch Customers in batches
    let allCustomers: any[] = []
    let custFrom = 0
    const batchSize = 1000
    let hasMoreCust = true

    while (hasMoreCust) {
        const { data, error } = await supabase
            .from('customers')
            .select('id, full_name')
            .order('full_name', { ascending: true })
            .order('id', { ascending: true })
            .range(custFrom, custFrom + batchSize - 1)

        if (error) {
            console.error('Error fetching customers batch:', error)
            hasMoreCust = false
        } else if (data && data.length > 0) {
            allCustomers = [...allCustomers, ...data]
            custFrom += batchSize
            if (data.length < batchSize) hasMoreCust = false
        } else {
            hasMoreCust = false
        }
    }
    // Ensure unique customers by ID
    const customers = Array.from(new Map(allCustomers.map(c => [c.id, c])).values())

    // 2. Fetch Activities in batches
    let allActivities: any[] = []
    let actFrom = 0
    let hasMoreAct = true

    while (hasMoreAct) {
        const { data, error } = await supabase
            .from('activities')
            .select('*, customers(full_name, sales(status)), owner:profiles!activities_owner_id_fkey(full_name)')
            .order('due_date', { ascending: true })
            .order('id', { ascending: true })
            .range(actFrom, actFrom + batchSize - 1)

        if (error) {
            console.error('Error fetching activities batch:', error)
            hasMoreAct = false
        } else if (data && data.length > 0) {
            allActivities = [...allActivities, ...data]
            actFrom += batchSize
            if (data.length < batchSize) hasMoreAct = false
        } else {
            hasMoreAct = false
        }
    }
    // Ensure unique activities by ID
    const activities = Array.from(new Map(allActivities.map(a => [a.id, a])).values())

    // 3. Fetch Profiles (Users) for assignment - Role Based
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    const isAdmin = currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner'

    let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name')

    // If not admin, only show self. 
    // BUT: Ensure the list is never empty by fallback to current user.
    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    let { data: profiles } = await profilesQuery

    // Fallback: If profiles list is empty for some reason, add the current user manually
    if (!profiles || profiles.length === 0) {
        profiles = [{
            id: user.id,
            full_name: currentUserProfile?.full_name || user.email?.split('@')[0] || 'Mevcut Kullanıcı'
        }]
    }

    // Double check: if any profile has null full_name, use email or fallback
    profiles = profiles.map(p => ({
        ...p,
        full_name: p.full_name || 'İsimsiz Kullanıcı'
    }))

    const t = await getTranslations('Activities')

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <ActivitiesView
                    initialActivities={activities || []}
                    customers={customers || []}
                    profiles={profiles || []}
                    user={user}
                />
            </Suspense>
        </div>
    )
}
