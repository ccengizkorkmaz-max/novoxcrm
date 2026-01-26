import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/app/(dashboard)/crm/components/CustomerList'

export default async function CustomersPage() {
    const supabase = await createClient()

    // Fetch Customers with Demands
    const { data: customers } = await supabase
        .from('customers')
        .select('*, customer_demands(*), contract_customers(id)')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Müşteri Yönetimi</h1>
            </div>

            <div className="rounded-md border bg-card p-6">
                <CustomerList customers={customers || []} />
            </div>
        </div>
    )
}
