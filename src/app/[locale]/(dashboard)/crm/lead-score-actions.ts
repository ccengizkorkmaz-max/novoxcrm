'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateLeadScoreOverride(params: {
    leadId?: string
    customerId?: string
    newScore: string
    reason?: string
}) {
    const { leadId, customerId, newScore, reason } = params
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Oturum bulunamadı' }
    }

    // 2. Fetch user profile to check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { success: false, error: 'Kullanıcı profili bulunamadı' }
    }

    const allowedRoles = ['admin', 'owner', 'crm_manager', 'manager', 'sales', 'broker', 'sales_rep', 'agent', 'user']
    if (!allowedRoles.includes(profile.role)) {
        return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' }
    }

    const actorName = profile.full_name || 'Yönetici'

    // 3. Update Leads table if leadId is provided
    if (leadId) {
        // Fetch current lead state
        const { data: lead, error: fetchErr } = await supabase
            .from('leads')
            .select('lead_score, lead_score_ai, lead_score_history')
            .eq('id', leadId)
            .single()

        if (fetchErr || !lead) {
            return { success: false, error: 'Aday kaydı bulunamadı: ' + (fetchErr?.message || '') }
        }

        const currentScore = lead.lead_score || 'unknown'
        const currentAiScore = lead.lead_score_ai || (lead.lead_score && lead.lead_score !== 'unknown' ? lead.lead_score : null)
        const currentHistory = Array.isArray(lead.lead_score_history) ? lead.lead_score_history : []

        const newHistoryRecord = {
            date: new Date().toISOString(),
            actor: actorName,
            from: currentScore,
            to: newScore,
            reason: reason || ''
        }

        const updatedHistory = [...currentHistory, newHistoryRecord]

        const { error: updateErr } = await supabase
            .from('leads')
            .update({
                lead_score: newScore,
                lead_score_ai: currentAiScore,
                lead_score_source: 'manual',
                lead_score_history: updatedHistory,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId)

        if (updateErr) {
            return { success: false, error: 'Güncelleme başarısız: ' + updateErr.message }
        }
    }

    // 4. Update Lead Qualifications table if customerId is provided
    if (customerId) {
        // Fetch current qualification state (using maybeSingle to handle missing records)
        const { data: qual } = await supabase
            .from('lead_qualifications')
            .select('interest_level, interest_level_ai, interest_level_history, tenant_id')
            .eq('customer_id', customerId)
            .maybeSingle()

        const currentInterest = qual?.interest_level || 'unknown'
        const currentAiInterest = qual?.interest_level_ai || (qual?.interest_level && qual.interest_level !== 'unknown' ? qual.interest_level : null)
        const currentHistory = Array.isArray(qual?.interest_level_history) ? qual.interest_level_history : []

        const newHistoryRecord = {
            date: new Date().toISOString(),
            actor: actorName,
            from: currentInterest,
            to: newScore,
            reason: reason || ''
        }

        const updatedHistory = [...currentHistory, newHistoryRecord]

        if (!qual) {
            // Get tenant_id from profile or fallback to customer record
            let tenantId = profile?.tenant_id
            if (!tenantId) {
                const { data: cust } = await supabase
                    .from('customers')
                    .select('tenant_id')
                    .eq('id', customerId)
                    .single()
                tenantId = cust?.tenant_id
            }

            const { error: insertErr } = await supabase
                .from('lead_qualifications')
                .insert({
                    tenant_id: tenantId || null,
                    customer_id: customerId,
                    status: 'new',
                    interest_level: newScore,
                    interest_level_ai: null,
                    interest_level_source: 'manual',
                    interest_level_history: updatedHistory,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })

            if (insertErr) {
                return { success: false, error: 'Ön değerlendirme kaydı oluşturulamadı: ' + insertErr.message }
            }
        } else {
            const { error: updateErr } = await supabase
                .from('lead_qualifications')
                .update({
                    interest_level: newScore,
                    interest_level_ai: currentAiInterest,
                    interest_level_source: 'manual',
                    interest_level_history: updatedHistory,
                    updated_at: new Date().toISOString()
                })
                .eq('customer_id', customerId)

            if (updateErr) {
                return { success: false, error: 'Güncelleme başarısız: ' + updateErr.message }
            }
        }
    }

    revalidatePath('/crm')
    revalidatePath('/leads')
    revalidatePath('/lead-qualification')

    return { success: true }
}
