import { createClient } from '@/lib/supabase/server'
import { ActivitiesView } from './activities-view'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

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
            .order('full_name')
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
    const customers = allCustomers

    // 2. Fetch Activities in batches
    let allActivities: any[] = []
    let actFrom = 0
    let hasMoreAct = true

    while (hasMoreAct) {
        const { data, error } = await supabase
            .from('activities')
            .select('*, customers(full_name), owner:profiles!activities_owner_id_fkey(full_name)')
            .order('due_date', { ascending: true })
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
    const activities = allActivities

    const t = await getTranslations('Activities')

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>
            <ActivitiesView
                initialActivities={activities || []}
                customers={customers || []}
                user={user}
            />
        </div>
    )
}
