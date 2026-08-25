import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from '@/lib/supabase/server'

/**
 * NetGSM Call Recording Transcription API
 * 
 * Downloads a call recording from NetGSM and transcribes it using AI.
 * Supports both Gemini (priority) and OpenAI Whisper (fallback).
 * 
 * POST /api/netgsm-transcribe
 * Body: { recordingUrl: "https://dosyaindir.netgsm.com.tr/upload.php?tip=1&a=..." }
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Allow up to 2 minutes for large files

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
        }

        if (!['admin', 'owner', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
        }

        // Get AI keys from tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('openai_api_key, gemini_api_key, is_openai_enabled, is_gemini_enabled')
            .eq('id', profile.tenant_id)
            .single()

        const finalOpenAIKey = tenant?.openai_api_key || process.env.OPENAI_API_KEY
        const finalGeminiKey = tenant?.gemini_api_key || process.env.GEMINI_API_KEY
        const isOpenAIEnabled = tenant?.is_openai_enabled ?? true
        const isGeminiEnabled = tenant?.is_gemini_enabled ?? true

        const body = await req.json()
        const { recordingUrl } = body

        if (!recordingUrl) {
            return NextResponse.json({ error: 'recordingUrl gerekli' }, { status: 400 })
        }

        // Validate URL is from NetGSM domain
        try {
            const url = new URL(recordingUrl)
            if (!url.hostname.includes('netgsm.com.tr')) {
                return NextResponse.json({ error: 'Geçersiz kayıt URL\'si' }, { status: 400 })
            }
        } catch {
            return NextResponse.json({ error: 'Geçersiz URL formatı' }, { status: 400 })
        }

        // Download the recording from NetGSM
        console.log('[netgsm-transcribe] Downloading recording from:', recordingUrl)
        const audioResponse = await fetch(recordingUrl)
        if (!audioResponse.ok) {
            return NextResponse.json(
                { error: `Ses kaydı indirilemedi (HTTP ${audioResponse.status})` },
                { status: 502 }
            )
        }

        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
        const contentType = audioResponse.headers.get('content-type') || 'audio/wav'

        if (audioBuffer.length < 100) {
            return NextResponse.json(
                { error: 'Ses kaydı dosyası çok küçük veya boş' },
                { status: 400 }
            )
        }

        console.log('[netgsm-transcribe] Audio size:', audioBuffer.length, 'bytes, type:', contentType)

        // --- Provider Logic: Priority to Gemini ---
        if (finalGeminiKey && isGeminiEnabled) {
            try {
                const genAI = new GoogleGenerativeAI(finalGeminiKey)
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

                const base64Audio = audioBuffer.toString('base64')

                const prompt = `Bu bir müşteri ile temsilci arasındaki telefon görüşmesinin ses kaydıdır.
                
Görevin:
1. Ses kaydını dinle ve tam transkript oluştur
2. Konuşmayı analiz et

MUTLAKA şu JSON formatında cevap ver:
{
    "transcript": "Konuşmanın tam transkripsiyonu. Kişileri [Temsilci] ve [Müşteri] olarak etiketle.",
    "summary": "Görüşmenin 2-3 cümlelik kısa özeti",
    "duration_estimate": "Tahmini görüşme süresi (ör: '3 dakika 20 saniye')",
    "sentiment": "positive, neutral veya negative",
    "key_points": ["Önemli noktaların listesi"]
}

Kurallar:
- Sadece geçerli bir JSON objesi döndür
- Ses kaydı boşsa veya anlaşılamıyorsa transcript alanını "Ses kaydı anlaşılamadı" yap
- Konuşma dilini otomatik tespit et (Türkçe varsayılan)`

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: contentType.includes('wav') ? 'audio/wav' : 
                                      contentType.includes('mp3') ? 'audio/mpeg' :
                                      contentType.includes('ogg') ? 'audio/ogg' : 'audio/wav'
                        }
                    }
                ])

                const responseText = result.response.text()
                const jsonMatch = responseText.match(/\{[\s\S]*\}/)
                const structure = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

                return NextResponse.json({
                    transcript: structure.transcript || 'Transkript oluşturulamadı',
                    summary: structure.summary || '',
                    sentiment: structure.sentiment || 'neutral',
                    keyPoints: structure.key_points || [],
                    provider: 'gemini'
                })

            } catch (geminiError) {
                console.error('[netgsm-transcribe] Gemini error:', geminiError)
                if (!finalOpenAIKey || !isOpenAIEnabled) {
                    throw geminiError
                }
            }
        }

        // --- Fallback: OpenAI Whisper ---
        if (!finalOpenAIKey || !isOpenAIEnabled) {
            return NextResponse.json(
                { error: 'AI servisi yapılandırılmamış. Ayarlar > AI bölümünden API key ekleyin.' },
                { status: 400 }
            )
        }

        const openai = new OpenAI({ apiKey: finalOpenAIKey })

        // Determine file extension from content type
        const ext = contentType.includes('mp3') ? 'mp3' : 
                    contentType.includes('ogg') ? 'ogg' : 'wav'

        const fileObj = await toFile(audioBuffer, `recording.${ext}`, { type: contentType })

        const transcription = await openai.audio.transcriptions.create({
            file: fileObj,
            model: 'whisper-1',
            language: 'tr',
            prompt: 'Gayrimenkul satış görüşmesi, müşteri arama, telefon, randevu, proje, daire, fiyat.',
        })

        const text = transcription.text

        // Optional: Use GPT to analyze the transcript
        let summary = ''
        let sentiment = 'neutral'
        let keyPoints: string[] = []

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Telefon görüşmesi transkripsiyonunu analiz et ve JSON formatında yanıt ver:
{
    "summary": "2-3 cümlelik kısa özet",
    "sentiment": "positive, neutral veya negative",
    "key_points": ["Önemli noktalar listesi"]
}`
                    },
                    { role: 'user', content: text }
                ],
                response_format: { type: 'json_object' }
            })

            const analysis = JSON.parse(completion.choices[0].message.content || '{}')
            summary = analysis.summary || ''
            sentiment = analysis.sentiment || 'neutral'
            keyPoints = analysis.key_points || []
        } catch (analysisErr) {
            console.error('[netgsm-transcribe] Analysis error:', analysisErr)
        }

        return NextResponse.json({
            transcript: text,
            summary,
            sentiment,
            keyPoints,
            provider: 'openai'
        })

    } catch (error: any) {
        console.error('[netgsm-transcribe] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Transkript oluşturulurken hata oluştu' },
            { status: 500 }
        )
    }
}
