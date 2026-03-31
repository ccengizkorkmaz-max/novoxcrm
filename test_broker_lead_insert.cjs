require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    const brokerId = '98ba308c-2b9c-4cf5-94ea-cc91ec4e95e2'; 
    const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';
    
    // Attempt the insert once again WITHOUT unit_id
    const { data: lead, error: leadError } = await supabase
        .from('broker_leads')
        .insert({
            tenant_id: tenantId,
            broker_id: brokerId,
            full_name: 'Test Setup Lead',
            phone: '5559998877',
            email: 'test@setup.com',
            status: 'Submitted',
            nationality: 'TC',
            budget_min: null,
            budget_max: null,
            purpose: null,
            property_type: null,
            location_interest: null,
            project_id: null,
            preferred_visit_date: null,
            credit_interest: false,
            notes: 'Testing insert from admin'
        })
        .select()
        .single();
        
    if (leadError) {
        fs.writeFileSync('error_log.json', JSON.stringify(leadError, null, 2));
        console.log('Error written to error_log.json');
    } else {
        console.log('Successfully inserted!', lead.id);
        await supabase.from('broker_leads').delete().eq('id', lead.id);
    }
}

testInsert().catch(console.error);
