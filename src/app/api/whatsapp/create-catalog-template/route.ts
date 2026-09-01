import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = createAdminClient()

    // 1. Get tenant WhatsApp credentials
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, wa_access_token, wa_phone_number_id')
        .not('wa_access_token', 'is', null)
        .limit(1)
        .single()

    let ACCESS_TOKEN = tenant?.wa_access_token || process.env.WHATSAPP_ACCESS_TOKEN
    let WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    const PHONE_ID = tenant?.wa_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!ACCESS_TOKEN) {
        return NextResponse.json({ error: 'WhatsApp Access Token bulunamadı' }, { status: 400 })
    }

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '')

    // If WABA_ID is missing, resolve it via Phone ID
    if (!WABA_ID && PHONE_ID) {
        try {
            const pRes = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}?fields=whatsapp_business_account&access_token=${ACCESS_TOKEN}`)
            const pData = await pRes.json()
            if (pData.whatsapp_business_account?.id) {
                WABA_ID = pData.whatsapp_business_account.id
            }
        } catch (e: any) {
            console.error('Error getting WABA_ID:', e)
        }
    }

    if (!WABA_ID) {
        return NextResponse.json({ error: 'WABA_ID tespit edilemedi' }, { status: 400 })
    }

    // 2. Create template on Meta
    const payload = {
        name: 'novo_katalog_paylasimi',
        category: 'UTILITY',
        language: 'tr',
        components: [
            {
                type: 'BODY',
                text: 'Merhaba Sayın {{1}},\n\nİlgilenmiş olduğunuz {{2}} projemize ait doküman ve kat planı detayları aşağıda yer almaktadır:\n\n{{3}}\n\nDokümanları inceleyebilir, detaylı bilgi veya randevu talepleriniz için bu mesaj üzerinden bizimle iletişime geçebilirsiniz.\n\nİyi günler dileriz.',
                example: {
                    body_text: [
                        [
                            'Ahmet Bey',
                            'Novo Port',
                            '📄 Proje Kataloğu: https://novoxcrm.com/d/abc\n📐 Kat Planları: https://novoxcrm.com/d/xyz'
                        ]
                    ]
                }
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'QUICK_REPLY',
                        text: '📞 Beni Arayın'
                    },
                    {
                        type: 'QUICK_REPLY',
                        text: '📅 Randevu Al'
                    }
                ]
            }
        ]
    }

    try {
        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${WABA_ID}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })

        const metaData = await metaRes.json()

        // Check if already exists or created
        if (!metaRes.ok && (metaData.error?.message?.includes('already exists') || metaData.error?.error_user_msg?.includes('already exists'))) {
            // Check status
            const checkRes = await fetch(`https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?name=novo_katalog_paylasimi&access_token=${ACCESS_TOKEN}`)
            const checkData = await checkRes.json()
            return NextResponse.json({
                success: true,
                message: 'Şablon Meta üzerinde zaten mevcut.',
                template: checkData.data?.[0] || checkData
            })
        }

        if (!metaRes.ok) {
            return NextResponse.json({
                success: false,
                error: metaData.error?.message || 'Meta şablon oluşturma hatası',
                details: metaData
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: '🎉 novo_katalog_paylasimi şablonu Meta üzerinde başarıyla oluşturuldu!',
            details: metaData
        })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
