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

export async function migrateWebLeadsToInbox() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Find all customers with web@novosirketlergrubu.com email
        const { data: webCustomers, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('email', 'web@novosirketlergrubu.com')

        if (customerError) {
            console.error('Error finding web customers:', customerError)
            return { success: false, error: customerError.message }
        }

        if (!webCustomers || webCustomers.length === 0) {
            return { success: true, count: 0, message: 'No web@ customers found' }
        }

        const customerIds = webCustomers.map(c => c.id)

        // Update their sales from 'Lead' to 'Inbox'
        const { data, error } = await supabase
            .from('sales')
            .update({ status: 'Inbox' })
            .in('customer_id', customerIds)
            .eq('status', 'Lead')
            .not('description', 'is', null)
            .select('id')

        if (error) {
            console.error('Error migrating leads:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        revalidatePath('/[locale]/(dashboard)/crm')

        return { success: true, count: data?.length || 0 }
    } catch (error: any) {
        console.error('Server error migrating leads:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}
