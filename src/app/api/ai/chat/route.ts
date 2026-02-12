import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
    try {
        const { message, project, history } = await req.json()

        // 1. Get API Key
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'AI Key missing' }, { status: 500 })
        }

        // 2. Fetch all active projects for global context using Admin client
        const adminSupabase = createAdminClient()
        const { data: allProjects } = await adminSupabase
            .from('projects')
            .select('name, city')
            .eq('status', 'Active')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `Sen Novox CRM için çalışan profesyonel bir Kurumsal Gayrimenkul Satış Asistanısın. 
            İsmin Novox AI. Görevin, müşterilere portföyümüzdeki tüm konut projeleri hakkında bilgi vermek.

            Şu an aktif olan tüm projelerimiz: ${JSON.stringify(allProjects || [])}.

            Özel Durum:
            ${project ? `Şu an özellikle "${project.name}" projesi sayfasındasın. Ama diğer projeler hakkında da bilgi verebilirsin.` : 'Şu an genel portföy asistanısın ve tüm projeler hakkında bilgi vermeye hazırsın.'}
            
            Görevin:
            1. Müşterinin proje tercihlerine (şehir, oda sayısı, fiyat vb.) göre portföyümüzden en uygun projeyi önermek.
            2. Projelerin lokasyonları, avantajları ve genel özellikleri hakkında bilgi vermek.
            3. Müşteri ciddi bir ilgi gösterdiğinde (fiyat listesi istemek, randevu talep etmek vb.) telefon numarasını alarak [LEAD_CAPTURE_EVENT] tetikle.
            
            Mevcut Odaklandığın Proje Detayı (Eğer Varsa):
            - Proje Adı: ${project?.name || 'Tüm Portföy'}
            - Şehir: ${project?.city || 'Global'}
            - Birim Özeti: ${JSON.stringify(project?.unitSummary || {})}
            
            Kurallar:
            - Cevapların profesyonel, sonuç odaklı ve nazik olsun.
            - Olmayan projeyi uydurma.
            - Kısa ve öz cevaplar ver.`
        })

        // Format history for Gemini
        // IMPORTANT: Gemini history MUST start with 'user' role.
        // If our first message is 'assistant' (the welcome message), we skip it.
        const chatHistory = history
            .map((h: any) => ({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }]
            }))
            .filter((msg: any, index: number, array: any[]) => {
                // Find the first 'user' message index
                const firstUserIndex = array.findIndex(m => m.role === 'user');
                return index >= firstUserIndex && firstUserIndex !== -1;
            })

        const chat = model.startChat({
            history: chatHistory,
        })

        const result = await chat.sendMessage(message)
        const responseText = result.response.text()

        // Check if lead captured
        const hasLeadCaptureStatus = responseText.includes('[LEAD_CAPTURE_EVENT]')
        const cleanReply = responseText.replace('[LEAD_CAPTURE_EVENT]', '').trim()

        // If lead captured, we could trigger a background process or flag it to the client
        // In a real implementation, we would extract the number/name here using another prompt 
        // or regex, but for now we'll just flag it.

        return NextResponse.json({
            reply: cleanReply,
            leadCaptured: hasLeadCaptureStatus
        })

    } catch (error: any) {
        console.error('AI Chat Route Error:', error)
        return NextResponse.json({
            error: 'AI yanıtı oluşturulamadı.',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
