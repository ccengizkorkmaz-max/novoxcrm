import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendWhatsAppTemplate } from './src/lib/whatsapp';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== TEST SEND TEMPLATE (TS) ===\n');

    // Get Burak Kotaman phone and tenant info
    const { data: manager, error: mErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone, tenant_id')
        .eq('is_hot_lead_manager', true)
        .limit(1)
        .single();

    if (mErr || !manager) {
        console.error('Error fetching manager:', mErr);
        return;
    }

    console.log('Found Manager:', manager.full_name, 'Phone:', manager.phone);

    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('wa_phone_number_id, wa_access_token')
        .eq('id', manager.tenant_id)
        .single();

    if (tErr || !tenant) {
        console.error('Error fetching tenant:', tErr);
        return;
    }

    console.log('Tenant Phone ID:', tenant.wa_phone_number_id);

    // Test with 4 parameters (like route.ts uses)
    console.log('\nTesting with 4 parameters:');
    const params4 = [
        'Test Müşteri',
        '+905321112233',
        new Date().toLocaleString('tr-TR'),
        'Bu bir test sıcak lead bildirim özetidir.'
    ];

    const result4 = await sendWhatsAppTemplate(
        manager.phone,
        'hot_lead_notification',
        params4,
        'tr',
        tenant.wa_phone_number_id,
        tenant.wa_access_token
    );

    console.log('Result for 4 parameters:', JSON.stringify(result4, null, 2));

    console.log('\nTesting hello_world template:');
    const result_hello = await sendWhatsAppTemplate(
        manager.phone,
        'hello_world',
        [],
        'en_US',
        tenant.wa_phone_number_id,
        tenant.wa_access_token
    );

    console.log('Result for hello_world:', JSON.stringify(result_hello, null, 2));
}

main().catch(console.error);
