import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user and tenant_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant found' }, { status: 404 })

        // Get AI keys from tenant settings
        const { data: tenant } = await supabase
            .from('tenants')
            .select('openai_api_key, gemini_api_key, is_openai_enabled, is_gemini_enabled')
            .eq('id', profile.tenant_id)
            .single()

        const finalOpenAIKey = tenant?.openai_api_key || process.env.OPENAI_API_KEY
        const finalGeminiKey = tenant?.gemini_api_key || process.env.GEMINI_API_KEY

        const isOpenAIEnabled = tenant?.is_openai_enabled ?? true
        const isGeminiEnabled = tenant?.is_gemini_enabled ?? true

        const formData = await req.formData()
        const file = formData.get('file') as Blob

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // --- Provider Logic: Priority to Gemini if Enabled and Key Exists ---
        if (finalGeminiKey && isGeminiEnabled) {
            try {
                const genAI = new GoogleGenerativeAI(finalGeminiKey)
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const buffer = Buffer.from(await file.arrayBuffer());
                const base64Audio = buffer.toString('base64');

                const prompt = `Sen bir Gayrimenkul CRM asistanısın. Bu sesli notu dinle ve şu JSON formatında yapılandırılmış veri çıkar:
                {
                    "summary": "5 kelimeyi geçmeyen kısa ve vurucu bir başlık (Örn: Ahmet Bey ile Proje Sunumu)",
                    "description": "Notun tamamının düzeltilmiş ve profesyonel hali.",
                    "type": "Call, Meeting, Site Visit, Email, Whatsapp, Other",
                    "outcome": "Success, Reached Interested, Reached Not Interested, No Answer, Busy, Follow Up Required",
                    "next_action": "Varsa bir sonraki aksiyon (yoksa null)",
                    "topic": "General, Sales, Negotiation, Contract, Support"
                }
                
                Kurallar:
                - Eğer notta 'aradım açmadı' deniyorsa outcome: 'No Answer' olmalı.
                - Eğer 'randevu verdik' deniyorsa type: 'Meeting' veya 'Site Visit' olmalı.
                - Eğer 'ilgilenmiyor' deniyorsa outcome: 'Reached Not Interested' olmalı.
                - Sadece geçerli bir JSON döndür.`;

                const result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: file.type || "audio/webm"
                        }
                    }
                ]);

                const responseText = result.response.text();
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                const structure = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

                return NextResponse.json({
                    text: structure.description || "Ses analiz edildi.",
                    structured: structure
                });
            } catch (geminiError) {
                console.error('Gemini Processing Error:', geminiError);
                // Fallback to OpenAI if Gemini fails and OpenAI key exists
                if (!finalOpenAIKey) {
                    throw geminiError;
                }
            }
        }

        // --- Fallback/Direct Provider: OpenAI ---
        if (!finalOpenAIKey || !isOpenAIEnabled) {
            console.error('AI API Keys are missing or disabled')
            return NextResponse.json({
                error: !isOpenAIEnabled
                    ? 'OpenAI is disabled in settings.'
                    : 'AI API Key is missing. Please add it to your settings.'
            }, { status: 500 })
        }

        const openai = new OpenAI({ apiKey: finalOpenAIKey })

        // 1. Transcribe Audio (Whisper)
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileObj = await toFile(buffer, 'recording.webm', { type: file.type })

        const transcription = await openai.audio.transcriptions.create({
            file: fileObj,
            model: 'whisper-1',
            language: 'tr',
            prompt: 'Gayrimenkul satış notları, müşteri görüşmesi, randevu, kapora, tapu, proje.',
        })

        const text = transcription.text

        // 2. Structured Extraction (GPT-4o-mini)
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Sen bir Gayrimenkul CRM asistanısın. Görevin, satış temsilcisinin aldığı sesli notu analiz ederek yapılandırılmış veri çıkarmaktır.
                    
                    Çıktı Formatı (JSON):
                    {
                        "summary": "5 kelimeyi geçmeyen kısa ve vurucu bir başlık",
                        "description": "Notun tamamının düzeltilmiş ve profesyonel hali.",
                        "type": "Aktivite Tipi (Call, Meeting, Site Visit, Email, Whatsapp, Other)",
                        "outcome": "Görüşme Sonucu (Success, Reached Interested, Reached Not Interested, No Answer, Busy, Follow Up Required)",
                        "next_action": "Varsa bir sonraki aksiyon (yoksa null)",
                        "topic": "Konu Başlığı (General, Sales, Negotiation, Contract, Support)"
                    }`
                },
                { role: 'user', content: text }
            ],
            response_format: { type: 'json_object' }
        })

        let structure = {}
        try {
            structure = JSON.parse(completion.choices[0].message.content || '{}')
        } catch (e) {
            console.error('Failed to parse GPT response:', e)
        }

        return NextResponse.json({
            text,
            structured: structure
        })

    } catch (error: any) {
        console.error('AI Processing Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage || 'Processing failed' }, { status: 500 })
    }
}
