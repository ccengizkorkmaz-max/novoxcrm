import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

        // 2. Send Message via WhatsApp
        // We will need the tenant info to send properly.
        const { data: tenant } = await supabase.from('tenants').select('wa_phone_number_id, wa_access_token').eq('id', session.tenant_id).single();
        if (!tenant || !tenant.wa_phone_number_id || !tenant.wa_access_token) {
            return NextResponse.json({ error: 'Tenant WhatsApp credentials missing' }, { status: 500 });
        }

        const waResult = await sendWhatsAppMessage(
            session.phone_number, 
            message,
            tenant.wa_phone_number_id,
            tenant.wa_access_token
        );
        
        if (!waResult.success) {
            return NextResponse.json({ error: waResult.error }, { status: 500 });
        }

        // 3. Store in DB
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

        // 4. Update session timestamp, last message, and turn off AI
        await supabase.from('whatsapp_conversations')
            .update({ 
                last_message_at: new Date().toISOString(),
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
