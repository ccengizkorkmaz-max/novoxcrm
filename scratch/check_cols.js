require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);
async function run() {
  const r = await supabase.from('whatsapp_messages').insert({
    conversation_id: '00000000-0000-0000-0000-000000000000',
    tenant_id: '00000000-0000-0000-0000-000000000000',
    role: 'user', direction: 'inbound', sender_type: 'customer',
    content: 'test', status: 'received'
  });
  if (r.error) console.log('Error:', r.error.message);
  else console.log('OK - columns exist');
}
run();
