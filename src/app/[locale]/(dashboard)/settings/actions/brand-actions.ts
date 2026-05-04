'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { BrandConfig } from '@/lib/brand-config'

/**
 * Update tenant brand configuration (white-label settings)
 * Only owner/admin can update
 * Uses admin client for the DB update since tenant RLS doesn't allow UPDATE
 */
export async function updateBrandConfig(brandConfig: Partial<BrandConfig>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Tenant bulunamadı')
    if (!['owner', 'admin'].includes(profile.role || '')) {
        throw new Error('Bu işlem için yetkiniz yok')
    }

    // Use admin client to bypass RLS for tenant update
    const adminClient = createAdminClient()

    // Full replace — when user selects a preset, replace entire config
    // Remove null/undefined values
    const cleanConfig: Record<string, any> = {}
    Object.entries(brandConfig).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            cleanConfig[key] = value
        }
    })

    const { error } = await adminClient
        .from('tenants')
        .update({ brand_config: cleanConfig })
        .eq('id', profile.tenant_id)

    if (error) throw new Error('Marka ayarları güncellenemedi: ' + error.message)

    revalidatePath('/', 'layout')
    return { success: true }
}

/**
 * Reset brand config to defaults
 */
export async function resetBrandConfig() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Tenant bulunamadı')
    if (!['owner', 'admin'].includes(profile.role || '')) {
        throw new Error('Bu işlem için yetkiniz yok')
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({ brand_config: {} })
        .eq('id', profile.tenant_id)

    if (error) throw new Error('Sıfırlanamadı: ' + error.message)

    revalidatePath('/', 'layout')
    return { success: true }
}
