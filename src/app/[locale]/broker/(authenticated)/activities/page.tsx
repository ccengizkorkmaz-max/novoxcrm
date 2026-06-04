import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActivitiesView } from '@/app/[locale]/(dashboard)/activities/activities-view'
import { Suspense } from 'react'

export default async function BrokerActivitiesPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/broker/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/broker/login')

    // Get broker's own customers (from broker_leads with customer_id)
    const { data: brokerLeads } = await supabase
        .from('broker_leads')
        .select('customer_id')
        .eq('broker_id', user.id)
        .not('customer_id', 'is', null)

    const brokerCustomerIds = (brokerLeads || []).map(bl => bl.customer_id).filter(Boolean)

    // Also get customers from sales assigned to this broker
    const { data: brokerSales } = await supabase
        .from('sales')
        .select('customer_id')
        .eq('assigned_to', user.id)

    const salesCustomerIds = (brokerSales || []).map(s => s.customer_id).filter(Boolean)
    
    // Merge and deduplicate customer IDs
    const allCustomerIds = [...new Set([...brokerCustomerIds, ...salesCustomerIds])]

    // Fetch customers
    let customers: { id: string; full_name: string }[] = []
    if (allCustomerIds.length > 0) {
        const { data: custData } = await supabase
            .from('customers')
            .select('id, full_name')
            .in('id', allCustomerIds)
            .order('full_name')
        customers = custData || []
    }

    // Fetch broker's own activities (created by broker OR for broker's customers)
    let activities: any[] = []
    if (allCustomerIds.length > 0) {
        const { data: actData } = await supabase
            .from('activities')
            .select('*, customers(full_name), owner:profiles!activities_owner_id_fkey(full_name)')
            .or(`owner_id.eq.${user.id}${allCustomerIds.length > 0 ? `,customer_id.in.(${allCustomerIds.join(',')})` : ''}`)
            .order('created_at', { ascending: false })
            .limit(200)
        activities = actData || []
    } else {
        // If no customers, only show activities owned by broker
        const { data: actData } = await supabase
            .from('activities')
            .select('*, customers(full_name), owner:profiles!activities_owner_id_fkey(full_name)')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200)
        activities = actData || []
    }

    // Projects for the form
    const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

    const brokerProfile = {
        id: user.id,
        full_name: profile.full_name || 'Broker',
        role: profile.role || 'broker'
    }

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-100px)] p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Aktivitelerim</h1>
            </div>
            <Suspense fallback={<div className="animate-pulse h-96 bg-muted/30 rounded-xl" />}>
                <ActivitiesView
                    initialActivities={activities}
                    customers={customers}
                    profiles={[brokerProfile]}
                    projects={projectsData || []}
                    user={user}
                />
            </Suspense>
        </div>
    )
}
