'use server'

import { createClient } from '@/lib/supabase/server'
import { convertToAdvanceMode } from '@/lib/crm-mode'
import { revalidatePath } from 'next/cache'

/**
 * CRM modunu Basic → Advance'e yükselt (tek yönlü, geri alınamaz)
 */
export async function upgradeCrmMode() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    // Yetki kontrolü: sadece owner ve admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { success: false, error: 'Bu işlem için yetkiniz yok. Sadece firma sahibi veya admin yükseltme yapabilir.' }
    }

    const result = await convertToAdvanceMode(profile.tenant_id)

    if (result.success) {
        revalidatePath('/(dashboard)', 'layout')
        revalidatePath('/(dashboard)/settings', 'page')
    }

    return result
}

/**
 * Pipeline aşamalarını güncelle (tenant bazlı)
 */
export async function updatePipelineStages(stages: { key: string; label: string; color: string; order: number }[]) {
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
        return { success: false, error: 'Bu işlem için yetkiniz yok.' }
    }

    // Validasyon
    if (!stages || stages.length < 2) {
        return { success: false, error: 'En az 2 aşama gereklidir.' }
    }

    // key'lerin unique olduğunu kontrol et
    const keys = stages.map(s => s.key)
    if (new Set(keys).size !== keys.length) {
        return { success: false, error: 'Aşama anahtarları benzersiz olmalıdır.' }
    }

    // Order'ları düzelt
    const sorted = stages.map((s, i) => ({ ...s, order: i + 1 }))

    const { error } = await supabase
        .from('tenants')
        .update({ pipeline_stages: sorted })
        .eq('id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/settings', 'page')
    revalidatePath('/(dashboard)/opportunities', 'page')
    return { success: true }
}

/**
 * Lead bildirim modunu güncelle (WhatsApp ne zaman gönderilsin?)
 * 'immediate' = Lead oluştuğu anda
 * 'on_conversion' = Lead müşteriye dönüştürüldüğünde
 */
export async function updateLeadNotificationMode(mode: 'immediate' | 'on_conversion') {
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
        return { success: false, error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ lead_notification_mode: mode })
        .eq('id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/settings', 'page')
    return { success: true }
}

/**
 * Müşteri adayları (leads) atamalarında temsilciye WhatsApp bildirimi gitsin mi?
 */
export async function updateWaLeadAssignmentNotification(enabled: boolean) {
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
        return { success: false, error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ wa_lead_assignment_notification_enabled: enabled })
        .eq('id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/settings', 'page')
    return { success: true }
}

/**
 * Lead otomatik atama modunu güncelle
 * 'manual' = Manuel atama
 * 'round_robin' = Sırayla Dağıtım (Round-Robin)
 */
export async function updateLeadAssignmentMode(mode: 'manual' | 'round_robin') {
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
        return { success: false, error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('tenants')
        .update({ lead_assignment_mode: mode })
        .eq('id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/settings', 'page')
    return { success: true }
}
