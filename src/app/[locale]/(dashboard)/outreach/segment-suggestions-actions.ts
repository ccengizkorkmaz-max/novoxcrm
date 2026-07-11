'use server'

import { createClient } from '@/lib/supabase/server'

interface SegmentSuggestion {
    id: string
    title: string
    description: string
    customerCount: number
    priority: 'high' | 'medium' | 'low'
    suggestedAction: string
    estimatedImpact: string
    icon: string
    segmentFilter: {
        type: string
        conditions: Record<string, any>
    }
}

export async function generateSegmentSuggestions(tenantId: string): Promise<SegmentSuggestion[]> {
    const supabase = await createClient()
    const suggestions: SegmentSuggestion[] = []
    const now = new Date()

    // 1. Sessiz Lead'ler — 2 haftadır hiç etkileşim yok
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const { data: allSales } = await supabase
        .from('sales')
        .select('id, customer_id, created_at, status')
        .eq('tenant_id', tenantId)
        .not('status', 'in', '("lost","cancelled")')
        .limit(1000)

    if (allSales && allSales.length > 0) {
        const customerIds = [...new Set(allSales.map(s => s.customer_id).filter(Boolean))]

        // Get recent activity per customer
        const { data: recentActivities } = await supabase
            .from('activities')
            .select('customer_id, created_at')
            .in('customer_id', customerIds.slice(0, 200))
            .gte('created_at', twoWeeksAgo.toISOString())

        const activeCustomerIds = new Set((recentActivities || []).map(a => a.customer_id))

        // Get recent outreach per customer
        const { data: recentOutreach } = await supabase
            .from('outreach_step_logs')
            .select('customer_id')
            .in('customer_id', customerIds.slice(0, 200))
            .gte('executed_at', twoWeeksAgo.toISOString())

        const outreachedCustomerIds = new Set((recentOutreach || []).map(o => o.customer_id))

        const silentLeads = customerIds.filter(id =>
            !activeCustomerIds.has(id) && !outreachedCustomerIds.has(id)
        )

        if (silentLeads.length >= 5) {
            suggestions.push({
                id: 'silent-leads',
                title: `🔇 ${silentLeads.length} Lead Sessiz`,
                description: `${silentLeads.length} lead 2 haftadır hiçbir etkileşimde bulunmadı. Re-engagement kampanyası başlatın.`,
                customerCount: silentLeads.length,
                priority: 'high',
                suggestedAction: 'Re-engagement WhatsApp + AI arama kampanyası',
                estimatedImpact: `${Math.round(silentLeads.length * 0.15)} potansiyel randevu`,
                icon: '🔇',
                segmentFilter: {
                    type: 'silent_leads',
                    conditions: { no_activity_days: 14, customer_ids: silentLeads.slice(0, 50) }
                }
            })
        }

        // 2. Yüksek AI skorlu ama aranmamış
        const { data: highScoreCustomers } = await supabase
            .from('customers')
            .select('id, full_name, ai_purchase_score')
            .in('id', customerIds.slice(0, 200))
            .gte('ai_purchase_score', 60)

        if (highScoreCustomers && highScoreCustomers.length > 0) {
            // Check which ones have NOT been called recently
            const { data: recentCalls } = await supabase
                .from('outreach_step_logs')
                .select('customer_id')
                .in('customer_id', highScoreCustomers.map(c => c.id))
                .eq('channel', 'ai_call')
                .gte('executed_at', twoWeeksAgo.toISOString())

            const calledIds = new Set((recentCalls || []).map(c => c.customer_id))
            const uncalledHighScore = highScoreCustomers.filter(c => !calledIds.has(c.id))

            if (uncalledHighScore.length >= 3) {
                suggestions.push({
                    id: 'high-score-uncalled',
                    title: `🔥 ${uncalledHighScore.length} Yüksek Skorlu Lead Aranmadı`,
                    description: `AI skoru 60+ olan ${uncalledHighScore.length} lead henüz aranmadı. Bu lead'ler yüksek dönüşüm potansiyeli taşıyor.`,
                    customerCount: uncalledHighScore.length,
                    priority: 'high',
                    suggestedAction: 'Acil AI arama kampanyası başlat',
                    estimatedImpact: `${Math.round(uncalledHighScore.length * 0.25)} potansiyel satış`,
                    icon: '🔥',
                    segmentFilter: {
                        type: 'high_score_uncalled',
                        conditions: { min_score: 60, customer_ids: uncalledHighScore.map(c => c.id).slice(0, 50) }
                    }
                })
            }
        }
    }

    // 3. Cevaplanmamış aramalar — tekrar deneyin
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: unansweredCalls } = await supabase
        .from('outreach_step_logs')
        .select('customer_id')
        .eq('tenant_id', tenantId)
        .eq('channel', 'ai_call')
        .eq('call_outcome', 'no_answer')
        .gte('executed_at', oneWeekAgo.toISOString())

    if (unansweredCalls && unansweredCalls.length > 0) {
        const unansweredIds = [...new Set(unansweredCalls.map(c => c.customer_id).filter(Boolean))]

        // Exclude those who were answered later
        const { data: answeredLater } = await supabase
            .from('outreach_step_logs')
            .select('customer_id')
            .in('customer_id', unansweredIds.slice(0, 200))
            .eq('channel', 'ai_call')
            .in('call_outcome', ['answered', 'completed', 'interested'])
            .gte('executed_at', oneWeekAgo.toISOString())

        const answeredSet = new Set((answeredLater || []).map(a => a.customer_id))
        const stillUnanswered = unansweredIds.filter(id => !answeredSet.has(id))

        if (stillUnanswered.length >= 5) {
            suggestions.push({
                id: 'retry-unanswered',
                title: `📞 ${stillUnanswered.length} Cevapsız Arama`,
                description: `Son 1 haftada ${stillUnanswered.length} kişi telefonunu açmadı. Farklı saat diliminde tekrar aranabilir.`,
                customerCount: stillUnanswered.length,
                priority: 'medium',
                suggestedAction: 'Farklı saatte AI arama + WhatsApp takip mesajı',
                estimatedImpact: `${Math.round(stillUnanswered.length * 0.3)} yeni cevaplama`,
                icon: '📞',
                segmentFilter: {
                    type: 'retry_unanswered',
                    conditions: { call_outcome: 'no_answer', customer_ids: stillUnanswered.slice(0, 50) }
                }
            })
        }
    }

    // 4. WhatsApp'tan cevap verenler — sıcak lead'ler
    const { data: waResponded } = await supabase
        .from('outreach_step_logs')
        .select('customer_id')
        .eq('tenant_id', tenantId)
        .eq('channel', 'whatsapp')
        .eq('status', 'responded')
        .gte('executed_at', oneWeekAgo.toISOString())

    if (waResponded && waResponded.length >= 3) {
        const respondedIds = [...new Set(waResponded.map(r => r.customer_id).filter(Boolean))]

        suggestions.push({
            id: 'wa-hot-leads',
            title: `💬 ${respondedIds.length} WA Cevap Veren Lead`,
            description: `${respondedIds.length} kişi WhatsApp mesajına cevap verdi. Bunlar sıcak lead — hemen aranmalı.`,
            customerCount: respondedIds.length,
            priority: 'high',
            suggestedAction: 'Acil AI telefon araması',
            estimatedImpact: `${Math.round(respondedIds.length * 0.35)} potansiyel randevu`,
            icon: '💬',
            segmentFilter: {
                type: 'wa_responded',
                conditions: { customer_ids: respondedIds.slice(0, 50) }
            }
        })
    }

    // 5. Eski lead'ler — 30+ gün önce oluşturulmuş ama dönüşmemiş
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: oldLeads } = await supabase
        .from('sales')
        .select('customer_id')
        .eq('tenant_id', tenantId)
        .not('status', 'in', '("lost","cancelled","won")')
        .lte('created_at', thirtyDaysAgo.toISOString())
        .limit(200)

    if (oldLeads && oldLeads.length >= 10) {
        const oldIds = [...new Set(oldLeads.map(l => l.customer_id).filter(Boolean))]

        suggestions.push({
            id: 'aging-leads',
            title: `⏰ ${oldIds.length} Yaşlanmış Lead`,
            description: `30+ gündür pipeline'da bekleyen ${oldIds.length} lead var. Özel teklif veya kampanya ile canlandırılabilir.`,
            customerCount: oldIds.length,
            priority: 'medium',
            suggestedAction: 'Özel teklif kampanyası (WhatsApp + SMS)',
            estimatedImpact: `${Math.round(oldIds.length * 0.1)} yeni dönüşüm`,
            icon: '⏰',
            segmentFilter: {
                type: 'aging_leads',
                conditions: { min_age_days: 30, customer_ids: oldIds.slice(0, 50) }
            }
        })
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    return suggestions
}

async function registerWhatsAppTemplateIfPossible(tenantId: string, name: string, text: string): Promise<string> {
    const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    let ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

    if (!WABA_ID || !ACCESS_TOKEN) {
        console.log('[Outreach] WABA credentials not configured. Using fallback template.')
        return 'novo_kampanya_genel_v2'
    }

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '')
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 50)

    try {
        const bodyPayload = {
            name: cleanName,
            category: 'UTILITY',
            language: 'tr',
            components: [
                {
                    type: 'BODY',
                    text: text
                }
            ]
        }

        const res = await fetch(
            `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            }
        )

        const data = await res.json()
        if (data.id) {
            console.log(`[Outreach] WhatsApp template registered successfully: ${cleanName} (ID: ${data.id})`)
            return cleanName
        } else {
            console.warn('[Outreach] Meta template registration failed:', data)
            return 'novo_kampanya_genel_v2' // Fallback to generic template
        }
    } catch (err: any) {
        console.error('[Outreach] Meta template registration exception:', err.message)
        return 'novo_kampanya_genel_v2' // Fallback to generic template
    }
}

export async function launchSuggestedCampaign(payload: {
    suggestionType: string
    title: string
    customerIds: string[]
    crmMode?: 'basic' | 'advance'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkilendirme hatası' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }
    const tenantId = profile.tenant_id

    // 1. Create a CUSTOM tailored outreach_scripts entry for this campaign
    let prompt = ''
    let firstMessage = ''

    if (payload.suggestionType === 'silent_leads') {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın. Bu kampanya 2 haftadır sessiz kalmış eski leadleri yeniden kazanmak (re-engagement) için yapılıyor. Müşteri daha önce projemizle ilgilenmişti. Amacın sıcak bir sohbet başlatmak, son güncellemeleri sormak ve ofisimize bir kahve eşliğinde randevu oluşturmak. Kibar, asla emir kipi kullanmayan, samimi bir dille konuş.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya. Nasılsınız? Projelerimizle daha önce ilgilenmiştiniz, güncel durumunuzu sormak ve yeni ödeme planlarımız hakkında bilgi vermek için rahatsız ettim.`
    } else if (payload.suggestionType === 'high_score_uncalled') {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın. Bu kampanya AI tarafından satın alma ihtimali çok yüksek olarak puanlanmış (70+ skor) ama henüz aranmamış müşteriler için. Müşteri son derece sıcak ve ilgili. Amacın doğrudan randevu almak veya detaylı sunum yapmak üzere bir toplantı organize etmek. Profesyonel ve sonuç odaklı ol.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya. Projelerimiz hakkında detaylı bilgi almak istediğinizi gördüm. Size en uygun ödeme seçeneklerini ve lansman fiyatlarını paylaşmak için hızlıca randevu organize etmek isterim.`
    } else if (payload.suggestionType === 'retry_unanswered') {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın. Bu kampanya daha önce aradığımızda telefonunu açmamış müşteriler için. Müşterinin meşgul olduğunu varsayarak kibar ve saygılı yaklaş, onu sıkmadan kısa bir bilgi sunup uygun zamanı öğrenerek randevu almaya çalış.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya. Daha önce ulaşamamıştım, meşgul olduğunuzu düşünerek tekrar şansımı denemek istedim. Projemiz hakkında kısa bir bilgi sunabilir miyim?`
    } else if (payload.suggestionType === 'wa_responded') {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın. Bu kampanya WhatsApp mesajımıza cevap veren sıcak leadler için. Müşteri yazılı kanaldan ilgi gösterdi, şimdi telefonla hızlıca güven ilişkisi kurup projeyi anlatmalı ve randevu almalısın.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya. WhatsApp üzerinden gönderdiğimiz bilgilere dönüş yaptığınız için teşekkürler. Detayları telefonda hızlıca aktarıp sorularınızı yanıtlamak istedim.`
    } else if (payload.suggestionType === 'aging_leads') {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın. Bu kampanya 30+ gündür pipeline'da bekleyen yaşlanmış leadleri canlandırmak için. Müşteriye yeni tanımlanan indirimler ve ödeme kolaylıklarından bahset, ilgisini tekrar çekmeye çalış.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya. İlgilendiğiniz konut projemiz için sınırlı sayıda üniteye özel yeni fiyat ve taksit avantajları tanımlandı. Detayları aktarmak isterim.`
    } else {
        prompt = `Sen gayrimenkul satış temsilcisi Maya'sın.`
        firstMessage = `Merhabalar, ben NovoCRM'den Maya.`
    }

    const { data: newScript, error: scriptError } = await supabase
        .from('outreach_scripts')
        .insert({
            tenant_id: tenantId,
            name: `🤖 AI Script: ${payload.title}`,
            description: `AI Kampanyası için özel oluşturulan script`,
            prompt,
            first_message: firstMessage,
            voice: 'Mert Aksoy',
            max_duration_seconds: 300,
            is_active: true
        })
        .select()
        .single()

    if (scriptError || !newScript) {
        return { error: 'Özel kampanya scripti oluşturulamadı: ' + scriptError?.message }
    }
    const scriptId = newScript.id

    // 2. Register WhatsApp Template or get fallback template
    let waTemplateName = 'novo_kampanya_genel_v2'
    let waTemplateParams = ['{customer_name}', '{project_name}']

    if (payload.suggestionType === 'silent_leads') {
        const text = 'Merhaba {{1}}, projemizle ilgili güncel detayları ve size özel ödeme planlarını paylaşmak isteriz. Uygun olduğunuzda görüşebilir miyiz?'
        waTemplateName = await registerWhatsAppTemplateIfPossible(tenantId, 'ai_silent_leads', text)
        waTemplateParams = waTemplateName === 'novo_kampanya_genel_v2' ? ['{customer_name}', '{project_name}'] : ['{customer_name}']
    } else if (payload.suggestionType === 'retry_unanswered') {
        const text = 'Merhabalar {{1}}, size telefonla ulaşamadık. İlgilendiğiniz proje hakkında bilgi almak veya randevu oluşturmak isterseniz buradan yardımcı olabiliriz.'
        waTemplateName = await registerWhatsAppTemplateIfPossible(tenantId, 'ai_retry_unanswered', text)
        waTemplateParams = waTemplateName === 'novo_kampanya_genel_v2' ? ['{customer_name}', '{project_name}'] : ['{customer_name}']
    } else if (payload.suggestionType === 'aging_leads') {
        const text = 'Merhabalar {{1}}, ilgilendiğiniz proje için özel fiyat indirimleri ve ödeme kolaylıkları tanımlandı. Detaylar için görüşmek isteriz.'
        waTemplateName = await registerWhatsAppTemplateIfPossible(tenantId, 'ai_aging_leads', text)
        waTemplateParams = waTemplateName === 'novo_kampanya_genel_v2' ? ['{customer_name}', '{project_name}'] : ['{customer_name}']
    }

    // 3. Create the segment
    const segmentName = `🤖 AI Önerisi: ${payload.title} (${new Date().toLocaleDateString('tr-TR')})`
    const { data: segment, error: segmentError } = await supabase
        .from('outreach_segments')
        .insert({
            tenant_id: tenantId,
            name: segmentName,
            description: `AI tarafından otomatik oluşturulan kampanya segmenti: ${payload.title}`,
            filters: {
                source: payload.crmMode === 'advance' ? 'leads' : 'sales',
                customer_ids: payload.customerIds
            },
            created_by: user.id
        })
        .select()
        .single()

    if (segmentError || !segment) {
        // Cleanup script if segment fails
        await supabase.from('outreach_scripts').delete().eq('id', scriptId)
        return { error: 'Segment oluşturulamadı: ' + segmentError?.message }
    }

    // 4. Define steps based on suggestion type
    let steps: any[] = []
    if (payload.suggestionType === 'silent_leads') {
        steps = [
            {
                step_order: 1,
                name: '💬 Re-engagement WhatsApp',
                action_type: 'whatsapp',
                config: { template_name: waTemplateName, template_params: waTemplateParams }
            },
            {
                step_order: 2,
                name: '⏰ 1 Gün Bekle',
                action_type: 'wait',
                config: { duration_value: 1, duration_unit: 'days' }
            },
            {
                step_order: 3,
                name: '🤖 Maya Telefon Araması',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            }
        ]
    } else if (payload.suggestionType === 'high_score_uncalled') {
        steps = [
            {
                step_order: 1,
                name: '🔥 Acil AI Arama (Maya)',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            }
        ]
    } else if (payload.suggestionType === 'retry_unanswered') {
        steps = [
            {
                step_order: 1,
                name: '⏰ 4 Saat Bekle',
                action_type: 'wait',
                config: { duration_value: 4, duration_unit: 'hours' }
            },
            {
                step_order: 2,
                name: '📞 Cevapsız Arama Tekrarı',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            },
            {
                step_order: 3,
                name: '⏰ 1 Gün Bekle',
                action_type: 'wait',
                config: { duration_value: 1, duration_unit: 'days' }
            },
            {
                step_order: 4,
                name: '💬 WhatsApp Takip Mesajı',
                action_type: 'whatsapp',
                config: { template_name: waTemplateName, template_params: waTemplateParams }
            }
        ]
    } else if (payload.suggestionType === 'wa_responded') {
        steps = [
            {
                step_order: 1,
                name: '📞 Sıcak Lead AI Arama',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            }
        ]
    } else if (payload.suggestionType === 'aging_leads') {
        steps = [
            {
                step_order: 1,
                name: '💬 Yaşlanmış Lead Özel Teklifi (WA)',
                action_type: 'whatsapp',
                config: { template_name: waTemplateName, template_params: waTemplateParams }
            },
            {
                step_order: 2,
                name: '⏰ 1 Gün Bekle',
                action_type: 'wait',
                config: { duration_value: 1, duration_unit: 'days' }
            },
            {
                step_order: 3,
                name: '📱 SMS Bilgilendirme',
                action_type: 'sms',
                config: { message: 'Size özel gayrimenkul fırsatı ve katalog bilgisi WhatsApp hattımızda paylaşıldı.' }
            }
        ]
    } else {
        steps = [
            {
                step_order: 1,
                name: '🤖 AI Arama',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            }
        ]
    }

    // 5. Create the workflow
    const workflowName = `🤖 AI Kampanyası: ${payload.title}`
    const { data: workflow, error: workflowError } = await supabase
        .from('outreach_workflows')
        .insert({
            tenant_id: tenantId,
            name: workflowName,
            description: `AI tarafından otomatik önerilen ve oluşturulan kampanya.`,
            segment_id: segment.id,
            created_by: user.id,
            is_active: false,
            working_hours_start: '09:00',
            working_hours_end: '18:00',
            working_days: [1, 2, 3, 4, 5],
            max_leads_per_day: 100,
            batch_size: 30,
            batch_interval_seconds: 60,
            stop_on_customer_response: true
        })
        .select()
        .single()

    if (workflowError || !workflow) {
        // Cleanup segment and script if workflow fails
        await supabase.from('outreach_segments').delete().eq('id', segment.id)
        await supabase.from('outreach_scripts').delete().eq('id', scriptId)
        return { error: 'Workflow oluşturulamadı: ' + workflowError?.message }
    }

    // 6. Create the steps
    const stepsPayload = steps.map(s => ({
        ...s,
        workflow_id: workflow.id,
        is_active: true
    }))

    const { error: stepsError } = await supabase
        .from('outreach_steps')
        .insert(stepsPayload)

    if (stepsError) {
        // Cleanup
        await supabase.from('outreach_workflows').delete().eq('id', workflow.id)
        await supabase.from('outreach_segments').delete().eq('id', segment.id)
        await supabase.from('outreach_scripts').delete().eq('id', scriptId)
        return { error: 'Adımlar oluşturulamadı: ' + stepsError.message }
    }

    return { success: true, workflowId: workflow.id }
}

