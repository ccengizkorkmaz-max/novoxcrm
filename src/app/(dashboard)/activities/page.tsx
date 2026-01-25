import { createClient } from '@/lib/supabase/server'
import { ActivitiesView } from './activities-view'
import { redirect } from 'next/navigation'

export default async function ActivitiesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Customers
    const { data: customers } = await supabase.from('customers').select('id, full_name').order('full_name')

    // Fetch Activities
    const { data: activities } = await supabase
        .from('activities')
        .select('*, customers(full_name), owner:profiles!activities_owner_id_fkey(full_name)')
        .order('due_date', { ascending: true })

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Aktiviteler</h1>
            </div>
            <ActivitiesView
                initialActivities={activities || []}
                customers={customers || []}
                user={user}
            />
        </div>
    )
}
