-- ============================================
-- Müşteri Kartı Zenginleştirme Migration
-- NovoCRM — 2026-06-15
-- ============================================

-- 1. Yeni sütunlar — customers tablosu
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS heard_from TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Index
CREATE INDEX IF NOT EXISTS idx_customers_gender ON customers(gender);
CREATE INDEX IF NOT EXISTS idx_customers_heard_from ON customers(heard_from);

-- 2. Dinamik Kaynak Seçenekleri Tablosu (tenant bazlı)
CREATE TABLE IF NOT EXISTS customer_source_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, label)
);

ALTER TABLE customer_source_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_source_options_tenant_isolation" ON customer_source_options
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 3. Seed varsayılan kaynak seçenekleri (tüm mevcut tenant'lara)
INSERT INTO customer_source_options (tenant_id, label, is_default, sort_order)
SELECT t.id, s.label, true, s.sort_order
FROM tenants t
CROSS JOIN (VALUES
  ('Web Sitesi', 1),
  ('Kapı (Satış Ofisi)', 2),
  ('Call Center', 3),
  ('Sosyal Medya', 4),
  ('İletişim Formu', 5),
  ('Acenta', 6),
  ('Dijital Reklam', 7),
  ('Referans', 8),
  ('Fuar', 9),
  ('Reklam Panoları', 10),
  ('TV Reklamları', 11),
  ('Sponsorluk', 12)
) AS s(label, sort_order)
ON CONFLICT (tenant_id, label) DO NOTHING;

-- 4. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_updated_at ON customers;
CREATE TRIGGER trg_customer_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_updated_at();
