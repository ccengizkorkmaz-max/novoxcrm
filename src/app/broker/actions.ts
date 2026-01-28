'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
    const unit_id = formData.get('unit_id') as string
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
            unit_id: unit_id || null,
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
 * Marketing Website: Capture Lead (No Broker Context)
 */
export async function captureMarketingLead(formData: FormData) {
    const supabase = await createClient()

    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const company = formData.get('company') as string
    const phone = formData.get('phone') as string
    const resource = formData.get('resource') as string // which magnet they downloaded

    if (!email || !full_name) {
        return { error: 'Lütfen adınız ve e-posta adresinizi giriniz.' }
    }

    // Insert into broker_applications with tenant_id = null to signify it's a SaaS/Marketing lead
    const { error: dbError } = await supabase.from('broker_applications').insert({
        full_name,
        email,
        phone,
        company_name: company,
        notes: `Marketing Resource: ${resource}`,
        status: 'Pending'
    })

    if (dbError) {
        console.error('Marketing Lead Store Error:', dbError)
        return { error: 'Bilgileriniz kaydedilemedi.' }
    }

    // Fallback: Send email to admin via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        await resend.emails.send({
            from: 'Novox Leads <onboarding@novoxcrm.com>',
            to: 'ccengizkorkmaz@gmail.com', // Admin Email
            subject: `New Lead: ${resource}`,
            html: `
                <h3>Yeni Web Sitesi Leadi</h3>
                <p><strong>Ad Soyad:</strong> ${full_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefon:</strong> ${phone}</p>
                <p><strong>Firma:</strong> ${company}</p>
                <p><strong>İndirilen Kaynak:</strong> ${resource}</p>
            `
        })
    } catch (e) {
        console.error('Email sending failed but data was stored:', e)
    }

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
        const { error } = await resend.emails.send({
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

        if (error) {
            console.error('Resend Error:', error)
            return { error: `E-posta gönderilemedi: ${error.message}` }
        }

    } catch (emailError: any) {
        console.error('Email Send Error:', emailError)
        return { error: `E-posta gönderilemedi: ${emailError.message || 'Bilinmeyen hata'}` }
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

    // 2.5 Get processor's tenant as fallback
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const targetTenantId = app.tenant_id || profile?.tenant_id

    // 3. If Approved, handle User Creation and Notification
    if (status === 'Approved') {
        const supabaseAdmin = createAdminClient()

        // Check if user exists in Auth
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingAuthUser = users?.find(u => u.email === app.email)

        if (!existingAuthUser) {
            // Create New User
            const tempPassword = crypto.randomBytes(4).toString('hex') // 8 chars
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: app.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: app.full_name }
            })

            if (createError) {
                console.error('User Create Error:', createError)
                return { error: 'Kullanıcı oluşturulamadı.' }
            }

            // Sync Profile (Profile might be created by trigger, but we ensure role is broker)
            // Wait a bit for trigger if needed, or just upsert.
            // Triggers are fast but race condition possible.
            // Better to update directly using Admin client to bypass RLS if needed, or wait.
            // We'll give it a try to update profile.

            // Actually, if trigger creates it, we just update role.
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: 'broker',
                    tenant_id: targetTenantId,
                    full_name: app.full_name,
                    is_active: true
                })
                .eq('id', newUser.user.id) // Profile ID = User ID

            // Wait, if trigger failed or hasn't run, update might fail if row doesn't exist.
            // Safe bet: UPSERT
            if (profileError) {
                // Try insert if update failed (maybe trigger didn't run?)
                await supabaseAdmin.from('profiles').upsert({
                    id: newUser.user.id,
                    email: app.email,
                    role: 'broker',
                    tenant_id: app.tenant_id,
                    full_name: app.full_name,
                    is_active: true
                })
            }

            // Send Email with Password
            const resend = new Resend(process.env.RESEND_API_KEY)

            // Using verified domain provided by user
            const fromAddress = 'NovaCRM <noreply@novoxcrm.com>'

            await resend.emails.send({
                from: fromAddress,
                to: app.email,
                subject: 'Broker Başvurunuz Onaylandı - Giriş Bilgileri',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Tebrikler, Başvurunuz Onaylandı!</h2>
                        <p>Merhaba <strong>${app.full_name}</strong>,</p>
                        <p>Broker başvurunuz incelenmiş ve onaylanmıştır. Sisteme giriş yapabilmeniz için kullanıcı hesabınız oluşturuldu.</p>
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold;">Giriş Bilgileriniz:</p>
                            <p style="margin: 5px 0;">Email: ${app.email}</p>
                            <p style="margin: 5px 0;">Şifre: <strong>${tempPassword}</strong></p>
                        </div>
                        <p>Giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Giriş Yap</a>
                    </div>
                `
            })

        } else {
            // User Exists - Just Update Role
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: 'broker',
                    tenant_id: targetTenantId
                })
                .eq('id', existingAuthUser.id)

            if (profileError) return { error: 'Profil rolü güncellenirken hata oluştu.' }

            // Send "Approved" Email (No Password)
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
                from: 'NovaCRM <noreply@novoxcrm.com>',
                to: app.email,
                subject: 'Broker Başvurunuz Onaylandı',
                html: `
                   <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Başvurunuz Onaylandı!</h2>
                        <p>Merhaba <strong>${app.full_name}</strong>,</p>
                        <p>Broker başvurunuz onaylanmıştır. Mevcut hesabınızla giriş yaparak broker panelinize erişebilirsiniz.</p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Panele Git</a>
                    </div>
                `
            })
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    const { data, error } = await supabase
        .from('commission_models')
        .select('*, projects(name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) return []
    return data
}

export async function createCommissionModel(data: {
    tenant_id: string,
    project_id: string,
    name: string,
    type: string,
    value: number,
    payable_stage: string,
    payment_terms: string,
    currency: string,
    start_date?: string | null,
    end_date?: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const insertData = {
        ...data,
        status: 'Active', // Default status
        project_id: (data.project_id === 'all' || !data.project_id) ? null : data.project_id
    }

    const { error } = await supabase.from('commission_models').insert(insertData)

    if (error) {
        console.error('Create Commission Model Error:', error)
        return { error: 'Komisyon modeli oluşturulamadı. (Hata: ' + error.message + ')' }
    }

    revalidatePath('/admin/broker-leads/commission-settings')
    return { success: true }
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

export async function getCommissionModel(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Oturum açılmamış (User null)' }
    }

    // Get user tenant for security and better filtering
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return { error: 'Profil bulunamadı' }

    const { data, error } = await supabase
        .from('commission_models')
        .select('*, projects(name)')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle()

    if (error) {
        console.error('getCommissionModel Debug Log:', {
            id,
            tenant_id: profile.tenant_id,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details
        })
        return {
            success: false,
            error: error.message || 'Model kaydı bulunamadı veya yetkiniz yok.',
            code: error.code
        }
    }

    if (!data) {
        return { success: false, error: 'Model bulunamadı.' }
    }

    return { success: true, data }
}

export async function addCommissionTier(data: {
    model_id: string,
    min_units: number,
    max_units: number | null,
    commission_value: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    console.log('Adding Tier Data:', data)

    const { error } = await supabase.from('commission_tiers').insert(data)

    if (error) {
        console.error('Add Commission Tier Error:', error)
        return { error: `Tier eklenemedi: ${error.message} (Code: ${error.code})` }
    }

    revalidatePath(`/admin/broker-leads/commission-settings/${data.model_id}`)
    return { success: true }
}

export async function deleteCommissionTier(tierId: string, modelId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('id', tierId)

    if (error) return { error: 'Tier silinemedi.' }

    revalidatePath(`/admin/broker-leads/commission-settings/${modelId}`)
    return { success: true }
}

export async function updateCommissionTier(tierId: string, data: any) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('commission_tiers')
        .update(data)
        .eq('id', tierId)

    if (error) return { error: 'Tier güncellenemedi.' }
    revalidatePath(`/admin/broker-leads/commission-settings/${data.model_id}`)
    return { success: true }
}

export async function getCommissionUnitRules(modelId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('commission_unit_rules')
        .select('*')
        .eq('model_id', modelId)
        .order('property_type', { ascending: true })

    if (error) return []
    return data
}

export async function addCommissionUnitRule(data: {
    model_id: string,
    property_type: string,
    commission_value: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('commission_unit_rules').insert(data)

    if (error) {
        console.error('Add Rule Error:', error)
        if (error.code === '23505') return { error: 'Bu ünite tipi için zaten bir kural var.' }
        return { error: 'Kural eklenemedi.' }
    }

    revalidatePath(`/admin/broker-leads/commission-settings/${data.model_id}`)
    return { success: true }
}

export async function deleteCommissionUnitRule(ruleId: string, modelId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('commission_unit_rules')
        .delete()
        .eq('id', ruleId)

    if (error) return { error: 'Kural silinemedi.' }

    revalidatePath(`/admin/broker-leads/commission-settings/${modelId}`)
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

    const insertData = {
        ...data,
        project_id: (data.project_id === 'all' || !data.project_id) ? null : data.project_id,
        is_active: true
    }

    const { error } = await supabase.from('incentive_campaigns').insert(insertData)

    if (error) {
        console.error('Create Incentive Campaign Error:', error)
        return { error: 'Kampanya oluşturulamadı. (Hata: ' + error.message + ')' }
    }

    revalidatePath('/admin/broker-leads/campaigns')
    revalidatePath('/broker')
    return { success: true }
}

export async function getIncentiveCampaigns(projectId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    let query = supabase.from('incentive_campaigns')
        .select('*, projects(name)')
        .eq('tenant_id', profile.tenant_id)

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false })
    if (error || !campaigns) return []

    // If no user (e.g. admin view), return without progress
    if (!user) return campaigns

    // Calculate progress for each active campaign for this broker
    const campaignsWithProgress = await Promise.all(campaigns.map(async (camp) => {
        if (!camp.is_active) return camp

        let leadQuery = supabase
            .from('broker_leads')
            .select('id, budget_max', { count: 'exact' })
            .eq('broker_id', user.id)

        if (camp.project_id) {
            leadQuery = leadQuery.eq('project_id', camp.project_id)
        }
        if (camp.start_date) {
            leadQuery = leadQuery.gte('created_at', camp.start_date)
        }
        if (camp.end_date) {
            leadQuery = leadQuery.lte('created_at', camp.end_date)
        }

        // Status filter based on type
        if (camp.type === 'Visits') {
            leadQuery = leadQuery.eq('status', 'Visited')
        } else if (camp.type === 'Unit Sales' || camp.type === 'Volume') {
            leadQuery = leadQuery.eq('status', 'Contract Signed')
        }

        const { count, data: leads } = await leadQuery

        let progress = count || 0
        if (camp.type === 'Volume' && leads) {
            // Sum budget_max as a proxy for volume if actual sale value isn't easily linked here
            progress = leads.reduce((sum, lead) => sum + (Number(lead.budget_max) || 0), 0)
        }

        return { ...camp, current_progress: progress }
    }))

    return campaignsWithProgress
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

    // Use Admin Client to bypass RLS for this specific update
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ broker_slug: slug })
        .eq('id', user.id)

    if (error) {
        console.error('Slug Update Error:', error)
        if (error.code === '23505') return { error: 'Bu kullanıcı adı zaten alınmış.' }
        return { error: 'Güncellenemedi: ' + error.message }
    }

    revalidatePath('/broker', 'page')
    revalidatePath('/broker/(authenticated)', 'page')
    return { success: true }
}

// ... (previous content)
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

export async function archiveCommissionModel(modelId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('commission_models')
        .update({ status: 'Archived', end_date: new Date().toISOString() })
        .eq('id', modelId)

    if (error) return { error: 'Model arşivlenemedi.' }

    revalidatePath('/admin/broker-leads/commission-settings')
    return { success: true }
}

export async function deleteCommissionModel(modelId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('commission_models')
        .delete()
        .eq('id', modelId)

    if (error) {
        return { error: 'Silinemedi. Bu model kullanımda olabilir, lütfen arşivlemeyi deneyin.' }
    }

    revalidatePath('/admin/broker-leads/commission-settings')
    return { success: true }
}

export async function getBrokerPerformanceReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get all commissions with lead details
    const { data: commissions, error } = await supabase
        .from('commissions')
        .select(`
            id,
            amount,
            currency,
            status,
            created_at,
            broker_leads (
                id,
                broker_id,
                full_name,
                project_id,
                projects (name),
                profiles!broker_id (full_name, email)
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Report Error Details:', JSON.stringify(error, null, 2))
        return []
    }

    // 2. Aggregate data by Broker
    const brokerStats: Record<string, any> = {}

    commissions.forEach((comm: any) => {
        const brokerId = comm.broker_leads?.broker_id
        if (!brokerId) return

        if (!brokerStats[brokerId]) {
            brokerStats[brokerId] = {
                brokerId,
                brokerName: comm.broker_leads.profiles?.full_name || 'Bilinmeyen Broker',
                email: comm.broker_leads.profiles?.email,
                totalEarnings: { TRY: 0, USD: 0, EUR: 0, GBP: 0 },
                transactionCount: 0,
                transactions: []
            }
        }

        // Add to total
        const currency = comm.currency || 'TRY'
        if (typeof comm.amount === 'number') {
            brokerStats[brokerId].totalEarnings[currency] = (brokerStats[brokerId].totalEarnings[currency] || 0) + comm.amount
        }

        brokerStats[brokerId].transactionCount++
        brokerStats[brokerId].transactions.push({
            id: comm.id,
            date: comm.created_at,
            amount: comm.amount,
            currency: comm.currency,
            leadName: comm.broker_leads.full_name,
            projectName: comm.broker_leads.projects?.name,
            status: comm.status
        })
    })

    return Object.values(brokerStats)
}

export async function endIncentiveCampaign(campaignId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('incentive_campaigns')
        .update({ is_active: false, end_date: new Date().toISOString() })
        .eq('id', campaignId)

    if (error) return { error: 'Kampanya sonlandırılamadı.' }

    revalidatePath('/admin/broker-leads/campaigns')
    return { success: true }
}

export async function deleteIncentiveCampaign(campaignId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('incentive_campaigns')
        .delete()
        .eq('id', campaignId)

    if (error) return { error: 'Kampanya silinemedi.' }

    revalidatePath('/admin/broker-leads/campaigns')
    return { success: true }
}

export async function updateIncentiveCampaign(campaignId: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('incentive_campaigns')
        .update(data)
        .eq('id', campaignId)

    if (error) {
        console.error('Update Campaign Error:', error)
        return { error: 'Kampanya güncellenemedi.' }
    }

    revalidatePath('/admin/broker-leads/campaigns')
    return { success: true }
}

export async function getIncentiveCampaign(campaignId: string) {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('incentive_campaigns')
        .select('*, projects(name)')
        .eq('id', campaignId)
        .single()

    if (error) return null
    return data
}

// --- BROKER LEVELS (GAMIFICATION) ACTIONS ---

export async function getBrokerLevels() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return []

    // 1. Fetch existing levels
    const { data: levels, error } = await supabase
        .from('broker_levels')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('min_sales_count', { ascending: true })

    if (error) {
        console.error('Error fetching broker levels:', error)
        return []
    }

    // 2. If no levels exist, seed defaults
    if (!levels || levels.length === 0) {
        const defaults = [
            { name: 'Junior Broker', min_sales_count: 0, min_sales_volume: 0, color: '#94a3b8', icon: 'User' },
            { name: 'Silver Broker', min_sales_count: 5, min_sales_volume: 500000, color: '#e2e8f0', icon: 'Award' },
            { name: 'Gold Broker', min_sales_count: 15, min_sales_volume: 2000000, color: '#fbbf24', icon: 'Star' },
            { name: 'Platinum Partner', min_sales_count: 50, min_sales_volume: 10000000, color: '#8b5cf6', icon: 'Crown' },
        ]

        // Using admin client or standard client? Standard client usually can't select from profiles outside own tenant but can insert into RLS enabled table if policy allows.
        // Assuming current user has permission to create levels (Admin)

        try {
            for (const d of defaults) {
                await supabase.from('broker_levels').insert({ ...d, tenant_id: profile.tenant_id })
            }
            // Fetch again
            const { data: newLevels } = await supabase
                .from('broker_levels')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .order('min_sales_count', { ascending: true })
            return newLevels || []

        } catch (e) {
            console.error('Error seeding defaults:', e)
            return []
        }
    }

    return levels
}

export async function createBrokerLevel(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const data = {
        tenant_id: profile?.tenant_id,
        name: formData.get('name') as string,
        min_sales_count: Number(formData.get('min_sales_count')) || 0,
        min_sales_volume: Number(formData.get('min_sales_volume')) || 0,
        color: formData.get('color') as string,
        icon: formData.get('icon') as string || 'Star'
    }

    const { error } = await supabase.from('broker_levels').insert(data)

    if (error) return { error: error.message }
    revalidatePath('/admin/broker-leads/levels')
    return { success: true }
}

export async function updateBrokerLevel(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const data = {
        name: formData.get('name') as string,
        min_sales_count: Number(formData.get('min_sales_count')) || 0,
        min_sales_volume: Number(formData.get('min_sales_volume')) || 0,
        color: formData.get('color') as string,
        icon: formData.get('icon') as string
    }

    const { error } = await supabase.from('broker_levels').update(data).eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/admin/broker-leads/levels')
    return { success: true }
}

export async function deleteBrokerLevel(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('broker_levels').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/broker-leads/levels')
    return { success: true }
}

// Logic to check and upgrade broker level
export async function checkAndUpgradeBroker(brokerId: string) {
    const supabase = await createClient()

    // 1. Calculate Performance (Won Leads Count)
    // We treat 'Contract Signed' as the success status usually, but let's check both just in case 'Won' is used elsewhere.
    const { count, error: countError } = await supabase
        .from('broker_leads')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', brokerId)
        .in('status', ['Won', 'Contract Signed']) // Check both success aliases

    if (countError) return

    // 2. Calculate Sales Volume
    // We need to sum the final price of sales linked to these broker leads.
    // Path: broker_leads -> customer_id -> sales.customer_id -> final_price
    const { data: leads } = await supabase
        .from('broker_leads')
        .select('customer_id')
        .eq('broker_id', brokerId)
        .in('status', ['Won', 'Contract Signed'])
        .not('customer_id', 'is', null)

    let totalVolume = 0

    if (leads && leads.length > 0) {
        const customerIds = leads.map(l => l.customer_id)
        if (customerIds.length > 0) {
            const { data: sales } = await supabase
                .from('sales')
                .select('final_price')
                .in('customer_id', customerIds)
                .eq('status', 'Completed') // Only completed sales

            if (sales) {
                totalVolume = sales.reduce((sum, sale) => sum + (Number(sale.final_price) || 0), 0)
            }
        }
    }

    // 3. Get Levels
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', brokerId).single()
    if (!profile) return

    const { data: levels } = await supabase
        .from('broker_levels')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('min_sales_count', { ascending: false }) // Check highest first

    if (!levels || levels.length === 0) return

    // 4. Find highest qualified level (OR logic: Count OR Volume)
    const qualifiedLevel = levels.find(l => {
        const countMet = (count || 0) >= l.min_sales_count
        const volumeMet = totalVolume >= (Number(l.min_sales_volume) || 0)
        return countMet || volumeMet
    })

    if (qualifiedLevel) {
        // Init admin client to update profile if needed (bypassing RLS if user can't update own level)
        // Generally system triggers this.
        await supabase
            .from('profiles')
            .update({ broker_level_id: qualifiedLevel.id })
            .eq('id', brokerId)
    }
}

// --- ADMIN BROKER MANAGEMENT ACTIONS ---

export async function toggleBrokerStatus(brokerId: string, isActive: boolean) {
    const supabase = await createClient()

    // Check permissions (Admin only)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'owner', 'management'].includes(adminProfile?.role || '')) {
        return { error: 'Yetkiniz yok.' }
    }

    // Update profile status
    const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', brokerId)

    if (error) return { error: error.message }

    revalidatePath('/admin/broker-applications')
    return { success: true }
}

export async function updateBrokerLevelManual(brokerId: string, levelId: string) {
    const supabase = await createClient()

    // Check permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'owner', 'management'].includes(adminProfile?.role || '')) {
        return { error: 'Yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ broker_level_id: levelId })
        .eq('id', brokerId)

    if (error) return { error: error.message }

    revalidatePath('/admin/broker-applications')
    return { success: true }
}

export async function adminSetBrokerPassword(brokerId: string, newPassword: string) {
    const supabase = await createClient()

    // 1. Check permissions (Admin only)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'owner', 'management'].includes(adminProfile?.role || '')) {
        return { error: 'Yetkiniz yok.' }
    }

    // 2. Use Admin Client to set password
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
        brokerId,
        { password: newPassword }
    )

    if (error) {
        console.error('Password Reset Error:', error)
        return { error: `Şifre güncellenemedi: ${error.message}` }
    }

    return { success: true }
}
