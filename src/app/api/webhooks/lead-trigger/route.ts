import { NextRequest, NextResponse } from 'next/server'
import { fireLeadCreatedTrigger } from '@/lib/outreach/triggers'

/**
 * Supabase Database Webhook Endpoint
 * 
 * customers tablosuna INSERT yapıldığında Supabase bu endpoint'i çağırır.
 * Source dış kaynak ise (whatsapp, facebook_messenger, website, make, vb.)
 * outreach tetikleyicisini ateşler.
 * 
 * Supabase Dashboard → Database → Webhooks → New Webhook:
 *   Table: customers
 *   Events: INSERT
 *   URL: https://www.novoxcrm.com/api/webhooks/lead-trigger
 *   Headers: x-webhook-secret: <secret>
 */

// Sadece bu kaynaklardan gelen lead'ler tetikleyiciyi ateşler
const EXTERNAL_SOURCES = [
    'whatsapp', 'facebook_messenger', 'messenger', 'instagram',
    'website', 'web', 'landing_page',
    'make', 'zapier', 'api',
    'google_ads', 'facebook_ads', 'tiktok_ads',
    'sahibinden', 'hepsiemlak', 'emlakjet',
]
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || 'novox_webhook_2024'

export async function POST(req: NextRequest) {
    try {
        // Güvenlik kontrolü
        const secret = req.headers.get('x-webhook-secret')
        if (secret !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const record = body.record

        if (!record?.id || !record?.tenant_id) {
            return NextResponse.json({ status: 'skipped', reason: 'no record' })
        }

        // Source kontrolü: sadece bilinen dış kaynaklar tetikler
        const source = (record.source || '').toLowerCase()
        if (!EXTERNAL_SOURCES.includes(source)) {
            console.log(`[LeadTrigger] Dahili/bilinmeyen kaynak (${source || 'boş'}), atlanıyor: ${record.full_name}`)
            return NextResponse.json({ status: 'skipped', reason: 'not_external_source' })
        }

        console.log(`[LeadTrigger] 🚀 Yeni dış lead: ${record.full_name} (${source}) → Tetikleyici ateşleniyor`)
        await fireLeadCreatedTrigger(record.tenant_id, record.id)

        return NextResponse.json({ status: 'triggered', customer: record.full_name })
    } catch (error: any) {
        console.error('[LeadTrigger] Hata:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
