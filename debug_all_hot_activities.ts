import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== DEBUG ALL HOT/ARAMA/WARM/HOT LEAD ACTIVITIES ===\n');

    const { data: acts, error: aErr } = await supabase
        .from('activities')
        .select('*')
        .or('summary.ilike.%arama%,summary.ilike.%hot%,summary.ilike.%warm%,summary.ilike.%satis%')
        .order('created_at', { ascending: false })
        .limit(50);

    if (aErr) {
        console.error('Error fetching activities:', aErr);
        return;
    }

    console.log(`Found ${acts.length} matching activities:`);
    acts.forEach(a => {
        console.log(`[${a.created_at}] Customer: ${a.customer_id}, Type: ${a.type}, Summary: ${a.summary}, Priority: ${a.priority}, Status: ${a.status}`);
    });
}

main().catch(console.error);
