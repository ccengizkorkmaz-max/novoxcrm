-- ============================================
-- Müşteri Profilleme & Anket Modülü Migration
-- NovoCRM — 2026-06-10
-- ============================================

-- 1. Customers tablosuna profil alanları ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_customers_profile_data ON customers USING GIN (profile_data);

-- 2. Anket Şablonları
CREATE TABLE IF NOT EXISTS survey_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Anket Yanıtları
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  answers JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  sent_via TEXT DEFAULT 'manual',
  synced_to_profile BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_survey_templates_tenant ON survey_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_tenant ON survey_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_customer ON survey_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_slug ON survey_responses(slug);

-- 4. RLS Policies
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Survey Templates: tenant isolation
CREATE POLICY "survey_templates_tenant_isolation" ON survey_templates
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Survey Responses: tenant isolation
CREATE POLICY "survey_responses_tenant_isolation" ON survey_responses
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Survey Responses: allow anonymous insert for public survey submission
CREATE POLICY "survey_responses_public_submit" ON survey_responses
  FOR UPDATE USING (true)
  WITH CHECK (true);
