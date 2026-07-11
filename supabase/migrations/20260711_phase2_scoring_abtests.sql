-- AI Lead Scoring - Prediktif Satın Alma Skoru
-- Müşteri tablosuna AI skor alanları ekleme
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_purchase_score INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_purchase_score_data JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_purchase_score_updated_at TIMESTAMPTZ;

-- A/B Test tablosu
CREATE TABLE IF NOT EXISTS outreach_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    script_a_id UUID,
    script_b_id UUID,
    status TEXT DEFAULT 'running',
    traffic_split REAL DEFAULT 0.5,
    stats_a JSONB DEFAULT '{"calls": 0, "answered": 0, "appointments": 0, "avg_duration": 0}',
    stats_b JSONB DEFAULT '{"calls": 0, "answered": 0, "appointments": 0, "avg_duration": 0}',
    winner TEXT,
    confidence REAL,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_ai_score ON customers(ai_purchase_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_ab_tests_tenant ON outreach_ab_tests(tenant_id, status);

-- RLS for AB tests
ALTER TABLE outreach_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read ab_tests" ON outreach_ab_tests
    FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Service role can manage ab_tests" ON outreach_ab_tests
    FOR ALL USING (true) WITH CHECK (true);
