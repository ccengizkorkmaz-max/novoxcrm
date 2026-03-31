require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPgColumns() {
    // Postgrest allows accessing raw info schema using `rpc`? No.
    // Let's try to query an invalid column, and parse the message which says what columns exist sometimes?
    // Let's just create an invalid table insert and see.
    // Or we can try the actual submit flow with exact same payload as the frontend:
    
    const brokerId = '98ba308c-2b9c-4cf5-94ea-cc91ec4e95e2'; // Bahadir
    const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';

    const payload = {
            tenant_id: tenantId,
            broker_id: brokerId,
            full_name: 'Test Setup Lead',
            phone: '5559998877',
            email: 'test@setup.com',
            nationality: null,
            budget_min: null,
            budget_max: null,
            purpose: null,
            property_type: null,
            location_interest: null,
            project_id: null,
            preferred_visit_date: null,
            credit_interest: false,
            notes: 'Testing',
            status: 'Submitted'
    };

    const { data: lead, error: leadError } = await supabase
        .from('broker_leads')
        .insert(payload)
        .select()
        .single();
        
    if (leadError) {
        console.error('Insert Error Detail:', leadError);
    } else {
        console.log('Successfully inserted!', lead.id);
        
        // Wait! We also do another insert in the action!
        // broker_lead_history!
        const { error: histError } = await supabase.from('broker_lead_history').insert({
            lead_id: lead.id,
            new_status: 'Submitted',
            changed_by: brokerId,
            notes: 'Broker tarafından yeni lead girişi yapıldı.'
        });
        
        if (histError) console.error('History API error:', histError);
        else console.log('Successfully inserted history');
        
        await supabase.from('broker_leads').delete().eq('id', lead.id);
    }
}

getPgColumns().catch(console.error);
