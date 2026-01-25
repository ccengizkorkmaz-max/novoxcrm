import { createClient } from '@/lib/supabase/server'
import { ContractList } from '@/components/contracts/contract-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ContractStats } from '@/components/contracts/contract-stats'

export default async function ContractsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        return <div>Tenant not found</div>
    }

    // Fetch Contracts
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            customers: contract_customers(
                customer: customers(full_name)
            ),
            unit: units(unit_number, block),
            project: projects(name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Fetch Payments for stats
    // Simplified stats calculation
    const totalSales = contracts?.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0) || 0
    // Fetching payments explicitly to be accurate
    const { data: allPayments } = await supabase
        .from('payment_plans')
        .select('amount, status, paid_amount, contracts!inner(tenant_id)')
        .eq('contracts.tenant_id', profile.tenant_id)

    const stats = {
        totalSales,
        totalPaid: allPayments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
        pendingAmount: allPayments?.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (Number(p.amount) - (Number(p.paid_amount) || 0)), 0) || 0,
        contractCount: contracts?.length || 0
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sözleşmeler</h1>
                    <p className="text-muted-foreground">Satış sözleşmelerini ve ödeme planlarını yönetin.</p>
                </div>
                <Button asChild>
                    <Link href="/contracts/new">
                        <Plus className="mr-2 h-4 w-4" /> Yeni Sözleşme
                    </Link>
                </Button>
            </div>

            <ContractStats stats={stats} />

            <ContractList initialContracts={contracts || []} />
        </div>
    )
}
