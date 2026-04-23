const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ncjamvghbzutohmtclwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
);

async function main() {
  // 1. Create broker tenant
  console.log('🏢 Creating broker tenant...');
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .insert({
      name: 'Test Broker Emlak',
      tenant_type: 'broker',
      subscription_status: 'Active',
      plan_type: 'Pro',
      user_limit: 20,
      country: 'Türkiye',
      is_openai_enabled: true,
      is_gemini_enabled: true,
      ai_assistant_name: 'Broker AI',
      ai_assistant_personality: 'Profesyonel ve yardımsever',
      ai_assistant_gender: 'female'
    })
    .select()
    .single();

  if (tenantErr) {
    console.error('❌ Tenant creation failed:', tenantErr);
    return;
  }
  console.log('✅ Tenant created:', tenant.id, '-', tenant.name);

  // 2. Create auth user via Supabase Admin API
  console.log('\n👤 Creating admin user...');
  const email = 'broker-admin@novocrm.test';
  const password = 'BrokerTest2026!';

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Auto-confirm email
  });

  if (authErr) {
    console.error('❌ Auth user creation failed:', authErr);
    // Cleanup tenant
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return;
  }
  console.log('✅ Auth user created:', authUser.user.id);

  // 3. Create profile linked to broker tenant
  console.log('\n📋 Creating profile...');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      email: email,
      full_name: 'Broker Admin',
      role: 'owner',
      tenant_id: tenant.id,
      phone: '+905551234567'
    })
    .select()
    .single();

  if (profileErr) {
    console.error('❌ Profile creation failed:', profileErr);
    return;
  }
  console.log('✅ Profile created:', profile.id);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 BROKER TENANT & ADMIN USER CREATED SUCCESSFULLY');
  console.log('='.repeat(50));
  console.log(`📌 Tenant ID:   ${tenant.id}`);
  console.log(`📌 Tenant Name: ${tenant.name}`);
  console.log(`📌 Tenant Type: ${tenant.tenant_type}`);
  console.log(`📌 User ID:     ${authUser.user.id}`);
  console.log(`📌 Email:       ${email}`);
  console.log(`📌 Password:    ${password}`);
  console.log(`📌 Role:        owner`);
  console.log('='.repeat(50));
  console.log(`\n🌐 Login at: http://localhost:8888/tr/login`);
}

main().catch(console.error);
