const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) {
            const key = line.substring(0, idx).trim();
            const value = line.substring(idx + 1).trim();
            if (key && value) envConfig[key] = value;
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set to true to actually delete duplicates, false = sadece raporla
const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--fix');

async function fixDuplicates() {
    console.log('\n🔍 Duplicate Tespit & Temizleme');
    console.log(DRY_RUN ? '⚠️  MOD: DRY RUN (silme yok, sadece rapor)' : '🔴 MOD: FIX (duplicate kayıtlar silinecek!)');
    console.log('='.repeat(60));

    // ─── 1. DUPLICATE CUSTOMERS (aynı telefon) ──────────────────
    console.log('\n📋 1. Duplicate Müşteriler (aynı telefon numarası)...');

    const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, full_name, phone, email, created_at')
        .not('phone', 'is', null)
        .order('created_at', { ascending: true });

    const phoneMap = {};
    allCustomers?.forEach(c => {
        const normalizedPhone = c.phone?.replace(/\s/g, '').replace(/-/g, '');
        if (!normalizedPhone) return;
        if (!phoneMap[normalizedPhone]) phoneMap[normalizedPhone] = [];
        phoneMap[normalizedPhone].push(c);
    });

    let dupCustomerCount = 0;
    const customerMergeMap = {}; // duplicateId -> keepId

    for (const [phone, customers] of Object.entries(phoneMap)) {
        if (customers.length > 1) {
            dupCustomerCount += customers.length - 1;
            const keep = customers[0]; // En eski kaydı tut
            const dups = customers.slice(1);
            dups.forEach(d => { customerMergeMap[d.id] = keep.id; });

            console.log(`\n  📞 Tel: ${phone} → ${customers.length} kayıt`);
            console.log(`     ✅ TUTULACAK: ${keep.full_name} (${keep.id.substring(0, 8)}...) - ${new Date(keep.created_at).toLocaleDateString('tr-TR')}`);
            dups.forEach(d => {
                console.log(`     ❌ SİLİNECEK: ${d.full_name} (${d.id.substring(0, 8)}...) - ${new Date(d.created_at).toLocaleDateString('tr-TR')}`);
            });
        }
    }

    console.log(`\n  Toplam duplicate müşteri: ${dupCustomerCount}`);

    // ─── 2. DUPLICATE LEADS (aynı customer_id + project_id) ─────
    console.log('\n📋 2. Duplicate Leadler (aynı müşteri + proje)...');

    const { data: allLeads } = await supabase
        .from('sales')
        .select('id, customer_id, project_id, status, created_at')
        .eq('status', 'Lead')
        .order('created_at', { ascending: true });

    const leadMap = {};
    allLeads?.forEach(l => {
        const key = `${l.customer_id}__${l.project_id || 'null'}`;
        if (!leadMap[key]) leadMap[key] = [];
        leadMap[key].push(l);
    });

    let dupLeadCount = 0;
    const leadsToDelete = [];

    for (const [key, leads] of Object.entries(leadMap)) {
        if (leads.length > 1) {
            dupLeadCount += leads.length - 1;
            const keep = leads[0];
            const dups = leads.slice(1);
            dups.forEach(d => leadsToDelete.push(d.id));

            console.log(`\n  👤 Müşteri+Proje: ${key.substring(0, 20)}... → ${leads.length} lead`);
            console.log(`     ✅ TUTULACAK: ${keep.id.substring(0, 8)}... (${new Date(keep.created_at).toLocaleDateString('tr-TR')})`);
            dups.forEach(d => {
                console.log(`     ❌ SİLİNECEK: ${d.id.substring(0, 8)}... (${new Date(d.created_at).toLocaleDateString('tr-TR')})`);
            });
        }
    }

    console.log(`\n  Toplam duplicate lead: ${dupLeadCount}`);

    // ─── 3. DUPLICATE CUSTOMERS İÇİN SATIN (sales) GÜNCELLE ────
    if (!DRY_RUN && Object.keys(customerMergeMap).length > 0) {
        console.log('\n🔧 Duplicate müşterilerin satışları birleştiriliyor...');
        for (const [dupId, keepId] of Object.entries(customerMergeMap)) {
            const { error } = await supabase
                .from('sales')
                .update({ customer_id: keepId })
                .eq('customer_id', dupId);
            if (error) console.error(`  ❌ sales update hatası (${dupId}):`, error.message);
            else console.log(`  ✅ sales güncellendi: ${dupId.substring(0,8)} → ${keepId.substring(0,8)}`);
        }

        // Duplicate müşterileri sil
        const dupCustomerIds = Object.keys(customerMergeMap);
        const { error: delCustErr } = await supabase
            .from('customers')
            .delete()
            .in('id', dupCustomerIds);
        if (delCustErr) console.error('  ❌ Müşteri silme hatası:', delCustErr.message);
        else console.log(`  ✅ ${dupCustomerIds.length} duplicate müşteri silindi`);
    }

    // ─── 4. DUPLICATE LEADLER SİL ───────────────────────────────
    if (!DRY_RUN && leadsToDelete.length > 0) {
        console.log('\n🔧 Duplicate leadler siliniyor...');
        // Batch sil (max 100'er)
        const batchSize = 100;
        for (let i = 0; i < leadsToDelete.length; i += batchSize) {
            const batch = leadsToDelete.slice(i, i + batchSize);
            const { error } = await supabase.from('sales').delete().in('id', batch);
            if (error) console.error(`  ❌ Batch ${i/batchSize + 1} sil hatası:`, error.message);
            else console.log(`  ✅ Batch ${i/batchSize + 1}: ${batch.length} lead silindi`);
        }
    }

    // ─── ÖZET ───────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('📊 ÖZET:');
    console.log(`   Duplicate müşteri: ${dupCustomerCount}`);
    console.log(`   Duplicate lead:    ${dupLeadCount}`);
    if (DRY_RUN) {
        console.log('\n💡 Temizlemek için: node fix_duplicates.js --fix');
    } else {
        console.log('\n✅ Temizleme tamamlandı!');
    }
}

fixDuplicates().catch(console.error);
