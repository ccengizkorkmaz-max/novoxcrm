import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const { sessionId, aiEnabled } = await req.json();

        if (!sessionId || typeof aiEnabled !== 'boolean') {
            return NextResponse.json({ error: 'Missing sessionId or aiEnabled' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('whatsapp_conversations')
            .update({ ai_enabled: aiEnabled })
            .eq('id', sessionId);

        if (error) {
            console.error('Toggle AI Error:', error);
            return NextResponse.json({ error: 'Failed to toggle AI' }, { status: 500 });
        }

        return NextResponse.json({ success: true, ai_enabled: aiEnabled });
    } catch (error: any) {
        console.error('Toggle AI API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
