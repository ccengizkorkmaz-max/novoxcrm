import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireLeadCreatedTrigger } from '@/lib/outreach/triggers'

/**
 * FACEBOOK LEAD ADS WEBHOOK
 * 
 * Facebook Lead Ads formlarından gelen lead'leri doğrudan CRM'e kaydeder.
 * Make.com'a gerek kalmadan Facebook → CRM direkt entegrasyon.
 * 
 * Kurulum:
 * 1. Meta Developer Console → App → Webhooks → Page → Subscribe to "leadgen"
 * 2. Callback URL: https://www.novoxcrm.com/api/webhooks/facebook-leads
 * 3. Verify Token: novox_fb_leads_2024
 * 4. Page Access Token: .env.local → FB_PAGE_ACCESS_TOKEN
 */

const VERIFY_TOKEN = process.env.FB_LEADS_VERIFY_TOKEN || 'novox_fb_leads_2024'
const NOVO_TENANT_ID = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'

// ─── Webhook Doğrulama (GET) ─────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Facebook Leads Webhook doğrulandı')
        return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse('Forbidden', { status: 403 })
}

// ─── Lead Verisi İşleme (POST) ───────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('[FB Leads] Webhook alındı:', JSON.stringify(body).substring(0, 200))

        // Facebook leadgen webhook'u "page" objesi gönderir
        if (body.object !== 'page') {
            return NextResponse.json({ status: 'not_page' })
        }

        const entries = body.entry || []
        let processedCount = 0

        for (const entry of entries) {
            const changes = entry.changes || []

            for (const change of changes) {
                if (change.field !== 'leadgen') continue

                const leadgenId = change.value?.leadgen_id
                const formId = change.value?.form_id
                const pageId = change.value?.page_id
                const adId = change.value?.ad_id

                if (!leadgenId) continue

                console.log(`[FB Leads] Yeni lead: ${leadgenId} (form: ${formId}, ad: ${adId})`)

                // Graph API ile lead detaylarını çek
                const leadData = await fetchLeadData(leadgenId, pageId)

                if (!leadData) {
                    console.error(`[FB Leads] Lead verisi alınamadı: ${leadgenId}`)
                    continue
                }

                // CRM'e kaydet
                const saved = await saveLeadToCRM(leadData, formId, adId, pageId)
                if (saved) processedCount++
            }
        }

        console.log(`[FB Leads] ${processedCount} lead işlendi`)
        return NextResponse.json({ status: 'ok', processed: processedCount })

    } catch (error: any) {
        console.error('[FB Leads] Webhook hatası:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// ─── Graph API: Lead Detaylarını Çek ─────────────────────────
async function fetchLeadData(leadgenId: string, pageId: string) {
    // Tenant'ın access token'ını al
    const supabase = createAdminClient()
    const { data: tenant } = await supabase
        .from('tenants')
        .select('wa_access_token, fb_page_id')
        .eq('id', NOVO_TENANT_ID)
        .single()

    const accessToken = tenant?.wa_access_token || process.env.FB_PAGE_ACCESS_TOKEN
    if (!accessToken) {
        console.error('[FB Leads] Access token bulunamadı!')
        return null
    }

    try {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`,
            { method: 'GET' }
        )

        if (!res.ok) {
            const err = await res.text()
            console.error(`[FB Leads] Graph API hatası (${res.status}):`, err)
            return null
        }

        const data = await res.json()
        console.log(`[FB Leads] Lead data:`, JSON.stringify(data).substring(0, 300))

        // Field data'yı parse et
        const fields: Record<string, string> = {}
        for (const fd of (data.field_data || [])) {
            fields[fd.name?.toLowerCase()] = fd.values?.[0] || ''
        }

        return {
            id: data.id,
            created_time: data.created_time,
            full_name: fields['full_name'] || fields['ad'] || fields['isim'] ||
                `${fields['first_name'] || ''} ${fields['last_name'] || ''}`.trim() || 'Facebook Lead',
            phone: fields['phone_number'] || fields['telefon'] || fields['phone'] || '',
            email: fields['email'] || fields['e-posta'] || '',
            city: fields['city'] || fields['şehir'] || fields['sehir'] || '',
            raw_fields: fields,
        }
    } catch (err: any) {
        console.error('[FB Leads] Fetch hatası:', err.message)
        return null
    }
}

// ─── CRM'e Lead Kaydet ───────────────────────────────────────
async function saveLeadToCRM(
    leadData: any, formId: string, adId: string, pageId: string
) {
    const supabase = createAdminClient()

    // Telefon normalize
    let phone = (leadData.phone || '').replace(/[\s\-\(\)]/g, '')
    if (phone.startsWith('+')) phone = phone.substring(1)
    if (!phone) {
        console.log(`[FB Leads] Telefon yok, atlanıyor: ${leadData.full_name}`)
        return false
    }

    // Duplicate kontrolü
    const phoneVariants = [phone]
    if (phone.startsWith('90') && phone.length > 10) phoneVariants.push(phone.substring(2))
    if (!phone.startsWith('90') && phone.length === 10) phoneVariants.push('90' + phone)

    for (const variant of phoneVariants) {
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', NOVO_TENANT_ID)
            .eq('phone', variant)
            .limit(1)
            .maybeSingle()

        if (existing) {
            console.log(`[FB Leads] Zaten kayıtlı: ${leadData.full_name} (${variant})`)
            return false
        }
    }

    // Yeni müşteri oluştur
    const { error } = await supabase.from('customers').insert({
        tenant_id: NOVO_TENANT_ID,
        full_name: leadData.full_name,
        phone: phone,
        email: leadData.email || null,
        city: leadData.city || null,
        source: 'Facebook Ads',
        contact_type: 'buyer',
        notes: `Facebook Lead Ads direkt entegrasyon | Form: ${formId || '-'} | Ad: ${adId || '-'}`,
    })

    if (error) {
        console.error(`[FB Leads] Kayıt hatası:`, error.message)
        return false
    }

    console.log(`[FB Leads] ✅ Yeni lead kaydedildi: ${leadData.full_name} (${phone})`)

    // Outreach tetikleyicisini çalıştır (Otomatik WhatsApp vb. için)
    // Not: customer id'sini almak için insert sonrası veriyi dönmek gerekebilir veya telefonla bulabiliriz.
    // Ancak insert başarılıysa ve bizde veri varsa direkt customer_id'ye ihtiyacımız var.
    const { data: newCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', NOVO_TENANT_ID)
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (newCustomer) {
        await fireLeadCreatedTrigger(NOVO_TENANT_ID, newCustomer.id)
    }

    return true
}
