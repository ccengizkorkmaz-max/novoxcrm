'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

interface AiScoreResult {
    score: number
    label: string
    signals: { icon: string; text: string }[]
    suggestion: string
    bestCallTime: string | null
    confidence: number
}

/**
 * Calculates a predictive AI purchase score (0-100) for a customer
 * Uses GPT-4o-mini to analyze all interaction history
 */
export async function calculateAiLeadScore(
    customerId: string,
    tenantId: string
): Promise<AiScoreResult> {
    const supabase = await createClient()

    // 1. Gather all signals
    const [
        { data: customer },
        { data: callLogs },
        { data: activities },
        { data: demands },
        { data: qualification }
    ] = await Promise.all([
        supabase
            .from('customers')
            .select('full_name, phone, email, source, created_at, tags, gender, heard_from')
            .eq('id', customerId)
            .single(),
        supabase
            .from('outreach_step_logs')
            .select('channel, status, call_outcome, call_duration, response_data, executed_at')
            .eq('customer_id', customerId)
            .order('executed_at', { ascending: false })
            .limit(20),
        supabase
            .from('activities')
            .select('type, description, created_at')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(15),
        supabase
            .from('customer_demands')
            .select('*')
            .eq('customer_id', customerId)
            .limit(5),
        supabase
            .from('lead_qualifications')
            .select('interest_level, interest_level_ai, status')
            .eq('customer_id', customerId)
            .maybeSingle()
    ])

    if (!customer) {
        return {
            score: 0,
            label: 'Bilinmiyor',
            signals: [],
            suggestion: 'Müşteri bulunamadı',
            bestCallTime: null,
            confidence: 0
        }
    }

    // Build signal summary
    const totalCalls = callLogs?.length || 0
    const answeredCalls = callLogs?.filter(l =>
        ['completed', 'answered', 'interested', 'follow_up', 'hot'].includes(l.call_outcome || '')
    ).length || 0
    const lastInteraction = callLogs?.[0]?.executed_at || activities?.[0]?.created_at || customer.created_at
    const daysSinceLastInteraction = Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
    const hasDemands = (demands?.length || 0) > 0
    const currentInterest = qualification?.interest_level || 'unknown'

    // Extract WA messages if any
    const waMessages = callLogs?.filter(l => l.channel === 'whatsapp') || []
    const waResponseCount = waMessages.filter(l => l.status === 'completed').length

    // Extract call summaries
    const callSummaries = callLogs
        ?.filter(l => l.response_data)
        .slice(0, 5)
        .map(l => {
            const data = l.response_data as any
            return data?.summary || data?.transcript?.substring(0, 200) || ''
        })
        .filter(Boolean) || []

    const signalText = [
        `Müşteri: ${customer.full_name}`,
        `Kaynak: ${customer.source || 'bilinmiyor'}`,
        `Kayıt tarihi: ${customer.created_at}`,
        `Toplam arama: ${totalCalls}, Cevaplanan: ${answeredCalls}`,
        `Son etkileşim: ${daysSinceLastInteraction} gün önce`,
        `WA mesajlaşma: ${waMessages.length} mesaj, ${waResponseCount} cevap`,
        `Talep kaydı: ${hasDemands ? 'Var' : 'Yok'}`,
        `Mevcut ilgi seviyesi: ${currentInterest}`,
        callSummaries.length > 0 ? `Arama özetleri:\n${callSummaries.join('\n')}` : '',
        activities?.length ? `Son aktiviteler: ${activities.slice(0, 5).map(a => `${a.type}: ${a.description || ''}`).join(', ')}` : ''
    ].filter(Boolean).join('\n')

    // 2. GPT-4o scoring
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
        // Fallback: rule-based scoring
        return ruleBasedScore(totalCalls, answeredCalls, daysSinceLastInteraction, hasDemands, currentInterest)
    }

    try {
        const openai = new OpenAI({ apiKey: openaiKey })

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Sen bir emlak satis analisti sin. Musteri verilerini analiz edip satin alma olasiligini tahmin ediyorsun. JSON formatinda yanit ver.'
                },
                {
                    role: 'user',
                    content: `Bu musterinin satin alma olasiligini 0-100 arasinda puanla.\n\n${signalText}\n\nJSON yanit:\n{\n  "score": 0-100,\n  "label": "Cok Sicak" | "Sicak" | "Ilik" | "Soguk" | "Kayip",\n  "signals": [\n    { "icon": "emoji", "text": "sinyal aciklamasi" }\n  ],\n  "suggestion": "Onerilen aksiyon",\n  "bestCallTime": "Onerilen arama zamani veya null",\n  "confidence": 0-100\n}\n\nKurallar:\n- 80-100: Cok Sicak (hemen arayin)\n- 60-79: Sicak (yakin takip)\n- 40-59: Ilik (nurture)\n- 20-39: Soguk (uzun vadeli)\n- 0-19: Kayip (pasif)\n- signals: max 5 adet, en onemli sinyaller\n- confidence: tahmin guven orani`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
        })

        const result = JSON.parse(response.choices[0]?.message?.content || '{}')

        // Save score to DB
        await supabase
            .from('customers')
            .update({
                ai_purchase_score: result.score || 0,
                ai_purchase_score_data: result,
                ai_purchase_score_updated_at: new Date().toISOString()
            })
            .eq('id', customerId)

        return {
            score: result.score || 0,
            label: result.label || 'Bilinmiyor',
            signals: result.signals || [],
            suggestion: result.suggestion || '',
            bestCallTime: result.bestCallTime || null,
            confidence: result.confidence || 50
        }
    } catch (error: any) {
        console.error('[AI Lead Scoring] Error:', error.message)
        return ruleBasedScore(totalCalls, answeredCalls, daysSinceLastInteraction, hasDemands, currentInterest)
    }
}

/**
 * Fallback rule-based scoring when GPT is unavailable
 */
function ruleBasedScore(
    totalCalls: number,
    answeredCalls: number,
    daysSince: number,
    hasDemands: boolean,
    interest: string
): AiScoreResult {
    let score = 30 // base

    // Interest level bonus
    if (interest === 'hot') score += 30
    else if (interest === 'warm') score += 20
    else if (interest === 'follow_up') score += 15
    else if (interest === 'cold') score -= 10
    else if (interest === 'disqualified') score -= 30

    // Call engagement
    if (totalCalls > 0) {
        const answerRate = answeredCalls / totalCalls
        score += Math.round(answerRate * 20)
    }

    // Recency
    if (daysSince <= 2) score += 15
    else if (daysSince <= 7) score += 10
    else if (daysSince <= 14) score += 5
    else if (daysSince > 30) score -= 15

    // Demand
    if (hasDemands) score += 10

    score = Math.max(0, Math.min(100, score))

    const label = score >= 80 ? 'Cok Sicak' : score >= 60 ? 'Sicak' : score >= 40 ? 'Ilik' : score >= 20 ? 'Soguk' : 'Kayip'

    return {
        score,
        label,
        signals: [
            { icon: '📞', text: `${totalCalls} arama, ${answeredCalls} cevap` },
            { icon: '📅', text: `Son etkilesim: ${daysSince} gun once` },
            { icon: '🏷', text: `Mevcut ilgi: ${interest}` }
        ],
        suggestion: score >= 60 ? 'Hemen arayin' : score >= 40 ? 'Takip e-postasi gonderin' : 'Bekleyin',
        bestCallTime: null,
        confidence: 40 // Low confidence for rule-based
    }
}

/**
 * Batch scoring for cron job - scores up to N customers per run
 */
export async function batchScoreLeads(tenantId: string, limit: number = 50) {
    const supabase = await createClient()

    // Get customers that need scoring (recently active, no recent score)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .or(`ai_purchase_score_updated_at.is.null,ai_purchase_score_updated_at.lt.${oneDayAgo}`)
        .order('updated_at', { ascending: false })
        .limit(limit)

    if (!customers || customers.length === 0) {
        return { scored: 0, total: 0 }
    }

    let scored = 0
    for (const c of customers) {
        try {
            await calculateAiLeadScore(c.id, tenantId)
            scored++
        } catch (e) {
            console.error(`[Batch Score] Failed for ${c.id}:`, e)
        }
    }

    return { scored, total: customers.length }
}
