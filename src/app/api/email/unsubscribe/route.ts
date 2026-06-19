import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email')
    const campaignId = req.nextUrl.searchParams.get('campaign')

    if (!email) {
        return new NextResponse('Geçersiz istek', { status: 400 })
    }

    const supabase = createAdminClient()

    // Müşteriyi bul
    const { data: customer } = await supabase
        .from('customers')
        .select('id, tenant_id, full_name')
        .eq('email', email)
        .single()

    if (customer) {
        // İletişimi kapat
        await supabase
            .from('customers')
            .update({ communication_enabled: false })
            .eq('id', customer.id)

        // Opt-out kaydı
        await supabase.from('outreach_optouts').upsert({
            tenant_id: customer.tenant_id,
            customer_id: customer.id,
            phone: email,
            channel: 'email',
            reason: 'Email aboneliğinden çıktı',
        }, { onConflict: 'phone,channel' }).select()

        // Audit log
        await supabase.from('outreach_optout_logs').insert({
            tenant_id: customer.tenant_id,
            customer_id: customer.id,
            phone: email,
            channel: 'email',
            action: 'opted_out',
            reason: 'Email aboneliğinden çıktı (unsubscribe linki)',
            performed_by_name: customer.full_name || email,
            source: 'system',
        })
    }

    // Kullanıcıya gösterilecek HTML sayfası
    const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Abonelik İptal Edildi</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border-radius: 16px; padding: 48px; text-align: center; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { color: #94a3b8; line-height: 1.6; }
            .check { font-size: 48px; margin-bottom: 16px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="check">✅</div>
            <h1>Aboneliğiniz iptal edildi</h1>
            <p>E-posta adresiniz <strong>${email}</strong> başarıyla listeden çıkarıldı. Artık pazarlama e-postaları almayacaksınız.</p>
        </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}
