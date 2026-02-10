'use server'

import { createClient } from '@/lib/supabase/server'

export type NotificationType = 'Info' | 'Warning' | 'Alert' | 'Success'
export type NotificationCategory = 'CRM' | 'Finance' | 'System' | 'HR' | 'Inventory'

interface CreateNotificationParams {
    tenant_id: string
    user_id?: string | null  // null = broadcast to all users in tenant
    type: NotificationType
    category: NotificationCategory
    title: string
    message: string
    link?: string
}

/**
 * Creates a system notification. Can be called from any server action or API route.
 * If user_id is null, the notification is visible to all users in the tenant.
 */
export async function createNotification(params: CreateNotificationParams) {
    const supabase = await createClient()

    // Deduplicate: check if same unread notification exists today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: existing } = await supabase
        .from('system_notifications')
        .select('id')
        .eq('tenant_id', params.tenant_id)
        .eq('title', params.title)
        .eq('message', params.message)
        .eq('is_read', false)
        .gte('created_at', startOfDay.toISOString())
        .maybeSingle()

    if (existing) return { skipped: true, id: existing.id }

    const { data, error } = await supabase
        .from('system_notifications')
        .insert({
            tenant_id: params.tenant_id,
            user_id: params.user_id || null,
            type: params.type,
            category: params.category,
            title: params.title,
            message: params.message,
            link: params.link || null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Create notification error:', error)
        return { error: error.message }
    }

    return { success: true, id: data?.id }
}

/**
 * Batch create notifications for multiple events.
 */
export async function createBatchNotifications(items: CreateNotificationParams[]) {
    const results = []
    for (const item of items) {
        const result = await createNotification(item)
        results.push(result)
    }
    return results
}
