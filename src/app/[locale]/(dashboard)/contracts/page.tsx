import { createClient } from '@/lib/supabase/server'
import { ContractList } from '@/components/contracts/contract-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ContractStats } from '@/components/contracts/contract-stats'
import { getTranslations } from 'next-intl/server'
import GeneralSearch from '@/components/dashboard/GeneralSearch'

export default async function ContractsPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const query = searchParams.q as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        return <div>Tenant not found</div>
    }

    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner'

    // Fetch Contracts
    let baseQuery = supabase
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

    if (!isManager) {
        baseQuery = baseQuery.eq('sales_rep_id', user.id)
    }

    if (query) {
        // Search by contract number (ilike on contracts table)
        // Note: searching on joined customer name is complex with .or() and foreign tables
        // For now searching contract_number and allowing users to search by ID
        baseQuery = baseQuery.ilike('contract_number', `%${query}%`)
    }

    const { data: contracts } = await baseQuery.order('created_at', { ascending: false })

    // Fetch Payments for stats
    // Fetch Payments for stats
    // Filter out cancelled contracts for stats calculation
    const activeContracts = contracts?.filter(c => c.status !== 'Cancelled') || []

    // Calculate total sales from only active contracts
    const totalSales = activeContracts.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0)

    // Fetching payments explicitly to be accurate, excluding those from cancelled contracts
    const { data: allPayments } = await supabase
        .from('payment_plans')
        .select('amount, status, paid_amount, contracts!inner(tenant_id, status)')
        .eq('contracts.tenant_id', profile.tenant_id)
        .neq('contracts.status', 'Cancelled')

    const stats = {
        totalSales,
        totalPaid: allPayments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
        pendingAmount: allPayments?.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (Number(p.amount) - (Number(p.paid_amount) || 0)), 0) || 0,
        contractCount: activeContracts.length
    }

    const t = await getTranslations('Contracts')

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-sm md:text-base text-muted-foreground">{t('description')}</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <GeneralSearch namespace="Contracts" placeholderKey="table.search" />
                    <Button asChild className="w-full md:w-auto">
                        <Link href="/contracts/new">
                            <Plus className="mr-2 h-4 w-4" /> {t('newContract')}
                        </Link>
                    </Button>
                </div>
            </div>

            <ContractStats stats={stats} />

            <ContractList initialContracts={contracts || []} />
        </div>
    )
}
