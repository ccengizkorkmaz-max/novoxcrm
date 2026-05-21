const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('=== DEBUG TENANT CONFIG ===\n');

    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('id, name, wa_phone_number_id, wa_access_token')
        .eq('id', '89b2829e-fc21-477e-8fd8-9f9f0c587e81')
        .single();

    if (tErr) {
        console.error('Error fetching tenant:', tErr);
        return;
    }
    
    console.log('Tenant:', tenant.name);
    console.log('wa_phone_number_id:', tenant.wa_phone_number_id);
    console.log('wa_access_token length:', tenant.wa_access_token ? tenant.wa_access_token.length : 0);
    if (tenant.wa_access_token) {
        console.log('wa_access_token start/end:', tenant.wa_access_token.substring(0, 15) + '...' + tenant.wa_access_token.substring(tenant.wa_access_token.length - 15));
    }
}

main().catch(console.error);
