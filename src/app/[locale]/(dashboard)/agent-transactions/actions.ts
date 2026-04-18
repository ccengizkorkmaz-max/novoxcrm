'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAgentTransactions() {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('agent_transactions')
        .select(`
            *,
            portfolios(title, city, district),
            customers(full_name)
        `)
        .order('created_at', { ascending: false })
    
    if (error) {
        // Fallback without joins if tables don't exist yet
        const { data: fallback } = await supabase
            .from('agent_transactions')
            .select('*')
            .order('created_at', { ascending: false })
        return fallback || []
    }
    
    return data || []
}

export async function getBrokerCommissionSettings() {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) return null
    
    const { data } = await supabase
        .from('broker_commission_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()
    
    return data
}

export async function saveBrokerCommissionSettings(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    const settings = {
        tenant_id: profile.tenant_id,
        default_split_office: Number(formData.get('split_office')) || 40,
        default_split_agent: Number(formData.get('split_agent')) || 60,
        cap_enabled: formData.get('cap_enabled') === 'true',
        cap_amount: Number(formData.get('cap_amount')) || 0,
        cap_split_after_office: Number(formData.get('cap_split_after_office')) || 10,
        cap_split_after_agent: Number(formData.get('cap_split_after_agent')) || 90,
        desk_fee_monthly: Number(formData.get('desk_fee_monthly')) || 0,
        updated_at: new Date().toISOString(),
    }
    
    const { data: existing } = await supabase
        .from('broker_commission_settings')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .single()
    
    if (existing) {
        const { error } = await supabase
            .from('broker_commission_settings')
            .update(settings)
            .eq('id', existing.id)
        if (error) throw error
    } else {
        const { error } = await supabase
            .from('broker_commission_settings')
            .insert(settings)
        if (error) throw error
    }
    
    revalidatePath('/agent-transactions')
    return { success: true }
}

export async function createAgentTransaction(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    // Get commission settings
    const { data: settings } = await supabase
        .from('broker_commission_settings')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .single()
    
    const salePrice = Number(formData.get('sale_price'))
    const commissionRate = Number(formData.get('commission_rate')) || 4 // default %4
    const grossCommission = salePrice * (commissionRate / 100)
    
    // Calculate splits
    const officePercent = settings?.default_split_office || 40
    const agentPercent = settings?.default_split_agent || 60
    
    const listingAgentId = formData.get('listing_agent_id') as string || null
    const buyerAgentId = formData.get('buyer_agent_id') as string || null
    
    const officeShare = grossCommission * (officePercent / 100)
    const agentPool = grossCommission - officeShare
    
    // If both agents exist, split agent pool equally; otherwise one gets all
    const listingAgentShare = listingAgentId && buyerAgentId ? agentPool / 2 : (listingAgentId ? agentPool : 0)
    const buyerAgentShare = listingAgentId && buyerAgentId ? agentPool / 2 : (buyerAgentId ? agentPool : 0)
    
    const transaction = {
        tenant_id: profile.tenant_id,
        portfolio_id: formData.get('portfolio_id') as string || null,
        listing_agent_id: listingAgentId,
        buyer_agent_id: buyerAgentId,
        customer_id: formData.get('customer_id') as string || null,
        sale_price: salePrice,
        currency: formData.get('currency') as string || 'TRY',
        commission_rate: commissionRate,
        gross_commission: grossCommission,
        office_share: officeShare,
        listing_agent_share: listingAgentShare,
        buyer_agent_share: buyerAgentShare,
        status: 'pending',
        transaction_date: formData.get('transaction_date') as string || new Date().toISOString().split('T')[0],
        notes: formData.get('notes') as string || null,
    }
    
    const { data, error } = await supabase
        .from('agent_transactions')
        .insert(transaction)
        .select()
        .single()
    
    if (error) throw error
    
    revalidatePath('/agent-transactions')
    return data
}

export async function updateTransactionStatus(id: string, status: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('agent_transactions')
        .update({ status })
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/agent-transactions')
    return { success: true }
}
