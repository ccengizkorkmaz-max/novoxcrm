'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function approveLead(saleId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Update sale status from 'Inbox' to 'Lead'
        const { error } = await supabase
            .from('sales')
            .update({ status: 'Lead' })
            .eq('id', saleId)
            .eq('status', 'Inbox') // Only update if still in Inbox status

        if (error) {
            console.error('Error approving lead:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        revalidatePath('/[locale]/(dashboard)/crm')

        return { success: true }
    } catch (error: any) {
        console.error('Server error approving lead:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}
