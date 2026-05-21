const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('=== DEBUG HOT LEAD MANAGERS ===\n');

    const { data: managers, error: mErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, is_hot_lead_manager, is_active, tenant_id');

    if (mErr) {
        console.error('Error fetching managers:', mErr);
        return;
    }
    
    console.log('Total profiles:', managers.length);
    const activeManagers = managers.filter(m => m.is_hot_lead_manager);
    console.log('Active Hot Lead Managers (is_hot_lead_manager = true):');
    console.log(JSON.stringify(activeManagers, null, 2));

    const burak = managers.filter(m => (m.full_name || '').toLowerCase().includes('burak'));
    console.log('\nProfiles containing "Burak":');
    console.log(JSON.stringify(burak, null, 2));
}

main().catch(console.error);
