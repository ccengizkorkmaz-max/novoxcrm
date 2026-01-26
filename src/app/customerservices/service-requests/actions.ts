'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createServiceRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get customer profile to get tenant_id and customer_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.customer_id) return { error: 'Customer profile not found' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!title || !description) return { error: 'Lütfen tüm alanları doldurun.' }

    const { error } = await supabase
        .from('service_requests')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: profile.customer_id,
            title,
            description,
            status: 'Open',
            priority: 'Normal'
        })

    if (error) {
        console.error('Create Service Request Error:', error)
        return { error: 'Talep oluşturulurken bir hata oluştu.' }
    }

    revalidatePath('/customerservices/service-requests')
    return { success: true }
}
