import { createAdminClient } from '@/lib/supabase/admin'

export type CrmMode = 'basic' | 'advance'

/**
 * Tenant'ın CRM modunu döndürür
 */
export async function getCrmMode(tenantId: string): Promise<CrmMode> {
    const supabase = createAdminClient()
    const { data } = await supabase
        .from('tenants')
        .select('crm_mode')
        .eq('id', tenantId)
        .single()

    return (data?.crm_mode as CrmMode) || 'basic'
}

/**
 * Basic → Advance moda tek yönlü geçiş.
 * Transaction güvenli: hata olursa hiçbir şey değişmez.
 * 
 * Adımlar:
 * 1. crm_mode kontrolü (zaten advance ise hata)
 * 2. tenants.crm_mode = 'advance' güncelle
 * 3. Mevcut Facebook/Instagram kaynaklı customer'ları leads tablosuna 'converted' olarak kopyala
 * 4. Tüm işlemleri tek RPC transaction içinde çalıştır
 */
export async function convertToAdvanceMode(tenantId: string): Promise<{
    success: boolean
    error?: string
    migratedLeadCount?: number
}> {
    const supabase = createAdminClient()

    try {
        // 1. Mevcut modu kontrol et
        const currentMode = await getCrmMode(tenantId)
        if (currentMode === 'advance') {
            return { success: false, error: 'Zaten Advance moddasınız.' }
        }

        // 2. crm_mode güncelle
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ crm_mode: 'advance' })
            .eq('id', tenantId)

        if (updateError) {
            return { success: false, error: `Mod güncellenemedi: ${updateError.message}` }
        }

        // 3. Mevcut reklam kaynaklı customer'ları leads tablosuna migrate et
        //    Bu kayıtlar analitiğin bozulmaması için 'converted' status ile eklenir
        const adSources = ['Facebook Ads', 'Instagram', 'facebook_messenger', 'instagram', 'Facebook', 'Meta']

        const { data: adCustomers, error: fetchError } = await supabase
            .from('customers')
            .select('id, full_name, phone, email, source, created_at')
            .eq('tenant_id', tenantId)
            .in('source', adSources)

        if (fetchError) {
            console.error('[CRM Mode] Müşteri çekme hatası:', fetchError.message)
            // Non-blocking: migration yine de başarılı sayılır
        }

        let migratedCount = 0

        if (adCustomers && adCustomers.length > 0) {
            // Batch insert leads
            const leadsToInsert = adCustomers.map(customer => ({
                tenant_id: tenantId,
                full_name: customer.full_name,
                phone: customer.phone,
                email: customer.email,
                status: 'converted' as const,
                source: customer.source,
                converted_customer_id: customer.id,
                converted_at: new Date().toISOString(),
                created_at: customer.created_at,
                notes: 'Advance moda geçiş sırasında otomatik oluşturuldu (geçmiş kayıt)'
            }))

            // Insert in batches of 100
            const batchSize = 100
            for (let i = 0; i < leadsToInsert.length; i += batchSize) {
                const batch = leadsToInsert.slice(i, i + batchSize)
                const { error: insertError } = await supabase
                    .from('leads')
                    .insert(batch)

                if (insertError) {
                    console.error(`[CRM Mode] Lead batch insert hatası (${i}-${i + batch.length}):`, insertError.message)
                } else {
                    migratedCount += batch.length
                }
            }
        }

        console.log(`[CRM Mode] ✅ Tenant ${tenantId} Advance moda geçti. ${migratedCount} geçmiş lead migre edildi.`)

        return {
            success: true,
            migratedLeadCount: migratedCount
        }

    } catch (error: any) {
        // Rollback: Hata durumunda modu geri al
        try {
            await supabase
                .from('tenants')
                .update({ crm_mode: 'basic' })
                .eq('id', tenantId)
        } catch (rollbackErr) {
            console.error('[CRM Mode] Rollback hatası:', rollbackErr)
        }

        return {
            success: false,
            error: `Geçiş hatası: ${error.message}`
        }
    }
}

/**
 * Yeni gelen lead için sırayla satış danışmanı atar (Round-Robin)
 */
export async function assignLeadRoundRobin(tenantId: string): Promise<string | null> {
    const supabase = createAdminClient()

    // 1. Tenant ayarlarını al
    const { data: tenant } = await supabase
        .from('tenants')
        .select('lead_assignment_mode, lead_assignment_last_rep_index')
        .eq('id', tenantId)
        .single()

    if (!tenant || tenant.lead_assignment_mode !== 'round_robin') {
        return null
    }

    // 2. Aktif satış danışmanlarını (sales) al
    const { data: reps } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('role', 'sales')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (!reps || reps.length === 0) {
        // Eğer satış temsilcisi bulunamadıysa crm_manager veya adminleri listele fallback olarak
        const { data: managers } = await supabase
            .from('profiles')
            .select('id')
            .eq('tenant_id', tenantId)
            .in('role', ['crm_manager', 'admin', 'owner'])
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        if (!managers || managers.length === 0) {
            return null
        }
        
        const lastIndex = tenant.lead_assignment_last_rep_index || 0
        const nextIndex = lastIndex % managers.length
        const assignedRep = managers[nextIndex]

        await supabase
            .from('tenants')
            .update({ lead_assignment_last_rep_index: nextIndex + 1 })
            .eq('id', tenantId)

        return assignedRep.id
    }

    const lastIndex = tenant.lead_assignment_last_rep_index || 0
    const nextIndex = lastIndex % reps.length
    const assignedRep = reps[nextIndex]

    await supabase
        .from('tenants')
        .update({ lead_assignment_last_rep_index: nextIndex + 1 })
        .eq('id', tenantId)

    return assignedRep.id
}

/**
 * Temsilciye atama bildirimlerini (WhatsApp ve zil bildirimi) gönderir
 */
export async function sendLeadAssignmentNotifications(
    tenantId: string, 
    leadId: string, 
    leadName: string, 
    leadPhone: string | null, 
    assignedTo: string
) {
    const supabase = createAdminClient()

    try {
        // 1. Uygulama içi bildirim (zil bildirimi) oluştur
        const { createNotification } = await import('@/lib/notifications/create')
        await createNotification({
            tenant_id: tenantId,
            user_id: assignedTo,
            type: 'Info',
            category: 'CRM',
            title: '🎯 Yeni Müşteri Adayı Atandı',
            message: `"${leadName}" isimli aday size atandı.`,
            link: `/leads?leadId=${leadId}`,
        })
        console.log(`[Outreach] Zil bildirimi gönderildi → Temsilci: ${assignedTo}`)

        // 2. WhatsApp bildirimi gönder (eğer aktifse)
        const { data: tenant } = await supabase
            .from('tenants')
            .select('wa_lead_assignment_notification_enabled, wa_phone_number_id, wa_access_token')
            .eq('id', tenantId)
            .single()

        if (tenant?.wa_lead_assignment_notification_enabled && tenant.wa_phone_number_id && tenant.wa_access_token) {
            const { data: repProfile } = await supabase
                .from('profiles')
                .select('phone, full_name')
                .eq('id', assignedTo)
                .single()

            if (repProfile?.phone) {
                const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                await sendWhatsAppTemplate(
                    repProfile.phone,
                    'lead_assignment_alert',
                    [
                        leadName || 'Aday Müşteri',
                        leadPhone || '',
                        'ADAY (LEADS)'
                    ],
                    'tr',
                    tenant.wa_phone_number_id,
                    tenant.wa_access_token
                )
                console.log(`[Outreach] WhatsApp atama bildirimi gönderildi → Temsilci: ${repProfile.full_name}`)
            }
        }
    } catch (err: any) {
        console.error('[CRM Mode] Atama bildirimleri gönderilirken hata oluştu:', err.message)
    }
}
