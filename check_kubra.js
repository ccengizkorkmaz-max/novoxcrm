require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: kubraProfile, error: qErr } = await supabase
    .from('profiles')
    .select('id, full_name, tenant_id')
    .ilike('full_name', '%Kübra Alpı%')
    .single();
    
  if (qErr && qErr.code !== 'PGRST116') {
      console.log("Profile error:", qErr);
  }
  
  let kubraId = null;
  if (kubraProfile) {
    console.log('Kübra Alpı Profile Found:', kubraProfile);
    kubraId = kubraProfile.id;
  } else {
    console.log('Kübra Alpı profile not found by exact string, searching broader...');
    const { data: b } = await supabase.from('profiles').select('id, full_name').ilike('full_name', '%Kübra%');
    console.log('Other Kübras:', b);
    if (b && b.length > 0) kubraId = b[0].id; // just take the first for now if we must
  }

  // Find customers where source contains Kübra or she is assigned
  const { data: customersBySource } = await supabase
    .from('customers')
    .select('id, full_name, phone, created_at, source')
    .ilike('source', '%Kübra%')
    .order('created_at', { ascending: false });
    
  console.log('Customers with source containing Kübra:', customersBySource?.length);
  require('fs').writeFileSync('kubra_source.json', JSON.stringify(customersBySource, null, 2));

  if (kubraId) {
    const { data: sales, error: sErr } = await supabase
        .from('sales')
        .select('id, created_at, customers (id, full_name, phone, source)')
        .eq('assigned_to', kubraId)
        .order('created_at', { ascending: false });

    console.log(`Sales/Leads assigned to Kübra:`, sales?.length);
    require('fs').writeFileSync('kubra_assigned.json', JSON.stringify(sales, null, 2));
  }
}

check();
