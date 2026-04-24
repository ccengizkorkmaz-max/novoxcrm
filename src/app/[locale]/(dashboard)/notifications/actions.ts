'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NotificationSettings {
    id?: string
    sms_provider: string
    sms_api_key: string
    sms_api_secret: string
    sms_header: string
    email_enabled: boolean
    sms_enabled: boolean
    notify_overdue_payments: boolean
    notify_approaching_checks: boolean
    notify_new_leads: boolean
}

/**
 * Fetches the notification settings for the current tenant.
 */
export async function getNotificationSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return null

    const { data: settings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()

    return settings
}

/**
 * Updates or creates notification settings.
 */
export async function updateNotificationSettings(data: NotificationSettings) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()

    if (!profile?.tenant_id) return { error: 'Tenant not found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Bu ayarları sadece yönetici değiştirebilir.' }
    }

    const { error } = await supabase
        .from('notification_settings')
        .upsert({
            tenant_id: profile.tenant_id,
            sms_provider: data.sms_provider,
            sms_api_key: data.sms_api_key,
            sms_api_secret: data.sms_api_secret,
            sms_header: data.sms_header,
            email_enabled: data.email_enabled,
            sms_enabled: data.sms_enabled,
            notify_overdue_payments: data.notify_overdue_payments,
            notify_approaching_checks: data.notify_approaching_checks,
            notify_new_leads: data.notify_new_leads,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })

    if (error) {
        console.error('Update Notification Settings Error:', error)
        return { error: 'Ayarlar güncellenemedi.' }
    }

    revalidatePath('/settings')
    return { success: true }
}

/**
 * Fetches recent system notifications for the current user.
 */
export async function getSystemNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data: notifications, error } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('❌ Fetch notifications error:', error)
    }

    console.log(`📡 Found ${notifications?.length || 0} notifications for user ${user.id} in tenant ${profile.tenant_id}`)
    return notifications || []
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', id)
        // Ensure user owns it or it's public
        .or(`user_id.eq.${user.id},user_id.is.null`)

    if (error) return { error: error.message }

    revalidatePath('/')
    return { success: true }
}

/**
 * Marks all notifications as read for the user.
 */
export async function markAllNotificationsAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant not found' }

    const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('tenant_id', profile.tenant_id)
        .eq('is_read', false)
        .or(`user_id.eq.${user.id},user_id.is.null`)

    if (error) return { error: error.message }

    revalidatePath('/')
    return { success: true }
}

/**
 * Deletes ALL notifications for the current tenant.
 * Only admin/owner can perform this action.
 * Uses admin client to bypass RLS for delete operations.
 */
export async function deleteAllNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant not found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Bu işlemi sadece yönetici yapabilir.' }
    }

    // Use admin client to bypass RLS for delete
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()

    const { error, count } = await adminSupabase
        .from('system_notifications')
        .delete()
        .eq('tenant_id', profile.tenant_id)

    if (error) {
        console.error('Delete all notifications error:', error)
        return { error: error.message }
    }

    console.log(`🗑️ Deleted ${count ?? 'all'} notifications for tenant ${profile.tenant_id}`)

    revalidatePath('/notifications')
    revalidatePath('/')
    return { success: true }
}
