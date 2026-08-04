import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * Sends a reply via Facebook Messenger using the Graph API.
 */
async function sendMessengerMessage(recipientId: string, message: string, accessToken: string) {
    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: message },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Messenger API Error:', data);
            return { success: false, error: data.error?.message || 'Messenger API error' };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Messenger Send Error:', error);
        return { success: false, error: error.message };
    }
}

export async function POST(req: NextRequest) {
    try {
        const { sessionId, message } = await req.json();

        if (!sessionId || !message) {
            return NextResponse.json({ error: 'Missing sessionId or message' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Fetch Session Info
        const { data: session, error: sessError } = await supabase
            .from('whatsapp_conversations')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Fetch Tenant credentials
        const { data: tenant } = await supabase
            .from('tenants')
            .select('wa_phone_number_id, wa_access_token, fb_page_id')
            .eq('id', session.tenant_id)
            .single();

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 500 });
        }

        const channel = session.channel || 'whatsapp';
        let sendResult: { success: boolean; error?: string };

        // 3. Route message based on channel
        if (channel === 'messenger') {
            // Messenger: use Facebook Graph API
            if (!tenant.wa_access_token) {
                return NextResponse.json({ error: 'Facebook Messenger Access Token eksik. Ayarlar → AI Modül → Mesajlaşma Entegrasyonları bölümünden tanımlayın.' }, { status: 500 });
            }
            sendResult = await sendMessengerMessage(
                session.phone_number, // This is the PSID for Messenger
                message,
                tenant.wa_access_token
            );
        } else {
            // WhatsApp: use WhatsApp Cloud API
            if (!tenant.wa_phone_number_id || !tenant.wa_access_token) {
                return NextResponse.json({ error: 'Tenant WhatsApp credentials missing' }, { status: 500 });
            }
            console.log(`[REPLY DEBUG] tenant_id: ${session.tenant_id}`);
            console.log(`[REPLY DEBUG] phone_number_id: ${tenant.wa_phone_number_id}`);
            console.log(`[REPLY DEBUG] token_start: ${tenant.wa_access_token?.substring(0, 20)}`);
            console.log(`[REPLY DEBUG] token_length: ${tenant.wa_access_token?.length}`);
            console.log(`[REPLY DEBUG] to: ${session.phone_number}`);
            sendResult = await sendWhatsAppMessage(
                session.phone_number,
                message,
                tenant.wa_phone_number_id,
                tenant.wa_access_token
            );
        }

        if (!sendResult.success) {
            return NextResponse.json({ error: sendResult.error }, { status: 500 });
        }

        // 4. Store in DB
        const { error: msgError } = await supabase.from('whatsapp_messages').insert({
            conversation_id: sessionId,
            tenant_id: session.tenant_id,
            direction: 'outbound',
            status: 'sent',
            role: 'assistant', // Manual replies show on the right side
            content: message
        });

        if (msgError) {
            console.error('Failed to store manual reply:', msgError);
            return NextResponse.json({ error: 'Message sent but failed to log in CRM' }, { status: 500 });
        }

        // 4.1 Otomatik aktivite kaydı kaldırıldı — sistem sessizce işini yapıyor

        // 5. Update session timestamp, last message, and turn off AI
        await supabase.from('whatsapp_conversations')
            .update({
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_message_preview: message.substring(0, 50),
                ai_enabled: false // Human took over!
            })
            .eq('id', sessionId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reply API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
