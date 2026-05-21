import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('content')
        .eq('content', 'Evet arayin')
        .limit(5);

    console.log('Matches for exact "Evet arayin":', messages?.length);

    // Let\'s search by conversation id
    const { data: lastMsgs } = await supabase
        .from('whatsapp_messages')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(20);

    console.log('\nLast 20 messages content and their char codes:');
    lastMsgs?.forEach(m => {
        const chars = Array.from(m.content).map(c => `${c}(${c.charCodeAt(0)})`).join(' ');
        console.log(`Content: "${m.content}" | Chars: ${chars}`);
    });
}

main().catch(console.error);
