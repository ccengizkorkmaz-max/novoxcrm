require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrokerProfile() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Bahad%');

  if (pErr) {
      console.error('Error fetching profiles:', pErr);
  } else {
      console.log('Broker Profiles:', JSON.stringify(profiles, null, 2));
  }
}

checkBrokerProfile().catch(console.error);
