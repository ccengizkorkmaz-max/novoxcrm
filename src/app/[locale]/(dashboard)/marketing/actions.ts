'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { sendPoliSms, sendSms } from '@/lib/sms'

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

export async function updateCampaign(campaignId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const name = (formData.get('name') as string)?.trim()
    const type = formData.get('type') as string || 'email'
    const subject = (formData.get('subject') as string)?.trim() || null
    const body = (formData.get('body') as string)?.trim() || ''
    const scheduleType = formData.get('schedule_type') as string || 'immediate'
    const scheduledAt = (formData.get('scheduled_at') as string)?.trim() || null

    if (!name) throw new Error('Kampanya adı zorunlu')

    const { error } = await supabase.from('campaigns').update({
        name,
        type,
        subject,
        body,
        schedule_type: scheduleType,
        scheduled_at: scheduledAt || null,
    }).eq('id', campaignId)

    if (error) throw new Error('Kampanya güncellenemedi: ' + error.message)
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

export async function updateEmailTemplate(templateId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const name = (formData.get('name') as string)?.trim()
    const category = formData.get('category') as string || 'general'
    const subject = (formData.get('subject') as string)?.trim()
    const body = (formData.get('body') as string)?.trim()

    if (!name || !subject || !body) throw new Error('Tüm alanlar zorunlu')

    const { error } = await supabase.from('email_templates').update({
        name, category, subject, body,
    }).eq('id', templateId)

    if (error) throw new Error('Şablon güncellenemedi: ' + error.message)
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

export async function sendCampaignEmails(campaignId: string) {
    const supabase = await createClient()

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError || !campaign) {
        throw new Error('Kampanya bulunamadı')
    }

    // 2. Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select('id, customer_id, customers(email, full_name, phone, city)')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    if (recipientsError || !recipients || recipients.length === 0) {
        throw new Error('Gönderilecek alıcı yok veya tümü gönderildi')
    }

    // 3. Initialize Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error('E-posta gönderimi için RESEND_API_KEY çevre değişkeni tanımlı değil.')
    }
    const resend = new Resend(apiKey)

    let successCount = 0
    let failedCount = 0

    // Helper for variable interpolation
    const interpolate = (text: string, customer: any) => {
        if (!text) return ''
        return text
            .replace(/\{\{musteri_adi\}\}/g, customer.full_name || '')
            .replace(/\{\{telefon\}\}/g, customer.phone || '')
            .replace(/\{\{email\}\}/g, customer.email || '')
            .replace(/\{\{sehir\}\}/g, customer.city || '')
    }

    // 4. Send emails one by one
    for (const rec of recipients) {
        const customer = rec.customers as any
        const sentAt = new Date().toISOString()

        if (!customer || !customer.email) {
            await supabase
                .from('campaign_recipients')
                .update({
                    status: 'failed',
                    sent_at: sentAt,
                    error_message: 'E-posta adresi eksik'
                })
                .eq('id', rec.id)
            failedCount++
            continue
        }

        const personalSubject = interpolate(campaign.subject || 'Kampanya', customer)
        const personalBody = interpolate(campaign.body || '', customer)

        try {
            const { error: sendError } = await resend.emails.send({
                from: 'Novo CRM <onboarding@novoxcrm.com>',
                to: customer.email,
                subject: personalSubject,
                html: personalBody,
            })

            if (sendError) {
                console.error(`Resend send error for ${customer.email}:`, sendError)
                await supabase
                    .from('campaign_recipients')
                    .update({
                        status: 'failed',
                        sent_at: sentAt,
                        error_message: sendError.message || 'Resend gönderim hatası'
                    })
                    .eq('id', rec.id)
                failedCount++
            } else {
                await supabase
                    .from('campaign_recipients')
                    .update({
                        status: 'sent',
                        sent_at: sentAt,
                        error_message: null
                    })
                    .eq('id', rec.id)
                successCount++
            }
        } catch (err: any) {
            console.error(`Resend connection error for ${customer.email}:`, err)
            await supabase
                .from('campaign_recipients')
                .update({
                    status: 'failed',
                    sent_at: sentAt,
                    error_message: err.message || 'Bağlantı hatası'
                })
                .eq('id', rec.id)
            failedCount++
        }
    }

    // 5. Update campaign status
    await supabase
        .from('campaigns')
        .update({
            sent_count: successCount,
            status: 'completed'
        })
        .eq('id', campaignId)

    revalidatePath('/marketing')

    return {
        success: true,
        message: `${successCount} alıcıya e-posta başarıyla gönderildi. ${failedCount} alıcıda başarısız olundu.`
    }
}

export async function sendCampaignSMS(campaignId: string) {
    const supabase = await createClient()

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

    if (campaignError || !campaign) {
        throw new Error('Kampanya bulunamadı')
    }

    // 2. Get pending recipients
    const { data: recipients, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select('id, customer_id, customers(phone, full_name, email, city)')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

    if (recipientsError || !recipients || recipients.length === 0) {
        throw new Error('Gönderilecek alıcı yok veya tümü gönderildi')
    }

    // 3. Get SMS API credentials from tenant settings
    const { data: tenant } = await supabase
        .from('tenants')
        .select('sms_api_user, sms_api_password, sms_sender_id, sms_provider')
        .eq('id', campaign.tenant_id)
        .single()

    const smsUser = tenant?.sms_api_user || process.env.POLI_SMS_USER
    const smsPass = tenant?.sms_api_password || process.env.POLI_SMS_PASS
    const header = tenant?.sms_sender_id || process.env.POLI_SMS_HEADER || 'NOVOEMLAK'

    if (!smsUser || !smsPass) {
        throw new Error('SMS API kimlik bilgileri (POLI_SMS_USER/PASS) ayarlanmamış.')
    }

    let successCount = 0
    let failedCount = 0

    // Helper for variable interpolation
    const interpolate = (text: string, customer: any) => {
        if (!text) return ''
        return text
            .replace(/\{\{musteri_adi\}\}/g, customer.full_name || '')
            .replace(/\{\{telefon\}\}/g, customer.phone || '')
            .replace(/\{\{email\}\}/g, customer.email || '')
            .replace(/\{\{sehir\}\}/g, customer.city || '')
    }

    // 4. Send SMS one by one
    for (const rec of recipients) {
        const customer = rec.customers as any
        const sentAt = new Date().toISOString()

        if (!customer || !customer.phone) {
            await supabase
                .from('campaign_recipients')
                .update({
                    status: 'failed',
                    sent_at: sentAt,
                    error_message: 'Telefon numarası eksik'
                })
                .eq('id', rec.id)
            failedCount++
            continue
        }

        const personalBody = interpolate(campaign.body || '', customer)

        try {
            const result = await sendSms({
                user: smsUser,
                pass: smsPass,
                message: personalBody,
                contacts: [customer.phone],
                header
            }, tenant?.sms_provider || 'polidijital')

            if (result.success) {
                await supabase
                    .from('campaign_recipients')
                    .update({
                        status: 'sent',
                        sent_at: sentAt,
                        error_message: null
                    })
                    .eq('id', rec.id)
                successCount++
            } else {
                console.error(`Poli SMS send error for ${customer.phone}:`, result.error)
                await supabase
                    .from('campaign_recipients')
                    .update({
                        status: 'failed',
                        sent_at: sentAt,
                        error_message: result.error || 'SMS gönderim hatası'
                    })
                    .eq('id', rec.id)
                failedCount++
            }
        } catch (err: any) {
            console.error(`Poli SMS connection error for ${customer.phone}:`, err)
            await supabase
                .from('campaign_recipients')
                .update({
                    status: 'failed',
                    sent_at: sentAt,
                    error_message: err.message || 'Bağlantı hatası'
                })
                .eq('id', rec.id)
            failedCount++
        }
    }

    // 5. Update campaign status
    await supabase
        .from('campaigns')
        .update({
            sent_count: successCount,
            status: 'completed'
        })
        .eq('id', campaignId)

    revalidatePath('/marketing')

    return {
        success: true,
        message: `${successCount} alıcıya SMS başarıyla gönderildi. ${failedCount} alıcıda başarısız olundu.`
    }
}
