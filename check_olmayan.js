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

function normalizePhone(p) {
    if (!p) return null;
    const digits = String(p).replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length >= 12) return '+' + digits;
    if (digits.startsWith('0') && digits.length === 11) return '+9' + digits;
    if (digits.length === 10) return '+90' + digits;
    return '+' + digits;
}

async function checkOlmayanMusteriler() {
    // 1. Excel oku
    const filePath = path.resolve(__dirname, 'OLMAYAN_MUSTERILER.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`\n📊 OLMAYAN_MUSTERILER.xlsx — ${rows.length} kayıt`);
    console.log('Sütunlar:', Object.keys(rows[0] || {}).join(', '));

    // 2. Excel'deki telefon listesi
    const excelItems = rows.map(r => ({
        name: String(r['Ad Soyad'] || '').trim(),
        phone: normalizePhone(r['Telefon (Standart)'] || r['Telefon (Orijinal)'] || r['Telefon'])
    })).filter(x => x.phone);

    const excelPhones = new Set(excelItems.map(x => x.phone));
    console.log(`📞 Excel'de ${excelPhones.size} benzersiz telefon`);

    // 3. DB'den TÜM müşterileri tek sorguda çek
    console.log('\n⏳ Veritabanındaki müşteriler çekiliyor...');
    let allCustomers = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
        const { data } = await supabase
            .from('customers')
            .select('full_name, phone')
            .range(from, from + pageSize - 1);
        if (!data || data.length === 0) break;
        allCustomers = allCustomers.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
    }

    console.log(`✅ DB'den ${allCustomers.length} müşteri alındı`);

    // 4. DB telefon seti oluştur
    const dbPhones = new Set();
    allCustomers.forEach(c => {
        if (c.phone) {
            dbPhones.add(normalizePhone(c.phone));
            // Alternatif formatlar
            const digits = c.phone.replace(/\D/g, '');
            dbPhones.add('+90' + digits.slice(-10));
        }
    });

    // 5. Karşılaştır
    const found = [];
    const notFound = [];

    excelItems.forEach(item => {
        if (dbPhones.has(item.phone)) {
            found.push(item);
        } else {
            notFound.push(item);
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Veritabanında BULUNAN:     ${found.length} / ${excelItems.length}`);
    console.log(`❌ Veritabanında BULUNMAYAN: ${notFound.length} / ${excelItems.length}`);
    console.log(`📊 Eşleşme oranı: %${Math.round(found.length / excelItems.length * 100)}`);

    if (notFound.length > 0) {
        console.log(`\n❌ İlk 15 gelmeyen kayıt:`);
        notFound.slice(0, 15).forEach((x, i) => {
            console.log(`  [${i+1}] ${x.name} | ${x.phone}`);
        });
    }
}

checkOlmayanMusteriler().catch(console.error);
