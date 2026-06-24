-- ============================================================
-- NovoCRM Advance Mode: Oikos Demo Seed Data
-- İki senaryo: 1) Elle girilen aday, 2) Instagram lead
-- ============================================================

-- Oikos Tenant: 3de3c038-8ce7-44b1-b5ba-8b99d63301f4
-- Oikos Admin User: 17b64a78-1458-4bcf-8853-99cf42614380

-- ── SENARYO 1: Elle Girilen Müşteri Adayı ───────────────
-- Satış danışmanı, telefonda görüştüğü kişiyi sisteme giriyor

INSERT INTO leads (
    tenant_id, full_name, phone, email, source, status, notes, assigned_to
) VALUES (
    '3de3c038-8ce7-44b1-b5ba-8b99d63301f4',
    'Mehmet Yılmaz',
    '+905551234567',
    'mehmet.yilmaz@email.com',
    'Telefon Görüşmesi',
    'new',
    'Bodrum''daki taş ev projeleriyle ilgileniyor. 2+1 veya 3+1 arıyor. Bütçesi 250K-350K USD aralığında.',
    '17b64a78-1458-4bcf-8853-99cf42614380'
);


-- ── SENARYO 2: Instagram Reklamından Gelen Lead ─────────
-- Meta Lead Ads üzerinden otomatik gelen form datası
-- (Normalde webhook ile gelir, burada simüle ediyoruz)

INSERT INTO leads (
    tenant_id, full_name, phone, email, source, form_name, status, 
    utm_source, utm_medium, utm_campaign, ad_id, notes
) VALUES (
    '3de3c038-8ce7-44b1-b5ba-8b99d63301f4',
    'Ayşe Kara',
    '+905559876543',
    'ayse.kara@gmail.com',
    'Instagram',
    'Oikos Green Valley - Lansman Formu',
    'new',
    'ig', 'paid', 'summer_launch_2025', 'ig_ad_987654',
    'Instagram reklamı üzerinden formu doldurdu. "Yatırım amaçlı villa arıyorum" yazmış.'
);


-- ── Ek: Farklı durumlarda leadler (zengin tablo için) ──

INSERT INTO leads (tenant_id, full_name, phone, source, status, notes) VALUES
('3de3c038-8ce7-44b1-b5ba-8b99d63301f4', 'Ali Demir', '+905553334455', 'Website', 'contacted', 'İlk görüşme yapıldı, fiyat listesi gönderildi.'),
('3de3c038-8ce7-44b1-b5ba-8b99d63301f4', 'Fatma Çelik', '+905557778899', 'Referans', 'qualified', 'Mevcut müşteri Hasan Bey referansı. Ciddi alıcı, ofis ziyareti planlıyor.'),
('3de3c038-8ce7-44b1-b5ba-8b99d63301f4', 'John Smith', '+447700123456', 'Google Ads', 'new', 'UK expat, retirement home arıyor.'),
('3de3c038-8ce7-44b1-b5ba-8b99d63301f4', 'Zeynep Aydın', '+905551112233', 'Facebook', 'lost', 'Bütçe uyuşmadı, 100K USD altı arıyordu.');


-- ── Firma seed (SCRUM-16 demo) ──────────────────────────

INSERT INTO companies (
    tenant_id, name, tax_number, tax_office, sector, phone, email, created_by, notes
) VALUES (
    '3de3c038-8ce7-44b1-b5ba-8b99d63301f4',
    'Kara Holding A.Ş.',
    '1234567890',
    'Beyoğlu VD',
    'Gayrimenkul Yatırım',
    '+902121234567',
    'info@karaholding.com',
    '17b64a78-1458-4bcf-8853-99cf42614380',
    'Ayşe Kara''nın firması. 3 adet villa toplu alım değerlendirmesi yapıyor.'
);
