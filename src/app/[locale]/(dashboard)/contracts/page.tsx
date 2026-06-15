import { createClient } from '@/lib/supabase/server'
import { ContractList } from '@/components/contracts/contract-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ContractStats } from '@/components/contracts/contract-stats'
import { getTranslations } from 'next-intl/server'
import GeneralSearch from '@/components/dashboard/GeneralSearch'
import { Suspense } from 'react'

// Deferred component: fetches payment stats in background
async function DeferredContractStats({ tenantId, contracts }: { tenantId: string, contracts: any[] }) {
    const supabase = await createClient()
    
    const activeContracts = contracts?.filter(c => c.status !== 'Cancelled') || []
    const totalSales = activeContracts.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0)

    const { data: allPayments } = await supabase
        .from('payment_plans')
        .select('amount, status, paid_amount, contracts!inner(tenant_id, status)')
        .eq('contracts.tenant_id', tenantId)
        .neq('contracts.status', 'Cancelled')

    const stats = {
        totalSales,
        totalPaid: allPayments?.reduce((sum, p) => sum + (Number(p.paid_amount) || 0), 0) || 0,
        pendingAmount: allPayments?.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (Number(p.amount) - (Number(p.paid_amount) || 0)), 0) || 0,
        contractCount: activeContracts.length
    }

    return <ContractStats stats={stats} />
}

export default async function ContractsPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const query = searchParams.q as string

    const supabase = await createClient()

    // Parallel: auth + translations
    const [{ data: { user } }, t] = await Promise.all([
        supabase.auth.getUser(),
        getTranslations('Contracts')
    ])

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

    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'crm_manager'

    // Fetch Contracts (critical path)
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
        baseQuery = baseQuery.ilike('contract_number', `%${query}%`)
    }

    const { data: contracts } = await baseQuery.order('created_at', { ascending: false })

    // Stats skeleton
    const statsSkeleton = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-lg border bg-card p-6">
                    <div className="h-4 w-20 bg-muted rounded mb-3" />
                    <div className="h-8 w-28 bg-muted rounded" />
                </div>
            ))}
        </div>
    )

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

            {/* Stats stream in via Suspense while contract list renders immediately */}
            <Suspense fallback={statsSkeleton}>
                <DeferredContractStats tenantId={profile.tenant_id} contracts={contracts || []} />
            </Suspense>

            {/* Contract list renders FIRST */}
            <ContractList initialContracts={contracts || []} />
        </div>
    )
}
