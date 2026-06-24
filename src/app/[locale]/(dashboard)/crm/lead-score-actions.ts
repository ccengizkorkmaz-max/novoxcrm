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
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { success: false, error: 'Kullanıcı profili bulunamadı' }
    }

    const allowedRoles = ['admin', 'owner', 'crm_manager', 'manager']
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
        // Fetch current qualification state
        const { data: qual, error: fetchErr } = await supabase
            .from('lead_qualifications')
            .select('interest_level, interest_level_ai, interest_level_history')
            .eq('customer_id', customerId)
            .single()

        if (fetchErr || !qual) {
            return { success: false, error: 'Ön değerlendirme kaydı bulunamadı: ' + (fetchErr?.message || '') }
        }

        const currentInterest = qual.interest_level || 'unknown'
        const currentAiInterest = qual.interest_level_ai || (qual.interest_level && qual.interest_level !== 'unknown' ? qual.interest_level : null)
        const currentHistory = Array.isArray(qual.interest_level_history) ? qual.interest_level_history : []

        const newHistoryRecord = {
            date: new Date().toISOString(),
            actor: actorName,
            from: currentInterest,
            to: newScore,
            reason: reason || ''
        }

        const updatedHistory = [...currentHistory, newHistoryRecord]

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

    revalidatePath('/crm')
    revalidatePath('/leads')
    revalidatePath('/lead-qualification')

    return { success: true }
}
