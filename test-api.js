const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const body = {
    "source": "Facebook Ads",
    "form_name": "NOVO PARK VISTA",
    "name": "Ahmet Test 123",
    "phone": "+90555" + Math.floor(Math.random() * 10000000),
    "email": "ahmettest@example.com",
    "campaign": "240326 / Vista / Potansiyel Müşteri Form Kampanyası",
    "lead_date": "2026-03-24T17:17:17.000Z"
  };

  fetch('http://localhost:3000/api/leads/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
  }).catch(e=>{});

  let tenant_id = null;
  const { data: firstTenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
  tenant_id = firstTenant?.id;

  const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
          tenant_id: tenant_id,
          full_name: body.name,
          email: body.email,
          phone: body.phone,
          source: body.source,
          created_at: new Date().toISOString()
      })
      .select('id')
      .single();

  if (customerError) {
      console.error('Customer Creation Error:', JSON.stringify(customerError, null, 2));
      return;
  }
  
  const customerId = newCustomer.id;

  const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert({
          tenant_id: tenant_id,
          customer_id: customerId,
          project_id: null,
          status: 'Lead',
          description: "Testing API Route"
      })
      .select('id')
      .single();

  if (saleError) {
      console.error('Sale Creation Error:', JSON.stringify(saleError, null, 2));
  } else {
      console.log('Created sale:', newSale.id);
  }
}

check();
