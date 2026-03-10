import { createClient } from '@supabase/supabase-js';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncjamvghbzutohmtclwf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching problematic customers...');
    const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email')
        .ilike('full_name', '%3.data%');

    if (error) {
        console.error('Error fetching customers:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No problematic customers found with full_name containing "3.data".');
    } else {
        console.log(`Found ${data.length} customers to delete.`);
        for (const customer of data) {
            console.log(`Deleting customer ${customer.id} - ${customer.full_name}`);
            const { error: delError } = await supabase
                .from('customers')
                .delete()
                .eq('id', customer.id);

            if (delError) {
                console.error(`Failed to delete ${customer.id}:`, delError);
            } else {
                console.log(`Successfully deleted ${customer.id}`);
            }
        }
    }

    console.log('Fetching problematic leads from leads table just in case...');
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, full_name, email')
        .ilike('full_name', '%3.data%');

    if (leadsError) {
        console.log('Error fetching leads:', leadsError.message);
    } else if (!leads || leads.length === 0) {
        console.log('No problematic leads found.');
    } else {
        console.log(`Found ${leads.length} leads to delete.`);
        for (const lead of leads) {
            console.log(`Deleting lead ${lead.id} - ${lead.full_name}`);
            const { error: delError } = await supabase
                .from('leads')
                .delete()
                .eq('id', lead.id);

            if (delError) {
                console.error(`Failed to delete ${lead.id}:`, delError);
            } else {
                console.log(`Successfully deleted ${lead.id}`);
            }
        }
    }
}

run();
