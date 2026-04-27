const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    // Check broker_slug vs agent_slug
    const { data } = await supabase
        .from('profiles')
        .select('full_name, broker_slug, agent_slug, agent_is_public, role')
        .or('broker_slug.neq.,agent_slug.neq.')
        .not('broker_slug', 'is', null)
    
    console.log('Profiles with broker_slug:')
    data?.forEach(p => console.log(`  ${p.full_name} | broker_slug=${p.broker_slug} | agent_slug=${p.agent_slug} | agent_is_public=${p.agent_is_public} | role=${p.role}`))
    
    // Check specifically for brokerTEST
    const { data: d2 } = await supabase
        .from('profiles')
        .select('full_name, broker_slug, agent_slug, agent_is_public')
        .or('broker_slug.eq.brokerTEST,agent_slug.eq.brokerTEST')
    console.log('\nbrokerTEST match:', d2)
}
check()
