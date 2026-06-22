'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAddress(data: {
    customer_id?: string
    company_id?: string
    address_type: string
    is_primary?: boolean
    label?: string
    address_line1: string
    address_line2?: string
    district?: string
    city: string
    state?: string
    postal_code?: string
    country?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // Eğer primary ise diğerlerini primary olmaktan çıkar
    if (data.is_primary) {
        const filter = data.customer_id
            ? { customer_id: data.customer_id }
            : { company_id: data.company_id }

        await supabase
            .from('customer_addresses')
            .update({ is_primary: false })
            .eq('tenant_id', profile.tenant_id)
            .match(filter)
    }

    const { error } = await supabase
        .from('customer_addresses')
        .insert({ ...data, tenant_id: profile.tenant_id })

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)')
    return { success: true }
}

export async function updateAddress(addressId: string, data: {
    address_type?: string
    is_primary?: boolean
    label?: string
    address_line1?: string
    address_line2?: string | null
    district?: string | null
    city?: string
    state?: string | null
    postal_code?: string | null
    country?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const { error } = await supabase
        .from('customer_addresses')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', addressId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)')
    return { success: true }
}

export async function deleteAddress(addressId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)')
    return { success: true }
}

export async function getAddresses(ownerId: string, ownerType: 'customer' | 'company') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return []

    const query = supabase
        .from('customer_addresses')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })

    if (ownerType === 'customer') {
        query.eq('customer_id', ownerId)
    } else {
        query.eq('company_id', ownerId)
    }

    const { data } = await query
    return data || []
}
