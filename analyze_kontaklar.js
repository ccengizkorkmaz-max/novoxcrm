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
    if (digits.length === 0) return null;
    if (digits.startsWith('90') && digits.length >= 12) return '+' + digits;
    if (digits.startsWith('0') && digits.length === 11) return '+9' + digits;
    if (digits.length === 10) return '+90' + digits;
    return '+' + digits;
}

function excelDateToISO(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString();
}

async function analyzeKontaklar() {
    const filePath = path.resolve(__dirname, 'Kontaklar - Tüm Kontaklar.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    console.log(`\n📊 Kontaklar - Tüm Kontaklar: ${rows.length} kayıt`);
    console.log('Kolonlar:', Object.keys(rows[0] || {}).join(' | '));

    // Kaynak dağılımı
    const sourceCount = {};
    rows.forEach(r => {
        const src = r['Kaynak'] || 'Bilinmiyor';
        sourceCount[src] = (sourceCount[src] || 0) + 1;
    });
    console.log('\n📊 Kaynak Dağılımı:');
    Object.entries(sourceCount).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
        console.log(`   ${k}: ${v}`);
    });

    // Örnek tarih
    const sample = rows.find(r => r['Kayıt Tarihi']);
    if (sample) {
        console.log(`\n📅 Örnek tarih (ham): ${sample['Kayıt Tarihi']}`);
        console.log(`   Dönüştürülmüş: ${excelDateToISO(sample['Kayıt Tarihi'])}`);
    }

    // DB'den tüm müşterileri çek
    console.log('\n⏳ DB müşterileri karşılaştırılıyor...');
    let allCustomers = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('customers').select('full_name, phone').range(from, from + 999);
        if (!data || data.length === 0) break;
        allCustomers = allCustomers.concat(data);
        if (data.length < 1000) break;
        from += 1000;
    }

    const dbPhones = new Set();
    allCustomers.forEach(c => {
        if (c.phone) {
            dbPhones.add(normalizePhone(c.phone));
            const d = c.phone.replace(/\D/g, '');
            if (d.length >= 10) dbPhones.add('+90' + d.slice(-10));
        }
    });

    // Eksik olanları bul
    const missing = [];
    rows.forEach(r => {
        const phone = normalizePhone(r['GSM']);
        if (!phone) return;
        if (!dbPhones.has(phone)) {
            missing.push({
                name: String(r['Ad Soyad'] || '').trim(),
                phone,
                date: excelDateToISO(r['Kayıt Tarihi']),
                source: r['Kaynak'] || 'Facebook Ads',
                note: r['Not'] || ''
            });
        }
    });

    console.log(`\n✅ DB'de VAR:    ${rows.length - missing.length}`);
    console.log(`❌ DB'de YOK:   ${missing.length}`);
    console.log(`📊 Eşleşme: %${Math.round((rows.length - missing.length) / rows.length * 100)}`);

    // Eksiklerin kaynak dağılımı
    const missingSources = {};
    missing.forEach(m => { missingSources[m.source] = (missingSources[m.source] || 0) + 1; });
    console.log('\n❌ Eksiklerin Kaynağı:');
    Object.entries(missingSources).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`   ${k}: ${v}`));

    console.log('\n📋 İlk 10 eksik kayıt:');
    missing.slice(0, 10).forEach((m, i) => {
        console.log(`  [${i+1}] ${m.name} | ${m.phone} | ${m.source} | ${m.date?.substring(0,10) || 'tarih yok'}`);
    });

    // JSON olarak kaydet
    fs.writeFileSync(path.resolve(__dirname, 'missing_contacts.json'), JSON.stringify(missing, null, 2));
    console.log(`\n💾 ${missing.length} eksik kayıt 'missing_contacts.json' dosyasına kaydedildi.`);
}

analyzeKontaklar().catch(console.error);
