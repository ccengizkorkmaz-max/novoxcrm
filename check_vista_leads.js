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

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVistaLeads() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    console.log('\n🔍 NOVO VİSTA Lead Kontrol — ' + now.toLocaleString('tr-TR'));
    console.log('='.repeat(60));

    // 1. Son 1 saatte oluşturulan tüm sales (Lead) kayıtları
    const { data: recentLeads, error: leadsErr } = await supabase
        .from('sales')
        .select(`
            id,
            status,
            description,
            created_at,
            project_id,
            customer_id,
            customers (full_name, phone, email, source)
        `)
        .eq('status', 'Lead')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });

    if (leadsErr) {
        console.error('❌ Sales sorgu hatası:', leadsErr.message);
    } else {
        console.log(`\n✅ Son 1 saatte oluşturulan Lead sayısı: ${recentLeads?.length || 0}`);
        if (recentLeads && recentLeads.length > 0) {
            recentLeads.slice(0, 10).forEach((lead, i) => {
                const c = lead.customers;
                console.log(`\n  [${i + 1}] ID: ${lead.id}`);
                console.log(`       Müşteri: ${c?.full_name || 'N/A'} | Tel: ${c?.phone || 'N/A'}`);
                console.log(`       Kaynak: ${c?.source || 'N/A'}`);
                console.log(`       Proje ID: ${lead.project_id || 'EŞLEŞMEDİ ⚠️'}`);
                console.log(`       Tarih: ${new Date(lead.created_at).toLocaleString('tr-TR')}`);
            });
            if (recentLeads.length > 10) {
                console.log(`\n  ... ve ${recentLeads.length - 10} kayıt daha`);
            }
        }
    }

    // 2. NOVO VİSTA projesine ait tüm leadler
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', '%vista%');

    console.log('\n📁 Vista Projeleri:');
    if (projects && projects.length > 0) {
        for (const proj of projects) {
            console.log(`   ${proj.name} → ${proj.id}`);

            const { count } = await supabase
                .from('sales')
                .select('id', { count: 'exact', head: true })
                .eq('project_id', proj.id)
                .eq('status', 'Lead');

            console.log(`   └── Lead sayısı: ${count || 0}`);
        }
    } else {
        console.log('   ⚠️  Veritabanında "vista" içeren proje bulunamadı!');
    }

    // 3. Toplam istatistik
    const { count: totalLeads } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Lead');

    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'Facebook Ads');

    console.log('\n📊 Genel İstatistik:');
    console.log(`   Toplam Lead (sales): ${totalLeads || 0}`);
    console.log(`   Facebook Ads kaynaklı müşteri: ${totalCustomers || 0}`);

    // 4. Duplicate check
    const { data: dupCheck } = await supabase.rpc('check_duplicate_leads').catch(() => ({ data: null }));

    console.log('\n' + '='.repeat(60));
    console.log('✅ Kontrol tamamlandı.');
}

checkVistaLeads().catch(console.error);
