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
    const status = 'Draft' // Default status
    const valid_until = formData.get('valid_until') as string
    const notes = formData.get('notes') as string

    // Simple payment terms construction
    const advance = formData.get('advance') as string
    const installments = formData.get('installments') as string
    const payment_plan = {
        advance: advance ? parseFloat(advance) : 0,
        installments: installments ? parseInt(installments) : 1
    }

    const { error } = await supabase
        .from('offers')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: user.id,
            customer_id,
            unit_id,
            price: parseFloat(price),
            currency,
            status,
            valid_until: valid_until || null,
            notes,
            payment_plan
        })

    if (error) {
        console.error('Create Offer Error:', error)
        return { error: 'Failed to create offer' }
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

    revalidatePath('/offers')
    revalidatePath('/crm')
    revalidatePath('/finance/deposits')
    return { success: true }
}
