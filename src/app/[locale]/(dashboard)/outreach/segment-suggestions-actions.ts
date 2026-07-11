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

    // 1. Get default script
    const { data: defaultScript } = await supabase
        .from('outreach_scripts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle()

    const scriptId = defaultScript?.id

    // 2. Create the segment
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
        return { error: 'Segment oluşturulamadı: ' + segmentError?.message }
    }

    // 3. Define steps based on suggestion type
    let steps: any[] = []
    if (payload.suggestionType === 'silent_leads') {
        steps = [
            {
                step_order: 1,
                name: '💬 Re-engagement WhatsApp',
                action_type: 'whatsapp',
                config: { message: 'Merhaba, projemizle ilgili güncel detayları ve size özel ödeme planlarını paylaşmak isteriz. Uygun olduğunuzda görüşebilir miyiz?' }
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
                config: { message: 'Merhabalar, size telefonla ulaşamadık. İlgilendiğiniz proje hakkında bilgi almak veya randevu oluşturmak isterseniz buradan yardımcı olabiliriz.' }
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
                config: { message: 'Merhabalar, ilgilendiğiniz proje için özel fiyat indirimleri ve ödeme kolaylıkları tanımlandı. Detaylar için görüşmek isteriz.' }
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
        // Fallback to simple AI Call
        steps = [
            {
                step_order: 1,
                name: '🤖 AI Arama',
                action_type: 'ai_call',
                config: { script_id: scriptId }
            }
        ]
    }

    // 4. Create the workflow
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
        // Cleanup segment if workflow fails
        await supabase.from('outreach_segments').delete().eq('id', segment.id)
        return { error: 'Workflow oluşturulamadı: ' + workflowError?.message }
    }

    // 5. Create the steps
    const stepsPayload = steps.map(s => ({
        ...s,
        workflow_id: workflow.id,
        tenant_id: tenantId,
        is_active: true
    }))

    const { error: stepsError } = await supabase
        .from('outreach_steps')
        .insert(stepsPayload)

    if (stepsError) {
        // Cleanup
        await supabase.from('outreach_workflows').delete().eq('id', workflow.id)
        await supabase.from('outreach_segments').delete().eq('id', segment.id)
        return { error: 'Adımlar oluşturulamadı: ' + stepsError.message }
    }

    return { success: true, workflowId: workflow.id }
}

