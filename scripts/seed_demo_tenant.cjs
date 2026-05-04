/**
 * Demo Tenant Seed Script
 * Creates: demo tenant, demo@demo.com user (Demo1234), and fills with realistic data
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ncjamvghbzutohmtclwf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomDate(daysBack, daysForward = 0) {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(-daysForward, daysBack));
  return d.toISOString();
}

async function main() {
  console.log('🚀 Demo Tenant Seed başlıyor...\n');

  // 1. Create Tenant
  const { data: tenant, error: tErr } = await admin.from('tenants').insert({
    name: 'Demo Emlak A.Ş.',
    logo_url: null,
    subscription_status: 'Active',
    plan_type: 'Pro',
    user_limit: 20,
    tenant_type: 'broker',
    subscription_end_date: new Date(Date.now() + 365 * 86400000).toISOString()
  }).select().single();
  if (tErr) { console.error('Tenant hatası:', tErr); return; }
  const T = tenant.id;
  console.log('✅ Tenant:', T);

  // 2. Create Auth User
  const { data: authUser, error: aErr } = await admin.auth.admin.createUser({
    email: 'demo@demo.com',
    password: 'Demo1234',
    email_confirm: true,
    user_metadata: { full_name: 'Demo Yönetici', tenant_id: T, role: 'owner' }
  });
  if (aErr) { console.error('Auth hatası:', aErr); return; }
  const ownerId = authUser.user.id;
  console.log('✅ Owner:', ownerId);

  // Ensure profile exists
  await admin.from('profiles').upsert({
    id: ownerId, tenant_id: T, role: 'owner', full_name: 'Demo Yönetici', email: 'demo@demo.com'
  });

  // 3. Create additional team members
  const teamMembers = [
    { email: 'ahmet.yilmaz@demo.com', name: 'Ahmet Yılmaz', role: 'manager' },
    { email: 'elif.kaya@demo.com', name: 'Elif Kaya', role: 'sales' },
    { email: 'mehmet.demir@demo.com', name: 'Mehmet Demir', role: 'sales' },
    { email: 'zeynep.celik@demo.com', name: 'Zeynep Çelik', role: 'sales' },
  ];
  const profileIds = [ownerId];

  for (const m of teamMembers) {
    const { data: u } = await admin.auth.admin.createUser({
      email: m.email, password: 'Demo1234', email_confirm: true,
      user_metadata: { full_name: m.name, tenant_id: T, role: m.role }
    });
    if (u?.user) {
      await admin.from('profiles').upsert({
        id: u.user.id, tenant_id: T, role: m.role, full_name: m.name, email: m.email
      });
      profileIds.push(u.user.id);
      console.log(`  👤 ${m.name} (${m.role})`);
    }
  }

  // 4. Sales Team
  const { data: team } = await admin.from('sales_teams').insert({
    tenant_id: T, name: 'İstanbul Satış Ekibi', description: 'Ana satış ekibi', region: 'İstanbul', office_name: 'Merkez Ofis'
  }).select().single();
  if (team) {
    for (let i = 0; i < profileIds.length; i++) {
      await admin.from('team_members').insert({
        team_id: team.id, profile_id: profileIds[i], role: i === 0 ? 'leader' : 'member'
      });
    }
  }
  console.log('✅ Satış ekibi oluşturuldu');

  // 5. Projects
  const projectsData = [
    { name: 'Panorama Residence', city: 'İstanbul', district: 'Beylikdüzü', status: 'Active', project_code: 'PAN-001', description: 'Deniz manzaralı lüks konut projesi', manager_name: 'Ahmet Yılmaz', phase_count: 2, address: 'Adnan Kahveci Mah.', start_date: '2025-03-01', delivery_date_planned: '2027-06-01' },
    { name: 'Yeşilvadi Evleri', city: 'İstanbul', district: 'Başakşehir', status: 'Active', project_code: 'YSV-002', description: 'Doğayla iç içe aile konutları', manager_name: 'Elif Kaya', phase_count: 1, address: 'Bahçeşehir 2. Kısım', start_date: '2025-06-15', delivery_date_planned: '2027-12-01' },
    { name: 'Marina Tower', city: 'İstanbul', district: 'Kartal', status: 'Active', project_code: 'MRT-003', description: 'Karma kullanımlı yüksek katlı proje', manager_name: 'Mehmet Demir', phase_count: 3, address: 'Yakacık Cad.', start_date: '2024-09-01', delivery_date_planned: '2026-12-01' },
    { name: 'Göl Konakları', city: 'Ankara', district: 'Çankaya', status: 'Active', project_code: 'GOL-004', description: 'Göl kenarında villa projesi', manager_name: 'Demo Yönetici', phase_count: 1, address: 'Eymir Göl Yolu', start_date: '2025-01-10', delivery_date_planned: '2026-08-01' },
  ];
  const projectIds = [];
  for (const p of projectsData) {
    const { data } = await admin.from('projects').insert({ tenant_id: T, ...p }).select().single();
    if (data) projectIds.push(data.id);
  }
  console.log(`✅ ${projectIds.length} proje oluşturuldu`);

  // Assign team to projects
  if (team) {
    for (const pid of projectIds) {
      await admin.from('team_project_assignments').insert({ team_id: team.id, project_id: pid });
    }
  }

  // 6. Blocks & Units
  const unitTypes = ['1+1', '2+1', '3+1', '4+1', 'Dublex'];
  const directions = ['Kuzey', 'Güney', 'Doğu', 'Batı', 'Güneydoğu', 'Güneybatı'];
  const views = ['Deniz', 'Şehir', 'Orman', 'Göl', 'Havuz'];
  const unitStatuses = ['For Sale', 'For Sale', 'For Sale', 'Reserved', 'Sold'];
  const allUnitIds = [];
  const blockNames = ['A Blok', 'B Blok', 'C Blok'];

  for (let pi = 0; pi < projectIds.length; pi++) {
    const numBlocks = pi < 2 ? 3 : 2;
    for (let bi = 0; bi < numBlocks; bi++) {
      const { data: block } = await admin.from('blocks').insert({
        project_id: projectIds[pi], name: blockNames[bi]
      }).select().single();
      if (!block) continue;

      for (let ui = 1; ui <= 8; ui++) {
        const typ = unitTypes[ui % unitTypes.length];
        const base = [3500000, 4200000, 6800000, 12000000][pi];
        const price = base + (ui * 200000) + (bi * 500000);
        const st = unitStatuses[Math.floor(Math.random() * unitStatuses.length)];
        const { data: unit } = await admin.from('units').insert({
          project_id: projectIds[pi], block_id: block.id,
          unit_number: `${blockNames[bi].charAt(0)}-${ui}`,
          type: typ, status: st, price, currency: 'TRY',
          area_gross: randomBetween(80, 220), area_net: randomBetween(65, 190),
          floor: ui, direction: randomItem(directions), view: randomItem(views),
          heating_type: randomItem(['Kombi', 'Merkezi Sistem']),
          parking_type: randomItem(['Kapalı Otopark', 'Açık Otopark']),
          has_builtin_kitchen: Math.random() > 0.3,
          kdv_rate: randomItem([1, 10, 20])
        }).select().single();
        if (unit) allUnitIds.push({ id: unit.id, projectId: projectIds[pi], status: st, price });
      }
    }
  }
  console.log(`✅ ${allUnitIds.length} ünite oluşturuldu`);

  // 7. Customers
  const firstNames = ['Ali', 'Veli', 'Ayşe', 'Fatma', 'Hasan', 'Hüseyin', 'Zehra', 'Emre', 'Selin', 'Burak', 'Deniz', 'Gökhan', 'Sema', 'Cem', 'Derya', 'Murat', 'Sibel', 'Kaan', 'Merve', 'Onur', 'Yasemin', 'Tolga', 'Burcu', 'Serkan', 'Aslı', 'Ozan', 'İrem', 'Umut', 'Beren', 'Koray'];
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Koç', 'Güneş', 'Akın'];
  const sources = ['Web Sitesi', 'Instagram', 'Referans', 'Sahibinden', 'Hepsiemlak', 'Google Ads', 'Facebook', 'Yürüyüş'];
  const customerIds = [];

  for (let i = 0; i < 50; i++) {
    const fn = randomItem(firstNames);
    const ln = randomItem(lastNames);
    const { data: cust } = await admin.from('customers').insert({
      tenant_id: T,
      full_name: `${fn} ${ln}`,
      phone: `053${randomBetween(10, 99)}${randomBetween(1000000, 9999999)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
      source: randomItem(sources),
      notes: i % 3 === 0 ? 'Yatırım amaçlı arıyor' : (i % 3 === 1 ? 'Oturum amaçlı' : null),
      created_by: randomItem(profileIds)
    }).select().single();
    if (cust) customerIds.push(cust.id);
  }
  console.log(`✅ ${customerIds.length} müşteri oluşturuldu`);

  // 8. Customer Demands
  const roomPrefs = [['2+1'], ['3+1'], ['2+1', '3+1'], ['4+1'], ['1+1', '2+1']];
  for (let i = 0; i < Math.min(30, customerIds.length); i++) {
    await admin.from('customer_demands').insert({
      tenant_id: T, customer_id: customerIds[i],
      min_price: randomBetween(2, 8) * 1000000,
      max_price: randomBetween(9, 25) * 1000000,
      currency: 'TRY',
      room_count: randomItem(roomPrefs),
      location_preference: randomItem(['Beylikdüzü', 'Başakşehir', 'Kartal', 'Çankaya']),
      property_type: randomItem(['Apartment', 'Villa']),
      investment_purpose: randomItem(['Living', 'Investment'])
    });
  }
  console.log('✅ Müşteri talepleri oluşturuldu');

  // 9. Sales Pipeline
  const saleStatuses = ['Lead', 'Lead', 'Prospect', 'Prospect', 'Reservation', 'Contract', 'Sold'];
  const saleIds = [];
  const forSaleUnits = allUnitIds.filter(u => u.status === 'For Sale');

  for (let i = 0; i < 40; i++) {
    const unit = forSaleUnits[i % forSaleUnits.length];
    const st = randomItem(saleStatuses);
    const { data: sale } = await admin.from('sales').insert({
      tenant_id: T,
      customer_id: customerIds[i % customerIds.length],
      unit_id: unit.id,
      project_id: unit.projectId,
      assigned_to: randomItem(profileIds),
      status: st,
      final_price: unit.price,
      deposit_amount: st === 'Reservation' ? unit.price * 0.1 : 0,
      created_at: randomDate(90)
    }).select().single();
    if (sale) saleIds.push({ id: sale.id, status: st, unitId: unit.id, price: unit.price });
  }
  console.log(`✅ ${saleIds.length} satış kaydı oluşturuldu`);

  // 10. Activities
  const actTypes = ['Call', 'Whatsapp', 'Meeting', 'Site Visit', 'Email', 'Follow Up'];
  const actStatuses = ['Planned', 'Completed', 'Completed', 'Completed', 'Cancelled'];
  const outcomes = ['Reached Interested', 'Reached Not Interested', 'No Answer', 'Follow Up Required', 'Success'];

  for (let i = 0; i < Math.min(customerIds.length, 45); i++) {
    const numActs = randomBetween(2, 5);
    for (let j = 0; j < numActs; j++) {
      const st = randomItem(actStatuses);
      await admin.from('activities').insert({
        tenant_id: T,
        customer_id: customerIds[i],
        user_id: randomItem(profileIds),
        owner_id: randomItem(profileIds),
        type: randomItem(actTypes),
        status: st,
        summary: randomItem([
          'Müşteriyle telefon görüşmesi yapıldı',
          'Proje hakkında bilgi verildi',
          'Saha ziyareti planlandı',
          'WhatsApp üzerinden fiyat listesi gönderildi',
          'Takip araması yapılacak',
          'Müşteri showroom\'a davet edildi'
        ]),
        outcome: st === 'Completed' ? randomItem(outcomes) : null,
        due_date: randomDate(30, 14),
        completed_at: st === 'Completed' ? randomDate(10) : null,
        created_at: randomDate(60)
      });
    }
  }
  console.log('✅ Aktiviteler oluşturuldu');

  // 11. Offers
  for (let i = 0; i < 15; i++) {
    const unit = randomItem(allUnitIds);
    await admin.from('offers').insert({
      tenant_id: T,
      customer_id: customerIds[i % customerIds.length],
      unit_id: unit.id,
      user_id: randomItem(profileIds),
      price: unit.price * (randomBetween(85, 100) / 100),
      currency: 'TRY',
      status: randomItem(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']),
      valid_until: new Date(Date.now() + randomBetween(7, 30) * 86400000).toISOString().split('T')[0],
      payment_plan: JSON.stringify({ down_payment: Math.round(unit.price * 0.25), installments: randomItem([6, 12, 24, 36]) }),
      notes: randomItem(['Müşteri ilgili', 'Fiyat pazarlığı devam ediyor', 'Kredi kullanacak', null])
    });
  }
  console.log('✅ Teklifler oluşturuldu');

  // 12. Portfolios (Broker İkinci El)
  const neighborhoods = ['Levent', 'Etiler', 'Ataşehir', 'Kadıköy', 'Üsküdar', 'Beşiktaş', 'Sarıyer'];
  for (let i = 0; i < 12; i++) {
    const nb = randomItem(neighborhoods);
    await admin.from('portfolios').insert({
      tenant_id: T,
      agent_id: randomItem(profileIds),
      title: `${nb}'da ${randomItem(['Deniz Manzaralı', 'Merkezi Konumda', 'Yeni Yapılmış', 'Bahçeli', 'Lüks'])} ${randomItem(unitTypes)}`,
      listing_type: randomItem(['sale', 'rent']),
      property_type: randomItem(['apartment', 'villa', 'office']),
      city: 'İstanbul', district: randomItem(['Beşiktaş', 'Kadıköy', 'Ataşehir', 'Sarıyer']),
      neighborhood: nb,
      room_count: randomItem(unitTypes),
      floor_number: randomBetween(1, 15),
      total_floors: randomBetween(8, 25),
      building_age: randomBetween(0, 20),
      area_gross: randomBetween(90, 250),
      area_net: randomBetween(75, 220),
      price: randomBetween(3, 30) * 1000000,
      currency: 'TRY',
      status: randomItem(['active', 'active', 'active', 'pending', 'sold']),
      authorization_type: randomItem(['exclusive', 'open']),
      owner_name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
      owner_phone: `054${randomBetween(10, 99)}${randomBetween(1000000, 9999999)}`,
      description: 'Eşsiz konumda, yüksek yatırım potansiyeline sahip mülk.',
      features: JSON.stringify({ balcony: true, parking: randomItem(['indoor', 'outdoor']), heating: randomItem(['central', 'combi']), elevator: true })
    });
  }
  console.log('✅ Portföyler oluşturuldu');

  // 13. Construction Stages
  const stageNames = ['Temel Kazı', 'Kaba İnşaat', 'Çatı', 'Dış Cephe', 'İç Mekan', 'Peyzaj'];
  for (const pid of projectIds.slice(0, 2)) {
    for (let s = 0; s < stageNames.length; s++) {
      const { data: stage } = await admin.from('construction_stages').insert({
        project_id: pid, name: stageNames[s], weight: Math.round(100 / stageNames.length), order_index: s
      }).select().single();
      if (!stage) continue;
      const pUnits = allUnitIds.filter(u => u.projectId === pid).slice(0, 5);
      for (const u of pUnits) {
        await admin.from('unit_construction_progress').insert({
          unit_id: u.id, stage_id: stage.id,
          completion_percentage: Math.min(100, randomBetween(s * 15, (s + 1) * 20)),
          updated_by: ownerId
        });
      }
    }
  }
  console.log('✅ İnşaat aşamaları oluşturuldu');

  // 14. Notifications
  const notifTexts = [
    { title: 'Yeni Lead Geldi', content: 'Web sitesinden yeni bir müşteri adayı geldi.' },
    { title: 'Saha Ziyareti Hatırlatma', content: 'Bugün saat 14:00\'te saha ziyareti var.' },
    { title: 'Teklif Onaylandı', content: 'Marina Tower A-3 için verilen teklif kabul edildi!' },
    { title: 'Ödeme Vadesi Yaklaşıyor', content: '3 gün içinde vadesi dolan taksit bulunmaktadır.' },
    { title: 'Yeni Görev Atandı', content: 'Panorama Residence müşteri takibi görevi atandı.' },
  ];
  for (const pid of profileIds) {
    for (let n = 0; n < 3; n++) {
      const notif = randomItem(notifTexts);
      await admin.from('portal_notifications').insert({
        user_id: pid, title: notif.title, content: notif.content,
        is_read: Math.random() > 0.5, created_at: randomDate(7)
      });
    }
  }
  console.log('✅ Bildirimler oluşturuldu');

  // 15. Broker Commission Settings
  await admin.from('broker_commission_settings').insert({
    tenant_id: T, default_split_office: 40, default_split_agent: 60,
    cap_enabled: true, cap_amount: 500000, desk_fee_monthly: 5000
  });
  console.log('✅ Komisyon ayarları oluşturuldu');

  // 16. Lead Routing Rules
  await admin.from('lead_routing_rules').insert({
    tenant_id: T, routing_type: 'round_robin', timeout_minutes: 15, is_active: true
  });
  console.log('✅ Lead yönlendirme kuralları oluşturuldu');

  console.log('\n🎉 Demo tenant başarıyla oluşturuldu!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Email:    demo@demo.com`);
  console.log(`🔑 Şifre:    Demo1234`);
  console.log(`🏢 Tenant:   ${T}`);
  console.log(`👥 Kullanıcı: ${profileIds.length} kişi`);
  console.log(`🏗️ Proje:    ${projectIds.length} adet`);
  console.log(`🏠 Ünite:    ${allUnitIds.length} adet`);
  console.log(`👤 Müşteri:  ${customerIds.length} adet`);
  console.log(`📊 Satış:    ${saleIds.length} adet`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
