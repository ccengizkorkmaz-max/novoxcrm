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
