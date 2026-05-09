'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { startWorkflowForLeads } from './engine'

export type OutreachEventType = 'lead_created' | 'status_changed' | 'activity_created'

/**
 * Handles incoming system events and triggers corresponding outreach workflows
 */
export async function handleOutreachEvent(
    tenantId: string, 
    eventType: OutreachEventType, 
    payload: { saleId: string; customerId: string; [key: string]: any }
) {
    const supabase = createAdminClient()

    console.log(`[Outreach Event] Processing ${eventType} for tenant ${tenantId}`, payload)

    // 1. Get active triggers for this event type
    const { data: triggers, error } = await supabase
        .from('outreach_event_triggers')
        .select(`
            *,
            outreach_workflows!inner(id, is_active)
        `)
        .eq('tenant_id', tenantId)
        .eq('event_type', eventType)
        .eq('is_active', true)
        .eq('outreach_workflows.is_active', true)

    if (error || !triggers?.length) {
        return { triggered: 0 }
    }

    let triggeredCount = 0

    for (const trigger of triggers) {
        // 2. Check if event_config matches payload (Filters)
        // Example event_config: { "new_status": "Inbox" }
        const config = trigger.event_config as any
        let isMatch = true

        if (config) {
            for (const [key, value] of Object.entries(config)) {
                if (payload[key] !== value) {
                    isMatch = false
                    break
                }
            }
        }

        if (isMatch) {
            console.log(`[Outreach Event] Trigger matched! Starting workflow ${trigger.workflow_id}`)
            try {
                await startWorkflowForLeads(trigger.workflow_id, [payload.saleId], tenantId)
                triggeredCount++
            } catch (err) {
                console.error(`[Outreach Event] Failed to start workflow:`, err)
            }
        }
    }

    return { triggered: triggeredCount }
}
