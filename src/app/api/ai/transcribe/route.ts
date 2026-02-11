import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: NextRequest) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY environment variable is missing')
            return NextResponse.json({ error: 'OpenAI API Key is missing. Please add it to your .env.local file.' }, { status: 500 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as Blob

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // 1. Transcribe Audio (Whisper)
        // Convert Blob to OpenAI compatible file object
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileObj = await toFile(buffer, 'recording.webm', { type: file.type })

        const transcription = await openai.audio.transcriptions.create({
            file: fileObj,
            model: 'whisper-1',
            language: 'tr', // Hint for Turkish
            prompt: 'Gayrimenkul satış notları, müşteri görüşmesi, randevu, kapora, tapu, proje.', // Context hint
        })

        const text = transcription.text

        // 2. Structured Extraction (GPT-4o-mini)
        // We ask GPT to parse this text into structured data for our CRM
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Sen bir Gayrimenkul CRM asistanısın. Görevin, satış temsilcisinin aldığı sesli notu analiz ederek yapılandırılmış veri çıkarmaktır.
                    
                    Çıktı Formatı (JSON):
                    {
                        "summary": "5 kelimeyi geçmeyen kısa ve vurucu bir başlık (Örn: Ahmet Bey ile Proje Sunumu)",
                        "description": "Notun tamamının düzeltilmiş ve profesyonel hali.",
                        "type": "Aktivite Tipi (Call, Meeting, Site Visit, Email, Whatsapp, Other)",
                        "outcome": "Görüşme Sonucu (Success, Reached Interested, Reached Not Interested, No Answer, Busy, Follow Up Required)",
                        "next_action": "Varsa bir sonraki aksiyon (yoksa null)",
                        "topic": "Konu Başlığı (General, Sales, Negotiation, Contract, Support)"
                    }
                    
                    Kurallar:
                    - Eğer notta 'aradım açmadı' deniyorsa outcome: 'No Answer' olmalı.
                    - Eğer 'randevu verdik' deniyorsa type: 'Meeting' veya 'Site Visit' olmalı.
                    - Eğer 'ilgilenmiyor' deniyorsa outcome: 'Reached Not Interested' olmalı.
                    - Türkçe karakter ve imla kurallarına dikkat et.
                    `
                },
                {
                    role: 'user',
                    content: text
                }
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
        // Ensure error message is string
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage || 'Processing failed' }, { status: 500 })
    }
}
