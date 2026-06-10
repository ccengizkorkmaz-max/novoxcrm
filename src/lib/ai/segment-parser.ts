'use server'

/**
 * AI Segment Parser
 * 
 * Serbest metin → Yapılandırılmış segment filtresi dönüşümü.
 * Gemini API kullanarak doğal dil ifadelerini JSON filtreye çevirir.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SYSTEM_PROMPT = `Sen bir gayrimenkul CRM sisteminin segment asistanısın. Kullanıcının serbest metin olarak yazdığı müşteri segmentasyon kriterlerini yapılandırılmış JSON filtresine çevirmelisin.

Kullanılabilir filtre alanları:

{
  "source": "sales" | "lead_qualifications",        // Varsayılan: "sales"
  "statuses": ["Lead", "Prospect", "Potential", "Lost", "Customer", "Contacted"],
  "project_id": "proje_uuid",                        // Proje adı verilirse project_name olarak gönder
  "project_name": "proje adı",                       // Proje adı string olarak
  "assigned_to_name": "temsilci adı",                 // Temsilci adı string olarak
  "unassigned": true/false,                           // Atanmamış lead'ler
  "date_from": "YYYY-MM-DD",                         // Kayıt başlangıç
  "date_to": "YYYY-MM-DD",                           // Kayıt bitiş
  "days_inactive": sayı,                              // Hareketsizlik süresi (gün)
  "tags": ["etiket1", "etiket2"],                     // Müşteri etiketleri
  "city": "şehir",                                    // Müşteri şehri
  "profile_data": {                                   // Profil filtreleri
    "occupation": "meslek",
    "education": "eğitim düzeyi",
    "income_segment": "A+|A|B+|B|C",
    "age_range": "18-25|25-35|35-45|45-55|55-65|65+",
    "marital_status": "married|single|divorced",
    "vehicle_info": "araç markası veya modeli (BMW, Mercedes, Audi vb.)",
    "children_count": sayı,
    "hobbies": "hobi anahtar kelimesi",
    "team": "tuttuğu takım (Fenerbahçe, Galatasaray vb.)",
    "notes_ai": "AI notu içinde geçen anahtar kelime"
  },
  "demand_filters": {                                 // Talep filtreleri
    "room_count": ["1+1", "2+1", "3+1", "4+1", "Villa"],
    "min_price": sayı,
    "max_price": sayı,
    "property_type": "Apartment|Villa|Office|Shop|Commercial|Land",
    "investment_purpose": "Living|Investment|Holiday"
  },
  "segment_name": "önerilen segment adı",             // Segment için önerilen ad
  "segment_description": "kısa açıklama"              // Segment için kısa açıklama
}

Mevcut tag seçenekleri: Premium, Orta-Üst, Orta, Ekonomik, Yatırımcı, Oturum, Tatil, Çocuk İçin, Aile, Bekar, Çift, Nakit, Kredi, Taksit, Takas, Doktor, Avukat, Mühendis, İşadamı, Memur, Emekli, Serbest Meslek, SUV, Lüks Sedan, Ekonomik Araç, Araç Yok

KURALLAR:
1. Bugünün tarihi: {{TODAY}}
2. "Son X gün" ifadesini date_from olarak hesapla
3. "Yeni lead" = statuses: ["Lead"]
4. "Soğuyan" / "takip edilmeyen" = days_inactive kullan
5. "Premium" / "Yatırımcı" gibi sınıflandırmalar = tags kullan
6. Şehir adı geçiyorsa city kullan
7. Bütçe geçiyorsa demand_filters.min_price / max_price kullan
8. Oda tipi geçiyorsa demand_filters.room_count kullan
9. Emin olmadığın alanları EKLEME
10. Sadece JSON döndür, başka metin ekleme
11. Segment adı ve açıklama ÖNERMEYİ UNUTMA
12. Araç markası/modeli geçiyorsa profile_data.vehicle_info kullan (örn: "BMW", "Mercedes")
13. "Evli" = profile_data.marital_status: "married", "Bekar" = "single"
14. "Çocuklu" = profile_data.children_count: 1 (en az 1 çocuk demek)
15. Meslek geçiyorsa hem profile_data.occupation hem de uygun tag kullan`

export interface ParsedSegmentFilters {
    source?: string
    statuses?: string[]
    project_id?: string
    project_name?: string
    assigned_to_name?: string
    unassigned?: boolean
    date_from?: string
    date_to?: string
    days_inactive?: number
    tags?: string[]
    city?: string
    profile_data?: Record<string, any>
    demand_filters?: Record<string, any>
    segment_name?: string
    segment_description?: string
}

export async function aiParseSegmentFilters(
    userPrompt: string,
    projectNames?: string[],
    profileNames?: string[]
): Promise<{ filters?: ParsedSegmentFilters; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açın' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const adminDb = createAdminClient()
    const { data: tenant } = await adminDb
        .from('tenants')
        .select('gemini_api_key, gemini_model')
        .eq('id', profile?.tenant_id)
        .single()

    const apiKey = tenant?.gemini_api_key || process.env.GEMINI_API_KEY
    if (!apiKey) return { error: 'Gemini API key bulunamadı. Ayarlar > AI bölümünden ekleyin.' }

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: tenant?.gemini_model || 'gemini-2.5-flash' })

        const today = new Date().toISOString().split('T')[0]
        const systemPrompt = SYSTEM_PROMPT.replace('{{TODAY}}', today)

        // Add context about available projects/profiles
        let context = ''
        if (projectNames?.length) {
            context += `\nMevcut projeler: ${projectNames.join(', ')}`
        }
        if (profileNames?.length) {
            context += `\nMevcut temsilciler: ${profileNames.join(', ')}`
        }

        const fullPrompt = `${systemPrompt}${context}\n\nKullanıcı İsteği: ${userPrompt}`

        const result = await model.generateContent(fullPrompt)
        const responseText = result.response.text()

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) return { error: 'AI yanıtı parse edilemedi. Lütfen daha açık bir ifade deneyin.' }

        const parsed: ParsedSegmentFilters = JSON.parse(jsonMatch[0])

        // Validate and clean the parsed filters
        const cleaned = validateFilters(parsed)

        return { filters: cleaned }
    } catch (err: any) {
        console.error('[AI Segment Parser] Error:', err.message)
        return { error: 'AI analiz hatası. Tekrar deneyin.' }
    }
}

function validateFilters(filters: ParsedSegmentFilters): ParsedSegmentFilters {
    const valid: ParsedSegmentFilters = {}

    // Source
    if (filters.source && ['sales', 'lead_qualifications'].includes(filters.source)) {
        valid.source = filters.source
    }

    // Statuses
    const allStatuses = ['Lead', 'Prospect', 'Potential', 'Lost', 'Customer', 'Contacted', 'new', 'follow_up', 'unreachable', 'qualified', 'disqualified']
    if (Array.isArray(filters.statuses)) {
        valid.statuses = filters.statuses.filter(s => allStatuses.includes(s))
    }

    // Project
    if (filters.project_name) valid.project_name = filters.project_name
    if (filters.project_id) valid.project_id = filters.project_id

    // Assignment
    if (filters.unassigned === true) valid.unassigned = true
    if (filters.assigned_to_name) valid.assigned_to_name = filters.assigned_to_name

    // Dates
    if (filters.date_from && /^\d{4}-\d{2}-\d{2}$/.test(filters.date_from)) valid.date_from = filters.date_from
    if (filters.date_to && /^\d{4}-\d{2}-\d{2}$/.test(filters.date_to)) valid.date_to = filters.date_to

    // Inactivity
    if (typeof filters.days_inactive === 'number' && filters.days_inactive > 0) valid.days_inactive = filters.days_inactive

    // Tags
    if (Array.isArray(filters.tags) && filters.tags.length > 0) valid.tags = filters.tags

    // City
    if (filters.city && typeof filters.city === 'string') valid.city = filters.city

    // Profile data
    if (filters.profile_data && typeof filters.profile_data === 'object') {
        const pd: Record<string, any> = {}
        if (filters.profile_data.occupation) pd.occupation = filters.profile_data.occupation
        if (filters.profile_data.education) pd.education = filters.profile_data.education
        if (filters.profile_data.income_segment) pd.income_segment = filters.profile_data.income_segment
        if (filters.profile_data.age_range) pd.age_range = filters.profile_data.age_range
        if (filters.profile_data.marital_status) pd.marital_status = filters.profile_data.marital_status
        if (filters.profile_data.vehicle_info) pd.vehicle_info = filters.profile_data.vehicle_info
        if (typeof filters.profile_data.children_count === 'number') pd.children_count = filters.profile_data.children_count
        if (filters.profile_data.hobbies) pd.hobbies = filters.profile_data.hobbies
        if (filters.profile_data.team) pd.team = filters.profile_data.team
        if (filters.profile_data.notes_ai) pd.notes_ai = filters.profile_data.notes_ai
        if (Object.keys(pd).length > 0) valid.profile_data = pd
    }

    // Demand filters
    if (filters.demand_filters && typeof filters.demand_filters === 'object') {
        const df: Record<string, any> = {}
        if (Array.isArray(filters.demand_filters.room_count)) df.room_count = filters.demand_filters.room_count
        if (typeof filters.demand_filters.min_price === 'number') df.min_price = filters.demand_filters.min_price
        if (typeof filters.demand_filters.max_price === 'number') df.max_price = filters.demand_filters.max_price
        if (filters.demand_filters.property_type) df.property_type = filters.demand_filters.property_type
        if (filters.demand_filters.investment_purpose) df.investment_purpose = filters.demand_filters.investment_purpose
        if (Object.keys(df).length > 0) valid.demand_filters = df
    }

    // Segment name/description
    if (filters.segment_name) valid.segment_name = filters.segment_name
    if (filters.segment_description) valid.segment_description = filters.segment_description

    return valid
}
