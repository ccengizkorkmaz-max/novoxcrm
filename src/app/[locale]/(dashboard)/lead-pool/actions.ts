'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLeadRoutingRules() {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('lead_routing_rules')
        .select('*')
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

export async function getUnassignedLeads() {
    const supabase = await createClient()
    
    // Fetch leads/customers that don't have an assigned sales rep
    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone, email, source, created_at, assigned_to, profiles!customers_assigned_to_fkey(full_name)')
        .is('assigned_to', null)
        .order('created_at', { ascending: false })
        .limit(50)
    
    if (error) {
        // If foreign key doesn't exist, fetch without join
        const { data: fallback } = await supabase
            .from('customers')
            .select('id, full_name, phone, email, source, created_at, assigned_to')
            .is('assigned_to', null)
            .order('created_at', { ascending: false })
            .limit(50)
        return fallback || []
    }
    
    return data || []
}

export async function getAvailableAgents() {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) return []
    
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_external')
        .eq('tenant_id', profile.tenant_id)
        .in('role', ['sales', 'manager', 'admin', 'owner'])
        .neq('role', 'broker')
        .eq('is_active', true)
        .or('is_external.is.null,is_external.eq.false')
        .order('full_name')
    
    if (error) {
        // Fallback without is_active filter
        const { data: fallback } = await supabase
            .from('profiles')
            .select('id, full_name, role, is_external')
            .eq('tenant_id', profile.tenant_id)
            .in('role', ['sales', 'manager', 'admin', 'owner'])
            .neq('role', 'broker')
            .or('is_external.is.null,is_external.eq.false')
            .order('full_name')
        return fallback || []
    }
    
    return data || []
}

export async function assignLeadToAgent(leadId: string, agentId: string) {
    const supabase = await createClient()
    
    const { data: customer, error: fetchErr } = await supabase
        .from('customers')
        .select('full_name, phone, tenant_id')
        .eq('id', leadId)
        .single()

    const { error } = await supabase
        .from('customers')
        .update({ assigned_to: agentId })
        .eq('id', leadId)
    
    if (error) throw error

    // Also update any open sales record for this customer
    await supabase
        .from('sales')
        .update({ assigned_to: agentId, assigned_at: new Date().toISOString() })
        .eq('customer_id', leadId)

    if (customer?.tenant_id && agentId) {
        try {
            const { sendLeadAssignmentAlert } = await import('@/lib/notifications/lead-assignment')
            await sendLeadAssignmentAlert({
                tenantId: customer.tenant_id,
                assignedToUserId: agentId,
                leadName: customer.full_name || 'Aday Müşteri',
                leadPhone: customer.phone || '',
                scoreText: 'ADAY (HAVUZ)',
                source: 'Lead Havuzu'
            })
        } catch (notifErr) {
            console.error('Lead pool assignment notification error:', notifErr)
        }
    }
    
    revalidatePath('/lead-pool')
    return { success: true }
}

export async function updateRoutingRule(routingType: string, timeoutMinutes: number) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    // Upsert: update if exists, create if not
    const { data: existing } = await supabase
        .from('lead_routing_rules')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .single()
    
    if (existing) {
        const { error } = await supabase
            .from('lead_routing_rules')
            .update({ routing_type: routingType, timeout_minutes: timeoutMinutes })
            .eq('id', existing.id)
        if (error) throw error
    } else {
        const { error } = await supabase
            .from('lead_routing_rules')
            .insert({
                tenant_id: profile.tenant_id,
                routing_type: routingType,
                timeout_minutes: timeoutMinutes,
            })
        if (error) throw error
    }
    
    revalidatePath('/lead-pool')
    return { success: true }
}
