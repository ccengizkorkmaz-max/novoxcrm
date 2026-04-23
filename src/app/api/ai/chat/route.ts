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
            .select('id, name, city, tenant_id')
            .eq('status', 'Active')

        // 3. Determine Tenant ID to fetch custom AI settings
        // If we have a project, use its tenant_id. Otherwise use from the first project we found.
        const tenantId = project?.tenant_id || allProjects?.[0]?.tenant_id

        let assistantSettings = {
            name: 'Novo AI',
            personality: 'Kurumsal, kibar ve çözüm odaklı',
            instructions: '',
            gender: 'female'
        }

        if (tenantId) {
            const { data: tenant } = await adminSupabase
                .from('tenants')
                .select('ai_assistant_name, ai_assistant_personality, ai_assistant_instructions, ai_assistant_gender')
                .eq('id', tenantId)
                .maybeSingle()

            if (tenant) {
                assistantSettings = {
                    name: tenant.ai_assistant_name || assistantSettings.name,
                    personality: tenant.ai_assistant_personality || assistantSettings.personality,
                    instructions: tenant.ai_assistant_instructions || assistantSettings.instructions,
                    gender: tenant.ai_assistant_gender || assistantSettings.gender
                }
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Sen Novo CRM için çalışan profesyonel bir Kurumsal Gayrimenkul Satış Asistanısın. 
            İsmin ${assistantSettings.name}. Karakterin ve üslubun: ${assistantSettings.personality}.
            
            Görevin, müşterilere portföyümüzdeki tüm konut projeleri hakkında bilgi vermek.
            ${assistantSettings.instructions ? `Önemli Özel Talimatlar: ${assistantSettings.instructions}` : ''}

            Şu an aktif olan tüm projelerimiz: ${JSON.stringify(allProjects || [])}.

            Özel Durum:
            ${project ? `Şu an özellikle "${project.name}" projesi sayfasındasın. Ama diğer projeler hakkında da bilgi verebilirsin.` : `Şu an genel portföy asistanısın ve tüm projeler hakkında bilgi vermeye hazırsın.`}
            
            Görevin:
            1. Müşterinin proje tercihlerine (şehir, oda sayısı, fiyat vb.) göre portföyümüzden en uygun projeyi önermek.
            2. Projelerin lokasyonları, avantajları ve genel özellikleri hakkında bilgi vermek.
            3. Müşteri ciddi bir ilgi gösterdiğinde (fiyat listesi istemek, randevu talep etmek vb.) telefon numarasını alarak [LEAD_CAPTURE_EVENT] tetikle.
            
            Mevcut Odaklandığın Proje Detayı (Eğer Varsa):
            - Proje Adı: ${project?.name || 'Tüm Portföy'}
            - Şehir: ${project?.city || 'Global'}
            - Birim Özeti: ${JSON.stringify(project?.unitSummary || {})}
            
            Kurallar:
            - Müşterinin ismini öğrenmek senin için en az telefon numarası kadar önemlidir. Telefonu alırken mutlaka ismini de nazikçe sormayı UNUTMA.
            - VERİ DOĞRULAMA: Sadece gerçekçi görünen isim ve telefon numaralarını kabul et. 
                * Saçma sapan harf yığınlarını (asdasd, qwer, aaaaa vb.), tek karakterli isimleri veya sadece "test" yazanları kabul etme.
                * Geçersiz veya uydurma telefon numaralarını (0000, 1234567, 8888 vb.) reddet.
                * Eğer bilgi geçersizse, nazikçe "Size ulaşabilmemiz için lütfen geçerli bir telefon ve isim paylaşır mısınız?" diye uyar ve bilgiyi tekrar iste.
            - [LEAD_CAPTURE_EVENT] tetikleyicisini SADECE bilgiler geçerli ve mantıklıysa ekle.
            - Cevapların profesyonel, sonuç odaklı ve nazik olsun.
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

        // Check if lead captured and extract data
        const hasLeadCaptureStatus = responseText.includes('[LEAD_CAPTURE_EVENT]')
        let cleanReply = responseText.replace('[LEAD_CAPTURE_EVENT]', '').trim()
        let extractedLeadData = null

        if (hasLeadCaptureStatus) {
            // Internal sub-request to extract details from the WHOLE context
            try {
                const extractionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
                const fullContext = history.map((h: any) => `${h.role}: ${h.content}`).join('\n') + `\nuser: ${message}`

                const extractionResult = await extractionModel.generateContent(`
                    Aşağıdaki konuşma geçmişinden müşterinin ismini, telefon numarasını ve ilgilendiği projenin ID'sini ayıkla. 
                    Mevcut Projeler Listesi (ID ve İsim): ${JSON.stringify(allProjects?.map(p => ({ id: p.id, name: p.name })))}
                    Sadece JSON döndür. Örnek: {"name": "Ahmet Yılmaz", "phone": "05321234567", "projectId": "uuid-buraya"}
                    Eğer projeyi bulamazsan projectId alanını boş bırak.
                    Konuşma Geçmişi:
                    ${fullContext}
                `)
                const jsonText = extractionResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
                extractedLeadData = JSON.parse(jsonText)
            } catch (e) {
                console.error("Lead extraction failed:", e)
            }
        }

        return NextResponse.json({
            reply: cleanReply,
            leadCaptured: hasLeadCaptureStatus,
            leadData: extractedLeadData
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
