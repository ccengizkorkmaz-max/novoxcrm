'use server'

import { createClient } from '@/lib/supabase/server'

interface SuccessPattern {
    pattern: string
    frequency: number
    examples: string[]
}

interface ScriptAnalysis {
    totalCalls: number
    successfulCalls: number
    failedCalls: number
    successRate: number
    patterns: {
        successful: SuccessPattern[]
        failed: SuccessPattern[]
    }
    currentPrompt: string
    suggestedPrompt: string | null
    improvements: string[]
    avgSuccessfulDuration: number
    avgFailedDuration: number
}

export async function analyzeSuccessPatterns(tenantId: string): Promise<ScriptAnalysis> {
    const supabase = await createClient()

    // 1. Get all call activities with transcripts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
        .from('activities')
        .select('id, summary, description, metadata, customer_id, created_at')
        .eq('tenant_id', tenantId)
        .eq('type', 'Transcript')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200)

    if (!activities || activities.length === 0) {
        return emptyAnalysis()
    }

    // 2. Categorize: successful vs failed
    const successful: { transcript: string; duration: number; summary: string }[] = []
    const failed: { transcript: string; duration: number; summary: string }[] = []

    for (const act of activities) {
        const meta = act.metadata as any || {}
        const transcript = act.description || ''
        const duration = meta.duration || 0
        const outcome = meta.call_outcome || meta.outcome || ''
        const summary = act.summary || ''

        // Determine success: randevu alındı, ilgi gösterildi, callback istendi
        const isSuccess = ['interested', 'hot', 'warm', 'follow_up', 'callback_requested', 'appointment'].includes(outcome) ||
            summary.toLowerCase().includes('randevu') ||
            summary.toLowerCase().includes('ilgili') ||
            summary.toLowerCase().includes('olumlu')

        if (isSuccess && transcript.length > 100) {
            successful.push({ transcript, duration, summary })
        } else if (transcript.length > 50) {
            failed.push({ transcript, duration, summary })
        }
    }

    // 3. Extract patterns from successful calls
    const successPatterns = extractPatterns(successful.map(s => s.transcript))
    const failPatterns = extractPatterns(failed.map(f => f.transcript))

    // 4. Get current default script
    const { data: defaultScript } = await supabase
        .from('outreach_scripts')
        .select('prompt')
        .eq('tenant_id', tenantId)
        .eq('is_default', true)
        .maybeSingle()

    const currentPrompt = defaultScript?.prompt || ''

    // 5. Generate improvements using AI (if enough data)
    let suggestedPrompt: string | null = null
    const improvements: string[] = []

    if (successful.length >= 3) {
        // Rule-based improvements
        const avgSuccessDur = successful.reduce((s, c) => s + c.duration, 0) / successful.length
        const avgFailDur = failed.length > 0 ? failed.reduce((s, c) => s + c.duration, 0) / failed.length : 0

        if (avgSuccessDur > avgFailDur && avgFailDur > 0) {
            improvements.push(`✅ Başarılı aramalar ortalama ${Math.round(avgSuccessDur)}sn, başarısızlar ${Math.round(avgFailDur)}sn. Daha uzun konuşmalar dönüşüme yol açıyor.`)
        }

        // Check if questions work
        const questionInSuccess = successful.filter(s =>
            s.transcript.includes('?') && (s.transcript.match(/\?/g) || []).length >= 3
        ).length
        const questionRate = questionInSuccess / successful.length

        if (questionRate > 0.5) {
            improvements.push(`✅ Başarılı aramaların %${Math.round(questionRate * 100)}'inde 3+ soru sorulmuş. Soru sormak dönüşümü artırıyor.`)
        }

        // Check greeting patterns
        const greetingWithName = successful.filter(s =>
            s.transcript.substring(0, 200).toLowerCase().includes('bey') ||
            s.transcript.substring(0, 200).toLowerCase().includes('hanım')
        ).length
        if (greetingWithName > successful.length * 0.6) {
            improvements.push(`✅ Başarılı aramalarda müşteriye ismiyle hitap ediliyor (Bey/Hanım). Bu kalıbı koruyun.`)
        }

        // Check for price mention timing
        const earlyPrice = successful.filter(s => {
            const words = s.transcript.split(/\s+/)
            const priceIdx = words.findIndex(w => w.includes('fiyat') || w.includes('₺') || w.includes('milyon') || w.includes('lira'))
            return priceIdx > 0 && priceIdx < words.length * 0.3
        }).length

        if (earlyPrice < successful.length * 0.3) {
            improvements.push(`💡 Başarılı aramalarda fiyat genellikle konuşmanın ilk %30'unda verilmiyor. Önce ilgi oluşturun.`)
        }

        // Check if there's a follow-up offer
        const followUpOffer = successful.filter(s =>
            s.transcript.toLowerCase().includes('whatsapp') ||
            s.transcript.toLowerCase().includes('katalog') ||
            s.transcript.toLowerCase().includes('broşür')
        ).length
        if (followUpOffer > successful.length * 0.4) {
            improvements.push(`✅ Başarılı aramaların %${Math.round((followUpOffer / successful.length) * 100)}'inde WhatsApp/katalog teklifi var. Bu etkili.`)
        }

        // Generate suggested prompt (rule-based enhancement of current)
        if (currentPrompt && improvements.length >= 2) {
            suggestedPrompt = enhancePrompt(currentPrompt, improvements, successPatterns)
        }
    } else {
        improvements.push('⚠️ Yeterli veri yok. En az 3 başarılı arama transkripti gerekli.')
    }

    return {
        totalCalls: activities.length,
        successfulCalls: successful.length,
        failedCalls: failed.length,
        successRate: activities.length > 0 ? Math.round((successful.length / activities.length) * 100) : 0,
        patterns: {
            successful: successPatterns,
            failed: failPatterns
        },
        currentPrompt,
        suggestedPrompt,
        improvements,
        avgSuccessfulDuration: successful.length > 0 ? Math.round(successful.reduce((s, c) => s + c.duration, 0) / successful.length) : 0,
        avgFailedDuration: failed.length > 0 ? Math.round(failed.reduce((s, c) => s + c.duration, 0) / failed.length) : 0,
    }
}

function extractPatterns(transcripts: string[]): SuccessPattern[] {
    if (transcripts.length === 0) return []

    const patterns: SuccessPattern[] = []
    const keywords: Record<string, number> = {}

    // Extract common phrases (3-5 word n-grams)
    for (const t of transcripts) {
        const words = t.toLowerCase().split(/\s+/).filter(w => w.length > 2)
        for (let i = 0; i < words.length - 2; i++) {
            const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
            keywords[trigram] = (keywords[trigram] || 0) + 1
        }
    }

    // Get most frequent patterns
    const sorted = Object.entries(keywords)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

    for (const [phrase, freq] of sorted) {
        // Find example contexts
        const examples = transcripts
            .filter(t => t.toLowerCase().includes(phrase))
            .slice(0, 2)
            .map(t => {
                const idx = t.toLowerCase().indexOf(phrase)
                const start = Math.max(0, idx - 30)
                const end = Math.min(t.length, idx + phrase.length + 30)
                return `...${t.substring(start, end)}...`
            })

        patterns.push({ pattern: phrase, frequency: freq, examples })
    }

    return patterns
}

function enhancePrompt(currentPrompt: string, improvements: string[], patterns: SuccessPattern[]): string {
    let enhanced = currentPrompt

    // Add data-driven insights as instructions
    const insights: string[] = []

    for (const imp of improvements) {
        if (imp.includes('soru sormak')) {
            insights.push('Konuşma boyunca en az 3 açık uçlu soru sor.')
        }
        if (imp.includes('ismiyle hitap')) {
            insights.push('Müşteriyi her zaman ismiyle (Bey/Hanım ekleyerek) hitap et.')
        }
        if (imp.includes('fiyat genellikle')) {
            insights.push('Fiyat bilgisini hemen verme, önce projenin özelliklerini anlat ve ilgi oluştur.')
        }
        if (imp.includes('WhatsApp/katalog')) {
            insights.push('Konuşma sonunda mutlaka WhatsApp\'tan katalog veya detaylı bilgi göndermeyi teklif et.')
        }
    }

    if (insights.length > 0) {
        enhanced += '\n\n--- Veri Bazlı İyileştirmeler (Otomatik) ---\n'
        enhanced += insights.map((ins, i) => `${i + 1}. ${ins}`).join('\n')
    }

    return enhanced
}

export async function applyImprovedPrompt(tenantId: string, newPrompt: string) {
    const supabase = await createClient()

    const { data: defaultScript } = await supabase
        .from('outreach_scripts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_default', true)
        .maybeSingle()

    if (defaultScript) {
        await supabase
            .from('outreach_scripts')
            .update({ prompt: newPrompt })
            .eq('id', defaultScript.id)

        return { success: true }
    }

    return { error: 'Varsayılan script bulunamadı' }
}

function emptyAnalysis(): ScriptAnalysis {
    return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        successRate: 0,
        patterns: { successful: [], failed: [] },
        currentPrompt: '',
        suggestedPrompt: null,
        improvements: ['⚠️ Henüz hiç arama transkripti bulunamadı.'],
        avgSuccessfulDuration: 0,
        avgFailedDuration: 0,
    }
}
