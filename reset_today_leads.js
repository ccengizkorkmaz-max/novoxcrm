const { createClient } = require('@supabase/supabase-js');
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

const TODAY = '2026-03-24';
const VISTA_PROJECT_ID = '366093a6-2f2e-41b5-9677-ce07fb3d9b5a';

async function deleteVistaLeadsToday() {
    console.log('\n🔍 Silinecek kayıtlar bulunuyor...');

    const { data: leads, error: fetchErr } = await supabase
        .from('sales')
        .select('id')
        .eq('project_id', VISTA_PROJECT_ID)
        .eq('status', 'Lead')
        .gte('created_at', `${TODAY}T00:00:00Z`)
        .lte('created_at', `${TODAY}T23:59:59Z`);

    if (fetchErr) { console.error('❌ Fetch hatası:', fetchErr.message); return; }
    if (!leads || leads.length === 0) { console.log('✅ Silinecek kayıt yok.'); return; }

    console.log(`🗑️  ${leads.length} NOVO PARK VISTA lead siliniyor (customers korunuyor)...`);

    const ids = leads.map(l => l.id);
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase.from('sales').delete().in('id', batch);
        if (error) console.error(`❌ Batch hatası:`, error.message);
        else { deleted += batch.length; console.log(`   ✅ ${deleted}/${ids.length}`); }
    }

    console.log(`\n✅ Tamamlandı — ${deleted} lead silindi.`);
    console.log(`🚀 Şimdi MAKE'i çalıştırın!`);
}

deleteVistaLeadsToday().catch(console.error);
