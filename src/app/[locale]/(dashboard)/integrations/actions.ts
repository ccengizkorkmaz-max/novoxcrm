'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const NOVO_TENANT_ID = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'

export async function getFacebookCampaigns() {
    const supabase = createAdminClient()

    // Son 30 gündeki Facebook Ads lead'lerini çek
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const { data: leads } = await supabase
        .from('customers')
        .select('id, full_name, phone, notes, created_at')
        .eq('tenant_id', NOVO_TENANT_ID)
        .eq('source', 'Facebook Ads')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

    // Lead'leri notes'taki form/ad bilgisine göre grupla
    const formGroups: Record<string, {
        formId: string
        adIds: Set<string>
        leadCount: number
        todayCount: number
        lastLeadAt: string
        firstLeadAt: string
        sampleNames: string[]
    }> = {}

    const today = new Date().toISOString().substring(0, 10)

    for (const lead of (leads || [])) {
        const notes = lead.notes || ''
        const formMatch = notes.match(/Form:\s*(\S+)/)
        const adMatch = notes.match(/Ad:\s*(\S+)/)
        const formId = formMatch?.[1]?.replace(/[|-]/g, '') || 'make_import'
        const adId = adMatch?.[1]?.replace(/[|-]/g, '') || ''

        if (!formGroups[formId]) {
            formGroups[formId] = {
                formId,
                adIds: new Set(),
                leadCount: 0,
                todayCount: 0,
                lastLeadAt: lead.created_at,
                firstLeadAt: lead.created_at,
                sampleNames: [],
            }
        }

        const g = formGroups[formId]
        g.leadCount++
        if (adId) g.adIds.add(adId)
        if (lead.created_at > g.lastLeadAt) g.lastLeadAt = lead.created_at
        if (lead.created_at < g.firstLeadAt) g.firstLeadAt = lead.created_at
        if (lead.created_at.startsWith(today)) g.todayCount++
        if (g.sampleNames.length < 3) g.sampleNames.push(lead.full_name)
    }

    // Enabled durumlarını çek
    const { data: integrations } = await supabase
        .from('fb_lead_integrations')
        .select('*')
        .eq('tenant_id', NOVO_TENANT_ID)

    const enabledMap: Record<string, any> = {}
    for (const i of (integrations || [])) {
        enabledMap[i.form_id || i.campaign_id] = i
    }

    // Sonuç
    const campaigns = Object.values(formGroups)
        .sort((a, b) => b.leadCount - a.leadCount)
        .map(g => ({
            formId: g.formId,
            adCount: g.adIds.size,
            leadCount: g.leadCount,
            todayCount: g.todayCount,
            lastLeadAt: g.lastLeadAt,
            firstLeadAt: g.firstLeadAt,
            sampleNames: g.sampleNames,
            integration: enabledMap[g.formId] || null,
            isDirectEnabled: !!enabledMap[g.formId]?.is_active,
        }))

    return {
        campaigns,
        totalLeads: (leads || []).length,
        totalToday: campaigns.reduce((sum, c) => sum + c.todayCount, 0),
    }
}

export async function toggleCampaignIntegration(formId: string, enabled: boolean) {
    const supabase = createAdminClient()

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
        .from('fb_lead_integrations')
        .select('id')
        .eq('tenant_id', NOVO_TENANT_ID)
        .eq('form_id', formId)
        .maybeSingle()

    if (existing) {
        await supabase
            .from('fb_lead_integrations')
            .update({ is_active: enabled })
            .eq('id', existing.id)
    } else {
        await supabase.from('fb_lead_integrations').insert({
            tenant_id: NOVO_TENANT_ID,
            form_id: formId,
            is_active: enabled,
            source: 'facebook_ads',
        })
    }

    revalidatePath('/integrations')
    return { success: true }
}
