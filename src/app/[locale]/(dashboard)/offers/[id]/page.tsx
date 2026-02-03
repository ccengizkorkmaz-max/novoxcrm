import { createClient } from '@/lib/supabase/server'
import OfferDetail from '@/app/[locale]/(dashboard)/crm/components/OfferDetail'
import { notFound } from 'next/navigation'
import { getPaymentPlan } from '@/app/[locale]/(dashboard)/crm/actions'

export default async function OfferDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    const { data: offer } = await supabase
        .from('offers')
        .select('*, customers(*), units(*, projects(*)), payment_plan')
        .eq('id', params.id)
        .single()

    if (!offer) {
        return notFound()
    }

    // Aggressive Fallback: If snapshot is missing, fetch live plan from Sale
    if (!offer.payment_plan) {
        if (offer.sale_id) {
            offer.payment_plan = await getPaymentPlan(offer.sale_id)
        } else {
            // Even deeper fallback for legacy offers (pre-id-fix)
            const { data: sale } = await supabase
                .from('sales')
                .select('id')
                .eq('unit_id', offer.unit_id)
                .eq('customer_id', offer.customer_id)
                .single()
            if (sale) {
                offer.payment_plan = await getPaymentPlan(sale.id)
            }
        }
    }

    return <OfferDetail offer={offer} />
}
