
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ncjamvghbzutohmtclwf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyDashboardStats() {
    console.log('Simulating Dashboard Query...');

    // 1. Get Tenant ID (Assuming the one from the contract for now, or just query contracts directly for that number to get tenant)
    const { data: contract } = await supabase.from('contracts').select('tenant_id, signed_amount, status').eq('contract_number', 'SZL-20260206-841').single();

    if (!contract) {
        console.error('Contract SZL-20260206-841 not found');
        return;
    }

    const tenantId = contract.tenant_id;
    console.log(`Target Tenant ID: ${tenantId}`);
    console.log(`Target Contract Status: ${contract.status}`);
    console.log(`Target Contract Amount: ${contract.signed_amount}`);

    // 2. Run the Dashboard Query for Sales Volume
    console.log('\nRunning Sales Volume Query (Including Cancelled)...');
    const { data: allContracts } = await supabase
        .from('contracts')
        .select('id, contract_number, signed_amount, status')
        .eq('tenant_id', tenantId);

    const match = allContracts.find(c => c.contract_number === 'SZL-20260206-841');
    console.log('Contract in Query Result:', match);

    console.log('\nRunning Sales Volume Query (With .neq("status", "Cancelled"))...');
    const { data: filteredContracts } = await supabase
        .from('contracts')
        .select('id, contract_number, signed_amount, status')
        .eq('tenant_id', tenantId)
        .neq('status', 'Cancelled');

    const matchFiltered = filteredContracts.find(c => c.contract_number === 'SZL-20260206-841');
    if (matchFiltered) {
        console.error('❌ FAIL: Contract STILL exists in filtered query!');
    } else {
        console.log('✅ SUCCESS: Contract successfully filtered out.');
    }

    const totalVolume = filteredContracts.reduce((sum, c) => sum + Number(c.signed_amount), 0);
    console.log(`Calculated Total Sales Volume: ${totalVolume}`);
}

verifyDashboardStats();
