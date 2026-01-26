'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { finalizeOffer } from '../crm/actions'
import { syncBrokerLeadFromSale } from '@/app/broker/actions'

export async function getDeposits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data: deposits, error } = await supabase
        .from('deposits')
        .select(`
            *,
            customer:customers(full_name),
            sale:sales(unit_id, unit:units(unit_number, block)),
            offer:offers(unit_id, unit:units(unit_number, block))
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Deposits Error:', error)
        return []
    }

    return deposits || []
}

export async function confirmDeposit(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch deposit details
    const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single()

    if (fetchError || !deposit) return { error: 'Deposit not found' }

    // 2. Update deposit status
    const { error: updateError } = await supabase
        .from('deposits')
        .update({
            status: 'Paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', depositId)

    if (updateError) return { error: updateError.message }

    // 3. Update associated sale or offer status
    if (deposit.sale_id) {
        // From 'Opsiyon - Kapora Bekleniyor' -> 'Reserved' (Opsiyonlu)
        const { error: saleError } = await supabase
            .from('sales')
            .update({ status: 'Reservation' }) // Final confirmed status
            .eq('id', deposit.sale_id)

        if (saleError) return { error: saleError.message }

        // Broker Sync
        await syncBrokerLeadFromSale(deposit.sale_id, 'Reservation')
    } else if (deposit.offer_id) {
        // Use the centralized finalization logic
        const finalizeResult = await finalizeOffer(deposit.offer_id)
        if (finalizeResult.error) return { error: finalizeResult.error }
    }

    revalidatePath('/finance/deposits')
    revalidatePath('/inventory')
    revalidatePath('/offers')

    return { success: true }
}

export async function confirmRefund(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch deposit details
    const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single()

    if (fetchError || !deposit) return { error: 'Deposit not found' }

    // 2. Update deposit status to Refunded
    const { error: updateError } = await supabase
        .from('deposits')
        .update({
            status: 'Refunded',
            updated_at: new Date().toISOString()
        })
        .eq('id', depositId)

    if (updateError) return { error: updateError.message }

    // 3. Finalize Cancellation of the associated entity
    if (deposit.sale_id) {
        // Free the Unit and update Sale
        const { data: sale } = await supabase.from('sales').select('unit_id').eq('id', deposit.sale_id).single()

        await supabase.from('sales').update({ status: 'Lost', reservation_expiry: null }).eq('id', deposit.sale_id)

        if (sale?.unit_id) {
            await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
        }

        // Broker Sync
        await syncBrokerLeadFromSale(deposit.sale_id, 'Lost')
    } else if (deposit.offer_id) {
        // Update Offer status
        await supabase.from('offers').update({ status: 'Cancelled' }).eq('id', deposit.offer_id)
    }

    revalidatePath('/finance/deposits')
    revalidatePath('/inventory')
    revalidatePath('/offers')
    revalidatePath('/crm')

    return { success: true }
}

export async function cancelDeposit(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('deposits')
        .update({ status: 'Cancelled' })
        .eq('id', depositId)

    if (error) return { error: error.message }

    revalidatePath('/finance/deposits')
    return { success: true }
}
