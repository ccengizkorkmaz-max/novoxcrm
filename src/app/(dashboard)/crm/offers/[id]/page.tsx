import { createClient } from '@/lib/supabase/server'
import OfferDetail from '../../components/OfferDetail'
import { notFound } from 'next/navigation'

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()

    const { data: offer } = await supabase
        .from('offers')
        .select('*, customers(*), units(*, projects(*))')
        .eq('id', params.id)
        .single()

    if (!offer) {
        return notFound()
    }

    return <OfferDetail offer={offer} />
}
