import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/app/[locale]/(dashboard)/crm/components/CustomerList'
import { getTranslations } from 'next-intl/server'
import React, { Suspense } from 'react'

// Deferred component — source stats load in background
async function DeferredSourceStats({
    children,
    sourceCounts,
    profiles,
    isManager
}: {
    children: React.ReactNode
    sourceCounts: Record<string, number>
    profiles: any[]
    isManager: boolean
}) {
    return <>{children}</>
}

// Async server component for source stats (streams in via Suspense)
async function SourceStatsLoader({ tenantId }: { tenantId?: string }) {
    const supabase = await createClient()
    const { data: allSources } = await supabase
        .from('customers')
        .select('source')
        .limit(5000)

    const sourceCounts = (allSources || []).reduce((acc: Record<string, number>, c) => {
        const src = c.source || 'Belirtilmemiş'
        acc[src] = (acc[src] || 0) + 1
        return acc
    }, {})

    // Return stats as JSON script for client hydration
    return (
        <script
            id="source-stats-data"
            type="application/json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(sourceCounts) }}
        />
    )
}

export default async function CustomersPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const supabase = await createClient()

    // ============================================================
    // CRITICAL PATH: Auth + Customer list (50 records) — loads FIRST
    // ============================================================
    const [t, { data: { user } }] = await Promise.all([
        getTranslations('Customers'),
        supabase.auth.getUser()
    ])

    const filterSearch = searchParams.q as string
    const sortKey = (searchParams.sort as string) || 'created_at'
    const sortOrder = (searchParams.order as string) === 'asc'

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // Build customer list query
    let query = supabase
        .from('customers')
        .select('*, customer_demands(*), contract_customers(id)', { count: 'exact' })

    if (filterSearch) {
        query = query.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`)
    }

    // Fetch customer list + source stats + profiles + user role in parallel
    const [
        customerResult,
        allSourcesResult,
        profilesResult,
        currentProfileResult
    ] = await Promise.all([
        // Critical: Customer list (50 records)
        query.order(sortKey as 'full_name' | 'created_at', { ascending: sortOrder }).range(from, to),
        // Secondary: Source stats
        supabase.from('customers').select('source').limit(5000),
        // Secondary: Profiles for Activity assignment
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        // Secondary: Current user role
        user ? supabase.from('profiles').select('role').eq('id', user.id).single() : Promise.resolve({ data: null })
    ])

    const allCustomers = customerResult.data || []
    const totalCount = customerResult.count || 0

    const allSources = allSourcesResult.data || []
    const sourceCounts = allSources.reduce((acc: Record<string, number>, c) => {
        const src = c.source || 'Belirtilmemiş'
        acc[src] = (acc[src] || 0) + 1
        return acc
    }, {})

    const profiles = profilesResult.data || []
    const currentProfile = currentProfileResult.data
    const isManager = currentProfile?.role === 'manager' || currentProfile?.role === 'admin' || currentProfile?.role === 'owner'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <div className="rounded-md border bg-card p-6">
                <CustomerList
                    customers={allCustomers || []}
                    totalRecords={totalCount}
                    initialPage={page}
                    sourceStats={sourceCounts}
                    profiles={profiles || []}
                    isManager={isManager}
                    initialSort={{ key: sortKey as 'full_name' | 'created_at', order: sortOrder ? 'asc' : 'desc' }}
                />
            </div>
        </div>
    )
}
