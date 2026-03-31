require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrokerLeads() {
    // 98ba308c-2b9c-4cf5-94ea-cc91ec4e95e2
    const { data, error } = await supabase
        .from('broker_leads')
        .select('*')
        .eq('broker_id', '98ba308c-2b9c-4cf5-94ea-cc91ec4e95e2')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching broker leads:', error);
    } else {
        console.log(`Found ${data.length} leads for Bahadir Ali Civan.`);
        if (data.length > 0) {
            console.log('Latest lead:', data[0].full_name, data[0].phone, data[0].created_at);
        }
    }
    
    // Also check if any recent logs exist at all for broker_leads table
    const { data: sysData, error: sysErr } = await supabase
        .from('system_logs')
        .select('*')
        .eq('entity_type', 'broker_leads')
        .order('created_at', { ascending: false })
        .limit(5);

    if (sysData && sysData.length > 0) {
        console.log('\nRecent system logs for broker_leads:', sysData);
    }
}

checkBrokerLeads().catch(console.error);
