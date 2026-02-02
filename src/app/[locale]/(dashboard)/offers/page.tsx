import { createClient } from '@/lib/supabase/server'
import OfferList from '@/app/[locale]/(dashboard)/crm/components/OfferList'
import { getTranslations } from 'next-intl/server'

export default async function OffersPage() {
    const supabase = await createClient()
    const t = await getTranslations('Offers')

    // Fetch Offers
    const { data: offers } = await supabase
        .from('offers')
        .select('*, customers(full_name), units(unit_number, projects(name)), offer_negotiations(*)')
        .neq('status', 'Closed') // Hide signed/closed offers
        .order('created_at', { ascending: false })


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <OfferList offers={offers || []} />
        </div>
    )
}
