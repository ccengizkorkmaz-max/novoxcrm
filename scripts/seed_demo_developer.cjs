const { createClient } = require('@supabase/supabase-js');
const admin = createClient(
  'https://ncjamvghbzutohmtclwf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const R = (a) => a[Math.floor(Math.random()*a.length)];
const RB = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

async function main() {
  console.log('🚀 Developer Demo Seed başlıyor...\n');

  // 1. Tenant (developer type)
  const { data: t, error: te } = await admin.from('tenants').insert({
    name: 'Demo İnşaat A.Ş.', tenant_type: 'developer', subscription_status: 'Active',
    plan_type: 'Pro', user_limit: 20, subscription_end_date: new Date(Date.now()+365*86400000).toISOString()
  }).select().single();
  if (te) { console.error('Tenant hata:', te); return; }
  const T = t.id;
  console.log('✅ Tenant:', T);

  // 2. Owner user
  const { data: au, error: ae } = await admin.auth.admin.createUser({
    email: 'Demodev@demo.com', password: 'Demo123', email_confirm: true,
    user_metadata: { full_name: 'Demo Developer', tenant_id: T, role: 'owner' }
  });
  if (ae) { console.error('Auth hata:', ae); return; }
  const OID = au.user.id;
  await admin.from('profiles').upsert({ id: OID, tenant_id: T, role: 'owner', full_name: 'Demo Developer', email: 'Demodev@demo.com' });
  console.log('✅ Owner:', OID);

  // 3. Team
  const team = [
    { email: 'dev.satis1@demo.com', name: 'Burak Aydın', role: 'manager' },
    { email: 'dev.satis2@demo.com', name: 'Selin Korkmaz', role: 'sales' },
    { email: 'dev.satis3@demo.com', name: 'Emre Yıldırım', role: 'sales' },
  ];
  const pIds = [OID];
  for (const m of team) {
    const { data: u } = await admin.auth.admin.createUser({ email: m.email, password: 'Demo123', email_confirm: true, user_metadata: { full_name: m.name, tenant_id: T, role: m.role } });
    if (u?.user) { await admin.from('profiles').upsert({ id: u.user.id, tenant_id: T, role: m.role, full_name: m.name, email: m.email }); pIds.push(u.user.id); console.log(`  👤 ${m.name} (${m.role})`); }
  }

  // Sales team
  const { data: st } = await admin.from('sales_teams').insert({ tenant_id: T, name: 'Proje Satış Ekibi', region: 'İstanbul', office_name: 'Şantiye Ofis' }).select().single();
  if (st) for (let i=0;i<pIds.length;i++) await admin.from('team_members').insert({ team_id: st.id, profile_id: pIds[i], role: i===0?'leader':'member' });
  console.log('✅ Ekip oluşturuldu');

  // 4. Projects (developer projects with construction)
  const projs = [
    { name: 'Altın Vadi Konutları', city: 'İstanbul', district: 'Eyüpsultan', status: 'Active', project_code: 'AV-001', description: 'Haliç manzaralı 500 konutluk prestij projesi', manager_name: 'Burak Aydın', phase_count: 3, address: 'Alibeyköy Mah.', start_date: '2024-06-01', delivery_date_planned: '2027-03-01' },
    { name: 'Deniz Park Residence', city: 'İstanbul', district: 'Büyükçekmece', status: 'Active', project_code: 'DP-002', description: 'Denize sıfır karma proje', manager_name: 'Selin Korkmaz', phase_count: 2, address: 'Kumburgaz Sahil', start_date: '2025-01-15', delivery_date_planned: '2027-09-01' },
    { name: 'Orman Konakları', city: 'İstanbul', district: 'Çekmeköy', status: 'Active', project_code: 'OK-003', description: 'Ormana komşu villa projesi', manager_name: 'Emre Yıldırım', phase_count: 1, address: 'Alemdağ Cad.', start_date: '2025-03-01', delivery_date_planned: '2026-12-01' },
    { name: 'Merkez Plaza', city: 'Ankara', district: 'Yenimahalle', status: 'Active', project_code: 'MP-004', description: 'Ticari + konut karma proje', manager_name: 'Demo Developer', phase_count: 2, address: 'Batıkent Bulvarı', start_date: '2024-11-01', delivery_date_planned: '2027-06-01' },
    { name: 'Sahil Konakları', city: 'Antalya', district: 'Konyaaltı', status: 'Active', project_code: 'SK-005', description: 'Deniz manzaralı yazlık proje', manager_name: 'Burak Aydın', phase_count: 1, address: 'Liman Mah.', start_date: '2025-05-01', delivery_date_planned: '2027-01-01' },
  ];
  const projIds = [];
  for (const p of projs) { const { data } = await admin.from('projects').insert({ tenant_id: T, ...p }).select().single(); if (data) projIds.push(data.id); }
  if (st) for (const pid of projIds) await admin.from('team_project_assignments').insert({ team_id: st.id, project_id: pid });
  console.log(`✅ ${projIds.length} proje oluşturuldu`);

  // 5. Blocks & Units
  const types = ['1+1','2+1','3+1','4+1','Dublex'];
  const dirs = ['Kuzey','Güney','Doğu','Batı','Güneydoğu'];
  const views = ['Deniz','Şehir','Orman','Göl','Havuz','Vadi'];
  const uStat = ['For Sale','For Sale','For Sale','Reserved','Sold'];
  const blkN = ['A Blok','B Blok','C Blok','D Blok'];
  const allU = [];
  for (let pi=0; pi<projIds.length; pi++) {
    const nb = pi<2?4:(pi<3?2:3);
    for (let bi=0; bi<nb; bi++) {
      const { data: blk } = await admin.from('blocks').insert({ project_id: projIds[pi], name: blkN[bi] }).select().single();
      if (!blk) continue;
      for (let ui=1; ui<=10; ui++) {
        const tp = types[(ui+bi)%types.length];
        const base = [4000000,5500000,15000000,3800000,8000000][pi];
        const pr = base + ui*250000 + bi*400000;
        const s = R(uStat);
        const { data: u } = await admin.from('units').insert({
          project_id: projIds[pi], block_id: blk.id, unit_number: `${blkN[bi].charAt(0)}-${bi*10+ui}`,
          type: tp, status: s, price: pr, currency: pi===4?'EUR':'TRY',
          area_gross: RB(75,240), area_net: RB(60,210), floor: Math.ceil(ui/2),
          direction: R(dirs), view: R(views), heating_type: R(['Kombi','Merkezi Sistem','Yerden Isıtma']),
          parking_type: R(['Kapalı Otopark','Açık Otopark']), has_builtin_kitchen: Math.random()>0.3, kdv_rate: R([1,10,20])
        }).select().single();
        if (u) allU.push({ id: u.id, pid: projIds[pi], s, pr });
      }
    }
  }
  console.log(`✅ ${allU.length} ünite oluşturuldu`);

  // 6. Construction Stages
  const stages = ['Temel Kazı','Kaba İnşaat','Betonarme','Çatı','Sıva & Alçı','Tesisat','Dış Cephe','İç Dekorasyon','Peyzaj','İskan'];
  for (const pid of projIds) {
    for (let s=0; s<stages.length; s++) {
      const { data: sg } = await admin.from('construction_stages').insert({ project_id: pid, name: stages[s], weight: 10, order_index: s }).select().single();
      if (!sg) continue;
      const pu = allU.filter(u=>u.pid===pid).slice(0,6);
      for (const u of pu) await admin.from('unit_construction_progress').insert({ unit_id: u.id, stage_id: sg.id, completion_percentage: Math.min(100, RB(s*8, (s+1)*12)), updated_by: OID });
    }
  }
  console.log('✅ İnşaat aşamaları oluşturuldu');

  // 7. Customers
  const fN = ['Ali','Veli','Ayşe','Fatma','Hasan','Hüseyin','Zehra','Emre','Selin','Burak','Deniz','Gökhan','Sema','Cem','Derya','Murat','Sibel','Kaan','Merve','Onur','Yasemin','Tolga','Burcu','Serkan','Aslı','Ozan','İrem','Umut','Beren','Koray','Pınar','Barış','Gamze','Tarık','Nihan','Erdem','Canan','Volkan','Tuğba','Ilker'];
  const lN = ['Yılmaz','Kaya','Demir','Çelik','Şahin','Yıldız','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Koç','Güneş','Akın','Tan','Öz','Kurt','Bal','Eren'];
  const src = ['Web Sitesi','Instagram','Google Ads','Referans','Sahibinden','Hepsiemlak','Facebook','Fuar','Outdoor Reklam','Yürüyüş'];
  const cIds = [];
  for (let i=0; i<60; i++) {
    const fn=R(fN), ln=R(lN);
    const { data: c } = await admin.from('customers').insert({
      tenant_id: T, full_name: `${fn} ${ln}`, phone: `05${RB(30,59)}${RB(1000000,9999999)}`,
      email: `${fn.toLowerCase().replace(/[İıÖöÜüŞşÇçĞğ]/g,'x')}.${ln.toLowerCase().replace(/[İıÖöÜüŞşÇçĞğ]/g,'x')}${i}@gmail.com`,
      source: R(src), created_by: R(pIds),
      notes: R([null,null,'Yatırım amaçlı','Oturum amaçlı','Acil arıyor','Kredi kullanacak'])
    }).select().single();
    if (c) cIds.push(c.id);
  }
  console.log(`✅ ${cIds.length} müşteri oluşturuldu`);

  // Customer demands
  for (let i=0; i<35; i++) {
    await admin.from('customer_demands').insert({
      tenant_id: T, customer_id: cIds[i], min_price: RB(2,10)*1000000, max_price: RB(11,30)*1000000,
      room_count: R([['2+1'],['3+1'],['2+1','3+1'],['4+1']]),
      location_preference: R(['Eyüpsultan','Büyükçekmece','Çekmeköy','Yenimahalle','Konyaaltı']),
      property_type: R(['Apartment','Villa','Dublex']), investment_purpose: R(['Living','Investment'])
    });
  }

  // 8. Sales Pipeline
  const sStatus = ['Lead','Lead','Prospect','Prospect','Reservation','Contract','Sold'];
  const saleIds = [];
  const fsu = allU.filter(u=>u.s==='For Sale');
  for (let i=0; i<50; i++) {
    const u = fsu[i%fsu.length]; const ss = R(sStatus);
    const { data: sale } = await admin.from('sales').insert({
      tenant_id: T, customer_id: cIds[i%cIds.length], unit_id: u.id, project_id: u.pid,
      assigned_to: R(pIds), status: ss, final_price: u.pr,
      deposit_amount: ss==='Reservation'?Math.round(u.pr*0.1):0,
      created_at: new Date(Date.now()-RB(1,120)*86400000).toISOString()
    }).select().single();
    if (sale) saleIds.push({ id: sale.id, ss, uid: u.id, pr: u.pr });
  }
  console.log(`✅ ${saleIds.length} satış kaydı oluşturuldu`);

  // 9. Activities
  const aTypes = ['Call','Whatsapp','Meeting','Site Visit','Email','Follow Up','Showroom Visit'];
  const aOut = ['Reached Interested','Reached Not Interested','No Answer','Follow Up Required','Success'];
  for (let i=0; i<50; i++) {
    for (let j=0; j<RB(2,5); j++) {
      const s = R(['Planned','Completed','Completed','Completed','Cancelled']);
      await admin.from('activities').insert({
        tenant_id: T, customer_id: cIds[i%cIds.length], user_id: R(pIds), owner_id: R(pIds),
        type: R(aTypes), status: s,
        summary: R(['Telefon görüşmesi yapıldı','Proje bilgisi verildi','Saha ziyareti planlandı','WhatsApp ile fiyat gönderildi','Takip araması','Showroom davet','Kredi danışmanlığı']),
        outcome: s==='Completed'?R(aOut):null,
        due_date: new Date(Date.now()+RB(-30,14)*86400000).toISOString(),
        completed_at: s==='Completed'?new Date(Date.now()-RB(0,15)*86400000).toISOString():null,
        created_at: new Date(Date.now()-RB(0,90)*86400000).toISOString()
      });
    }
  }
  console.log('✅ Aktiviteler oluşturuldu');

  // 10. Offers
  for (let i=0; i<20; i++) {
    const u = R(allU);
    await admin.from('offers').insert({
      tenant_id: T, customer_id: cIds[i%cIds.length], unit_id: u.id, user_id: R(pIds),
      price: Math.round(u.pr*(RB(85,100)/100)), currency: 'TRY',
      status: R(['Draft','Sent','Accepted','Rejected','Expired']),
      valid_until: new Date(Date.now()+RB(7,30)*86400000).toISOString().split('T')[0],
      payment_plan: JSON.stringify({ down_payment: Math.round(u.pr*0.25), installments: R([6,12,24,36]) })
    });
  }
  console.log('✅ Teklifler oluşturuldu');

  // 11. Payment Plan Templates
  for (const pid of projIds.slice(0,3)) {
    for (const tpl of [
      { name: 'Standart 12 Ay', down_payment_rate: 25, installment_count: 12 },
      { name: 'Uzun Vade 24 Ay', down_payment_rate: 30, installment_count: 24 },
      { name: 'Peşin + 6 Taksit', down_payment_rate: 50, installment_count: 6 },
    ]) await admin.from('payment_plan_templates').insert({ tenant_id: T, project_id: pid, ...tpl });
  }
  console.log('✅ Ödeme planı şablonları oluşturuldu');

  // 12. Notifications
  const notifs = [
    { title: 'Yeni Müşteri Adayı', content: 'Web sitesinden yeni lead geldi.' },
    { title: 'Saha Ziyareti', content: 'Bugün 14:00 saha ziyareti var.' },
    { title: 'Teklif Kabul Edildi', content: 'Altın Vadi A-5 teklifi onaylandı!' },
    { title: 'Taksit Hatırlatma', content: '3 gün içinde vadesi dolan taksit var.' },
    { title: 'İnşaat Güncelleme', content: 'Deniz Park kaba inşaat %80 tamamlandı.' },
  ];
  for (const pid of pIds) for (let n=0;n<4;n++) { const nf=R(notifs); await admin.from('portal_notifications').insert({ user_id: pid, title: nf.title, content: nf.content, is_read: Math.random()>0.5 }); }
  console.log('✅ Bildirimler oluşturuldu');

  console.log('\n🎉 Developer Demo Tenant başarıyla oluşturuldu!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Email:    Demodev@demo.com`);
  console.log(`🔑 Şifre:    Demo123`);
  console.log(`🏢 Tenant:   ${T} (developer)`);
  console.log(`👥 Kullanıcı: ${pIds.length} kişi`);
  console.log(`🏗️ Proje:    ${projIds.length} adet`);
  console.log(`🏠 Ünite:    ${allU.length} adet`);
  console.log(`👤 Müşteri:  ${cIds.length} adet`);
  console.log(`📊 Satış:    ${saleIds.length} adet`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
main().catch(console.error);
