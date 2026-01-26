'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWhatsAppLink, MessageTemplates } from '@/lib/whatsapp'
import { Resend } from 'resend'
import crypto from 'crypto'

/**
 * Broker Lead Submission with Ownership Lock
 */
export async function submitBrokerLead(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    // Get current user profile and tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profil bulunamadı.' }
    const isAuthorized = ['broker', 'management', 'sales', 'admin', 'owner'].includes(profile.role)
    if (!isAuthorized) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    const phone = formData.get('phone') as string
    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const nationality = formData.get('nationality') as string
    const budget_min = formData.get('budget_min') ? Number(formData.get('budget_min')) : null
    const budget_max = formData.get('budget_max') ? Number(formData.get('budget_max')) : null
    const purpose = formData.get('purpose') as string
    const property_type = formData.get('property_type') as string
    const location_interest = formData.get('location_interest') as string
    const project_id = formData.get('project_id') as string
    const preferred_visit_date = formData.get('preferred_visit_date') as string
    const credit_interest = formData.get('credit_interest') === 'true'
    const notes = formData.get('notes') as string

    if (!phone || !full_name) {
        return { error: 'Ad Soyad ve Telefon alanları zorunludur.' }
    }

    // --- Lead Ownership Lock Logic ---
    // Check if phone number exists in broker_leads and is NOT expired
    const { data: existingLead } = await supabase
        .from('broker_leads')
        .select('id, broker_id, ownership_expires_at')
        .eq('phone', phone)
        .eq('tenant_id', profile.tenant_id)
        .gt('ownership_expires_at', new Date().toISOString())
        .maybeSingle()

    if (existingLead) {
        if (existingLead.broker_id === user.id) {
            return { error: 'Bu müşteri için zaten aktif bir kaydınız bulunmaktadır.' }
        } else {
            return { error: 'Bu müşteri sistemde başka bir broker tarafından rezerve edilmiştir.' }
        }
    }

    // Check if phone number exists in main customers table (Internal protection)
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone)
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle()

    if (existingCustomer) {
        return { error: 'Bu müşteri halihazırda sistemde kayıtlıdır.' }
    }

    // --- Create Lead ---
    const { data: lead, error: leadError } = await supabase
        .from('broker_leads')
        .insert({
            tenant_id: profile.tenant_id,
            broker_id: user.id,
            full_name,
            phone,
            email,
            nationality,
            budget_min,
            budget_max,
            purpose,
            property_type,
            location_interest,
            project_id: project_id || null,
            preferred_visit_date: preferred_visit_date || null,
            credit_interest,
            notes,
            status: 'Submitted'
        })
        .select()
        .single()

    if (leadError) {
        console.error('Submit Broker Lead Error:', leadError)
        return { error: 'Talep iletilemedi.' }
    }

    // Log History
    await supabase.from('broker_lead_history').insert({
        lead_id: lead.id,
        new_status: 'Submitted',
        changed_by: user.id,
        notes: 'Broker tarafından yeni lead girişi yapıldı.'
    })

    revalidatePath('/broker/leads')

    // Prepare WhatsApp Notification for Staff (Manual Trigger via UI or placeholder for automated logic)
    // Note: Since server actions can't open URLs, we will use notifications table 
    // and let the client-side UI handle the triggering if needed, 
    // or log that a notification is "ready".

    return { success: true, leadId: lead.id }
}

/**
 * Public Lead Submission (from external forms)
 */
export async function submitPublicLead(brokerId: string, tenantId: string, formData: FormData) {
    const supabase = await createClient()

    const phone = formData.get('phone') as string
    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const budget_max = formData.get('budget_max') ? Number(formData.get('budget_max')) : null
    const notes = formData.get('notes') as string

    if (!phone || !full_name) {
        return { error: 'Ad Soyad ve Telefon alanları zorunludur.' }
    }

    // --- Lead Ownership Lock Logic (Same as internal) ---
    const { data: existingLead } = await supabase
        .from('broker_leads')
        .select('id, ownership_expires_at')
        .eq('phone', phone)
        .eq('tenant_id', tenantId)
        .gt('ownership_expires_at', new Date().toISOString())
        .maybeSingle()

    if (existingLead) {
        return { error: 'Bu numara ile daha önce bir başvuru yapılmış veya koruma altındadır.' }
    }

    // --- Create Lead ---
    const { data: lead, error: leadError } = await supabase
        .from('broker_leads')
        .insert({
            tenant_id: tenantId,
            broker_id: brokerId,
            full_name,
            phone,
            email,
            budget_max,
            notes: notes || 'Web formu üzerinden iletildi.',
            status: 'Submitted'
        })
        .select()
        .single()

    if (leadError) return { error: 'Başvuru iletilemedi.' }

    // Log History
    await supabase.from('broker_lead_history').insert({
        lead_id: lead.id,
        new_status: 'Submitted',
        notes: 'Dış kaynaklı web formu üzerinden başvuru yapıldı.'
    })

    return { success: true }
}

/**
 * Public: Send Verification Code
 */
export async function sendVerificationCode(email: string) {
    const supabase = await createClient()
    const resend = new Resend(process.env.RESEND_API_KEY)

    // 1. Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 mins

    // 2. Store in DB
    const { error: dbError } = await supabase.from('broker_verification_codes').insert({
        email,
        code,
        expires_at
    })

    if (dbError) {
        console.error('Code Store Error:', dbError)
        return { error: 'Kod oluşturulamadı.' }
    }

    // 3. Send Email
    try {
        await resend.emails.send({
            from: 'Novox <onboarding@novoxcrm.com>',
            to: email,
            subject: 'Broker Onay Kodu',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Novox Partner Programı</h2>
                    <p>Başvurunuzu tamamlamak için kullanmanız gereken doğrulama kodu:</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-bold; letter-spacing: 5px; color: #1e40af;">
                        ${code}
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">Bu kod 10 dakika süreyle geçerlidir.</p>
                </div>
            `
        })
    } catch (emailError) {
        console.error('Email Send Error:', emailError)
        // Note: For now we might not return error if DB insert worked but email failed 
        // OR we can retry. For simplicity, we return success if email triggered.
    }

    return { success: true }
}

/**
 * Public: Submit Broker Application
 */
export async function submitBrokerApplication(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const code = formData.get('code') as string

    // 1. Verify Code
    const { data: verif, error: verifError } = await supabase
        .from('broker_verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (verifError || !verif) {
        return { error: 'Doğrulama kodu geçersiz veya süresi dolmuş.' }
    }

    const tenant_id = formData.get('tenant_id') as string
    const full_name = formData.get('full_name') as string
    const company_name = formData.get('company_name') as string
    const phone = formData.get('phone') as string
    const notes = formData.get('notes') as string

    const { error } = await supabase.from('broker_applications').insert({
        tenant_id: tenant_id || null,
        full_name,
        company_name,
        email,
        phone,
        notes
    })

    if (error) {
        console.error('Submit Application Error:', error)
        return { error: 'Başvuru iletilemedi.' }
    }

    // Optional: Clean up code
    await supabase.from('broker_verification_codes').delete().eq('id', verif.id)

    return { success: true }
}

/**
 * Staff: Approve/Reject Application
 */
export async function processBrokerApplication(applicationId: string, status: 'Approved' | 'Rejected', adminNotes?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Application Details
    const { data: app, error: fetchError } = await supabase
        .from('broker_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

    if (fetchError || !app) return { error: 'Başvuru bulunamadı.' }

    // 2. Update Application Status
    const { error: updateError } = await supabase
        .from('broker_applications')
        .update({
            status,
            admin_notes: adminNotes,
            processed_by: user.id,
            processed_at: new Date().toISOString()
        })
        .eq('id', applicationId)

    if (updateError) return { error: 'Durum güncellenemedi.' }

    // 3. If Approved, update the profile role
    if (status === 'Approved') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', app.email)
            .maybeSingle()

        if (profile) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'broker',
                    tenant_id: app.tenant_id // Link them to the tenant
                })
                .eq('id', profile.id)

            if (profileError) return { error: 'Profil rolü güncellenirken hata oluştu.' }
        }
    }

    revalidatePath('/admin/broker-leads')
    return { success: true }
}

/**
 * Update Broker Lead Status (Internal Staff/Management)
 */
export async function updateBrokerLeadStatus(leadId: string, status: string, notes?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is staff/management
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isStaff = ['management', 'sales', 'admin', 'owner'].includes(profile?.role || '')
    if (!isStaff) {
        return { error: `Yetkiniz bulunmamaktadır. (Mevcut Rolünüz: ${profile?.role || 'Tanımlı Değil'})` }
    }

    const { data: oldLead } = await supabase
        .from('broker_leads')
        .select('status, broker_id, full_name')
        .eq('id', leadId)
        .single()

    // We only skip the record update if status is same, 
    // but we STILL want to log history if there are new notes!
    if (oldLead?.status !== status) {
        const { error: updateError } = await supabase
            .from('broker_leads')
            .update({ status })
            .eq('id', leadId)

        if (updateError) return { error: 'Durum güncellenemedi.' }
    }

    // --- CRM Integration Logic (Qualification) ---
    if (status === 'Qualified') {
        const { data: lead } = await supabase
            .from('broker_leads')
            .select('*, profiles!broker_id(full_name)')
            .eq('id', leadId)
            .single()

        if (lead) {
            // 1. Check if customer exists
            let { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', lead.phone)
                .eq('tenant_id', lead.tenant_id)
                .maybeSingle()

            if (!customer) {
                // 2. Create customer
                const { data: newCustomer, error: custError } = await supabase
                    .from('customers')
                    .insert({
                        tenant_id: lead.tenant_id,
                        full_name: lead.full_name,
                        phone: lead.phone,
                        email: lead.email,
                        source: `Broker: ${lead.profiles?.full_name || 'Bilinmiyor'}`,
                        notes: lead.notes || 'Broker portalından aktarıldı.'
                    })
                    .select()
                    .single()

                if (!custError) customer = newCustomer
            }

            if (customer) {
                // 3. Sync Demands
                await supabase.from('customer_demands').upsert({
                    tenant_id: lead.tenant_id,
                    customer_id: customer.id,
                    min_price: lead.budget_min,
                    max_price: lead.budget_max,
                    property_type: lead.property_type,
                    notes: lead.notes,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'customer_id' })

                // 4. Create Sale (Lead stage)
                const { data: existingSale } = await supabase
                    .from('sales')
                    .select('id')
                    .eq('customer_id', customer.id)
                    .maybeSingle()

                if (!existingSale) {
                    await supabase.from('sales').insert({
                        tenant_id: lead.tenant_id,
                        customer_id: customer.id,
                        status: 'Lead',
                        assigned_to: user.id // Assign to the person who qualified it
                    })
                }

                // 5. Update link in broker_leads
                await supabase.from('broker_leads').update({ customer_id: customer.id }).eq('id', leadId)
            }
        }
    }

    // Log History
    await supabase.from('broker_lead_history').insert({
        lead_id: leadId,
        old_status: oldLead?.status,
        new_status: status,
        changed_by: user.id,
        notes
    })

    // --- Commission Logic ---
    // If status is 'Contract Signed', check for commission eligibility
    if (status === 'Contract Signed') {
        const { data: lead } = await supabase
            .from('broker_leads')
            .select('*, projects(*)')
            .eq('id', leadId)
            .single()

        if (lead && lead.project_id) {
            // Find applicable commission model
            const { data: model } = await supabase
                .from('commission_models')
                .select('*')
                .eq('project_id', lead.project_id)
                .eq('payable_stage', 'Contract Signed')
                .maybeSingle()

            if (model) {
                let commissionAmount = model.value

                if (model.type === 'Tiered') {
                    // Count how many successful leads this broker has in this project/tenant
                    const { count: successCount } = await supabase
                        .from('broker_leads')
                        .select('id', { count: 'exact', head: true })
                        .eq('broker_id', lead.broker_id)
                        .eq('status', 'Contract Signed')

                    // Find matching tier
                    const { data: tier } = await supabase
                        .from('commission_tiers')
                        .select('commission_value')
                        .eq('model_id', model.id)
                        .lte('min_units', successCount || 0)
                        .or(`max_units.is.null,max_units.gte.${successCount || 0}`)
                        .order('min_units', { ascending: false })
                        .limit(1)
                        .maybeSingle()

                    if (tier) {
                        commissionAmount = tier.commission_value
                    }
                }

                await supabase.from('commissions').insert({
                    lead_id: leadId,
                    amount: commissionAmount,
                    currency: model.currency,
                    status: 'Eligible'
                })
            }
        }
    }

    revalidatePath('/broker/commissions')
    revalidatePath('/admin/broker-leads')

    // --- Notification ---
    await supabase.from('portal_notifications').insert({
        user_id: oldLead?.broker_id,
        title: 'Lead Durumu Güncellendi',
        content: `${oldLead?.full_name} isimli leadinizin durumu "${status}" olarak güncellendi.`,
        link_url: `/broker/leads/${leadId}`
    })

    // In a real API integration like Twilio/Meta, we would trigger it here.
    // For this implementation, we log the message intent.
    const waMessage = MessageTemplates.statusUpdateForBroker(oldLead?.full_name || '', status)
    console.log('WhatsApp Notification Queued:', waMessage)

    return { success: true, waMessage: (status === 'Contract Signed' || status === 'Visited') ? waMessage : null }
}

/**
 * Sync Broker Lead Status from CRM Sale Status
 * This is called from main CRM actions
 */
export async function syncBrokerLeadFromSale(saleId: string, crmStatus: string, customNotes?: string) {
    const supabase = await createClient()

    // 1. Find the sale and linked customer
    const { data: sale } = await supabase
        .from('sales')
        .select('customer_id')
        .eq('id', saleId)
        .single()

    if (!sale?.customer_id) return

    // 2. Find linked broker lead
    const { data: lead } = await supabase
        .from('broker_leads')
        .select('id')
        .eq('customer_id', sale.customer_id)
        .maybeSingle()

    if (!lead) return

    // 3. Map CRM status to Broker status
    let brokerStatus = ''
    switch (crmStatus) {
        case 'Lead':
            brokerStatus = 'Qualified'
            break
        case 'Prospect':
            brokerStatus = 'Qualified'
            break
        case 'Reservation':
        case 'Opsiyon - Kapora Bekleniyor':
            brokerStatus = 'Reserved'
            break
        case 'Proposal':
        case 'Teklif - Kapora Bekleniyor':
        case 'Negotiation':
            brokerStatus = 'Offer Sent'
            break
        case 'Sold':
        case 'Completed':
            brokerStatus = 'Contract Signed'
            break
        case 'Lost':
            brokerStatus = 'Rejected'
            break
        default:
            return // No mapping found
    }

    // 4. Update the broker lead
    let finalNotes = customNotes || `Sistem güncellemesi: ${crmStatus}`
    if (!customNotes) {
        if (crmStatus === 'Reservation') finalNotes = "Müşterinin kapora ödemesi onaylandı ve ünite resmen rezerve edildi."
        if (crmStatus === 'Prospect') finalNotes = "Müşteri satış ekibi tarafından onaylandı ve portföy eşleştirmesi yapıldı."
        if (crmStatus === 'Sold') finalNotes = "Satış süreci başarıyla tamamlandı, sözleşme imzalandı."
        if (crmStatus === 'Lost') finalNotes = "Görüşmeler sonucunda müşteri talebi olumsuz sonuçlandı."
    }

    // We call the update function to trigger history, commissions and notifications
    return await updateBrokerLeadStatus(lead.id, brokerStatus, finalNotes)
}

/**
 * Commission Model & Tier Functions
 */
export async function getCommissionModels() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('commission_models')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function getCommissionTiers(modelId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('model_id', modelId)
        .order('min_units', { ascending: true })

    if (error) return []
    return data
}

export async function updateCommissionTier(tierId: string, data: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('commission_tiers')
        .update(data)
        .eq('id', tierId)

    if (error) return { error: 'Tier güncellenemedi.' }
    return { success: true }
}
/**
 * Incentive Campaign Functions
 */
export async function createIncentiveCampaign(data: {
    tenant_id: string,
    project_id: string,
    name: string,
    description: string,
    type: string,
    bonus_value: number,
    start_date?: string,
    end_date?: string,
    target_count?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('incentive_campaigns').insert({
        ...data,
        is_active: true
    })

    if (error) return { error: 'Kampanya oluşturulamadı.' }

    revalidatePath('/admin/broker-leads/campaigns')
    revalidatePath('/broker')
    return { success: true }
}

export async function getIncentiveCampaigns(projectId?: string) {
    const supabase = await createClient()
    let query = supabase.from('incentive_campaigns').select('*, projects(name)')

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) return []
    return data
}
export async function getDocuments(projectId?: string) {
    const supabase = await createClient()
    let query = supabase.from('document_library').select('*, projects(name)')

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('category', { ascending: true })
    if (error) return []
    return data
}

/**
 * Broker Slug & Form Link Management
 */
export async function updateBrokerSlug(slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Validate slug (alphanumeric and dashes only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return { error: 'Slug sadece küçük harf, rakam ve tire içerebilir.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ broker_slug: slug })
        .eq('id', user.id)

    if (error) {
        if (error.code === '23505') return { error: 'Bu kullanıcı adı zaten alınmış.' }
        return { error: 'Güncellenemedi.' }
    }

    revalidatePath('/broker')
    return { success: true }
}

export async function getBrokerBySlug(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, tenant_id')
        .eq('broker_slug', slug)
        .single()

    if (error) return null
    return data
}
