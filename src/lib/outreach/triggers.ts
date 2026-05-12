'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { startWorkflowForLeads } from '@/lib/outreach/engine'

/**
 * Yeni lead oluştuğunda outreach_triggers tablosundaki
 * lead_created kurallarını kontrol eder ve eşleşen workflow'ları başlatır.
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
            console.log(`[Trigger] 🚀 Workflow başlatılıyor: ${trigger.workflow_id} → ${customer.full_name}`)

            // sales kaydı oluşturmadan doğrudan workflow engine'e gönder
            const leads = [{
                customer_id: customer.id,
                customer_name: customer.full_name,
                phone: customer.phone,
            }]

            await startWorkflowForLeads(trigger.workflow_id, leads, tenantId)
            console.log(`[Trigger] ✅ Workflow başlatıldı: ${customer.full_name} (${customer.phone})`)
        }
    } catch (error: any) {
        console.error('[Trigger] lead_created hatası:', error.message)
    }
}
