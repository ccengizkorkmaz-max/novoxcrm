/**
 * Meta WhatsApp Template Creator Script
 * 
 * Bu script Meta Graph API üzerinden lead_assignment_alert template'i oluşturur.
 * Çalıştırmak için: node scripts/create-wa-template.mjs
 */

// Supabase'den tenant bilgilerini al
const SUPABASE_URL = 'https://ncjamvghbzutohmtclwf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
    // 1. Tenant bilgilerini al
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=wa_access_token,wa_phone_number_id,wa_business_account_id&limit=1`, {
        headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
    })
    const tenants = await res.json()
    const tenant = tenants[0]

    if (!tenant?.wa_access_token) {
        console.error('❌ Tenant WA credentials bulunamadı')

        // Fallback: try to get WABA_ID from wa_phone_number_id
        if (tenant?.wa_phone_number_id && tenant?.wa_access_token) {
            console.log('Trying to get WABA_ID from phone number...')
        }
        return
    }

    const ACCESS_TOKEN = tenant.wa_access_token.replace(/[\r\n"\s]+/g, '')
    let WABA_ID = tenant.wa_business_account_id

    // WABA_ID yoksa phone_number_id'den bul
    if (!WABA_ID && tenant.wa_phone_number_id) {
        console.log('📱 WABA_ID yok, phone_number_id üzerinden bulunuyor...')
        const phoneRes = await fetch(
            `https://graph.facebook.com/v21.0/${tenant.wa_phone_number_id}?fields=id,verified_name&access_token=${ACCESS_TOKEN}`
        )
        const phoneData = await phoneRes.json()
        console.log('Phone data:', phoneData)
        
        // Get WABA_ID from the account
        // Actually we need to check if there's a wa_business_account_id column
    }

    if (!WABA_ID) {
        console.error('❌ WABA_ID bulunamadı. Lütfen tenants tablosunda wa_business_account_id alanını kontrol edin.')
        console.log('Alternatif: Meta Business Manager → WhatsApp → Settings → WhatsApp Business Account ID')
        return
    }

    console.log(`✅ WABA_ID: ${WABA_ID}`)
    console.log('🔄 Template oluşturuluyor...')

    // 2. Template oluştur
    const templateRes = await fetch(
        `https://graph.facebook.com/v21.0/${WABA_ID}/message_templates`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'lead_assignment_alert',
                language: 'tr',
                category: 'UTILITY',
                components: [
                    {
                        type: 'HEADER',
                        format: 'TEXT',
                        text: '🎯 Yeni Lead Atandı — Hemen Ara!'
                    },
                    {
                        type: 'BODY',
                        text: '👤 *Müşteri:* {{1}}\n📱 *Telefon:* {{2}}\n📊 *Lead Skor:* {{3}}',
                        example: {
                            body_text: [['Ahmet Yılmaz', '+905551234567', '🔥 HOT']]
                        }
                    },
                    {
                        type: 'FOOTER',
                        text: 'NovoCRM Lead Takip'
                    },
                    {
                        type: 'BUTTONS',
                        buttons: [
                            {
                                type: 'QUICK_REPLY',
                                text: 'Aradım Olumlu'
                            },
                            {
                                type: 'QUICK_REPLY',
                                text: 'Aradım Olumsuz'
                            },
                            {
                                type: 'QUICK_REPLY',
                                text: 'Tekrar Aranacak'
                            },
                            {
                                type: 'QUICK_REPLY',
                                text: 'Değerlendiriyor'
                            }
                        ]
                    }
                ]
            })
        }
    )

    const templateData = await templateRes.json()

    if (templateRes.ok) {
        console.log('✅ Template başarıyla oluşturuldu!')
        console.log('Template ID:', templateData.id)
        console.log('Status:', templateData.status)
        console.log('\n⏳ Meta onayı bekleniyor... (genellikle birkaç dakika)')
    } else {
        console.error('❌ Template oluşturulamadı:', JSON.stringify(templateData, null, 2))
    }
}

main().catch(console.error)
