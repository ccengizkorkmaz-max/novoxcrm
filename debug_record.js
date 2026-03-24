const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
            envConfig[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        }
    });
}
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function debugRecord() {
    const searchName = process.argv[2] || 'Evriye';

    console.log(`\n🔍 Aranan: "${searchName}"`);
    console.log('='.repeat(60));

    // 1. Müşteriyi bul
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, phone, email, source, created_at')
        .ilike('full_name', `%${searchName}%`)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!customers || customers.length === 0) {
        console.log('❌ Müşteri bulunamadı!');
        return;
    }

    for (const c of customers) {
        console.log(`\n👤 Müşteri: ${c.full_name}`);
        console.log(`   ID:        ${c.id}`);
        console.log(`   Telefon:   ${c.phone || 'yok'}`);
        console.log(`   Kaynak:    ${c.source}`);
        console.log(`   created_at: ${c.created_at} (${new Date(c.created_at).toLocaleDateString('tr-TR')})`);

        // 2. Bu müşterinin leadlerini bul
        const { data: sales } = await supabase
            .from('sales')
            .select('id, status, created_at, project_id, description')
            .eq('customer_id', c.id)
            .order('created_at', { ascending: false });

        if (sales && sales.length > 0) {
            console.log(`\n   📋 Lead kayıtları (${sales.length} adet):`);
            sales.forEach(s => {
                console.log(`     - ID: ${s.id.substring(0, 8)}...`);
                console.log(`       Status: ${s.status}`);
                console.log(`       created_at: ${s.created_at} (${new Date(s.created_at).toLocaleDateString('tr-TR')})`);
                console.log(`       Proje: ${s.project_id || 'EŞLEŞMEDİ'}`);
            });
        } else {
            console.log('   📋 Lead kaydı yok');
        }
    }
}

debugRecord().catch(console.error);
