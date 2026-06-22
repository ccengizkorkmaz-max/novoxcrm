'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Lead kaydını güncelle (SCRUM-9)
 */
export async function updateLead(leadId: string, data: {
    full_name?: string
    phone?: string | null
    email?: string | null
    status?: string
    assigned_to?: string | null
    notes?: string | null
    project_id?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // Fetch the lead's current state first
    const { data: currentLead } = await supabase
        .from('leads')
        .select('assigned_to, full_name, phone')
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    const { error } = await supabase
        .from('leads')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    // Send assignment notifications if assignee changed and is not empty
    const isAssigneeChanging = data.assigned_to !== undefined && data.assigned_to !== currentLead?.assigned_to && data.assigned_to !== null && data.assigned_to !== ''
    if (isAssigneeChanging && data.assigned_to) {
        // App-level notification
        try {
            const { createNotification } = await import('@/lib/notifications/create')
            await createNotification({
                tenant_id: profile.tenant_id,
                user_id: data.assigned_to,
                type: 'Info',
                category: 'CRM',
                title: '🎯 Yeni Müşteri Adayı Atandı',
                message: `${currentLead?.full_name || 'Aday'} isimli müşteri adayı takibinize atandı.`,
                link: '/leads'
            })
        } catch (notifErr) {
            console.error('Lead assignment notification error:', notifErr)
        }

        // WhatsApp notification (conditional based on tenant setting)
        try {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('wa_lead_assignment_notification_enabled, wa_phone_number_id, wa_access_token')
                .eq('id', profile.tenant_id)
                .single()

            if (tenant?.wa_lead_assignment_notification_enabled && tenant.wa_phone_number_id && tenant.wa_access_token) {
                const { data: repProfile } = await supabase
                    .from('profiles')
                    .select('phone, full_name')
                    .eq('id', data.assigned_to)
                    .single()

                if (repProfile?.phone) {
                    const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                    await sendWhatsAppTemplate(
                        repProfile.phone,
                        'lead_assignment_alert',
                        [
                            currentLead?.full_name || 'Aday Müşteri', 
                            currentLead?.phone || '', 
                            'ADAY (LEADS)'
                        ],
                        'tr',
                        tenant.wa_phone_number_id,
                        tenant.wa_access_token
                    )
                    console.log(`✅ Lead atama WA template gönderildi (Leads): ${repProfile.full_name}`)
                }
            }
        } catch (waErr) {
            console.error('Lead assignment WA notification error:', waErr)
        }
    }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

/**
 * Lead → Müşteri dönüştürme (SCRUM-10 + SCRUM-14)
 * 1. customers tablosuna yeni kayıt oluşturur
 * 2. Opsiyonel: opportunities tablosuna fırsat oluşturur
 * 3. Lead'i 'converted' olarak işaretler
 */
export async function convertLeadToCustomer(leadId: string, options?: {
    createOpportunity?: boolean
    opportunityTitle?: string
    opportunityStage?: string
    opportunityValue?: number
    opportunityCurrency?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // 1. Lead verisini al
    const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (leadErr || !lead) return { success: false, error: 'Lead bulunamadı' }
    if (lead.status === 'converted') return { success: false, error: 'Bu lead zaten dönüştürülmüş' }

    // 2. Müşteri oluştur
    const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
            tenant_id: profile.tenant_id,
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            source: lead.source || 'Lead Conversion',
            contact_type: 'buyer',
            notes: `Lead'den dönüştürüldü. Orijinal lead: ${lead.id}${lead.notes ? '\n' + lead.notes : ''}`
        })
        .select('id')
        .single()

    if (custErr || !newCustomer) {
        return { success: false, error: `Müşteri oluşturma hatası: ${custErr?.message}` }
    }

    // 3. Lead'i converted olarak güncelle
    await supabase
        .from('leads')
        .update({
            status: 'converted',
            converted_customer_id: newCustomer.id,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

    // 4. Opsiyonel: Fırsat oluştur (SCRUM-14)
    let opportunityId: string | null = null
    if (options?.createOpportunity) {
        const { data: opp } = await supabase
            .from('opportunities')
            .insert({
                tenant_id: profile.tenant_id,
                customer_id: newCustomer.id,
                title: options.opportunityTitle || `${lead.full_name} - Fırsat`,
                stage: options.opportunityStage || 'prospect',
                value: options.opportunityValue || null,
                currency: options.opportunityCurrency || 'TRY',
                assigned_to: lead.assigned_to || user.id,
                project_id: lead.project_id || null,
                notes: `Lead #${lead.id} dönüşümünden oluşturuldu.`,
                lead_id: lead.id
            })
            .select('id')
            .single()

        opportunityId = opp?.id || null
    }

    // 5. Satış kaydı da oluştur (mevcut CRM pipeline ile entegrasyon)
    // Lead zaten niteliklendirilmiş, CRM'de direkt "Prospect" olarak başlar
    await supabase.from('sales').insert({
        tenant_id: profile.tenant_id,
        customer_id: newCustomer.id,
        status: 'Prospect',
        project_id: lead.project_id || null,
        description: `Lead dönüşümü: ${lead.source || 'Bilinmeyen kaynak'}`,
    })

    // 6. Lead bildirim modu: on_conversion ise dönüştürme anında WhatsApp gönder
    const { data: tenantNotif } = await supabase
        .from('tenants')
        .select('lead_notification_mode')
        .eq('id', profile.tenant_id)
        .single()

    if (tenantNotif?.lead_notification_mode === 'on_conversion') {
        const { fireLeadCreatedTrigger } = await import('@/lib/outreach/triggers')
        await fireLeadCreatedTrigger(profile.tenant_id, newCustomer.id)
    }

    revalidatePath('/(dashboard)/leads')
    revalidatePath('/(dashboard)/opportunities')
    revalidatePath('/(dashboard)/crm')

    return {
        success: true,
        customerId: newCustomer.id,
        opportunityId,
        message: `${lead.full_name} başarıyla müşteriye dönüştürüldü.`
    }
}

/**
 * Lead sil
 */
export async function deleteLead(leadId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }
    if (profile.role !== 'owner' && profile.role !== 'admin' && profile.role !== 'manager') {
        return { success: false, error: 'Silme yetkiniz yok' }
    }

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

/**
 * Lead → Firma dönüştürme (SCRUM-11)
 * 1. companies tablosuna firma oluşturur
 * 2. customers tablosuna kişi oluşturur ve firmaya bağlar
 * 3. Lead'i 'converted' olarak işaretler
 */
export async function convertLeadToCompany(leadId: string, companyData: {
    companyName: string
    taxNumber?: string
    taxOffice?: string
    sector?: string
    createOpportunity?: boolean
    opportunityTitle?: string
    opportunityValue?: number
    opportunityCurrency?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // 1. Lead verisini al
    const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (leadErr || !lead) return { success: false, error: 'Lead bulunamadı' }
    if (lead.status === 'converted') return { success: false, error: 'Bu lead zaten dönüştürülmüş' }

    // 2. Firma oluştur
    const { data: newCompany, error: compErr } = await supabase
        .from('companies')
        .insert({
            tenant_id: profile.tenant_id,
            name: companyData.companyName,
            tax_number: companyData.taxNumber || null,
            tax_office: companyData.taxOffice || null,
            sector: companyData.sector || null,
            phone: lead.phone,
            email: lead.email,
            notes: `Lead'den dönüştürüldü. Orijinal lead: ${lead.id}`,
            created_by: user.id,
        })
        .select('id')
        .single()

    if (compErr || !newCompany) {
        return { success: false, error: `Firma oluşturma hatası: ${compErr?.message}` }
    }

    // 3. Kişi kaydı oluştur ve firmaya bağla
    const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
            tenant_id: profile.tenant_id,
            full_name: lead.full_name,
            phone: lead.phone,
            email: lead.email,
            company_id: newCompany.id,
            source: lead.source || 'Lead Conversion (Company)',
            contact_type: 'buyer',
            notes: `Firma dönüşümü: ${companyData.companyName}`
        })
        .select('id')
        .single()

    // 4. Lead'i converted olarak güncelle
    await supabase
        .from('leads')
        .update({
            status: 'converted',
            converted_customer_id: newCustomer?.id || null,
            converted_company_id: newCompany.id,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)

    // 5. Opsiyonel: Opportunity oluştur
    let opportunityId: string | null = null
    if (companyData.createOpportunity && newCustomer) {
        const { data: opp } = await supabase
            .from('opportunities')
            .insert({
                tenant_id: profile.tenant_id,
                customer_id: newCustomer.id,
                title: companyData.opportunityTitle || `${companyData.companyName} - Fırsat`,
                stage: 'prospect',
                value: companyData.opportunityValue || null,
                currency: companyData.opportunityCurrency || 'TRY',
                assigned_to: lead.assigned_to || user.id,
                project_id: lead.project_id || null,
                notes: `Lead #${lead.id} → Firma dönüşümünden oluşturuldu.`,
                lead_id: lead.id
            })
            .select('id')
            .single()

        opportunityId = opp?.id || null
    }

    // Satış kaydı oluştur
    if (newCustomer) {
        await supabase.from('sales').insert({
            tenant_id: profile.tenant_id,
            customer_id: newCustomer.id,
            status: 'Prospect',
            project_id: lead.project_id || null,
            description: `Lead dönüşümü (Firma): ${lead.source || 'Bilinmeyen kaynak'}`,
        })
    }

    revalidatePath('/(dashboard)/leads')
    revalidatePath('/(dashboard)/companies')
    revalidatePath('/(dashboard)/opportunities')

    return {
        success: true,
        companyId: newCompany.id,
        customerId: newCustomer?.id,
        opportunityId,
        message: `${lead.full_name} → ${companyData.companyName} firması olarak dönüştürüldü.`
    }
}

/**
 * Yeni lead oluştur (Manuel Ekleme)
 */
export async function createLead(data: {
    full_name: string
    phone?: string | null
    email?: string | null
    status?: string
    source?: string | null
    project_id?: string | null
    assigned_to?: string | null
    notes?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const { error, data: newLead } = await supabase
        .from('leads')
        .insert({
            tenant_id: profile.tenant_id,
            full_name: data.full_name,
            phone: data.phone || null,
            email: data.email || null,
            status: data.status || 'new',
            source: data.source || 'manual',
            project_id: data.project_id || null,
            assigned_to: data.assigned_to || null,
            notes: data.notes || null,
        })
        .select('id')
        .single()

    if (error) return { success: false, error: error.message }

    // Temsilciye atama bildirimi gönder
    if (data.assigned_to) {
        try {
            const { createNotification } = await import('@/lib/notifications/create')
            await createNotification({
                tenant_id: profile.tenant_id,
                user_id: data.assigned_to,
                type: 'Info',
                category: 'CRM',
                title: '🎯 Yeni Müşteri Adayı Atandı',
                message: `${data.full_name || 'Aday'} isimli yeni müşteri adayı takibinize atandı.`,
                link: '/leads'
            })
        } catch (notifErr) {
            console.error('Lead assignment notification error:', notifErr)
        }
    }

    revalidatePath('/(dashboard)/leads')
    return { success: true, leadId: newLead?.id }
}

/**
 * Toplu lead oluştur (Excel Yükle)
 */
export async function bulkCreateLeads(leadsData: Array<{
    full_name: string
    phone?: string | null
    email?: string | null
    source?: string | null
    project_id?: string | null
    assigned_to?: string | null
    notes?: string | null
}>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const records = leadsData.map(lead => ({
        tenant_id: profile.tenant_id,
        full_name: lead.full_name,
        phone: lead.phone || null,
        email: lead.email || null,
        status: 'new',
        source: lead.source || 'excel_import',
        project_id: lead.project_id || null,
        assigned_to: lead.assigned_to || null,
        notes: lead.notes || null,
    }))

    const { error } = await supabase
        .from('leads')
        .insert(records)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

/**
 * Adaya ait aktiviteleri ve AI arama kayıtlarını getir
 */
export async function getLeadActivities(leadId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    // Standart aktiviteleri çek (profiles'tan full_name ile join)
    const { data: activities, error: actErr } = await supabase
        .from('activities')
        .select('*, profiles!user_id(full_name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

    if (actErr) {
        console.error("Error fetching activities:", actErr)
        return { success: false, error: actErr.message }
    }

    // AI Arama kayıtlarını çek
    const { data: callLogs, error: callLogsErr } = await supabase
        .from('outreach_step_logs')
        .select(`
            id,
            executed_at,
            call_summary,
            call_recording_url,
            call_duration_seconds,
            outreach_executions!inner (
                lead_id,
                workflows:outreach_workflows ( name )
            )
        `)
        .eq('outreach_executions.lead_id', leadId)
        .not('call_summary', 'is', null)

    if (callLogsErr) {
        console.error("Error fetching AI call logs:", callLogsErr)
    }

    // AI Arama kayıtlarını aktivite formatına map et
    const aiActivities = (callLogs || []).map((log: any) => ({
        id: `ai-${log.id}`,
        type: 'Call',
        summary: 'AI Araması: ' + (log.outreach_executions?.workflows?.name || 'Genel'),
        notes: log.call_summary || '',
        created_at: log.executed_at,
        call_recording_url: log.call_recording_url,
        call_duration_seconds: log.call_duration_seconds,
        user_name: 'AI Asistanı'
    }))

    // İki listeyi birleştir ve tarihe göre sırala
    const combined = [
        ...(activities || []).map(a => ({
            id: a.id,
            type: a.type,
            summary: a.summary,
            notes: a.notes,
            created_at: a.created_at,
            user_name: a.profiles?.full_name || 'Sistem'
        })),
        ...aiActivities
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { success: true, activities: combined }
}

/**
 * Adaya ait zaman tüneline hızlı not ekle
 */
export async function addLeadActivityNote(leadId: string, noteText: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const { error: insertErr } = await supabase
        .from('activities')
        .insert({
            tenant_id: profile.tenant_id,
            lead_id: leadId,
            user_id: user.id,
            type: 'Note',
            summary: 'Not Eklendi',
            notes: noteText,
            status: 'Completed'
        })

    if (insertErr) return { success: false, error: insertErr.message }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

