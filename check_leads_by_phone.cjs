require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const phoneList = [
  "53771243",
  "53163202",
  "53759383",
  "54668760",
  "50706227",
  "5073021895",
  "5379931269",
  "5378565592"
];

async function checkLeadsByPhone() {
  console.log('Checking database for leads/customers by phone...');
  
  const results = [];
  
  for (const phone of phoneList) {
    let found = false;
    let foundDetails = [];

    // Check customers table
    const { data: customerData } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone')
      .ilike('phone', `%${phone}%`);

    if (customerData && customerData.length > 0) {
      found = true;
      foundDetails = [...foundDetails, ...customerData];
    }
    
    // Check leads table
    const { data: leadData } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone')
      .ilike('phone', `%${phone}%`);
      
    if (leadData && leadData.length > 0) {
      found = true;
      foundDetails = [...foundDetails, ...leadData];
    }

    results.push({ phone, found, foundDetails });
  }

  const foundCount = results.filter(r => r.found).length;
  console.log(`\nResults: ${foundCount} out of ${phoneList.length} found.`);
  
  const notFound = results.filter(r => !r.found).map(r => r.phone);
  if (notFound.length > 0) {
      console.log('\n--- NOT FOUND ---');
      notFound.forEach(n => console.log(n));
  }
  
  const foundItems = results.filter(r => r.found);
  if (foundItems.length > 0) {
      console.log('\n--- FOUND ---');
      foundItems.forEach(n => console.log(`${n.phone} => ${JSON.stringify(n.foundDetails)}`));
  }
}

checkLeadsByPhone().catch(console.error);
