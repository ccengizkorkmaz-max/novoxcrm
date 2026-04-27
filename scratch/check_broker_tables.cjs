const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)
async function check() {
    const tables = ['commissions','incentive_earnings','broker_payments','broker_commission_earnings','broker_commission_payouts','commission_models','incentive_campaigns','document_library','broker_levels']
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*', { count: 'exact', head: true })
        console.log(`${t}: ${error ? '❌ ' + error.code + ' ' + error.message : '✅ exists'}`)
    }
}
check()
