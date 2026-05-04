import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContractsView } from './components/ContractsView'

export default async function BrokerContractsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Try to get contracts - table may not exist yet
    let contracts: any[] = []
    try {
        const { data } = await supabase
            .from('broker_contracts')
            .select('*, customer:customers(full_name, phone), portfolio:portfolios(title)')
            .order('created_at', { ascending: false })
        contracts = data || []
    } catch { /* table doesn't exist yet */ }

    // Get customers and portfolios for dropdowns
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, contact_type')
        .order('full_name')

    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, title, listing_type, price, currency')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Sözleşmeler</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Yetkilendirme, satış, kiralama ve komisyon sözleşmelerini yönetin.
                </p>
            </div>
            <ContractsView 
                contracts={contracts} 
                customers={customers || []} 
                portfolios={portfolios || []} 
            />
        </div>
    )
}
