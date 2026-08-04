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
    company_name?: string | null
    company_phone?: string | null
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
        .select(`
            assigned_to, 
            full_name, 
            phone,
            converted_customer_id,
            customers:converted_customer_id(full_name, phone, lead_qualifications(interest_level))
        `)
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
        // Get user notification preferences
        let isEnabled = true
        let inAppEnabled = true
        let whatsappEnabled = true

        try {
            const { data: pref } = await supabase
                .from('user_notification_preferences')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', data.assigned_to)
                .eq('notification_type', 'lead_assigned')
                .maybeSingle()

            if (pref) {
                isEnabled = pref.is_enabled
                inAppEnabled = pref.channel_in_app
                whatsappEnabled = pref.channel_whatsapp
            }
        } catch (prefErr) {
            console.error('Error fetching notification preferences:', prefErr)
        }

        if (isEnabled) {
            // App-level notification
            if (inAppEnabled) {
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
            }

            // WhatsApp notification
            if (whatsappEnabled) {
                try {
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('wa_phone_number_id, wa_access_token')
                        .eq('id', profile.tenant_id)
                        .single()

                    if (tenant?.wa_phone_number_id && tenant.wa_access_token) {
                        const { data: repProfile } = await supabase
                            .from('profiles')
                            .select('phone, full_name')
                            .eq('id', data.assigned_to)
                            .single()

                        if (repProfile?.phone) {
                            const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')

                            const resolvedName = currentLead?.full_name || (currentLead as any)?.customers?.full_name || 'Aday Müşteri'
                            const resolvedPhone = currentLead?.phone || (currentLead as any)?.customers?.phone || ''
                            const rawInterest = (currentLead as any)?.customers?.lead_qualifications?.[0]?.interest_level
                            const scoreLabel: Record<string, string> = {
                                hot: 'HOT', warm: 'WARM', cold: 'COLD',
                                call_requested: 'ARAMA', disqualified: 'DQ'
                            }
                            const scoreText = rawInterest ? scoreLabel[rawInterest] || '—' : 'ADAY (LEADS)'

                            await sendWhatsAppTemplate(
                                repProfile.phone,
                                'lead_assignment_alert',
                                [
                                    resolvedName,
                                    resolvedPhone,
                                    scoreText
                                ],
                                'tr',
                                tenant.wa_phone_number_id,
                                tenant.wa_access_token
                            )
                            console.log(`✅ Lead atama WA template gönderildi (Leads): ${repProfile.full_name}`)

                            // Hot Lead Manager'lara da bildir (Atanan temsilci hariç)
                            const { data: hotLeadManagers } = await supabase
                                .from('profiles')
                                .select('phone, full_name, id')
                                .eq('tenant_id', profile.tenant_id)
                                .eq('is_hot_lead_manager', true)
                            
                            if (hotLeadManagers && hotLeadManagers.length > 0) {
                                for (const manager of hotLeadManagers) {
                                    if (manager.phone && manager.id !== data.assigned_to) {
                                        await sendWhatsAppTemplate(
                                            manager.phone,
                                            'lead_assignment_alert',
                                            [resolvedName, resolvedPhone, `${scoreText} - Atanan: ${repProfile.full_name}`],
                                            'tr',
                                            tenant.wa_phone_number_id,
                                            tenant.wa_access_token
                                        )
                                        console.log(`✅ Lead atama WA bildirimi hot lead manager'a gönderildi: ${manager.full_name}`)
                                    }
                                }
                            }
                        }
                    }
                } catch (waErr) {
                    console.error('Lead assignment WA notification error:', waErr)
                }
            }
        }
    }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

/**
 * Lead → Müşteri dönüştürme (SCRUM-10 + SCRUM-14)
 * 1. customers tablosuna yeni kayıt oluşturur
 * 2. Opsiyonel: opportunities tablosuna fırsat oluşturur
 * 3. Lead'i 'converted' olarak işaretler ve firma bilgisi varsa firmayı da oluşturup ilişkilendirir.
 */
export async function convertLeadToCustomer(leadId: string, options?: {
    createOpportunity?: boolean
    opportunityTitle?: string
    opportunityStage?: string
    opportunityValue?: number
    opportunityCurrency?: string
    customerData?: {
        fullName: string
        phone?: string | null
        email?: string | null
        source?: string | null
    }
    companyData?: {
        companyName: string
        companyPhone?: string
        taxNumber?: string
        taxOffice?: string
        sector?: string
    }
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

    // 2. Opsiyonel: Firma oluştur
    let newCompanyId: string | null = null
    const companyName = options?.companyData?.companyName?.trim()
    if (companyName && options?.companyData) {
        const { data: newCompany, error: compErr } = await supabase
            .from('companies')
            .insert({
                tenant_id: profile.tenant_id,
                name: companyName,
                tax_number: options.companyData.taxNumber || null,
                tax_office: options.companyData.taxOffice || null,
                sector: options.companyData.sector || null,
                phone: options.companyData.companyPhone || lead.phone || null,
                email: lead.email,
                notes: `Lead'den dönüştürüldü. Orijinal lead: ${lead.id}`,
                created_by: user.id,
            })
            .select('id')
            .single()

        if (compErr || !newCompany) {
            return { success: false, error: `Firma oluşturma hatası: ${compErr?.message}` }
        }
        newCompanyId = newCompany.id
    }

    // 3. Müşteri oluştur
    const fullName = options?.customerData?.fullName || lead.full_name
    const phone = options?.customerData?.phone !== undefined ? options.customerData.phone : lead.phone
    const email = options?.customerData?.email !== undefined ? options.customerData.email : lead.email
    const source = options?.customerData?.source !== undefined ? options.customerData.source : lead.source

    const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
            tenant_id: profile.tenant_id,
            full_name: fullName,
            phone: phone,
            email: email,
            company_id: newCompanyId,
            source: source || (newCompanyId ? 'Lead Conversion (Company)' : 'Lead Conversion'),
            contact_type: 'buyer',
            created_by: user.id,
            notes: newCompanyId 
                ? `Lead'den dönüştürüldü (Firma: ${companyName}). Orijinal lead: ${lead.id}${lead.notes ? '\n' + lead.notes : ''}`
                : `Lead'den dönüştürüldü. Orijinal lead: ${lead.id}${lead.notes ? '\n' + lead.notes : ''}`
        })
        .select('id')
        .single()

    if (custErr || !newCustomer) {
        return { success: false, error: `Müşteri oluşturma hatası: ${custErr?.message}` }
    }

    // 4. CRM Satış Pipeline kaydı oluştur (Fırsat = Sales)
    // Bu adım lead'i converted yapmadan ÖNCE yapılmalı — eğer başarısız olursa lead tekrar dönüştürülebilir
    const { data: newSale, error: saleErr } = await supabase.from('sales').insert({
        tenant_id: profile.tenant_id,
        customer_id: newCustomer.id,
        status: 'Lead',
        project_id: lead.project_id || null,
        assigned_to: lead.assigned_to || user.id,
        description: newCompanyId 
            ? `Lead dönüşümü (Firma): ${lead.source || 'Bilinmeyen kaynak'}`
            : `Lead dönüşümü: ${lead.source || 'Bilinmeyen kaynak'}`,
    }).select('id').single()

    if (saleErr) {
        console.error('Lead conversion - Sales (Fırsat) creation error:', saleErr)
        return {
            success: false,
            error: `Müşteri oluşturuldu ancak CRM Fırsat kaydı oluşturulamadı: ${saleErr.message}`
        }
    }

    // 5. Sales başarılı — artık lead'i converted olarak güncelle
    await supabase
        .from('leads')
        .update({
            status: 'converted',
            converted_customer_id: newCustomer.id,
            converted_company_id: newCompanyId,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            full_name: fullName,
            phone: phone,
            email: email,
            source: source
        })
        .eq('id', leadId)

    // 5.5 Move lead activities to the customer and clear lead_id
    // Clearing lead_id prevents the "Müşteri Adayı" badge from showing on the customer card
    const { error: actMoveErr } = await supabase
        .from('activities')
        .update({ customer_id: newCustomer.id, lead_id: null })
        .eq('lead_id', leadId)

    if (actMoveErr) {
        console.error('Failed to move lead activities to customer:', actMoveErr)
    }

    // 6. Opsiyonel: Fırsat (Opportunities) oluştur — yalnızca checkbox işaretliyse
    let opportunityId: string | null = null
    if (options?.createOpportunity) {
        const oppTitle = options.opportunityTitle || (newCompanyId ? `${companyName} - Fırsat` : `${lead.full_name} - Fırsat`)
        const { data: opp, error: oppErr } = await supabase
            .from('opportunities')
            .insert({
                tenant_id: profile.tenant_id,
                customer_id: newCustomer.id,
                title: oppTitle,
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

        if (oppErr) {
            console.error('Lead conversion - Opportunity creation error:', oppErr)
        }
        opportunityId = opp?.id || null
    }

    // 7. Lead bildirim modu: on_conversion ise dönüştürme anında WhatsApp gönder
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
    if (newCompanyId) {
        revalidatePath('/(dashboard)/companies')
    }

    return {
        success: true,
        customerId: newCustomer.id,
        companyId: newCompanyId || undefined,
        opportunityId,
        message: newCompanyId 
            ? `${lead.full_name} ve ${companyName} firması başarıyla oluşturulup dönüştürüldü.`
            : `${lead.full_name} başarıyla müşteriye dönüştürüldü.`
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
    company_name?: string | null
    company_phone?: string | null
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
            company_name: data.company_name || null,
            company_phone: data.company_phone || null,
        })
        .select('id')
        .single()

    if (error) return { success: false, error: error.message }

    // Temsilciye atama bildirimi gönder
    if (data.assigned_to) {
        let isEnabled = true
        let inAppEnabled = true
        let whatsappEnabled = true

        try {
            const { data: pref } = await supabase
                .from('user_notification_preferences')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', data.assigned_to)
                .eq('notification_type', 'lead_assigned')
                .maybeSingle()

            if (pref) {
                isEnabled = pref.is_enabled
                inAppEnabled = pref.channel_in_app
                whatsappEnabled = pref.channel_whatsapp
            }
        } catch (prefErr) {
            console.error('Error fetching notification preferences:', prefErr)
        }

        if (isEnabled) {
            // App-level notification
            if (inAppEnabled) {
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

            // WhatsApp notification
            if (whatsappEnabled) {
                try {
                    const { data: tenant } = await supabase
                        .from('tenants')
                        .select('wa_phone_number_id, wa_access_token')
                        .eq('id', profile.tenant_id)
                        .single()

                    if (tenant?.wa_phone_number_id && tenant.wa_access_token) {
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
                                    data.full_name || 'Aday Müşteri', 
                                    data.phone || '', 
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
    // NOT: outreach_step_logs ayrıca merge edilmiyor çünkü Vapi webhook zaten activities tablosuna kayıt oluşturuyor
    const { data: activities, error: actErr } = await supabase
        .from('activities')
        .select('*, profiles!user_id(full_name)')
        .eq('lead_id', leadId)
        .neq('type', 'Transcript')
        .order('created_at', { ascending: false })

    if (actErr) {
        console.error("Error fetching activities:", actErr)
        return { success: false, error: actErr.message }
    }

    const combined = (activities || []).map(a => {
        const recordingMatch = a.description?.match(/(?:\[RECORDING\]:|🎙️ Kayıt:)\s*(https?:\/\/[^\s]+)/);
        const call_recording_url = recordingMatch ? recordingMatch[1] : a.call_recording_url;

        const callIdMatch = a.description?.match(/\[Call\s+ID:\s*([^\]]+)\]/i);
        const vapi_call_id = callIdMatch ? callIdMatch[1].trim() : null;

        return {
            id: a.id,
            type: a.type,
            summary: a.summary,
            notes: a.notes || a.description,
            created_at: a.created_at,
            call_recording_url: call_recording_url,
            vapi_call_id: vapi_call_id,
            user_name: a.profiles?.full_name || 'Sistem'
        };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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

/**
 * Müşteri adayını sil
 */
export async function deleteLead(leadId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/(dashboard)/leads')
    return { success: true }
}

