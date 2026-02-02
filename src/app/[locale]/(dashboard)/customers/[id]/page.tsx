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

    return <CustomerView
        customer={customer}
        activities={activities || []}
        contracts={contracts || []}
    />
}
