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

const INTERNAL_SOURCES = ['manual', 'crm', 'import', 'migration', 'admin']
const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET || 'novox_webhook_2024'

export async function POST(req: NextRequest) {
    try {
        // Güvenlik kontrolü
        const secret = req.headers.get('x-webhook-secret')
        if (secret !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const record = body.record // Supabase INSERT webhook'u yeni kaydı 'record' olarak gönderir

        if (!record?.id || !record?.tenant_id) {
            return NextResponse.json({ status: 'skipped', reason: 'no record' })
        }

        // Source kontrolü: sadece dış kaynak ise tetikle
        const source = (record.source || '').toLowerCase()
        if (INTERNAL_SOURCES.includes(source)) {
            console.log(`[LeadTrigger] Dahili kaynak (${source}), atlanıyor: ${record.full_name}`)
            return NextResponse.json({ status: 'skipped', reason: 'internal_source' })
        }

        console.log(`[LeadTrigger] 🚀 Yeni dış lead: ${record.full_name} (${source}) → Tetikleyici ateşleniyor`)
        await fireLeadCreatedTrigger(record.tenant_id, record.id)

        return NextResponse.json({ status: 'triggered', customer: record.full_name })
    } catch (error: any) {
        console.error('[LeadTrigger] Hata:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
