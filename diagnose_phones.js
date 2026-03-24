const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) envConfig[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    });
}
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    // 1. DB'den 10 örnek telefon al
    const { data: sampleCustomers } = await supabase
        .from('customers').select('full_name, phone').limit(10).not('phone', 'is', null);

    console.log('\n📱 DB Telefon Örnekleri:');
    sampleCustomers?.forEach(c => console.log(`   "${c.phone}" → ${c.full_name}`));

    // 2. Excel'den 5 telefon al
    const filePath = path.resolve(__dirname, 'Kontaklar - Tüm Kontaklar.xlsx');
    const workbook = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    console.log('\n📱 Excel Telefon Örnekleri:');
    rows.slice(0, 5).forEach(r => console.log(`   "${r['GSM']}" → ${r['Ad Soyad']}`));

    // 3. Manuel test: Excel'deki ilk telefonu DB'de bul
    const testPhone = String(rows[2]['GSM']).replace(/\D/g, '');
    console.log(`\n🔍 Test telefon: ${testPhone}`);
    const { data: found } = await supabase
        .from('customers')
        .select('full_name, phone')
        .or(`phone.eq.${testPhone},phone.eq.+${testPhone},phone.eq.+90${testPhone.slice(-10)},phone.eq.0${testPhone.slice(-10)}`)
        .limit(3);
    console.log('   DB sonucu:', found?.length ? found : 'BULUNAMADI');

    // 4. Proje listesi (admin)
    const { data: projects, error: pErr } = await supabase.from('projects').select('id, name');
    console.log('\n📁 Projeler:', pErr?.message || JSON.stringify(projects?.map(p => ({id: p.id.substring(0,8), name: p.name}))));
}

diagnose().catch(console.error);
