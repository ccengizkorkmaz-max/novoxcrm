import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== DEBUG NOTIF STATE ===\n');

    // Fetch conversation 8df945d1-90a5-462e-a9d0-e92cfc4c8b03
    const { data: conv } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', '8df945d1-90a5-462e-a9d0-e92cfc4c8b03')
        .single();

    console.log('Conversation:', conv);

    // Let\'s check system logs for today to see if there were any database trigger errors or webhook errors
    const { data: logs } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    console.log(`\nChecking all system logs containing errors or warnings:`);
    const errLogs = logs?.filter(l => l.status === 'ERROR' || l.status === 'WARN' || JSON.stringify(l).toLowerCase().includes('fail') || JSON.stringify(l).toLowerCase().includes('error'));
    console.log('Error Logs count:', errLogs?.length);
    console.log(JSON.stringify(errLogs?.slice(0, 10), null, 2));

    // Also look for logs mentioning 905337237721
    console.log(`\nLogs mentioning phone 905337237721:`);
    const phoneLogs = logs?.filter(l => JSON.stringify(l).includes('5337237721'));
    console.log(JSON.stringify(phoneLogs, null, 2));
}

main().catch(console.error);
