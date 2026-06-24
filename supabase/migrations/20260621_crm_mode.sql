-- ============================================================
-- NovoCRM: Basic vs Advance CRM Mode
-- Tek yönlü geçiş altyapısı (basic → advance, geri alınamaz)
-- ============================================================

-- 1. Tenant tablosuna crm_mode kolonu
ALTER TABLE tenants 
  ADD COLUMN IF NOT EXISTS crm_mode text NOT NULL DEFAULT 'basic';

-- Check constraint (idempotent)
DO $$ BEGIN
  ALTER TABLE tenants ADD CONSTRAINT tenants_crm_mode_check 
    CHECK (crm_mode IN ('basic', 'advance'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tenant bazlı özelleştirilebilir pipeline aşamaları (JSON)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS pipeline_stages jsonb NOT NULL DEFAULT '[
    {"key": "prospect", "label": "Aday", "color": "#6366f1", "order": 1},
    {"key": "qualified", "label": "Nitelikli", "color": "#8b5cf6", "order": 2},
    {"key": "proposal", "label": "Teklif", "color": "#f59e0b", "order": 3},
    {"key": "negotiation", "label": "Müzakere", "color": "#f97316", "order": 4},
    {"key": "won", "label": "Kazanıldı", "color": "#22c55e", "order": 5},
    {"key": "lost", "label": "Kaybedildi", "color": "#ef4444", "order": 6}
  ]'::jsonb;

-- 2. Leads (Müşteri Adayları) tablosu
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'new',
  source text,
  -- Pazarlama / Reklam parametreleri
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ad_id text,
  campaign_id text,
  form_name text,
  -- Atama
  assigned_to uuid REFERENCES profiles(id),
  -- Notlar
  notes text,
  -- Dönüştürme bilgisi
  converted_customer_id uuid REFERENCES customers(id),
  converted_at timestamptz,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Check constraint for lead status
DO $$ BEGIN
  ALTER TABLE leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Opportunities (Fırsatlar / Satış Hunisi) tablosu
-- stage alanı CHECK constraint YOK — tenant bazlı pipeline_stages JSON'dan yönetilir
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  stage text NOT NULL DEFAULT 'prospect',
  -- Çoklu para birimi desteği
  value numeric(15,2),
  currency text DEFAULT 'TRY',
  value_try numeric(15,2),          -- TRY karşılığı (raporlama için)
  exchange_rate numeric(10,4),      -- Kullanılan döviz kuru
  rate_date date,                   -- Kurun tarihi
  close_date date,
  -- İlişkiler
  assigned_to uuid REFERENCES profiles(id),
  project_id uuid REFERENCES projects(id),
  lead_id uuid REFERENCES leads(id),
  -- Notlar
  notes text,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Currency check constraint
DO $$ BEGIN
  ALTER TABLE opportunities ADD CONSTRAINT opportunities_currency_check 
    CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(tenant_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(tenant_id, email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned ON opportunities(assigned_to) WHERE assigned_to IS NOT NULL;

-- 5. RLS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Leads: tenant isolation
DO $$ BEGIN
  CREATE POLICY "leads_tenant_isolation" ON leads
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Opportunities: tenant isolation
DO $$ BEGIN
  CREATE POLICY "opportunities_tenant_isolation" ON opportunities
    FOR ALL USING (tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER opportunities_updated_at
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Enable realtime for leads and opportunities
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE leads;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
