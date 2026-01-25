import { createClient } from '@/lib/supabase/server'
import OfferList from '@/app/(dashboard)/crm/components/OfferList'

export default async function OffersPage() {
    const supabase = await createClient()

    // Fetch Offers
    const { data: offers } = await supabase
        .from('offers')
        .select('*, customers(full_name), units(unit_number, projects(name)), offer_negotiations(*)')
        .neq('status', 'Closed') // Hide signed/closed offers
        .order('created_at', { ascending: false })


    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Teklif Yönetimi</h1>
            </div>

            <OfferList offers={offers || []} />
        </div>
    )
}
