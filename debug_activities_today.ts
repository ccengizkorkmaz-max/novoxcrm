import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== DEBUG FILTERED ACTIVITIES TODAY ===\n');
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: acts, error: aErr } = await supabase
        .from('activities')
        .select('*')
        .gte('created_at', todayStr + 'T00:00:00Z');

    if (aErr) {
        console.error('Error fetching activities:', aErr);
        return;
    }

    const filtered = acts.filter(a => 
        !a.summary.includes('Mesajı Gönderildi') && 
        !a.summary.includes('Kampanya Mesajı')
    );

    console.log(`Found ${filtered.length} non-message activities created today:`);
    filtered.forEach(a => {
        console.log(`[${a.created_at}] Customer: ${a.customer_id}, Type: ${a.type}, Summary: ${a.summary}, Priority: ${a.priority}, Status: ${a.status}`);
    });
}

main().catch(console.error);
