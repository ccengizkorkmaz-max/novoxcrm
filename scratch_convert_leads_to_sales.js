const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';

async function run() {
    const startDate = '2026-05-19T21:00:00.000Z'; // 20 Mayis itibariyle

    const { data: convs, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
            id,
            customer_id,
            customers!inner (
                id,
                full_name,
                phone
            )
        `)
        .eq('tenant_id', tenantId)
        .in('lead_score', ['hot', 'warm', 'call_requested'])
        .gte('updated_at', startDate)
        .order('updated_at', { ascending: true });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Found ${convs.length} hot leads to check for sales pipeline.`);
    let createdCount = 0;

    for (const conv of convs) {
        if (!conv.customer_id) continue;

        const { data: existingSale } = await supabase.from('sales')
            .select('id')
            .eq('customer_id', conv.customer_id)
            .in('status', ['Lead', 'Prospect', 'Proposal', 'Reservation', 'Negotiation', 'Contract'])
            .maybeSingle();

        if (!existingSale) {
            await supabase.from('sales').insert({
                tenant_id: tenantId,
                customer_id: conv.customer_id,
                status: 'Lead',
                lead_origin: 'whatsapp_campaign' // or whatsapp_ai
            });
            console.log(`✅ ${conv.customers.full_name || conv.customers.phone} için Ön Değerlendirme oluşturuldu.`);
            createdCount++;
        } else {
            console.log(`⏩ ${conv.customers.full_name || conv.customers.phone} zaten satış listesinde.`);
        }
    }

    console.log(`=== İşlem Tamam! Toplam ${createdCount} adet yeni satış kaydı oluşturuldu. ===`);
}

run();
