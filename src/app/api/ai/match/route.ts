import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { customerId } = await req.json()
        if (!customerId) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })

        // 1. Fetch Customer and Demands
        const { data: customer } = await supabase
            .from('customers')
            .select('*, customer_demands(*)')
            .eq('id', customerId)
            .single()

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 1404 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        // 2. Fetch Available Units
        // Fetch project IDs first for reliable unit filtering
        const { data: tenantProjects } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', profile?.tenant_id)
            .eq('status', 'Active')

        const projectIds = tenantProjects?.map(p => p.id) || []

        const { data: availableUnits } = await supabase
            .from('units')
            .select(`
                *,
                project: projects(name)
            `)
            .eq('status', 'For Sale')
            .eq('is_legacy', false)
            .in('project_id', projectIds)
            .limit(20) // Limit to top 20 for AI to process

        // 3. AI Insights/Matching with Gemini
        const { data: tenant } = await supabase
            .from('tenants')
            .select('gemini_api_key, is_gemini_enabled')
            .eq('id', profile?.tenant_id)
            .single()

        const apiKey = tenant?.gemini_api_key || process.env.GEMINI_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'AI key missing' }, { status: 503 })

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `Sen bir Gayrimenkul Yatırım uzmanısın. Aşağıdaki müşteri talepleri ile elimizdeki boş daireleri karşılaştır.
        Müşteri için en uygun 3 daireyi seç ve nedenlerini açıkla.
        
        Müşteri: ${customer.full_name}
        Talepler: ${JSON.stringify(customer.customer_demands)}
        
        Boş Daireler: ${JSON.stringify(availableUnits)}
        
        Cevabını şu JSON formatında ver:
        {
            "match_score": 0-100 arası genel uyum puanı,
            "recommendations": [
                {
                    "unit_id": "daire id",
                    "project_name": "proje adı",
                    "unit_number": "no",
                    "reason": "Neden bu daire? (Kısa ve ikna edici)",
                    "score": 0-100 uyum puanı
                }
            ],
            "sales_pitch": "Satış danışmanına bu müşteri için 1 cümlelik tüyo"
        }
        
        Kurallar:
        - Sadece JSON döndür.
        - Eğer talep yoksa, genel bütçeye veya popüler dairelere göre öneri yap.`;

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        const matches = jsonMatch ? JSON.parse(jsonMatch[0]) : { recommendations: [] }

        return NextResponse.json(matches)

    } catch (error: any) {
        console.error('Matching Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
