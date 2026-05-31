'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserRole, checkRole } from '@/lib/auth'

// ─── Types ───────────────────────────────────────────────────

export interface CallForReview {
    id: string
    call_id: string
    channel: string
    status: string
    call_duration_seconds: number
    call_outcome: string
    call_summary: string
    call_transcript: string
    call_recording_url: string
    cost_amount: number
    executed_at: string
    external_id: string
    customer_name: string
    customer_phone: string
    project_name: string
    workflow_name: string
    existing_feedback?: any
}

export interface FeedbackInput {
    step_log_id: string
    call_id?: string
    overall_rating: number
    tone_rating?: string
    accuracy_rating?: string
    objection_handling?: string
    question_asking?: string
    closing_skill?: string
    free_comment?: string
    suggested_response?: string
    transcript_highlight?: string
    tags?: string[]
}

export interface PromptVersionInput {
    prompt_type: string
    prompt_content: string
    change_summary: string
    feedback_ids?: string[]
}

// ─── 1. Get AI Calls for Review ──────────────────────────────

export async function getAICallsForReview(limit = 50): Promise<CallForReview[]> {
    const supabase = createAdminClient()
    const userSupabase = await createClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await userSupabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    // Fetch AI call logs with customer and project info
    const { data: logs, error } = await supabase
        .from('outreach_step_logs')
        .select(`
            id, channel, status, call_duration_seconds, call_outcome, 
            call_summary, call_transcript, call_recording_url, cost_amount, 
            executed_at, external_id,
            outreach_executions!inner(
                workflow_id, customer_id, tenant_id,
                customers(full_name, phone),
                sales(projects(name)),
                outreach_workflows(name)
            )
        `)
        .eq('channel', 'ai_call')
        .eq('outreach_executions.tenant_id', profile.tenant_id)
        .in('status', ['answered', 'converted', 'hung_up'])
        .order('executed_at', { ascending: false })
        .limit(limit)

    if (error && !logs) return []

    const validLogs = logs || []

    // Fetch manual AI calls from activities
    const { data: actData } = await supabase
        .from('activities')
        .select(`
            id, type, status, outcome, summary, description, created_at, customer_id,
            customers(full_name, phone),
            sales(projects(name))
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('type', 'Call')
        .ilike('summary', '%🤖 AI Arama%')
        .order('created_at', { ascending: false })
        .limit(limit)

    let manualLogs: any[] = []
    if (actData) {
        manualLogs = actData.map((act: any) => {
            const desc = act.description || ''
            const transcriptMarker = desc.indexOf('📝 Transkript:')
            let summaryPart = transcriptMarker > 0 ? desc.substring(0, transcriptMarker).trim() : desc
            let transcriptPart = transcriptMarker > 0 ? desc.substring(transcriptMarker + '📝 Transkript:'.length).trim() : ''
            
            const recordingMatch = desc.match(/\[RECORDING\]:\s*(https?:\/\/[^\s]+)/)
            const recUrl = recordingMatch ? recordingMatch[1] : ''
            
            summaryPart = summaryPart.replace(/\[RECORDING\]:\s*https?:\/\/[^\s]+/g, '').trim()
            transcriptPart = transcriptPart.replace(/\[RECORDING\]:\s*https?:\/\/[^\s]+/g, '').trim()

            // Try to extract duration if present in summary like (0dk 35sn)
            let duration = 0;
            const durMatch = act.summary?.match(/\((\d+)dk\s*(\d+)sn\)/)
            if (durMatch) {
                duration = (parseInt(durMatch[1]) * 60) + parseInt(durMatch[2])
            }

            return {
                id: act.id,
                call_id: `manual_${act.id}`,
                channel: 'ai_call',
                status: act.status === 'Completed' ? 'answered' : 'hung_up',
                call_duration_seconds: duration,
                call_outcome: act.outcome || '',
                call_summary: summaryPart,
                call_transcript: transcriptPart,
                call_recording_url: recUrl,
                cost_amount: 0,
                executed_at: act.created_at,
                external_id: `manual_${act.id}`,
                customer_name: act.customers?.full_name || 'Bilinmiyor',
                customer_phone: act.customers?.phone || '',
                project_name: act.sales?.projects?.name || 'Genel Proje',
                workflow_name: 'Manuel CRM Araması'
            }
        })
    }

    // Get existing feedback for these calls
    const logIds = [...validLogs.map(l => l.id), ...manualLogs.map(m => m.id)]
    const { data: feedbacks } = await supabase
        .from('ai_call_feedback')
        .select('*')
        .in('step_log_id', logIds)

    const feedbackMap = new Map(feedbacks?.map(f => [f.step_log_id, f]) || [])

    const outreachMapped = validLogs.map((log: any) => ({
        id: log.id,
        call_id: log.external_id || '',
        channel: log.channel,
        status: log.status,
        call_duration_seconds: log.call_duration_seconds || 0,
        call_outcome: log.call_outcome || '',
        call_summary: log.call_summary || '',
        call_transcript: log.call_transcript || '',
        call_recording_url: log.call_recording_url || '',
        cost_amount: log.cost_amount || 0,
        executed_at: log.executed_at,
        external_id: log.external_id || '',
        customer_name: log.outreach_executions?.customers?.full_name || 'Bilinmiyor',
        customer_phone: log.outreach_executions?.customers?.phone || '',
        project_name: log.outreach_executions?.sales?.projects?.name || 'Genel Proje',
        workflow_name: log.outreach_executions?.outreach_workflows?.name || 'Bilinmeyen Kampanya',
        existing_feedback: feedbackMap.get(log.id) || null
    }))

    // Combine and sort by date descending
    const allCalls = [...outreachMapped, ...manualLogs.map(m => ({ ...m, existing_feedback: feedbackMap.get(m.id) || null }))]
    allCalls.sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime())

    return allCalls.slice(0, limit)
}


// ─── 2. Submit Call Feedback ─────────────────────────────────

export async function submitCallFeedback(input: FeedbackInput): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum gerekli' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // All internal staff can submit feedback
    if (!['admin', 'owner', 'manager', 'sales'].includes(profile.role)) {
        return { success: false, error: 'Yetkiniz yok' }
    }

    const adminDb = createAdminClient()

    // Check if feedback already exists for this call
    const { data: existing } = await adminDb
        .from('ai_call_feedback')
        .select('id')
        .eq('step_log_id', input.step_log_id)
        .eq('reviewer_id', user.id)
        .maybeSingle()

    const feedbackData = {
        tenant_id: profile.tenant_id,
        reviewer_id: user.id,
        step_log_id: input.step_log_id,
        call_id: input.call_id || null,
        overall_rating: input.overall_rating,
        tone_rating: input.tone_rating || null,
        accuracy_rating: input.accuracy_rating || null,
        objection_handling: input.objection_handling || null,
        question_asking: input.question_asking || null,
        closing_skill: input.closing_skill || null,
        free_comment: input.free_comment || null,
        suggested_response: input.suggested_response || null,
        transcript_highlight: input.transcript_highlight || null,
        tags: input.tags || [],
    }

    if (existing) {
        // Update existing feedback
        const { error } = await adminDb
            .from('ai_call_feedback')
            .update(feedbackData)
            .eq('id', existing.id)

        if (error) return { success: false, error: error.message }
    } else {
        // Insert new
        const { error } = await adminDb
            .from('ai_call_feedback')
            .insert(feedbackData)

        if (error) return { success: false, error: error.message }
    }

    return { success: true }
}


// ─── 3. Feedback Analytics ───────────────────────────────────

export async function getFeedbackAnalytics() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return null

    const adminDb = createAdminClient()

    const { data: feedbacks } = await adminDb
        .from('ai_call_feedback')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (!feedbacks || feedbacks.length === 0) {
        return {
            totalFeedbacks: 0,
            avgRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            commonIssues: [],
            topTags: [],
            toneBreakdown: {},
            accuracyBreakdown: {},
            objectionBreakdown: {},
            recentSuggestions: [],
        }
    }

    // Calculate analytics
    const totalFeedbacks = feedbacks.length
    const avgRating = feedbacks.reduce((sum, f) => sum + f.overall_rating, 0) / totalFeedbacks

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
    feedbacks.forEach(f => { ratingDistribution[f.overall_rating] = (ratingDistribution[f.overall_rating] || 0) + 1 })

    // Count breakdowns
    const countField = (field: string) => {
        const counts: Record<string, number> = {}
        feedbacks.forEach(f => {
            const val = (f as any)[field]
            if (val) counts[val] = (counts[val] || 0) + 1
        })
        return counts
    }

    // Tag frequency
    const tagCounts: Record<string, number> = {}
    feedbacks.forEach(f => {
        (f.tags || []).forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
    })
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // Common issues (low ratings with comments)
    const commonIssues = feedbacks
        .filter(f => f.overall_rating <= 2 && f.free_comment)
        .map(f => ({ comment: f.free_comment, rating: f.overall_rating, date: f.created_at }))
        .slice(0, 10)

    // Recent suggested responses
    const recentSuggestions = feedbacks
        .filter(f => f.suggested_response)
        .map(f => ({
            suggestion: f.suggested_response,
            highlight: f.transcript_highlight,
            rating: f.overall_rating,
            date: f.created_at,
        }))
        .slice(0, 10)

    return {
        totalFeedbacks,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
        commonIssues,
        topTags,
        toneBreakdown: countField('tone_rating'),
        accuracyBreakdown: countField('accuracy_rating'),
        objectionBreakdown: countField('objection_handling'),
        questionBreakdown: countField('question_asking'),
        closingBreakdown: countField('closing_skill'),
        recentSuggestions,
    }
}


// ─── 4. Prompt Versions ──────────────────────────────────────

export async function getPromptVersions() {
    await checkRole(['admin', 'owner'])

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const adminDb = createAdminClient()
    const { data } = await adminDb
        .from('ai_prompt_versions')
        .select('*, profiles(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    return data || []
}


// ─── 5. Generate Prompt Suggestion ───────────────────────────

export async function generatePromptSuggestion(promptType: string = 'standard'): Promise<{ suggestion: string; analysis: string } | { error: string }> {
    await checkRole(['admin', 'owner'])

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum gerekli' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const adminDb = createAdminClient()

    // Get recent feedback
    const { data: feedbacks } = await adminDb
        .from('ai_call_feedback')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50)

    if (!feedbacks || feedbacks.length < 3) {
        return { error: 'Analiz için en az 3 geri bildirim gerekli' }
    }

    // Get current active prompt
    const { data: activePrompt } = await adminDb
        .from('ai_prompt_versions')
        .select('prompt_content')
        .eq('tenant_id', profile.tenant_id)
        .eq('prompt_type', promptType)
        .eq('is_active', true)
        .maybeSingle()

    // Import the hardcoded defaults as fallback
    const { DEFAULT_OUTREACH_PROMPTS } = await import('@/lib/vapi')
    const currentPrompt = activePrompt?.prompt_content || (DEFAULT_OUTREACH_PROMPTS as any)[promptType] || DEFAULT_OUTREACH_PROMPTS.standard

    // Build analysis prompt for Gemini
    const feedbackSummary = feedbacks.map((f, i) => {
        const parts = [
            `Değerlendirme ${i + 1}: Puan=${f.overall_rating}/5`,
            f.tone_rating ? `Ton=${f.tone_rating}` : '',
            f.accuracy_rating ? `Doğruluk=${f.accuracy_rating}` : '',
            f.objection_handling ? `İtiraz=${f.objection_handling}` : '',
            f.free_comment ? `Yorum: "${f.free_comment}"` : '',
            f.suggested_response ? `Öneri: "${f.suggested_response}"` : '',
            f.transcript_highlight ? `İlgili kısım: "${f.transcript_highlight}"` : '',
            f.tags?.length ? `Etiketler: ${f.tags.join(', ')}` : '',
        ].filter(Boolean).join(' | ')
        return parts
    }).join('\n')

    const geminiPrompt = `Sen bir AI satış asistanı prompt mühendisisin. 

MEVCUT PROMPT:
"""
${currentPrompt}
"""

SON ${feedbacks.length} GERİ BİLDİRİM:
${feedbackSummary}

GÖREV:
1. Geri bildirimlerdeki ortak pattern'leri analiz et (hangi konularda sorun var?)
2. Mevcut prompt'u bu geri bildirimlere göre iyileştir
3. Yanıtını şu formatta ver:

## ANALİZ
(Geri bildirimlerdeki ortak sorunlar ve pattern'ler — Türkçe)

## İYİLEŞTİRİLMİŞ PROMPT
(Mevcut prompt'un tamamının güncellenmiş versiyonu — sadece gerekli kısımları değiştir, gereksiz değişiklik yapma)

ÖNEMLİ: İyileştirilmiş prompt TÜRKÇE olmalı ve mevcut yapıyı korumalı.`

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(geminiPrompt)
        const text = result.response.text()

        // Parse analysis and suggestion
        const analysisMatch = text.match(/## ANALİZ\n([\s\S]*?)(?=## İYİLEŞTİRİLMİŞ PROMPT)/i)
        const promptMatch = text.match(/## İYİLEŞTİRİLMİŞ PROMPT\n([\s\S]*)/i)

        return {
            analysis: analysisMatch?.[1]?.trim() || 'Analiz oluşturulamadı',
            suggestion: promptMatch?.[1]?.trim() || currentPrompt,
        }
    } catch (e: any) {
        return { error: `Gemini hatası: ${e.message}` }
    }
}


// ─── 6. Create Prompt Version ────────────────────────────────

export async function createPromptVersion(input: PromptVersionInput): Promise<{ success: boolean; error?: string }> {
    await checkRole(['admin', 'owner'])

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum gerekli' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const adminDb = createAdminClient()

    // Get next version number
    const { data: latest } = await adminDb
        .from('ai_prompt_versions')
        .select('version')
        .eq('tenant_id', profile.tenant_id)
        .eq('prompt_type', input.prompt_type)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

    const nextVersion = (latest?.version || 0) + 1

    const { error } = await adminDb
        .from('ai_prompt_versions')
        .insert({
            tenant_id: profile.tenant_id,
            version: nextVersion,
            prompt_type: input.prompt_type,
            prompt_content: input.prompt_content,
            change_summary: input.change_summary,
            feedback_ids: input.feedback_ids || [],
            created_by: user.id,
            is_active: false,
        })

    if (error) return { success: false, error: error.message }
    return { success: true }
}


// ─── 7. Apply Prompt Version ─────────────────────────────────

export async function applyPromptVersion(versionId: string): Promise<{ success: boolean; error?: string }> {
    await checkRole(['admin', 'owner'])

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum gerekli' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    const adminDb = createAdminClient()

    // Get the version to activate
    const { data: version } = await adminDb
        .from('ai_prompt_versions')
        .select('*')
        .eq('id', versionId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!version) return { success: false, error: 'Versiyon bulunamadı' }

    // Deactivate all versions of this type
    await adminDb
        .from('ai_prompt_versions')
        .update({ is_active: false })
        .eq('tenant_id', profile.tenant_id)
        .eq('prompt_type', version.prompt_type)

    // Activate this version
    const { error } = await adminDb
        .from('ai_prompt_versions')
        .update({ is_active: true })
        .eq('id', versionId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}
