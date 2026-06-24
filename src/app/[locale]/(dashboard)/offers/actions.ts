'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOffer(formData: FormData) {
    const supabase = await createClient()

    // validate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        console.error('No tenant_id found for user', user.id)
        return { error: 'No tenant associated with user.' }
    }

    const customer_id = formData.get('customer_id') as string
    const unit_id = formData.get('unit_id') as string
    const price = formData.get('price') as string
    const currency = formData.get('currency') as string || 'TRY'
    const status = formData.get('status') as string || 'Draft' // Default to Draft if not specified
    const valid_until = formData.get('valid_until') as string
    const notes = formData.get('notes') as string

    // Find active sale to link
    let saleQuery = supabase
        .from('sales')
        .select('id, status')
        .eq('customer_id', customer_id)
        .order('created_at', { ascending: false })
    if (unit_id) {
        saleQuery = saleQuery.eq('unit_id', unit_id)
    }
    const { data: sale } = await saleQuery.limit(1).maybeSingle()

    // Simple payment terms construction
    const advance = formData.get('advance') as string
    const installments = formData.get('installments') as string
    const payment_plan = {
        advance: advance ? parseFloat(advance) : 0,
        installments: installments ? parseInt(installments) : 1
    }

    const { error, data: newOffer } = await supabase
        .from('offers')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: user.id,
            customer_id,
            unit_id,
            sale_id: sale?.id || null,
            price: parseFloat(price),
            currency,
            status,
            valid_until: valid_until || null,
            notes,
            payment_plan
        })
        .select('id')
        .single()

    if (error) {
        console.error('Create Offer Error:', error)
        return { error: 'Failed to create offer' }
    }

    if (sale) {
        try {
            const { updateSaleStatus } = await import('@/app/[locale]/(dashboard)/crm/actions')
            await updateSaleStatus(sale.id, 'Proposal', undefined, true, true)
        } catch (syncErr) {
            console.error('Failed to sync offer creation status to sale:', syncErr)
        }
    }

    revalidatePath('/offers')
    return { success: true }
}

export async function deleteOffer(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete Offer Error:', error)
        return { error: 'Failed to delete offer' }
    }

    revalidatePath('/offers')
    return { success: true }
}

export async function updateOfferStatus(id: string, newStatus: string) {
    const supabase = await createClient()

    // Check for PAID deposits if trying to reject/cancel
    if (['Rejected', 'Cancelled', 'Draft'].includes(newStatus)) {
        const { data: paidDeposit } = await supabase
            .from('deposits')
            .select('id')
            .eq('offer_id', id)
            .eq('status', 'Paid')
            .maybeSingle()

        if (paidDeposit) {
            await supabase.from('deposits').update({ status: 'Refund Pending' }).eq('id', paidDeposit.id)
            revalidatePath('/finance/deposits')
            return { success: true, message: 'Kapora ödemesi onaylı olduğu için iade süreci başlatıldı. İade tamamlandığında teklif durumu güncellenecektir.' }
        }
    }

    const { error } = await supabase
        .from('offers')
        .update({ status: newStatus })
        .eq('id', id)

    if (error) {
        console.error('Update Offer Status Error:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/finance/deposits')
    return { success: true }
}

export async function checkOfferExpirations(shouldRevalidate: boolean = true) {
    const supabase = await createClient()

    // Find offers that are 'Sent' and valid_until < now
    const { data: expiredOffers, error } = await supabase
        .from('offers')
        .select('id')
        .eq('status', 'Sent')
        .lt('valid_until', new Date().toISOString())

    if (error) {
        console.error('Check Expiration Error:', error)
        return
    }

    if (expiredOffers && expiredOffers.length > 0) {
        const ids = expiredOffers.map(o => o.id)
        await supabase
            .from('offers')
            .update({ status: 'Expired' })
            .in('id', ids)

        console.log(`Expired ${ids.length} offers`)

        if (shouldRevalidate) {
            revalidatePath('/offers')
        }
    }
}

export async function markOfferAsLost(offerId: string, lostReason: string) {
    const supabase = await createClient()
    
    // Get current user tenant
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    try {
        // 1. Get offer details (to get sale_id and unit_id)
        const { data: offer } = await supabase
            .from('offers')
            .select('sale_id, unit_id, customer_id')
            .eq('id', offerId)
            .single()

        if (!offer) throw new Error('Teklif bulunamadı')

        // 2. Update offer status to 'Rejected'
        const { error: offerError } = await supabase
            .from('offers')
            .update({ status: 'Rejected' })
            .eq('id', offerId)

        if (offerError) throw offerError

        // 3. Update the related sale to 'Lost' if sale_id exists
        if (offer.sale_id) {
            const { error: saleError } = await supabase
                .from('sales')
                .update({ 
                    status: 'Lost', 
                    lost_reason: lostReason || null 
                })
                .eq('id', offer.sale_id)

            if (saleError) throw saleError
        }

        // 4. Update the unit status to 'For Sale' if unit_id exists
        if (offer.unit_id) {
            const { error: unitError } = await supabase
                .from('units')
                .update({ status: 'For Sale' })
                .eq('id', offer.unit_id)

            if (unitError) console.error('Failed to release unit during offer rejection:', unitError)

            // Log activity
            try {
                const { data: customer } = await supabase.from('customers').select('full_name').eq('id', offer.customer_id).single()
                const { data: unit } = await supabase.from('units').select('unit_number, project_id').eq('id', offer.unit_id).single()

                await supabase.from('activities').insert({
                    tenant_id: profile?.tenant_id,
                    customer_id: offer.customer_id,
                    owner_id: user?.id,
                    user_id: user?.id,
                    project_id: unit?.project_id || null,
                    type: 'System',
                    topic: 'Satış Kapandı',
                    summary: `Teklif Reddedildi / Kaybedildi olarak işaretlendi`,
                    description: `Müşteri: ${customer?.full_name || 'Bilinmiyor'}, Ünite: ${unit?.unit_number || ''}. Gerekçe: ${lostReason || 'Belirtilmedi'}`,
                    status: 'Completed',
                    due_date: new Date().toISOString()
                })
            } catch (logErr) {
                console.error('Failed to log lost offer activity:', logErr)
            }
        }

        revalidatePath('/offers')
        revalidatePath('/crm')
        revalidatePath('/inventory')

        return { success: true }
    } catch (error: any) {
        console.error('Mark Offer As Lost Error:', error)
        return { error: error.message }
    }
}
