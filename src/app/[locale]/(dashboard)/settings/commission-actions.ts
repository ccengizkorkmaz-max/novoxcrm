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
    if (!['admin', 'owner', 'manager'].includes(profile?.role || '')) {
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
