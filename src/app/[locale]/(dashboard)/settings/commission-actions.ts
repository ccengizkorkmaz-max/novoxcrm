'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates a commission rule's rate and description.
 * Only accessible by Admins/Owners.
 */
export async function updateCommissionRule(formData: FormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'owner', 'manager', 'crm_manager'].includes(profile?.role || '')) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // 2. Parse Data
    const id = formData.get('id') as string
    const rateRaw = formData.get('rate') as string // Percentage (e.g. 2 for 2%)
    const description = formData.get('description') as string

    if (!id || !rateRaw) return { error: 'Eksik bilgi.' }

    // Convert percentage (2) to decimal (0.02)
    const rate = parseFloat(rateRaw) / 100

    if (isNaN(rate)) return { error: 'Geçersiz oran.' }

    // 3. Update DB
    const { error } = await supabase
        .from('commission_rules')
        .update({
            rate,
            description
        })
        .eq('id', id)

    if (error) {
        console.error('Update Rule Error:', error)
        return { error: 'Güncelleme başarısız.' }
    }

    revalidatePath('/settings')
    return { success: true }
}
/**
 * Creates a new commission rule.
 */
export async function createCommissionRule(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile || !['admin', 'owner', 'crm_manager'].includes(profile.role || '')) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    const source_category = formData.get('source_category') as string
    const payment_type = formData.get('payment_type') as string
    const rateRaw = formData.get('rate') as string
    const description = formData.get('description') as string

    if (!source_category || !payment_type || !rateRaw) {
        return { error: 'Gerekli alanları doldurun.' }
    }

    const rate = parseFloat(rateRaw) / 100
    if (isNaN(rate)) return { error: 'Geçersiz oran.' }

    const { error } = await supabase
        .from('commission_rules')
        .insert({
            tenant_id: profile.tenant_id,
            source_category,
            payment_type,
            rate,
            description,
            role: 'sales' // Default role for now
        })

    if (error) {
        console.error('Create Rule Error:', error)
        return { error: 'Kural oluşturulamadı.' }
    }

    revalidatePath('/settings')
    return { success: true }
}

/**
 * Deletes a commission rule.
 */
export async function deleteCommissionRule(ruleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'owner', 'crm_manager'].includes(profile?.role || '')) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', ruleId)

    if (error) {
        console.error('Delete Rule Error:', error)
        return { error: 'Kural silinemedi.' }
    }

    revalidatePath('/settings')
    return { success: true }
}
