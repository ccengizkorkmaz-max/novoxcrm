import { createClient } from '@/lib/supabase/client' // Using client for simpler auth context in edge/serverless reuse
import { createClient as createServerClient } from '@/lib/supabase/server'

interface ScanResult {
    notificationsCreated: number
    queueItemsCreated: number
    errors: string[]
}

/**
 * Scans for overdue payments and approaching valuable papers.
 * Recommended to run this via a Cron Job (e.g., every morning).
 */
export async function scanForNotifications(): Promise<ScanResult> {
    const supabase = await createServerClient()
    const result: ScanResult = { notificationsCreated: 0, queueItemsCreated: 0, errors: [] }

    // 1. Get all tenants with notification settings
    const { data: allSettings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')

    if (settingsError) {
        result.errors.push(`Settings Fetch Error: ${settingsError.message}`)
        return result
    }

    if (!allSettings || allSettings.length === 0) return result

    const today = new Date()
    const threeDaysLater = new Date()
    threeDaysLater.setDate(today.getDate() + 3)

    for (const settings of allSettings) {
        const tenantId = settings.tenant_id

        // --- A. Overdue Payments Scan ---
        if (settings.notify_overdue_payments) {
            const { data: overdueItems } = await supabase
                .from('payment_items')
                .select(`
                    id, amount, due_date,
                    payment_plans (
                        sales (
                            id,
                            customers (id, full_name, email, phone)
                        )
                    )
                `)
                .eq('tenant_id', tenantId)
                .neq('status', 'Paid')
                .lt('due_date', today.toISOString())
                // Prevent duplicate notifications for the same item today? 
                // In a real system, we'd check a 'last_notified_at' field. 
                // For simplified MVP, we'll rely on the UI list or a distinct check if needed.
                .limit(50)

            for (const item of overdueItems || []) {
                // @ts-ignore
                const customer = item.payment_plans?.sales?.customers
                if (!customer) continue

                // 1. Create System Notification for Admin
                await createSystemNotification(supabase, tenantId, {
                    type: 'Alert',
                    category: 'Finance',
                    title: 'Gecikmiş Ödeme',
                    message: `${customer.full_name} isimli müşterinin ${new Date(item.due_date).toLocaleDateString('tr-TR')} vadeli ödemesi gecikmiştir.`,
                    link: `/finance`
                })
                result.notificationsCreated++

                // 2. Add to Queue for Customer (SMS/Email)
                await addToNotificationQueue(supabase, tenantId, {
                    recipient_type: 'Customer',
                    recipient_id: customer.id,
                    recipient_contact: settings.sms_enabled ? customer.phone : customer.email,
                    channel: settings.sms_enabled ? 'SMS' : 'Email',
                    subject: 'Ödeme Hatırlatması',
                    content: `Sayın ${customer.full_name}, vadesi geçen ödemeniz bulunmaktadır. Lütfen en kısa sürede iletişime geçiniz.`
                })
                result.queueItemsCreated++
            }
        }

        // --- B. Approaching Checks Scan ---
        if (settings.notify_approaching_checks) {
            const { data: approachingPapers } = await supabase
                .from('valuable_papers')
                .select(`
                    id, amount, due_date, paper_type,
                    customers (full_name)
                `)
                .eq('tenant_id', tenantId)
                .eq('status', 'Portföyde')
                .gt('due_date', today.toISOString())
                .lt('due_date', threeDaysLater.toISOString())

            for (const paper of approachingPapers || []) {
                // @ts-ignore
                const customerName = paper.customers?.full_name || 'Bilinmiyor'

                await createSystemNotification(supabase, tenantId, {
                    type: 'Info',
                    category: 'Finance',
                    title: 'Yaklaşan Çek/Senet',
                    message: `${customerName} müşterisine ait ${new Date(paper.due_date).toLocaleDateString('tr-TR')} vadeli evrağın günü yaklaşmaktadır.`,
                    link: `/finance?tab=papers`
                })
                result.notificationsCreated++
            }
        }
    }

    return result
}

// --- Helpers ---

async function createSystemNotification(supabase: any, tenantId: string, data: any) {
    // Check duplication to prevent spamming the same alert repeatedly
    // For MVP, we check if an identical unread notification exists created today
    const startOfDay = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
        .from('system_notifications')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('title', data.title)
        .eq('message', data.message)
        .eq('is_read', false)
        .gte('created_at', startOfDay)
        .single()

    if (existing) return // Skip duplicate

    await supabase.from('system_notifications').insert({
        tenant_id: tenantId,
        ...data
    })
}

async function addToNotificationQueue(supabase: any, tenantId: string, data: any) {
    // Check duplication for queue as well
    const startOfDay = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
        .from('notification_queue')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('recipient_id', data.recipient_id)
        .eq('content', data.content)
        .gte('created_at', startOfDay)
        .single()

    if (existing) return // Skip duplicate

    await supabase.from('notification_queue').insert({
        tenant_id: tenantId,
        ...data
    })
}
