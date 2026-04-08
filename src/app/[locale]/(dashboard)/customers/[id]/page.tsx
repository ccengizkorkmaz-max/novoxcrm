import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CustomerView } from '@/components/customers/customer-view'

interface CustomerPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CustomerPage({ params }: CustomerPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: customer } = await supabase
        .from('customers')
        .select('*, customer_demands(*)')
        .eq('id', id)
        .single()

    if (!customer) {
        notFound()
    }

    // Fetch activities for this customer
    const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('customer_id', id)
        .order('due_date', { ascending: false })

    // Fetch contracts for this customer
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            unit: units(unit_number, block),
            project: projects(name),
            contract_customers!inner(customer_id)
        `)
        .eq('contract_customers.customer_id', id)
        .order('created_at', { ascending: false })

    // Fetch active sales/leads for this customer
    const { data: sales } = await supabase
        .from('sales')
        .select(`
            *,
            unit: units(unit_number, block),
            project: projects(name)
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

    // Fetch Profiles (Users) for assignment - Same logic as activities page
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

    if (!isAdmin) {
        profilesQuery = profilesQuery.eq('id', user.id)
    }

    let { data: profiles } = await profilesQuery

    // Fallback: If profiles list is empty or null, add the current user manually
    if (!profiles || profiles.length === 0) {
        profiles = [{
            id: user.id,
            full_name: currentUserProfile?.full_name || user.email?.split('@')[0] || 'Mevcut Kullanıcı'
        }]
    }

    // Ensure full_name is not null
    profiles = (profiles || []).map(p => ({
        ...p,
        full_name: p.full_name || 'İsimsiz Kullanıcı'
    }))

    return <CustomerView
        customer={customer}
        activities={activities || []}
        contracts={contracts || []}
        profiles={profiles}
        sales={sales || []}
    />
}
