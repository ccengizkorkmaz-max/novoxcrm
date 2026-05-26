// Outreach trigger fire logic — called from webhooks when new leads are created

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Yeni lead oluştuğunda outreach_triggers tablosundaki
 * lead_created kurallarını kontrol eder ve eşleşen workflow'ları başlatır.
 * 
 * NOT: Bu fonksiyon sale_id gerektirmez — doğrudan customer üzerinden çalışır.
 */
export async function fireLeadCreatedTrigger(tenantId: string, customerId: string) {
    try {
        const supabase = createAdminClient()

        // Aktif lead_created tetikleyicilerini bul
        const { data: triggers } = await supabase
            .from('outreach_triggers')
            .select('id, workflow_id, event_config')
            .eq('tenant_id', tenantId)
            .eq('event_type', 'lead_created')
            .eq('is_active', true)

        if (!triggers || triggers.length === 0) {
            console.log('[Trigger] lead_created tetikleyicisi yok veya pasif')
            return
        }

        // Müşteri bilgisini al
        const { data: customer } = await supabase
            .from('customers')
            .select('id, full_name, phone')
            .eq('id', customerId)
            .single()

        if (!customer || !customer.phone) {
            console.log('[Trigger] Müşteri bulunamadı veya telefon yok:', customerId)
            return
        }

        for (const trigger of triggers) {
            // Workflow'un ilk adımını bul
            const { data: firstStep } = await supabase
                .from('outreach_steps')
                .select('id')
                .eq('workflow_id', trigger.workflow_id)
                .eq('step_order', 1)
                .single()

            if (!firstStep) {
                console.log(`[Trigger] Workflow ${trigger.workflow_id} adım bulunamadı, atlanıyor`)
                continue
            }

            // Aynı müşteri için zaten aktif execution var mı?
            const { data: existing } = await supabase
                .from('outreach_executions')
                .select('id')
                .eq('workflow_id', trigger.workflow_id)
                .eq('customer_id', customerId)
                .in('status', ['active', 'waiting', 'completed', 'converted', 'stopped'])
                .limit(1)

            if (existing?.length) {
                console.log(`[Trigger] Müşteri zaten aktif execution'da: ${customer.full_name}`)
                continue
            }

            // Execution oluştur (sale_id opsiyonel — null olabilir)
            const { error } = await supabase.from('outreach_executions').insert({
                tenant_id: tenantId,
                workflow_id: trigger.workflow_id,
                customer_id: customerId,
                sale_id: null,
                current_step_id: firstStep.id,
                current_step_order: 1,
                status: 'active',
                next_action_at: new Date().toISOString(),
            })

            if (error) {
                console.error(`[Trigger] Execution oluşturma hatası:`, error.message)
            } else {
                console.log(`[Trigger] ✅ Workflow başlatıldı: ${customer.full_name} (${customer.phone})`)
            }
        }
    } catch (error: any) {
        console.error('[Trigger] lead_created hatası:', error.message)
    }
}
