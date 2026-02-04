'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRepresentativeAssignments() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.log('Update Rep: No user found')
            return { success: false, error: 'Unauthorized' }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            console.log('Update Rep: No tenant found')
            return { success: false, error: 'No tenant found' }
        }

        console.log('Update Rep: Updating assignments from Cengiz Korkmaz to Burak Kotaman...')

        const cengizUserId = '60925a94-8539-484d-843d-a11ae0e00ddd'
        const burakUserId = 'a4f33bd0-800f-416f-8da7-a7c7aaa557dc'

        // Update sales records
        const { data: updatedSales, error: salesError } = await supabase
            .from('sales')
            .update({ assigned_to: burakUserId })
            .eq('tenant_id', profile.tenant_id)
            .eq('assigned_to', cengizUserId)
            .select('id')

        if (salesError) {
            console.error('Update Rep: Sales update error:', salesError)
            throw salesError
        }

        const salesCount = updatedSales?.length || 0
        console.log(`Update Rep: Updated ${salesCount} sales records`)

        // Update activities
        const { data: updatedActivities, error: activitiesError } = await supabase
            .from('activities')
            .update({ owner_id: burakUserId })
            .eq('tenant_id', profile.tenant_id)
            .eq('owner_id', cengizUserId)
            .select('id')

        if (activitiesError) {
            console.error('Update Rep: Activities update error:', activitiesError)
            // Don't throw, just log
        }

        const activitiesCount = updatedActivities?.length || 0
        console.log(`Update Rep: Updated ${activitiesCount} activities`)

        revalidatePath('/[locale]/(dashboard)/crm')
        revalidatePath('/[locale]/(dashboard)/activities')

        return {
            success: true,
            salesCount,
            activitiesCount,
            message: `${salesCount} satış kaydı ve ${activitiesCount} aktivite güncellendi.`
        }

    } catch (error: any) {
        console.error('Update Rep: Fatal error:', error)
        return { success: false, error: `Güncelleme hatası: ${error.message}` }
    }
}
