const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    envFileContent.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            envConfig[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const validPhones = [
    "90539451960698", 
    "+905071947785", 
    "+15314349876", 
    "+905330954456", 
    "+905050367343", 
    "+905384049842", 
    "+905536636325", 
    "+905373018296", 
    "905342785844", 
    "905424541545", 
    "905337931292", 
    "+905544719395", 
    "5332953157", 
    "5050185098"
];

async function importLeads() {
    const dataPath = path.resolve(__dirname, 'missing_leads_from_excel.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const recordsToImport = rawData.filter(r => validPhones.includes(r.Phone) || validPhones.includes(r.GSM?.toString()));

    const { data: tenantData } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenantData) return;
    const tenantId = tenantData.id;

    for (const lead of recordsToImport) {
        const sourcePlat = lead.Platform || 'excel';
        const projectOrCampaign = lead.PROJE || '';
        const notesAndAssignee = lead['Görüşen'] ? `Görüşen: ${lead['Görüşen']}, Ek Soru: ${lead['Reklam Ek Soru'] || '-'}` : `Excel Import, Ek Soru: ${lead['Reklam Ek Soru'] || '-'}`;
        
        console.log(`Processing: ${lead.Name}`);

        let customerId;

        // Check if customer already exists (from failed script)
        const { data: existingCustomer } = await supabase.from('customers')
            .select('id')
            .eq('phone', lead.Phone)
            .single();

        if (existingCustomer) {
            customerId = existingCustomer.id;
            console.log(`-- Customer ${lead.Name} already exists.`);
        } else {
            const { data: customerData, error: customerErr } = await supabase.from('customers').insert({
                tenant_id: tenantId,
                full_name: lead.Name,
                phone: lead.Phone,
                source: sourcePlat,
                notes: notesAndAssignee
            }).select('id').single();

            if (customerErr) {
                console.error(`-- Failed to insert customer ${lead.Name}:`, customerErr.message);
                continue;
            }
            customerId = customerData.id;
        }

        // Check if sale already exists
        const { data: existingSale } = await supabase.from('sales')
            .select('id')
            .eq('customer_id', customerId)
            .eq('description', `Kampanya: ${projectOrCampaign} - Excel Import`)
            .single();

        if (existingSale) {
            console.log(`-- Sale for ${lead.Name} already exists.`);
            continue;
        }

        // Insert sale (Lead) without lead_origin
        const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
            tenant_id: tenantId,
            customer_id: customerId,
            status: 'Lead',
            description: `Kampanya: ${projectOrCampaign} - Excel Import`
        });

        if (saleErr) {
            console.error(`-- Failed to insert sale for ${lead.Name}:`, saleErr.message);
        } else {
            console.log(`-- Successfully imported sale for ${lead.Name}.`);
        }
    }
}

importLeads().catch(console.error);
