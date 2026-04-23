require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function reset() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('Error listing users:', error); return; }
  
  const user = data.users.find(u => u.email === 'ccengizkorkmaz@gmail.com');
  if (!user) { console.error('User not found!'); return; }
  
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: 'Passkall22!'
  });
  
  if (updateError) console.error('Update error:', updateError);
  else console.log('Password successfully reset to Passkall22!');
}
reset();
