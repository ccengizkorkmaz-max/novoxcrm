import { createClient } from '@/lib/supabase/server'
import CustomerList from '@/app/[locale]/(dashboard)/crm/components/CustomerList'
import { getTranslations } from 'next-intl/server'

export default async function CustomersPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const t = await getTranslations('Customers')
    const supabase = await createClient()
    const filterSearch = searchParams.q as string

    // 1. Build Base Query for Customers
    let query = supabase
        .from('customers')
        .select('*, customer_demands(*), contract_customers(id)')

    if (filterSearch) {
        query = query.or(`full_name.ilike.%${filterSearch}%,phone.ilike.%${filterSearch}%,email.ilike.%${filterSearch}%`)
    }

    // Fetch customers in batches (bypassing the 1000 limit)
    let allCustomers: any[] = []
    let from = 0
    const batchSize = 1000
    let hasMore = true

    while (hasMore) {
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(from, from + batchSize - 1)

        if (error) {
            console.error('Error fetching customers batch:', error)
            hasMore = false
        } else if (data && data.length > 0) {
            allCustomers = [...allCustomers, ...data]
            from += batchSize
            if (data.length < batchSize) hasMore = false
        } else {
            hasMore = false
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <div className="rounded-md border bg-card p-6">
                <CustomerList customers={allCustomers || []} />
            </div>
        </div>
    )
}
