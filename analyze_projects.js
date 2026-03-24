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

function excelDateToISO(serial) {
    if (!serial || typeof serial !== 'number') return null;
    return new Date((serial - 25569) * 86400 * 1000).toISOString();
}

async function analyze() {
    // 1. DB projeleri
    const { data: projects } = await supabase.from('projects').select('id, name').order('name');
    console.log('\n📁 DB\'deki Projeler:');
    projects.forEach(p => console.log(`   [${p.id}] ${p.name}`));

    // 2. Excel Notes analizi
    const filePath = path.resolve(__dirname, 'Kontaklar - Tüm Kontaklar.xlsx');
    const workbook = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    // Not kolonunda ETİLİ ve KOCAELİ geçenleri say
    let etiliCount = 0, kocaeliCount = 0, unknownCount = 0;
    const etiliSamples = [], kocaeliSamples = [], unknownSamples = [];

    rows.forEach(r => {
        const note = String(r['Not'] || '').toUpperCase();
        const name = String(r['Ad Soyad'] || '').trim();
        const phone = r['GSM'];
        const date = excelDateToISO(r['Kayıt Tarihi'])?.substring(0, 10);

        if (note.includes('ETİ') || note.includes('ETI') || note.includes('ÇAN')) {
            etiliCount++;
            if (etiliSamples.length < 3) etiliSamples.push({ name, phone, note: r['Not']?.substring(0, 80) });
        } else if (note.includes('KOC') || note.includes('PARK 4') || note.includes('P4')) {
            kocaeliCount++;
            if (kocaeliSamples.length < 3) kocaeliSamples.push({ name, phone, note: r['Not']?.substring(0, 80) });
        } else {
            unknownCount++;
            if (unknownSamples.length < 3) unknownSamples.push({ name, phone, note: r['Not']?.substring(0, 60), date });
        }
    });

    console.log(`\n📊 Not kolonuna göre sınıflandırma:`);
    console.log(`   ETİLİ / ÇANAKKALE: ${etiliCount}`);
    console.log(`   KOCAELİ / PARK 4:  ${kocaeliCount}`);
    console.log(`   Belirsiz:          ${unknownCount}`);

    console.log('\n🏗️  ETİLİ örnekleri:');
    etiliSamples.forEach(s => console.log(`   ${s.name} | ${s.phone} | "${s.note}"`));

    console.log('\n🏗️  KOCAELİ örnekleri:');
    kocaeliSamples.forEach(s => console.log(`   ${s.name} | ${s.phone} | "${s.note}"`));

    console.log('\n❓ Belirsiz örnekler (Not yok veya tanımlanamadı):');
    unknownSamples.forEach(s => console.log(`   ${s.name} | ${s.phone} | "${s.note}" | ${s.date}`));
}

analyze().catch(console.error);
