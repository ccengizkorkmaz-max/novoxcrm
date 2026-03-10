import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * WHATSAPP BUSINESS CLOUD API WEBHOOK
 * 
 * Bu endpoint Meta (WhatsApp) tarafından gelen mesajları ve durum güncellemelerini karşılar.
 * Meta Developer Dashboard -> WhatsApp -> Configuration kısmında bu URL tanımlanmalıdır.
 */

// 1. Meta Webhook Doğrulaması (GET)
// Meta, webhook URL'ini ilk kez eklediğinizde bu adrese bir doğrulama isteği gönderir.
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Bu token Meta Panelinde "Verify Token" kısmına yazdığınız metinle aynı olmalıdır.
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'novox_wa_secure_2024';

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WhatsApp Webhook Başarıyla Doğrulandı.');
            return new NextResponse(challenge, { status: 200 });
        } else {
            console.error('❌ WhatsApp Webhook Doğrulama Hatası: Token uyuşmuyor.');
            return new NextResponse('Forbidden', { status: 403 });
        }
    }
    return new NextResponse('Bad Request', { status: 400 });
}

// 2. Gelen Mesajları İşleme (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Log for debugging
        console.log('Incoming WhatsApp Body:', JSON.stringify(body, null, 2));

        // Meta her zaman 'object': 'whatsapp_business_account' gönderir
        if (body.object === 'whatsapp_business_account') {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const messageData = body.entry[0].changes[0].value.messages[0];
                const contactData = body.entry[0].changes[0].value.contacts[0];

                const payload = {
                    phone: messageData.from, // Kullanıcının telefon numarası
                    wa_id: contactData.wa_id,
                    name: contactData.profile?.name || 'WhatsApp User',
                    message: messageData.text?.body || '', // Sadece metin mesajlarını alıyoruz
                    timestamp: messageData.timestamp,
                    message_id: messageData.id,
                    channel: 'whatsapp'
                };

                console.log(`📩 Yeni Mesaj: ${payload.name} (${payload.phone}): ${payload.message}`);

                // --- MAKE (INTEGROMAT) ENTEGRASYONU ---
                // Mesajı Make üzerindeki senaryomuza iletiyoruz.
                // Make burada orkestrasyonu (AI -> CRM -> Reply) yönetecek.
                const MAKE_URL = process.env.MAKE_WHATSAPP_WEBHOOK_URL;

                if (MAKE_URL && payload.message) {
                    // Yangın ve unut (Fire and forget) - Beklemiyoruz ki Meta timeout'a düşmesin (5sn sınırı var)
                    fetch(MAKE_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }).catch(err => console.error('Make Forwarding Error:', err));
                }

                // Webhook'un çalıştığını onaylamak için 200 dönmemiz şart (yoksa Meta tekrar tekrar gönderir)
                return NextResponse.json({ status: 'ok' }, { status: 200 });
            }

            // Mesaj dışındaki (okundu bilgisi vb.) eventleri de kabul et ama işleme alma
            return NextResponse.json({ status: 'event_received' }, { status: 200 });
        }

        return NextResponse.json({ status: 'not_whatsapp' }, { status: 404 });
    } catch (error: any) {
        console.error('WhatsApp Webhook POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
