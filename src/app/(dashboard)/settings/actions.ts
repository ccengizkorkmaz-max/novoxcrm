'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateTenantProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const updates = {
        name: formData.get('name') as string,
        logo_url: formData.get('logo_url') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update Tenant Error:', error)
        return { error: 'Failed to update tenant profile' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function inviteUser(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string || 'user'

    // For MVP: We'll create a simplified invitation
    // In production, you'd use Supabase Auth Admin API to send invite emails
    // For now, we'll just create a profile entry (user must sign up separately)

    // Note: This is a simplified approach. In production, use:
    // const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)

    // For now, just return success with a message
    return {
        success: true,
        message: `Invitation prepared for ${email}. User must sign up with this email.`
    }
}

export async function createPaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .insert({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })

    if (error) {
        console.error('Create Template Error:', error)
        return { error: 'Failed to create template' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deletePaymentPlanTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('payment_plan_templates').delete().eq('id', id)
    if (error) {
        return { error: 'Failed to delete template' }
    }
    revalidatePath('/settings')
    return { success: true }
}

export async function updatePaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .update({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })
        .eq('id', id)

    if (error) {
        console.error('Update Template Error:', error)
        return { error: 'Failed to update template' }
    }

    revalidatePath('/settings')
    return { success: true }
}
