'use server'

import { createAdminClient } from '@/lib/supabase/admin'

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
 * Creates a system notification.
 */
export async function createNotification(params: CreateNotificationParams) {
    console.log('🔔 Attempting to create notification:', params.title);
    const supabaseAdmin = createAdminClient()

    // Deduplicate: check if same unread notification exists today for this specific user
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const query = supabaseAdmin
        .from('system_notifications')
        .select('id')
        .eq('tenant_id', params.tenant_id)
        .eq('title', params.title)
        .eq('message', params.message)
        .eq('is_read', false)
        .gte('created_at', startOfDay.toISOString());

    if (params.user_id) {
        query.eq('user_id', params.user_id);
    } else {
        query.is('user_id', null);
    }

    /* 
    const { data: existing, error: checkError } = await query.maybeSingle();

    if (checkError) {
        console.error('❌ Notification check error:', checkError);
    }

    if (existing) {
        console.log('⏭️ Notification skipped (duplicate):', params.title);
        return { skipped: true, id: existing.id };
    }
    */

    console.log('✍️ Inserting notification into DB...');
    const { data, error } = await supabaseAdmin
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
        console.error('❌ Insert notification error:', error)
        return { error: error.message }
    }

    console.log('✅ Notification created successfully:', data?.id);
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
