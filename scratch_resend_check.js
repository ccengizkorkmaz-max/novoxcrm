const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Credentials missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
    console.log('=== ELIGIBLE LEAD RESEND CHECK ===\n');
    
    // Fetch all active tenants with WhatsApp automated templates enabled
    const { data: tenants, error: tErr } = await supabase
        .from('tenants')
        .select('id, name, wa_auto_template_enabled, wa_auto_template_name, wa_phone_number_id, wa_access_token')
        .eq('wa_auto_template_enabled', true);
        
    if (tErr) {
        console.error('Error fetching tenants:', tErr);
        return;
    }
    
    console.log('Eligible Tenants:', tenants.map(t => `${t.name} (${t.id})`));
    const eligibleTenantIds = tenants.map(t => t.id);
    
    if (eligibleTenantIds.length === 0) {
        console.log('No tenants have automated templates enabled.');
        return;
    }

    const startDate = '2026-05-19T21:00:00.000Z'; // May 20 Turkey time
    
    const { data: sales, error: sErr } = await supabase
        .from('sales')
        .select(`
            id,
            created_at,
            tenant_id,
            project_id,
            wa_first_message_sent,
            wa_first_message_at,
            customer_id,
            customers!inner (
                id,
                full_name,
                phone,
                source
            )
        `)
        .in('tenant_id', eligibleTenantIds)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

    if (sErr) {
        console.error('Error fetching sales:', sErr);
        return;
    }

    const fbSales = sales.filter(s => {
        const src = s.customers?.source || '';
        return src.toLowerCase().includes('facebook') || src.toLowerCase().includes('fb');
    });

    console.log(`Total Facebook Ads sales since ${startDate} for eligible tenants:`, fbSales.length);

    // Group by day in Turkey time (UTC+3)
    const dailyGroups = {};
    const toResend = [];
    let sentCount = 0;
    let invalidCount = 0;
    let notSentCount = 0;

    for (const sale of fbSales) {
        const dateObj = new Date(sale.created_at);
        // Shift to Turkey time
        dateObj.setUTCHours(dateObj.getUTCHours() + 3);
        const dayString = dateObj.toISOString().slice(0, 10);
        
        if (!dailyGroups[dayString]) {
            dailyGroups[dayString] = { total: 0, sent: 0, notSent: 0, invalid: 0 };
        }
        
        dailyGroups[dayString].total++;
        
        const phone = sale.customers?.phone || '';
        let wpPhone = phone.replace(/[^\d]/g, '');
        if (wpPhone.startsWith('0')) wpPhone = '90' + wpPhone.substring(1);
        if (!wpPhone.startsWith('90') && wpPhone.length === 10) wpPhone = '90' + wpPhone;
        const isDummy = wpPhone.length < 10 || /^900+$/.test(wpPhone) || wpPhone.includes('00000') || wpPhone === '90' || wpPhone === '';

        if (sale.wa_first_message_sent) {
            dailyGroups[dayString].sent++;
            sentCount++;
        } else if (isDummy) {
            dailyGroups[dayString].invalid++;
            invalidCount++;
        } else {
            dailyGroups[dayString].notSent++;
            notSentCount++;
            toResend.push({
                sale_id: sale.id,
                customer_id: sale.customers.id,
                tenant_id: sale.tenant_id,
                project_id: sale.project_id,
                name: sale.customers.full_name || 'Değerli Müşterimiz',
                phone: wpPhone,
                created_at: sale.created_at
            });
        }
    }

    console.log('\nDaily breakdown (Turkey time):');
    console.table(dailyGroups);

    console.log(`\nOverall Statistics:`);
    console.log(`- Already Sent: ${sentCount}`);
    console.log(`- Invalid/Dummy Phone: ${invalidCount}`);
    console.log(`- Need Resending: ${notSentCount}`);

    console.log(`\nSample of leads needing resending (up to 5):`);
    console.log(JSON.stringify(toResend.slice(0, 5), null, 2));
}

main().catch(console.error);
