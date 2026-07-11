'use server'

import { createClient } from '@/lib/supabase/server'

interface ChannelRecommendation {
    channel: 'ai_call' | 'whatsapp' | 'sms'
    confidence: number
    reason: string
    stats: {
        ai_call: { sent: number; responded: number; rate: number }
        whatsapp: { sent: number; responded: number; rate: number }
        sms: { sent: number; responded: number; rate: number }
    }
}

/**
 * Analyzes a customer's past interaction history to recommend
 * the most effective communication channel
 */
export async function getOptimalChannel(customerId: string): Promise<ChannelRecommendation> {
    const supabase = await createClient()

    // Fetch all outreach step logs for this customer
    const { data: logs } = await supabase
        .from('outreach_step_logs')
        .select('channel, status, call_outcome')
        .eq('customer_id', customerId)
        .order('executed_at', { ascending: false })
        .limit(50)

    const stats = {
        ai_call: { sent: 0, responded: 0, rate: 0 },
        whatsapp: { sent: 0, responded: 0, rate: 0 },
        sms: { sent: 0, responded: 0, rate: 0 }
    }

    if (logs && logs.length > 0) {
        for (const log of logs) {
            const ch = log.channel as keyof typeof stats
            if (!stats[ch]) continue

            stats[ch].sent++

            // Determine if customer responded
            const responded = (
                log.status === 'completed' ||
                log.status === 'responded' ||
                (log.channel === 'ai_call' && ['completed', 'answered', 'interested', 'follow_up', 'hot', 'warm'].includes(log.call_outcome || ''))
            )

            if (responded) {
                stats[ch].responded++
            }
        }
    }

    // Calculate rates
    for (const ch of Object.keys(stats) as (keyof typeof stats)[]) {
        stats[ch].rate = stats[ch].sent > 0
            ? Math.round((stats[ch].responded / stats[ch].sent) * 100)
            : 0
    }

    // Find best channel
    let bestChannel: 'ai_call' | 'whatsapp' | 'sms' = 'ai_call'
    let bestRate = -1
    let confidence = 30 // base confidence

    for (const ch of Object.keys(stats) as (keyof typeof stats)[]) {
        if (stats[ch].sent >= 2 && stats[ch].rate > bestRate) {
            bestRate = stats[ch].rate
            bestChannel = ch
        }
    }

    // Calculate confidence based on data volume
    const totalData = stats.ai_call.sent + stats.whatsapp.sent + stats.sms.sent
    if (totalData >= 10) confidence = 80
    else if (totalData >= 5) confidence = 60
    else if (totalData >= 2) confidence = 45

    // If no clear winner, default to AI call
    if (bestRate <= 0) {
        bestChannel = 'ai_call'
        confidence = 20
    }

    const channelNames = {
        ai_call: 'AI Telefon Araması',
        whatsapp: 'WhatsApp',
        sms: 'SMS'
    }

    let reason: string
    if (totalData === 0) {
        reason = 'Henüz yeterli veri yok, varsayılan kanal: telefon araması'
    } else if (bestRate > 0) {
        reason = `${channelNames[bestChannel]} %${bestRate} cevap oranıyla en etkili kanal`
    } else {
        reason = 'Tüm kanallar benzer performans, telefon araması öneriliyor'
    }

    return {
        channel: bestChannel,
        confidence,
        reason,
        stats
    }
}

/**
 * Get channel optimization summary for a tenant (aggregate across all customers)
 */
export async function getTenantChannelStats(tenantId: string) {
    const supabase = await createClient()

    const { data: logs } = await supabase
        .from('outreach_step_logs')
        .select('channel, status, call_outcome')
        .eq('tenant_id', tenantId)
        .limit(500)

    const channelStats: Record<string, { sent: number; responded: number; rate: number }> = {
        ai_call: { sent: 0, responded: 0, rate: 0 },
        whatsapp: { sent: 0, responded: 0, rate: 0 },
        sms: { sent: 0, responded: 0, rate: 0 }
    }

    if (logs) {
        for (const log of logs) {
            const ch = log.channel
            if (!channelStats[ch]) continue
            channelStats[ch].sent++

            const responded = (
                log.status === 'completed' ||
                log.status === 'responded' ||
                (ch === 'ai_call' && ['completed', 'answered', 'interested', 'follow_up', 'hot', 'warm'].includes(log.call_outcome || ''))
            )

            if (responded) channelStats[ch].responded++
        }

        for (const ch of Object.keys(channelStats)) {
            channelStats[ch].rate = channelStats[ch].sent > 0
                ? Math.round((channelStats[ch].responded / channelStats[ch].sent) * 100)
                : 0
        }
    }

    return channelStats
}
