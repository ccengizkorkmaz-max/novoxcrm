const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

async function check() {
  const { data: customer } = await dbClient.from('customers').select('id, full_name').ilike('full_name', '%şeyma%').single();

  if(!customer) { console.log('not found'); return; }

  console.log('Found:', customer.full_name);

  // Replicate exact server side code now
  try {
      await dbClient.from('activities').delete().eq('customer_id', customer.id);
      await dbClient.from('customer_demands').delete().eq('customer_id', customer.id);
      
      const { data: sales } = await dbClient.from('sales').select('id').eq('customer_id', customer.id);
      if (sales && sales.length > 0) {
          const saleIds = sales.map(s => s.id);
          const { data: offers } = await dbClient.from('offers').select('id').in('sale_id', saleIds);
          if (offers && offers.length > 0) {
              const offerIds = offers.map(o => o.id);
              await dbClient.from('offer_negotiations').delete().in('offer_id', offerIds);
              await dbClient.from('offers').delete().in('id', offerIds);
          }
          await dbClient.from('sales').delete().in('id', saleIds);
      }

      // Delete finance accounts if they have no transactions
      const facctResult = await dbClient.from('financial_accounts').delete().eq('customer_id', customer.id);
      console.log('Financial Accounts Result:', facctResult.error ? facctResult.error : `OK - Count ${facctResult.count}`);
  } catch (e) {
      console.error('Cascading delete error:', e);
  }

  const finalDel = await dbClient.from('customers').delete().eq('id', customer.id);
  if (finalDel.error) {
      console.log('Final DELETE Error:', JSON.stringify(finalDel.error, null, 2));
  } else {
      console.log('Customer correctly deleted!');
  }
}

check();
