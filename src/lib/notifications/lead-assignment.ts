'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from './create'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'

export interface LeadAssignmentAlertParams {
    tenantId: string
    assignedToUserId: string
    leadName: string
    leadPhone?: string | null
    scoreText?: string
    source?: string
    leadId?: string
    notifyManagers?: boolean
}

/**
 * Lead / Müşteri ataması yapıldığında temsilciye ve (opsiyonel olarak) Hot Lead Yöneticilerine
 * WhatsApp şablonu (lead_assignment_alert) ve sistem içi bildirim gönderen merkezi fonksiyon.
 */
export async function sendLeadAssignmentAlert(params: LeadAssignmentAlertParams) {
    const {
        tenantId,
        assignedToUserId,
        leadName,
        leadPhone,
        scoreText = 'ADAY (LEADS)',
        source = 'CRM',
        leadId,
        notifyManagers = true
    } = params

    if (!tenantId || !assignedToUserId) {
        console.warn('⚠️ [sendLeadAssignmentAlert] tenantId veya assignedToUserId eksik:', { tenantId, assignedToUserId })
        return { success: false, reason: 'missing_params' }
    }

    try {
        const adminSupabase = createAdminClient()

        // 1. Kullanıcı bildirim tercihlerini kontrol et
        const { data: pref } = await adminSupabase
            .from('user_notification_preferences')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('user_id', assignedToUserId)
            .eq('notification_type', 'lead_assigned')
            .maybeSingle()

        const isEnabled = pref ? pref.is_enabled : true
        const inAppEnabled = pref ? pref.channel_in_app : true
        const whatsappEnabled = pref ? pref.channel_whatsapp : true

        if (!isEnabled) {
            console.log(`⏭️ [sendLeadAssignmentAlert] Temsilci bildirimleri kapalı (user: ${assignedToUserId})`)
            return { success: false, reason: 'user_disabled' }
        }

        const cleanLeadName = (leadName && leadName.trim()) || 'Aday Müşteri'
        const cleanLeadPhone = (leadPhone && leadPhone.trim()) || '-'
        const cleanScore = (scoreText && scoreText.trim()) || 'ADAY (LEADS)'

        // 2. Uygulama içi (Zil) Bildirimi
        if (inAppEnabled) {
            try {
                await createNotification({
                    tenant_id: tenantId,
                    user_id: assignedToUserId,
                    type: 'Info',
                    category: 'CRM',
                    title: '🎯 Yeni Müşteri Adayı Atandı',
                    message: `${cleanLeadName} isimli müşteri adayı takibinize atandı. (${source})`,
                    link: leadId ? `/leads?leadId=${leadId}` : '/leads'
                })
            } catch (notifErr) {
                console.error('❌ [sendLeadAssignmentAlert] In-app notification hatası:', notifErr)
            }
        }

        // 3. WhatsApp Bildirimi
        if (whatsappEnabled) {
            try {
                // Tenant WA ayarlarını al veya .env fallback uygula
                const { data: tenant } = await adminSupabase
                    .from('tenants')
                    .select('wa_phone_number_id, wa_access_token')
                    .eq('id', tenantId)
                    .single()

                const waPhoneId = tenant?.wa_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
                const waToken = tenant?.wa_access_token || process.env.WHATSAPP_ACCESS_TOKEN

                if (!waPhoneId || !waToken) {
                    console.warn('⚠️ [sendLeadAssignmentAlert] WhatsApp API kimlik bilgileri (Phone ID / Token) bulunamadı')
                    return { success: false, reason: 'credentials_missing' }
                }

                // Temsilcinin profil ve telefon bilgilerini al
                const { data: repProfile } = await adminSupabase
                    .from('profiles')
                    .select('phone, full_name')
                    .eq('id', assignedToUserId)
                    .single()

                if (!repProfile?.phone) {
                    console.warn(`⚠️ [sendLeadAssignmentAlert] Temsilcinin telefon numarası yok (ID: ${assignedToUserId})`)
                    return { success: false, reason: 'no_phone' }
                }

                // UTILITY template kullanıyoruz (crm_operasyonel_durum_bildirimi)
                // MARKETING kategorisindeki lead_assignment_alert Meta frekans limitine takılıyordu
                // UTILITY şablonları her zaman teslim edilir
                const now = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                const statusDesc = `${cleanScore} — ${source} üzerinden atandı`

                console.log(`📤 [sendLeadAssignmentAlert] WA atama bildirimi gönderiliyor (UTILITY): ${repProfile.full_name} (${repProfile.phone}) - Lead: ${cleanLeadName}`)

                const waResult = await sendWhatsAppTemplate(
                    repProfile.phone,
                    'crm_operasyonel_durum_bildirimi',
                    [cleanLeadName, cleanLeadPhone, now, statusDesc],
                    'tr',
                    waPhoneId,
                    waToken
                )

                if (waResult.success) {
                    console.log(`✅ [sendLeadAssignmentAlert] WA atama bildirimi başarıyla iletildi: ${repProfile.full_name}`)
                } else {
                    console.error(`❌ [sendLeadAssignmentAlert] WA atama bildirimi BAŞARISIZ: ${repProfile.full_name}`, waResult.error, JSON.stringify(waResult.data || {}))
                }

                // 4. Hot Lead Yöneticilerine bildirim gönder (Temsilcinin kendisi hariç)
                if (notifyManagers) {
                    const { data: hotLeadManagers } = await adminSupabase
                        .from('profiles')
                        .select('phone, full_name, id')
                        .eq('tenant_id', tenantId)
                        .eq('is_hot_lead_manager', true)

                    if (hotLeadManagers && hotLeadManagers.length > 0) {
                        for (const manager of hotLeadManagers) {
                            if (manager.phone && manager.id !== assignedToUserId) {
                                const mgrStatusDesc = `${cleanScore} — Atanan: ${repProfile.full_name} (${source})`
                                const mgrResult = await sendWhatsAppTemplate(
                                    manager.phone,
                                    'crm_operasyonel_durum_bildirimi',
                                    [cleanLeadName, cleanLeadPhone, now, mgrStatusDesc],
                                    'tr',
                                    waPhoneId,
                                    waToken
                                )
                                if (mgrResult.success) {
                                    console.log(`✅ [sendLeadAssignmentAlert] Hot Lead Manager WA iletildi: ${manager.full_name}`)
                                } else {
                                    console.error(`❌ [sendLeadAssignmentAlert] Hot Lead Manager WA BAŞARISIZ: ${manager.full_name}`, mgrResult.error)
                                }
                            }
                        }
                    }
                }

                return waResult
            } catch (waErr) {
                console.error('❌ [sendLeadAssignmentAlert] WhatsApp gönderim işlemi sırasında hata:', waErr)
                return { success: false, error: waErr }
            }
        }

        return { success: true }
    } catch (err: any) {
        console.error('❌ [sendLeadAssignmentAlert] Genel hata:', err)
        return { success: false, error: err.message }
    }
}
