import { createAdminClient } from '../src/lib/supabase/admin'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function run() {
    console.log('--- META WHATSAPP TEMPLATE CREATION ---')

    let ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    let WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    const supabase = createAdminClient()
    const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, wa_access_token, wa_phone_number_id')
        .limit(5)

    if (!ACCESS_TOKEN && tenants && tenants.length > 0) {
        for (const t of tenants) {
            if (t.wa_access_token) {
                ACCESS_TOKEN = t.wa_access_token
                console.log(`Using access token from tenant: ${t.name} (${t.id})`)
                break
            }
        }
    }

    if (!ACCESS_TOKEN) {
        console.error('ERROR: No WhatsApp Access Token found!')
        process.exit(1)
    }

    ACCESS_TOKEN = ACCESS_TOKEN.replace(/[\r\n"\s]+/g, '')

    // If WABA_ID is not explicitly set, fetch it from debug_token or phone_number_id
    if (!WABA_ID) {
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || tenants?.[0]?.wa_phone_number_id
        if (phoneId) {
            console.log(`Fetching WABA_ID from Phone ID: ${phoneId}...`)
            try {
                const phoneRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}?fields=whatsapp_business_account&access_token=${ACCESS_TOKEN}`)
                const phoneData = await phoneRes.json()
                if (phoneData.whatsapp_business_account?.id) {
                    WABA_ID = phoneData.whatsapp_business_account.id
                    console.log(`Found WABA_ID: ${WABA_ID}`)
                }
            } catch (e: any) {
                console.error('Error fetching WABA_ID from phone:', e.message)
            }
        }
    }

    if (!WABA_ID) {
        console.error('ERROR: No WABA_ID found!')
        process.exit(1)
    }

    console.log(`Creating template 'novo_katalog_paylasimi' on WABA: ${WABA_ID}...`)

    const payload = {
        name: 'novo_katalog_paylasimi',
        category: 'UTILITY',
        language: 'tr',
        components: [
            {
                type: 'BODY',
                text: 'Merhaba Sayın {{1}},\n\nİlgilenmiş olduğunuz {{2}} projemize ait dokümanlar aşağıda yer almaktadır:\n\n{{3}}\n\nDokümanları inceleyebilir, detaylı bilgi veya randevu talepleriniz için bu mesaj üzerinden bizimle iletişime geçebilirsiniz.\n\nİyi günler dileriz.',
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

    const res = await fetch(`https://graph.facebook.com/v21.0/${WABA_ID}/message_templates`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    const data = await res.json()
    console.log('META API RESPONSE:', JSON.stringify(data, null, 2))

    if (res.ok) {
        console.log('✅ TEMPLATE CREATED SUCCESSFULLY ON META!')
    } else {
        if (data.error?.message?.includes('already exists') || data.error?.error_user_msg?.includes('already exists')) {
            console.log('ℹ️ Template already exists on Meta. Fetching its current status...')
            const checkRes = await fetch(`https://graph.facebook.com/v21.0/${WABA_ID}/message_templates?name=novo_katalog_paylasimi&access_token=${ACCESS_TOKEN}`)
            const checkData = await checkRes.json()
            console.log('EXISTING TEMPLATE STATUS:', JSON.stringify(checkData, null, 2))
        }
    }
}

run().catch(console.error)
