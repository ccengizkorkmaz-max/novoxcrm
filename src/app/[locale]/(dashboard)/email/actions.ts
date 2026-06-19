'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendCampaignEmails, sendTestEmail } from '@/lib/email/resend'

async function getAuthContext() {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await authClient.from('profiles').select('tenant_id, role, full_name').eq('id', user.id).single()
    const supabase = createAdminClient()
    return { supabase, user, profile, tenantId: profile?.tenant_id }
}

// ─── Templates ───────────────────────────────────────────────

export async function getTemplates() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false })
    return data || []
}

export async function getTemplate(id: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('email_templates')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function createTemplate(payload: { name: string; subject?: string }) {
    const { supabase, user, tenantId } = await getAuthContext()
    const { data, error } = await supabase.from('email_templates').insert({
        tenant_id: tenantId,
        name: payload.name,
        subject: payload.subject || '',
        created_by: user.id,
    }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { data }
}

export async function updateTemplate(id: string, payload: { name?: string; subject?: string; design_json?: any; html?: string }) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('email_templates')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('email_templates').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { success: true }
}

// ─── Campaigns ───────────────────────────────────────────────

export async function getCampaigns() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('email_campaigns')
        .select('*, email_templates(name)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function getCampaign(id: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('email_campaigns')
        .select('*, email_templates(*), outreach_segments(name, filters)')
        .eq('id', id)
        .single()
    return data
}

export async function createCampaign(payload: {
    name: string
    subject: string
    template_id: string
    segment_id: string
    from_name?: string
    from_email?: string
    html?: string
}) {
    const { supabase, user, tenantId } = await getAuthContext()
    const { data, error } = await supabase.from('email_campaigns').insert({
        tenant_id: tenantId,
        name: payload.name,
        subject: payload.subject,
        template_id: payload.template_id,
        segment_id: payload.segment_id,
        from_name: payload.from_name || 'Novo İnşaat',
        from_email: payload.from_email || 'onboarding@novoxcrm.com',
        html: payload.html || '',
        created_by: user.id,
    }).select().single()
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { data }
}

export async function updateCampaign(id: string, payload: Record<string, any>) {
    const { supabase } = await getAuthContext()
    const { error } = await supabase.from('email_campaigns')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { success: true }
}

export async function deleteCampaign(id: string) {
    const { supabase } = await getAuthContext()
    // İlk sends'leri sil
    await supabase.from('email_sends').delete().eq('campaign_id', id)
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/email')
    return { success: true }
}

export async function launchCampaign(campaignId: string) {
    try {
        const result = await sendCampaignEmails(campaignId)
        revalidatePath('/email')
        return { success: true, ...result }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function sendTest(to: string, subject: string, html: string) {
    try {
        await sendTestEmail(to, subject, html)
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

// ─── Campaign Stats ──────────────────────────────────────────

export async function getCampaignSends(campaignId: string) {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('email_sends')
        .select('*, customers(full_name)')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(200)
    return data || []
}

// ─── Segments (reuse from outreach) ──────────────────────────

export async function getSegmentsForEmail() {
    const { supabase } = await getAuthContext()
    const { data } = await supabase.from('outreach_segments')
        .select('id, name, description')
        .order('created_at', { ascending: false })
    return data || []
}

// ─── Segment recipient count ─────────────────────────────────

export async function getSegmentRecipientCount(segmentId: string) {
    const { supabase, tenantId } = await getAuthContext()
    
    const { data: segment } = await supabase
        .from('outreach_segments')
        .select('filters')
        .eq('id', segmentId)
        .single()
    
    let query = supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId!)
        .eq('communication_enabled', true)
        .not('email', 'is', null)
    
    if (segment?.filters) {
        const f = segment.filters
        if (f.projects?.length) query = query.in('project_id', f.projects)
        if (f.sources?.length) query = query.in('source', f.sources)
        if (f.statuses?.length) query = query.in('status', f.statuses)
    }
    
    const { count } = await query
    return count || 0
}
