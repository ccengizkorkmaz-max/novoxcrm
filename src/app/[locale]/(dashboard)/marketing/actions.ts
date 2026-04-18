'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ===== CAMPAIGN MANAGEMENT =====

export async function getCampaigns() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('campaigns')
        .select('*, profiles!created_by(full_name)')
        .order('created_at', { ascending: false })
    return data || []
}

export async function getCampaign(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('campaigns')
        .select('*, profiles!created_by(full_name), campaign_recipients(*, customers(full_name, email, phone))')
        .eq('id', id)
        .single()
    return data
}

export async function createCampaign(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const name = (formData.get('name') as string)?.trim()
    const type = formData.get('type') as string || 'email'
    const subject = (formData.get('subject') as string)?.trim() || null
    const body = (formData.get('body') as string)?.trim() || ''
    const scheduleType = formData.get('schedule_type') as string || 'immediate'
    const scheduledAt = (formData.get('scheduled_at') as string)?.trim() || null

    if (!name) throw new Error('Kampanya adı zorunlu')

    const { data: campaign, error } = await supabase.from('campaigns').insert({
        tenant_id: profile?.tenant_id,
        name,
        type,
        status: 'draft',
        subject,
        body,
        schedule_type: scheduleType,
        scheduled_at: scheduledAt || null,
        created_by: user.id,
    }).select().single()

    if (error) throw new Error('Kampanya oluşturulamadı: ' + error.message)
    revalidatePath('/marketing')
    return { success: true, campaign }
}

export async function updateCampaignStatus(campaignId: string, status: string) {
    const supabase = await createClient()

    if (status === 'active') {
        // Load target customers and create recipients
        const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
        if (!campaign) throw new Error('Kampanya bulunamadı')

        const filter = campaign.target_filter || {}
        let query = supabase.from('customers').select('id')

        // Apply filters
        if (filter.source) query = query.eq('source', filter.source)
        if (filter.city) query = query.eq('city', filter.city)

        const { data: targets } = await query

        if (targets && targets.length > 0) {
            // Check existing recipients
            const { data: existing } = await supabase.from('campaign_recipients').select('customer_id').eq('campaign_id', campaignId)
            const existingIds = new Set(existing?.map(e => e.customer_id))

            const newRecipients = targets
                .filter(t => !existingIds.has(t.id))
                .map(t => ({
                    campaign_id: campaignId,
                    customer_id: t.id,
                    status: 'pending',
                }))

            if (newRecipients.length > 0) {
                await supabase.from('campaign_recipients').insert(newRecipients)
            }

            await supabase.from('campaigns').update({
                target_count: (existing?.length || 0) + newRecipients.length,
            }).eq('id', campaignId)
        }
    }

    const { error } = await supabase.from('campaigns').update({ status }).eq('id', campaignId)
    if (error) throw new Error('Durum güncellenemedi')

    revalidatePath('/marketing')
    return { success: true }
}

export async function deleteCampaign(campaignId: string) {
    const supabase = await createClient()
    await supabase.from('campaign_recipients').delete().eq('campaign_id', campaignId)
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
    if (error) throw new Error('Silinemedi: ' + error.message)
    revalidatePath('/marketing')
    return { success: true }
}

export async function addRecipientsManually(campaignId: string, customerIds: string[]) {
    const supabase = await createClient()

    const { data: existing } = await supabase.from('campaign_recipients').select('customer_id').eq('campaign_id', campaignId)
    const existingSet = new Set(existing?.map(e => e.customer_id))

    const newOnes = customerIds
        .filter(id => !existingSet.has(id))
        .map(id => ({ campaign_id: campaignId, customer_id: id, status: 'pending' as const }))

    if (newOnes.length > 0) {
        await supabase.from('campaign_recipients').insert(newOnes)
        // Update target count
        await supabase.from('campaigns').update({
            target_count: (existing?.length || 0) + newOnes.length,
        }).eq('id', campaignId)
    }

    revalidatePath('/marketing')
    return { success: true, added: newOnes.length }
}

// ===== EMAIL TEMPLATES =====

export async function getEmailTemplates() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('name')
    return data || []
}

export async function createEmailTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const name = (formData.get('name') as string)?.trim()
    const category = formData.get('category') as string || 'general'
    const subject = (formData.get('subject') as string)?.trim()
    const body = (formData.get('body') as string)?.trim()

    if (!name || !subject || !body) throw new Error('Tüm alanlar zorunlu')

    const { error } = await supabase.from('email_templates').insert({
        tenant_id: profile?.tenant_id,
        name, category, subject, body,
        created_by: user.id,
    })

    if (error) throw new Error('Şablon oluşturulamadı: ' + error.message)
    revalidatePath('/marketing')
    return { success: true }
}

export async function deleteEmailTemplate(templateId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('email_templates').delete().eq('id', templateId)
    if (error) throw new Error('Silinemedi')
    revalidatePath('/marketing')
    return { success: true }
}

// ===== SEND (Integration Points) =====
// These are stubs that will be connected to external services

export async function sendCampaignEmails(campaignId: string) {
    // TODO: Integrate with Mailchimp / Resend / SendGrid
    // For now, mark as sent and log
    const supabase = await createClient()

    const { data: recipients } = await supabase
        .from('campaign_recipients')
        .select('id, customers(email, full_name)')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    if (!recipients || recipients.length === 0) {
        throw new Error('Gönderilecek alıcı yok')
    }

    // Mark as sent (simulation - replace with actual API calls)
    const sentAt = new Date().toISOString()
    await supabase.from('campaign_recipients')
        .update({ status: 'sent', sent_at: sentAt })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    await supabase.from('campaigns').update({
        sent_count: recipients.length,
        status: 'completed',
    }).eq('id', campaignId)

    revalidatePath('/marketing')
    return {
        success: true,
        message: `${recipients.length} alıcıya gönderildi`,
        note: '⚠️ Gerçek gönderim için Mailchimp/Resend/SendGrid API entegrasyonu gereklidir'
    }
}

export async function sendCampaignSMS(campaignId: string) {
    // TODO: Integrate with Twilio / Netgsm / iletimerkezi
    const supabase = await createClient()

    const { data: recipients } = await supabase
        .from('campaign_recipients')
        .select('id, customers(phone, full_name)')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    if (!recipients || recipients.length === 0) {
        throw new Error('Gönderilecek alıcı yok')
    }

    const sentAt = new Date().toISOString()
    await supabase.from('campaign_recipients')
        .update({ status: 'sent', sent_at: sentAt })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    await supabase.from('campaigns').update({
        sent_count: recipients.length,
        status: 'completed',
    }).eq('id', campaignId)

    revalidatePath('/marketing')
    return {
        success: true,
        message: `${recipients.length} alıcıya SMS gönderildi`,
        note: '⚠️ Gerçek SMS için Twilio/Netgsm API entegrasyonu gereklidir'
    }
}
