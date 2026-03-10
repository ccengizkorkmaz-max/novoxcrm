const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugDatabase() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- Checking Messaging Sessions ---');
    const { data: sessions, error: sErr } = await supabase
        .from('messaging_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (sErr) console.error('Error fetching sessions:', sErr);
    else console.log('Recent Sessions:', JSON.stringify(sessions, null, 2));

    console.log('\n--- Checking Messaging Messages ---');
    const { data: messages, error: mErr } = await supabase
        .from('messaging_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (mErr) console.error('Error fetching messages:', mErr);
    else console.log('Recent Messages:', JSON.stringify(messages, null, 2));
}

debugDatabase();
