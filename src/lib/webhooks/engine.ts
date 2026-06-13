'use server'

import { createClient } from '@/lib/supabase/server'

type WebhookEvent =
    | 'new_lead'
    | 'lead_assigned'
    | 'portfolio_created'
    | 'portfolio_updated'
    | 'portfolio_sold'
    | 'sale_completed'
    | 'commission_paid'

interface WebhookPayload {
    event: WebhookEvent
    tenant_id: string
    data: Record<string, any>
    timestamp: string
}

/**
 * Tenant bazlı webhook tetikleyici.
 * Bu fonksiyon, verilen event_type'a abone olan tüm webhook URL'lerini bulur
 * ve onlara HTTP POST gönderir.
 */
export async function triggerWebhooks(tenantId: string, event: WebhookEvent, data: Record<string, any>) {
    const supabase = await createClient()

    // Bu tenant'ın bu event'e abone olan aktif webhook'larını bul
    const { data: webhooks, error } = await supabase
        .from('tenant_webhooks')
        .select('id, target_url, headers')
        .eq('tenant_id', tenantId)
        .eq('event_type', event)
        .eq('is_active', true)

    if (error || !webhooks || webhooks.length === 0) return

    const payload: WebhookPayload = {
        event,
        tenant_id: tenantId,
        data,
        timestamp: new Date().toISOString(),
    }

    // Tüm webhook'lara paralel gönder
    const results = await Promise.allSettled(
        webhooks.map(async (webhook) => {
            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                    'X-Webhook-Event': event,
                    'X-Tenant-Id': tenantId,
                    ...(typeof webhook.headers === 'object' ? webhook.headers : {}),
                }

                const response = await fetch(webhook.target_url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000), // 10s timeout
                })

                // Sonucu kaydet
                await supabase
                    .from('tenant_webhooks')
                    .update({
                        last_triggered_at: new Date().toISOString(),
                        last_status_code: response.status,
                    })
                    .eq('id', webhook.id)

                return { webhookId: webhook.id, status: response.status, success: response.ok }
            } catch (err: any) {
                // Hata durumunda da kaydet
                await supabase
                    .from('tenant_webhooks')
                    .update({
                        last_triggered_at: new Date().toISOString(),
                        last_status_code: 0,
                    })
                    .eq('id', webhook.id)

                console.error(`[Webhook] Failed for ${webhook.target_url}:`, err.message)
                return { webhookId: webhook.id, status: 0, success: false, error: err.message }
            }
        })
    )

    return results
}

/**
 * Belirli bir tenant'ın webhook yapılandırmalarını getir
 */
export async function getTenantWebhooks(tenantId?: string) {
    const supabase = await createClient()

    if (!tenantId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()
        tenantId = profile?.tenant_id || undefined
    }

    if (!tenantId) return []

    const { data } = await supabase
        .from('tenant_webhooks')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    return data || []
}

/**
 * Yeni webhook oluştur
 */
export async function createTenantWebhook(eventType: string, targetUrl: string, headers?: Record<string, string>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant')
    if (!['admin', 'owner', 'crm_manager'].includes(profile.role)) throw new Error('Insufficient permissions')

    const { data, error } = await supabase
        .from('tenant_webhooks')
        .insert({
            tenant_id: profile.tenant_id,
            event_type: eventType,
            target_url: targetUrl,
            headers: headers || {},
            is_active: true,
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Webhook sil
 */
export async function deleteTenantWebhook(webhookId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_webhooks')
        .delete()
        .eq('id', webhookId)

    if (error) throw error
    return { success: true }
}

/**
 * Webhook toggle (aktif/pasif)
 */
export async function toggleTenantWebhook(webhookId: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_webhooks')
        .update({ is_active: isActive })
        .eq('id', webhookId)

    if (error) throw error
    return { success: true }
}

/**
 * Test webhook'u — ping gönderir
 */
export async function testWebhook(webhookId: string) {
    const supabase = await createClient()

    const { data: webhook } = await supabase
        .from('tenant_webhooks')
        .select('target_url, headers, tenant_id, event_type')
        .eq('id', webhookId)
        .single()

    if (!webhook) throw new Error('Webhook not found')

    const payload: WebhookPayload = {
        event: webhook.event_type as WebhookEvent,
        tenant_id: webhook.tenant_id,
        data: { test: true, message: 'Bu bir test webhook mesajıdır.' },
        timestamp: new Date().toISOString(),
    }

    try {
        const response = await fetch(webhook.target_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Event': 'test',
                ...(typeof webhook.headers === 'object' ? webhook.headers : {}),
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        })

        await supabase
            .from('tenant_webhooks')
            .update({ last_triggered_at: new Date().toISOString(), last_status_code: response.status })
            .eq('id', webhookId)

        return { success: response.ok, status: response.status }
    } catch (err: any) {
        return { success: false, status: 0, error: err.message }
    }
}
