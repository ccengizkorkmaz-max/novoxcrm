import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('=== TEST ACTIVITY INSERT ===');
    const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';

    // 1. Try to insert activity from quick reply (Evet Arayın)
    console.log('\nTrying to insert activity from quick reply...');
    const res1 = await supabase.from('activities').insert({
        tenant_id: tenantId,
        type: 'Call',
        topic: 'Sales',
        summary: '📞 ARAMA TALEBİ (Evet Arayın) - TEST',
        description: `Müşteri kampanya şablonundaki "Evet arayın" butonuna tıkladı.`,
        status: 'Pending',
        priority: 'High',
    }).select();

    console.log('Insert 1 status:', res1.error ? 'FAILED' : 'SUCCESS');
    if (res1.error) console.error('Error 1:', res1.error);
    else console.log('Inserted 1:', res1.data);

    // 2. Try to insert activity from AI evaluation
    console.log('\nTrying to insert activity from AI evaluation...');
    const res2 = await supabase.from('activities').insert({
        tenant_id: tenantId,
        type: 'Call',
        topic: 'Sales',
        summary: '🌤️ ILIK SATIŞ (WARM LEAD) - TEST',
        description: `Novo AI ılık bir potansiyel tespit etti!`,
        status: 'Pending',
        priority: 'High',
    }).select();

    console.log('Insert 2 status:', res2.error ? 'FAILED' : 'SUCCESS');
    if (res2.error) console.error('Error 2:', res2.error);
    else console.log('Inserted 2:', res2.data);
}

main().catch(console.error);
