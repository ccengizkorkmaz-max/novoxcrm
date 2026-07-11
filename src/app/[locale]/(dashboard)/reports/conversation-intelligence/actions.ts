'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Konuşma Zekası Analizi
export async function analyzeConversations(tenantId: string, days: number = 7) {
    const supabase = await createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch recent call transcripts
    const { data: logs } = await supabase
        .from('outreach_step_logs')
        .select('response_data, call_outcome, call_duration, executed_at')
        .eq('channel', 'ai_call')
        .gte('executed_at', since)
        .not('response_data', 'is', null)
        .order('executed_at', { ascending: false })
        .limit(100)

    if (!logs || logs.length === 0) {
        return {
            totalCalls: 0,
            analyzedCalls: 0,
            topQuestions: [],
            objections: [],
            aiSuggestions: [],
            tonAnalysis: null,
            cached: false
        }
    }

    // Extract transcripts
    const transcripts: string[] = []
    for (const log of logs) {
        const data = log.response_data as any
        const transcript = data?.transcript || data?.summary
        if (transcript && typeof transcript === 'string' && transcript.length > 20) {
            transcripts.push(transcript.substring(0, 1000))
        }
    }

    if (transcripts.length === 0) {
        return {
            totalCalls: logs.length,
            analyzedCalls: 0,
            topQuestions: [],
            objections: [],
            aiSuggestions: [],
            tonAnalysis: null,
            cached: false
        }
    }

    // Check cache first
    const { data: cached } = await supabase
        .from('conversation_insights')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (cached) {
        return {
            totalCalls: logs.length,
            analyzedCalls: transcripts.length,
            ...(cached.insights as any),
            cached: true
        }
    }

    // Analyze with GPT-4o
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
        return {
            totalCalls: logs.length,
            analyzedCalls: transcripts.length,
            topQuestions: [],
            objections: [],
            aiSuggestions: [{ text: 'OpenAI API anahtari bulunamadi. Ayarlardan ekleyin.', type: 'error' }],
            tonAnalysis: null,
            cached: false
        }
    }

    try {
        const openai = new OpenAI({ apiKey: openaiKey })

        const sampleTranscripts = transcripts.slice(0, 15)
        const batchText = sampleTranscripts.map((t, i) => `--- Arama ${i + 1} ---\n${t}`).join('\n\n')

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Sen bir satis konusma analistisin. Emlak satis aramasi transkriptlerini analiz ediyorsun. JSON formatinda yanit ver.'
                },
                {
                    role: 'user',
                    content: `Asagidaki ${sampleTranscripts.length} adet satis aramasi transkriptini analiz et.\n\n${batchText}\n\nSu JSON formatinda yanit ver:\n{\n  "topQuestions": [\n    { "question": "Musterinin sordugu soru", "count": 5, "percentage": 35, "trend": "up" | "stable" | "down" }\n  ],\n  "objections": [\n    { "objection": "Itiraz metni", "count": 3, "percentage": 20, "trend": "up" | "stable" | "down" }\n  ],\n  "aiSuggestions": [\n    { "text": "Script iyilestirme onerisi", "type": "warning" | "tip" | "important", "priority": "high" | "medium" | "low" }\n  ],\n  "tonAnalysis": {\n    "overallSentiment": "positive" | "neutral" | "negative",\n    "averageEngagement": 72,\n    "politenessScore": 85,\n    "imperativeViolations": 0\n  }\n}\n\nKurallar:\n- topQuestions: Musterilerin en sik sordugu sorulari listele (max 8)\n- objections: Musterilerin itirazlarini/redlerini listele (max 6)\n- aiSuggestions: Script gelistirme onerileri (max 5)\n- tonAnalysis: Genel konusma tonu analizi\n- Percentage degerleri toplam aramaya gore yuzde olarak hesapla\n- Trend: Bu hafta vs onceki hafta karsilastirmasi (tahmini)\n- imperativeViolations: Maya'nin emir kipiyle konustugu sayi`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
        })

        const analysis = JSON.parse(response.choices[0]?.message?.content || '{}')

        // Cache the results
        await supabase.from('conversation_insights').insert({
            tenant_id: tenantId,
            period_start: since,
            period_end: new Date().toISOString(),
            insights: analysis,
            total_calls: transcripts.length
        })

        return {
            totalCalls: logs.length,
            analyzedCalls: transcripts.length,
            ...analysis,
            cached: false
        }
    } catch (error: any) {
        console.error('[ConversationIntel] GPT analysis error:', error.message)
        return {
            totalCalls: logs.length,
            analyzedCalls: transcripts.length,
            topQuestions: [],
            objections: [],
            aiSuggestions: [{ text: `Analiz hatasi: ${error.message}`, type: 'error' }],
            tonAnalysis: null,
            cached: false
        }
    }
}
