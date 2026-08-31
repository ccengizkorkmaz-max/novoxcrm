import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/app/[locale]/(dashboard)/crm/components/CustomerList'
import NewContactModal from '@/app/[locale]/(dashboard)/crm/components/NewContactModal'
import { getTranslations } from 'next-intl/server'
import React from 'react'

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
        const { buildCustomerSearchFilter } = await import('@/lib/phone-search-utils')
        const searchFilter = buildCustomerSearchFilter(filterSearch)
        if (searchFilter) {
            query = query.or(searchFilter)
        }
    }

    // Fetch customer list + profiles + user role + source stats in parallel (single roundtrip)
    const [
        customerResult,
        profilesResult,
        currentProfileResult,
        sourceStatsResult,
        projectsResult
    ] = await Promise.all([
        // Critical: Customer list (50 records)
        query.order(sortKey as 'full_name' | 'created_at', { ascending: sortOrder }).range(from, to),
        // Secondary: Profiles for Activity assignment
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        // Secondary: Current user role
        user ? supabase.from('profiles').select('role').eq('id', user.id).single() : Promise.resolve({ data: null }),
        // Performance View: Fetch source counts in a single aggregated DB query!
        supabase.from('tenant_customer_source_stats').select('source, count'),
        // Secondary: Projects for Activity creation
        supabase.from('projects').select('id, name').order('name')
    ])

    const allCustomers = customerResult.data || []
    const totalCount = customerResult.count || 0

    const sourceCounts = (sourceStatsResult.data || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.source] = item.count
        return acc
    }, {})

    const profiles = profilesResult.data || []
    const currentProfile = currentProfileResult.data
    const isManager = currentProfile?.role === 'manager' || currentProfile?.role === 'admin' || currentProfile?.role === 'owner'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <NewContactModal profiles={profiles || []} />
            </div>

            <div className="rounded-md border bg-card p-6">
                <CustomerList
                    customers={allCustomers || []}
                    totalRecords={totalCount}
                    initialPage={page}
                    sourceStats={sourceCounts}
                    profiles={profiles || []}
                    projects={projectsResult?.data || []}
                    isManager={isManager}
                    initialSort={{ key: sortKey as 'full_name' | 'created_at', order: sortOrder ? 'asc' : 'desc' }}
                />
            </div>
        </div>
    )
}
