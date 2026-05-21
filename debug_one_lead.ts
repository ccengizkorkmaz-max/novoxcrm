import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== DEBUG LEAD 905337237721 ===\n');

    // 1. Conversation
    const { data: conv, error: cErr } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('phone_number', '905337237721')
        .single();

    if (cErr) {
        console.error('Error fetching conv:', cErr);
        return;
    }
    console.log('Conversation:', JSON.stringify(conv, null, 2));

    // 2. Messages
    const { data: messages, error: mErr } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

    if (mErr) console.error('Error fetching messages:', mErr);
    else {
        console.log(`\nMessages count: ${messages.length}`);
        messages.forEach(m => {
            console.log(`[${m.created_at}] ${m.direction} (${m.sender_type}): ${m.content} [Status: ${m.status}]`);
        });
    }

    // 3. Activities
    const { data: acts, error: aErr } = await supabase
        .from('activities')
        .select('*')
        .eq('customer_id', conv.customer_id)
        .order('created_at', { ascending: true });

    if (aErr) console.error('Error fetching activities:', aErr);
    else {
        console.log(`\nActivities count: ${acts.length}`);
        acts.forEach(a => {
            console.log(`[${a.created_at}] Type: ${a.type}, Summary: ${a.summary}, Priority: ${a.priority}, Status: ${a.status}`);
        });
    }
}

main().catch(console.error);
