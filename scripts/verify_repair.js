
const { createClient } = require('@supabase/supabase-js');

// Hardcoded for script simplicity based on .env.local view
const SUPABASE_URL = 'https://ncjamvghbzutohmtclwf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log('Verifying SZL-20260206-841...');

    // 1. Check Contract
    const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_number', 'SZL-20260206-841')
        .single();

    if (error || !contract) {
        console.error('Contract NOT FOUND or Error:', error);
        return;
    }

    console.log(`CONTRACT STATUS: ${contract.status}`);
    console.log(`UNIT ID: ${contract.unit_id}`);

    if (contract.unit_id) {
        // 2. Check Unit
        const { data: unit } = await supabase.from('units').select('status, id').eq('id', contract.unit_id).single();
        console.log(`UNIT STATUS: ${unit?.status}`);

        // 3. Check Sales
        const { data: sales } = await supabase.from('sales').select('id, status').eq('unit_id', contract.unit_id);
        console.log('SALES RECORDS:', sales);
    }

    // 4. Check Payment Plans
    const { data: plans } = await supabase.from('payment_plans').select('id, status').eq('contract_id', contract.id);
    console.log(`PAYMENT PLANS COUNT: ${plans?.length}`);
    if (plans?.length > 0) {
        console.log(`PAYMENT PLAN STATUSES: ${plans.map(p => p.status).join(', ')}`);
    }

    // 5. Check Finance Transactions
    const { count: txCount } = await supabase.from('finance_transactions').select('*', { count: 'exact', head: true }).eq('contract_id', contract.id);
    console.log(`FINANCE TX COUNT (Direct): ${txCount}`);
}

verify();
