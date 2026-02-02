'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { syncBrokerLeadFromSale } from '@/app/broker/actions'

export async function createUnit(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const project_id = formData.get('project_id') as string
    const unit_number = formData.get('unit_number') as string
    const type = formData.get('type') as string
    const price = formData.get('price') as string
    const floor = formData.get('floor') as string
    const direction = formData.get('direction') as string
    const area_gross = formData.get('area_gross') as string
    const currency = formData.get('currency') as string || 'TRY'

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const { error } = await supabase
        .from('units')
        .insert({
            tenant_id: profile?.tenant_id,
            project_id,
            unit_number,
            type,
            price: parseFloat(price),
            currency,
            floor: parseInt(floor),
            direction,
            area_gross: parseFloat(area_gross),
            status: 'For Sale' // default
        })

    if (error) {
        console.error(error)
        return { error: 'Unit creation failed: ' + error.message }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function updateUnitStatus(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const status = formData.get('status') as string

    const { error } = await supabase
        .from('units')
        .update({ status })
        .eq('id', id)

    if (error) return { error: 'Update failed' };
    revalidatePath('/inventory')
    return { success: true }
}

export async function reserveUnit(formData: FormData) {
    const supabase = await createClient()
    const unitId = formData.get('unit_id') as string
    const customerId = formData.get('customer_id') as string
    const expiryDate = formData.get('expiry_date') as string
    const depositAmount = Number(formData.get('deposit_amount')) || 0

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) {
        return { error: 'Tenant information not found' }
    }

    // Get unit price and currency for the offer
    const { data: unit } = await supabase.from('units').select('price, currency').eq('id', unitId).single()
    if (!unit) return { error: 'Unit not found' }

    // Determination of initial status
    const initialSaleStatus = depositAmount > 0 ? 'Opsiyon - Kapora Bekleniyor' : 'Reservation'

    // 1. Update unit status
    const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'Reserved' })
        .eq('id', unitId)

    if (unitError) {
        console.error('Unit status update error:', unitError)
        return { error: 'Unit status update failed' }
    }

    // 2. Create reservation in sales table
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: customerId,
            unit_id: unitId,
            assigned_to: user.id,
            status: initialSaleStatus,
            reservation_expiry: expiryDate,
        })
        .select()
        .single()

    if (saleError) {
        console.error('Create reservation error:', saleError)
        return { error: 'Reservation record creation failed' }
    }

    // Broker Sync
    await syncBrokerLeadFromSale(sale.id, initialSaleStatus)

    // 3. Create Deposit record if > 0
    if (depositAmount > 0) {
        const { error: depositError } = await supabase.from('deposits').insert({
            tenant_id: profile.tenant_id,
            customer_id: customerId,
            sale_id: sale.id,
            amount: depositAmount,
            currency: unit.currency || 'TRY',
            status: 'Pending'
        })

        if (depositError) {
            console.error('Create Deposit Error:', depositError)
            return { error: 'Kapora kaydı oluşturulamadı.' }
        }
    }

    // 4. Create Offer record so "Document" exists
    const { error: offerError } = await supabase.from('offers').insert({
        tenant_id: profile.tenant_id,
        customer_id: customerId,
        unit_id: unitId,
        user_id: user.id,
        price: unit.price || 0,
        currency: unit.currency || 'TRY',
        status: 'Sent',
        valid_until: expiryDate,
        created_at: new Date().toISOString()
    })

    if (offerError) {
        console.error('Create offer error:', offerError)
    }

    revalidatePath('/inventory')
    revalidatePath('/options')
    revalidatePath('/offers')
    revalidatePath('/finance/deposits')
    return { success: true }
}

export async function updateReservation(formData: FormData) {
    const supabase = await createClient()
    const unitId = formData.get('unit_id') as string
    const expiryDate = formData.get('expiry_date') as string

    // 1. Update reservation_expiry in sales table
    const { error: saleError } = await supabase
        .from('sales')
        .update({ reservation_expiry: expiryDate })
        .eq('unit_id', unitId)
        .eq('status', 'Reservation')

    if (saleError) {
        console.error('Update reservation error:', saleError)
        return { error: 'Failed to update reservation expiry' }
    }

    // 2. Update valid_until in offers table for the active offer
    const { error: offerError } = await supabase
        .from('offers')
        .update({ valid_until: expiryDate })
        .eq('unit_id', unitId)
        .eq('status', 'Sent')

    if (offerError) {
        console.error('Update offer valid_until error:', offerError)
    }

    revalidatePath('/options')
    return { success: true }
}

export async function convertReservationToOffer(unitId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Get the current reservation sale
    const { data: sale } = await supabase
        .from('sales')
        .select('*')
        .eq('unit_id', unitId)
        .eq('status', 'Reservation')
        .single()

    if (!sale) return { error: 'No active reservation found for this unit' }

    // 2. Update Unit status to For Sale (technically it's now in Proposal)
    const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'For Sale' })
        .eq('id', unitId)

    if (unitError) return { error: 'Failed to update unit status' }

    // 3. Update Sales status to Proposal
    const { error: saleError } = await supabase
        .from('sales')
        .update({ status: 'Proposal' })
        .eq('id', sale.id)

    if (saleError) return { error: 'Failed to update sale status' }

    // Broker Sync
    await syncBrokerLeadFromSale(sale.id, 'Proposal')

    // 4. Update the active offer with the new price and payment plan
    // We need to fetch the payment plan snapshot for the offer
    // This logic is similar to crm/actions.ts updateSaleStatus
    const { data: paymentPlan } = await supabase
        .from('payment_plans')
        .select('*, payment_items(*)')
        .eq('sale_id', sale.id)
        .single()

    // 5. Upsert offer record
    // We update based on customer_id and unit_id to avoid duplicates, 
    // or insert if it doesn't exist.
    const { error: offerError } = await supabase
        .from('offers')
        .upsert({
            tenant_id: sale.tenant_id,
            customer_id: sale.customer_id,
            unit_id: unitId,
            user_id: user.id,
            status: 'Sent',
            price: sale.final_price || 0,
            currency: sale.currency || 'TRY',
            payment_plan: paymentPlan,
            updated_at: new Date().toISOString()
        }, { onConflict: 'customer_id,unit_id' })

    if (offerError) {
        console.error('Upsert Offer Error (Conversion):', offerError)
        // If upsert fails due to missing constraint or other, try a less strict update
        await supabase
            .from('offers')
            .update({
                status: 'Sent',
                price: sale.final_price || 0,
                currency: sale.currency || 'TRY',
                payment_plan: paymentPlan,
                updated_at: new Date().toISOString()
            })
            .match({ customer_id: sale.customer_id, unit_id: unitId })
    }


    if (offerError) {
        console.error('Update Offer Error (Conversion):', offerError)
    }

    revalidatePath('/options')
    revalidatePath('/offers')
    revalidatePath('/inventory')
    revalidatePath('/crm')
    return { success: true }
}



