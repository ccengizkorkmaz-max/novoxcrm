import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/app/[locale]/(dashboard)/crm/components/CustomerList'
import { getTranslations } from 'next-intl/server'
import React from 'react'

export default async function CustomersPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const t = await getTranslations('Customers')
    const supabase = await createClient()
    const filterSearch = searchParams.q as string

    // 1. Build Base Query for Customers
    let query = supabase
        .from('customers')
        .select('*, customer_demands(*), contract_customers(id)', { count: 'exact' })

    if (filterSearch) {
        query = query.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`)
    }

    const page = Number(searchParams.page) || 1
    const itemsPerPage = 50
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    // 2. Fetch customers with count and range
    const { data: customers, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching customers:', error)
    }

    const allCustomers = customers || []
    const totalCount = count || 0

    // 3. Fetch all sources for stats (lighter query)
    const { data: allSources } = await supabase
        .from('customers')
        .select('source')

    const sourceCounts = (allSources || []).reduce((acc: Record<string, number>, c) => {
        const src = c.source || 'Belirtilmemiş'
        acc[src] = (acc[src] || 0) + 1
        return acc
    }, {})

    // 4. Fetch Profiles for Activity assignment
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isManager = currentProfile?.role === 'manager' || currentProfile?.role === 'admin' || currentProfile?.role === 'owner'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <div className="rounded-md border bg-card p-6">
                <React.Suspense fallback={<div className="h-96 w-full bg-gray-100 animate-pulse rounded" />}>
                    <CustomerList
                        customers={allCustomers || []}
                        totalRecords={totalCount}
                        initialPage={page}
                        sourceStats={sourceCounts}
                        profiles={profiles || []}
                        isManager={isManager}
                    />
                </React.Suspense>
            </div>
        </div>
    )
}
