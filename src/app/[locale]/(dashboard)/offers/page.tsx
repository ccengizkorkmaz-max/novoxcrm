import { createClient } from '@/lib/supabase/server'
import OfferList from '@/app/[locale]/(dashboard)/crm/components/OfferList'
import { getTranslations } from 'next-intl/server'
import GeneralSearch from '@/components/dashboard/GeneralSearch'

import { checkOfferExpirations } from './actions'

export default async function OffersPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { locale } = await props.params
    const searchParams = await props.searchParams
    const query = searchParams.q as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner'

    await checkOfferExpirations(false) // Check expirations on load, skip reval
    const t = await getTranslations('Offers')

    // Fetch Offers
    let baseQuery = supabase
        .from('offers')
        .select('*, customers(full_name), units(unit_number, projects(name)), offer_negotiations(*), payment_plan')
        .neq('status', 'Closed') // Hide signed/closed offers

    if (!isManager && user) {
        baseQuery = baseQuery.eq('created_by', user.id)
    }

    if (query) {
        // Search by customer name or unit number
        baseQuery = baseQuery.or(`full_name.ilike.%${query}%`, { foreignTable: 'customers' })
    }

    const { data: offers } = await baseQuery.order('created_at', { ascending: false })


    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <GeneralSearch namespace="Offers" placeholderKey="table.search" />
            </div>

            <OfferList offers={offers || []} />
        </div>
    )
}
