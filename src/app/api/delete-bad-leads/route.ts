import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncjamvghbzutohmtclwf.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo';

    const supabase = createClient(supabaseUrl, supabaseKey);
    const deletedLeads = [];
    const deletedCustomers = [];

    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name')
        .ilike('full_name', '%3.data%');

    if (customers) {
        for (const c of customers) {
            await supabase.from('customers').delete().eq('id', c.id);
            deletedCustomers.push(c.id);
        }
    }

    const { data: leads } = await supabase
        .from('leads')
        .select('id, full_name')
        .ilike('full_name', '%3.data%');

    if (leads) {
        for (const l of leads) {
            await supabase.from('leads').delete().eq('id', l.id);
            deletedLeads.push(l.id);
        }
    }

    return NextResponse.json({ deletedCustomers, deletedLeads, total: deletedCustomers.length + deletedLeads.length });
}
