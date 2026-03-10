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
            .from('messaging_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Send Message via Channel
        if (session.channel === 'whatsapp') {
            const waResult = await sendWhatsAppMessage(session.external_user_id, message);
            if (!waResult.success) {
                return NextResponse.json({ error: waResult.error }, { status: 500 });
            }
        } else {
            // For now only WhatsApp is implemented for outgoing manual replies
            return NextResponse.json({ error: 'Manual reply not yet implemented for ' + session.channel }, { status: 400 });
        }

        // 3. Store in DB
        const { error: msgError } = await supabase.from('messaging_messages').insert({
            session_id: sessionId,
            role: 'assistant', // Manual replies treated as assistant
            content: message
        });

        if (msgError) {
            console.error('Failed to store manual reply:', msgError);
            // Even if DB fails, the message was sent, but we handle the error for the UI
            return NextResponse.json({ error: 'Message sent but failed to log in CRM' }, { status: 500 });
        }

        // 4. Update session timestamp
        await supabase.from('messaging_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reply API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
