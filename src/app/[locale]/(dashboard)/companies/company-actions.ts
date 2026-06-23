'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCompany(data: {
    name: string
    tax_number?: string
    tax_office?: string
    trade_registry_no?: string
    sector?: string
    website?: string
    phone?: string
    email?: string
    notes?: string
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

    const { data: company, error } = await supabase
        .from('companies')
        .insert({ ...data, tenant_id: profile.tenant_id, created_by: user.id })
        .select('id')
        .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/companies')
    return { success: true, companyId: company?.id }
}

export async function updateCompany(companyId: string, data: {
    name?: string
    tax_number?: string | null
    tax_office?: string | null
    trade_registry_no?: string | null
    sector?: string | null
    website?: string | null
    phone?: string | null
    email?: string | null
    status?: string
    notes?: string | null
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
        .from('companies')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', companyId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/companies')
    return { success: true }
}

export async function deleteCompany(companyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { success: false, error: 'Silme yetkiniz yok' }
    }

    const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/companies')
    return { success: true }
}

export async function getActiveCompanies() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'active')
        .order('name')

    if (error) {
        console.error('[getActiveCompanies] Error:', error.message)
        return []
    }
    return data || []
}

export async function getAllCustomersForSelect() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone')
        .eq('tenant_id', profile.tenant_id)
        .order('full_name')

    if (error) {
        console.error('[getAllCustomersForSelect] Error:', error.message)
        return []
    }
    return data || []
}

export async function getCompanyContacts(companyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { contacts: [] }

    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone, email')
        .eq('company_id', companyId)
        .order('full_name')

    if (error) return { error: error.message, contacts: [] }
    return { contacts: data || [] }
}

export async function addContactToCompany(companyId: string, customerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { error } = await supabase
        .from('customers')
        .update({ company_id: companyId })
        .eq('id', customerId)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/(dashboard)/companies')
    revalidatePath('/companies')
    revalidatePath('/(dashboard)/crm')
    revalidatePath('/crm')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath(`/(dashboard)/customers/${customerId}`)
    return { success: true }
}

export async function removeContactFromCompany(customerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { error } = await supabase
        .from('customers')
        .update({ company_id: null })
        .eq('id', customerId)

    if (error) return { success: false, error: error.message }
    
    revalidatePath('/(dashboard)/companies')
    revalidatePath('/companies')
    revalidatePath('/(dashboard)/crm')
    revalidatePath('/crm')
    revalidatePath(`/customers/${customerId}`)
    revalidatePath(`/(dashboard)/customers/${customerId}`)
    return { success: true }
}
