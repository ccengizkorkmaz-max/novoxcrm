'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ===== COMMISSION PLANS =====

export async function getCommissionPlans() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('commission_plans')
        .select('*')
        .order('name')
    return data || []
}

export async function createCommissionPlan(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const name = (formData.get('name') as string)?.trim()
    if (!name) throw new Error('Plan adı zorunlu')

    const agentSplit = Number(formData.get('agent_split_pct') || 50)
    const officeSplit = 100 - agentSplit
    const franchiseFeePct = Number(formData.get('franchise_fee_pct') || 0)
    const capEnabled = formData.get('cap_enabled') === 'true'
    const capAmount = Number(formData.get('cap_amount') || 0)
    const capPeriod = (formData.get('cap_period') as string) || 'yearly'
    const tierEnabled = formData.get('tier_enabled') === 'true'
    const isDefault = formData.get('is_default') === 'true'

    let tiers: any[] = []
    if (tierEnabled) {
        try {
            tiers = JSON.parse(formData.get('tiers') as string || '[]')
        } catch { tiers = [] }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
        await supabase.from('commission_plans').update({ is_default: false }).eq('tenant_id', profile?.tenant_id)
    }

    const { error } = await supabase.from('commission_plans').insert({
        tenant_id: profile?.tenant_id,
        name,
        description: (formData.get('description') as string)?.trim() || null,
        agent_split_pct: agentSplit,
        office_split_pct: officeSplit,
        franchise_fee_pct: franchiseFeePct,
        cap_enabled: capEnabled,
        cap_amount: capAmount,
        cap_period: capPeriod,
        tier_enabled: tierEnabled,
        tiers,
        is_default: isDefault,
    })

    if (error) throw new Error('Plan oluşturulamadı: ' + error.message)
    revalidatePath('/commission-plans')
    return { success: true }
}

export async function updateCommissionPlan(planId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const name = (formData.get('name') as string)?.trim()
    if (!name) throw new Error('Plan adı zorunlu')

    const agentSplit = Number(formData.get('agent_split_pct') || 50)
    const isDefault = formData.get('is_default') === 'true'
    const tierEnabled = formData.get('tier_enabled') === 'true'

    let tiers: any[] = []
    if (tierEnabled) {
        try { tiers = JSON.parse(formData.get('tiers') as string || '[]') } catch { tiers = [] }
    }

    if (isDefault) {
        await supabase.from('commission_plans').update({ is_default: false }).eq('tenant_id', profile?.tenant_id)
    }

    const { error } = await supabase.from('commission_plans').update({
        name,
        description: (formData.get('description') as string)?.trim() || null,
        agent_split_pct: agentSplit,
        office_split_pct: 100 - agentSplit,
        franchise_fee_pct: Number(formData.get('franchise_fee_pct') || 0),
        cap_enabled: formData.get('cap_enabled') === 'true',
        cap_amount: Number(formData.get('cap_amount') || 0),
        cap_period: (formData.get('cap_period') as string) || 'yearly',
        tier_enabled: tierEnabled,
        tiers,
        is_default: isDefault,
    }).eq('id', planId)

    if (error) throw new Error('Güncellenemedi: ' + error.message)
    revalidatePath('/commission-plans')
    return { success: true }
}

export async function deleteCommissionPlan(planId: string) {
    const supabase = await createClient()

    // Check if any agents use this plan
    const { data: agents } = await supabase.from('profiles').select('id').eq('commission_plan_id', planId)
    if (agents && agents.length > 0) {
        throw new Error(`Bu plan ${agents.length} danışmana atanmış, önce planlarını değiştirin`)
    }

    const { error } = await supabase.from('commission_plans').delete().eq('id', planId)
    if (error) throw new Error('Silinemedi: ' + error.message)
    revalidatePath('/commission-plans')
    return { success: true }
}

export async function assignPlanToAgent(agentId: string, planId: string | null) {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ commission_plan_id: planId }).eq('id', agentId)
    if (error) throw new Error('Atanamadı: ' + error.message)
    revalidatePath('/commission-plans')
    return { success: true }
}

// ===== COMMISSION CALCULATOR =====
export interface CommissionCalcResult {
    salePrice: number
    commissionRate: number
    grossCommission: number
    franchiseFee: number
    netOfficeCommission: number
    agentShare: number
    officeShare: number
    agentSplitPct: number
    officeSplitPct: number
    tierApplied?: string
    capReached: boolean
    capSavings: number
}

export async function calculateCommission(
    agentId: string,
    salePrice: number,
    commissionRate: number = 3, // default %3
): Promise<CommissionCalcResult> {
    const supabase = await createClient()

    // Get agent's plan
    const { data: agent } = await supabase
        .from('profiles')
        .select('commission_plan_id, tenant_id')
        .eq('id', agentId)
        .single()

    let plan: any = null
    if (agent?.commission_plan_id) {
        const { data } = await supabase.from('commission_plans').select('*').eq('id', agent.commission_plan_id).single()
        plan = data
    }

    // Fallback to default plan
    if (!plan && agent?.tenant_id) {
        const { data } = await supabase.from('commission_plans').select('*').eq('tenant_id', agent.tenant_id).eq('is_default', true).single()
        plan = data
    }

    // Fallback to simple 50/50
    if (!plan) {
        plan = {
            agent_split_pct: 50,
            office_split_pct: 50,
            franchise_fee_pct: 0,
            cap_enabled: false,
            cap_amount: 0,
            tier_enabled: false,
            tiers: [],
        }
    }

    const grossCommission = salePrice * (commissionRate / 100)
    const franchiseFee = grossCommission * ((plan.franchise_fee_pct || 0) / 100)
    const netOfficeCommission = grossCommission - franchiseFee

    // Determine agent split percentage
    let agentSplitPct = plan.agent_split_pct
    let tierApplied: string | undefined

    if (plan.tier_enabled && plan.tiers?.length > 0) {
        // Check YTD (year-to-date) agent earnings to determine tier
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
        const { data: ytdTx } = await supabase
            .from('agent_transactions')
            .select('listing_agent_share, buyer_agent_share, listing_agent_id, buyer_agent_id')
            .or(`listing_agent_id.eq.${agentId},buyer_agent_id.eq.${agentId}`)
            .gte('transaction_date', yearStart)
            .in('status', ['approved', 'paid'])

        let ytdEarnings = 0
        ytdTx?.forEach(tx => {
            if (tx.listing_agent_id === agentId) ytdEarnings += (tx.listing_agent_share || 0)
            if (tx.buyer_agent_id === agentId) ytdEarnings += (tx.buyer_agent_share || 0)
        })

        // Find applicable tier
        for (const tier of plan.tiers.sort((a: any, b: any) => (b.from || 0) - (a.from || 0))) {
            if (ytdEarnings >= (tier.from || 0)) {
                agentSplitPct = tier.agent_pct
                tierApplied = `₺${(tier.from / 1000).toFixed(0)}K+ → %${tier.agent_pct}`
                break
            }
        }
    }

    let agentShare = netOfficeCommission * (agentSplitPct / 100)
    let officeShare = netOfficeCommission - agentShare

    // CAP check
    let capReached = false
    let capSavings = 0
    if (plan.cap_enabled && plan.cap_amount > 0) {
        // Calculate YTD office share
        const periodStart = plan.cap_period === 'yearly'
            ? new Date(new Date().getFullYear(), 0, 1).toISOString()
            : plan.cap_period === 'quarterly'
                ? new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString()
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

        const { data: periodTx } = await supabase
            .from('agent_transactions')
            .select('office_share')
            .or(`listing_agent_id.eq.${agentId},buyer_agent_id.eq.${agentId}`)
            .gte('transaction_date', periodStart)
            .in('status', ['approved', 'paid'])

        const ytdOfficeShare = periodTx?.reduce((s, t) => s + (t.office_share || 0), 0) || 0

        if (ytdOfficeShare >= plan.cap_amount) {
            // CAP reached - agent gets 100%
            capReached = true
            capSavings = officeShare
            agentShare = netOfficeCommission
            officeShare = 0
        } else if (ytdOfficeShare + officeShare > plan.cap_amount) {
            // Partial CAP
            const remainingCap = plan.cap_amount - ytdOfficeShare
            capSavings = officeShare - remainingCap
            officeShare = remainingCap
            agentShare = netOfficeCommission - officeShare
            capReached = true
        }
    }

    return {
        salePrice,
        commissionRate,
        grossCommission,
        franchiseFee,
        netOfficeCommission,
        agentShare,
        officeShare,
        agentSplitPct,
        officeSplitPct: 100 - agentSplitPct,
        tierApplied,
        capReached,
        capSavings,
    }
}
