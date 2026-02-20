import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

        // Fetch AI keys from tenant settings
        const { data: tenant } = await supabase
            .from('tenants')
            .select('gemini_api_key, is_gemini_enabled')
            .eq('id', profile.tenant_id)
            .single()

        const apiKey = tenant?.gemini_api_key || process.env.GEMINI_API_KEY
        const isEnabled = tenant?.is_gemini_enabled ?? true

        if (!apiKey || !isEnabled) {
            return NextResponse.json({ error: 'AI Insights disabled or key missing' }, { status: 503 })
        }

        // --- Data Gathering for AI Context ---

        // 1. Fetch Stale Leads (Customers with no activities in last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: staleLeads } = await supabase
            .from('customers')
            .select('id, full_name, created_at')
            .eq('tenant_id', profile.tenant_id)
            .lt('created_at', sevenDaysAgo.toISOString())
            .limit(5)

        // 2. Fetch Low Stock Projects
        const { data: projects } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'Active')

        const projectStock = await Promise.all((projects || []).map(async (p) => {
            const { count } = await supabase
                .from('units')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', p.id)
                .eq('status', 'For Sale')
            return { name: p.name, count: count || 0 }
        }))

        const lowStock = projectStock.filter(ps => ps.count > 0 && ps.count < 5)

        // 3. Upcoming High Priority Tasks
        const { data: tasks } = await supabase
            .from('activities')
            .select('summary, due_date')
            .eq('tenant_id', profile.tenant_id)
            .eq('assigned_to', user.id)
            .eq('status', 'Planned')
            .order('due_date', { ascending: true })
            .limit(3)

        // 4. Overdue Payments (Finance Module)
        const { data: overduePayments } = await supabase
            .from('payment_plans')
            .select('amount, currency, due_date, contracts(contract_number, projects(name))')
            .eq('status', 'Overdue')
            .limit(5)

        // 5. Contracts with Missing Documents (Audit Core Sales Process)
        // We look for contract_activities to see if documents were ever uploaded or use document table
        const { data: contractsWithDocs } = await supabase
            .from('contracts')
            .select('id, contract_number, contract_documents(id)')
            .eq('tenant_id', profile.tenant_id)
            .limit(10)

        const missingDocs = contractsWithDocs?.filter(c => !c.contract_documents || c.contract_documents.length === 0)
            .map(c => ({ number: c.contract_number })) || []

        // --- Gemini Prompting ---
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `Sen Novo CRM'in Akıllı Satış Asistanısın. Kullanıcının adı: ${profile.full_name}.
        Aşağıdaki verilere bakarak kullanıcıya bugün için 3 kritik tavsiye ver. Tavsiyeler kısa, motive edici ve aksiyon odaklı olsun.
        
        Veriler:
        - Bekleyen Kritik Görevler: ${JSON.stringify(tasks)}
        - Stoğu Azalan Projeler: ${JSON.stringify(lowStock)}
        - İlgilenilmeyen Müşteriler (7 gündür işlem yok): ${JSON.stringify(staleLeads)}
        - Geciken Ödemeler: ${JSON.stringify(overduePayments)}
        - Evrakları Eksik Sözleşmeler: ${JSON.stringify(missingDocs)}
        
        Cevabını şu JSON formatında ver:
        {
            "briefing": "Kısa bir 'Günaydın' mesajı",
            "actions": [
                {"title": "Eylem Başlığı", "description": "Detaylı açıklama", "type": "warning|info|success"}
            ]
        }
        
        Kurallar:
        - Sadece JSON döndür.
        - Tavsiyeler gerçekçi olsun.
        - Eğer veri yoksa genel ama akıllıca tavsiyeler ver.`;

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : { briefing: "Hazırlanıyor...", actions: [] }

        return NextResponse.json(insights)

    } catch (error: any) {
        console.error('AI Insights Error:', error)
        return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
    }
}
