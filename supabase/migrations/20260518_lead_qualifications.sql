-- Lead Qualifications Table
-- Ön Değerlendirme (Lead Qualification) modülü için ana tablo
-- Müşteri kaydı ile satış hunisi arasında bir eleme/nitelendirme katmanı sağlar

CREATE TABLE IF NOT EXISTS lead_qualifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Durum Yönetimi
    -- new: Henüz aranmadı
    -- contacted: İlk temas yapıldı
    -- follow_up: Takipte, tekrar aranacak
    -- unreachable: Ulaşılamadı
    -- disqualified: Elendi / Olumsuz
    -- qualified: Nitelikli, satışa aktarılabilir
    status          TEXT NOT NULL DEFAULT 'new',
    
    -- Kaynak Bilgisi
    source          TEXT,               -- 'meta_ads', 'whatsapp', 'web_form', 'manual', 'referral'
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    campaign_name   TEXT,               -- Meta Ads kampanya adı veya platformu
    
    -- İletişim Geçmişi
    call_count      INT DEFAULT 0,
    last_call_at    TIMESTAMPTZ,
    last_call_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Değerlendirme
    interest_level  TEXT,               -- 'hot', 'warm', 'cold', 'none'
    budget_fit      BOOLEAN,
    timeline        TEXT,               -- 'immediate', '1_3_months', '3_6_months', '6_plus_months'
    
    -- Notlar
    call_notes      TEXT,               -- En son arama notu
    disqualify_reason TEXT,             -- Elendiyse neden
    
    -- Atama
    assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Satışa Aktarım
    converted_at    TIMESTAMPTZ,        -- Satış hunisine aktarıldığı an
    sale_id         UUID REFERENCES sales(id) ON DELETE SET NULL,
    
    -- Zaman Damgaları
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lq_tenant_id ON lead_qualifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lq_customer_id ON lead_qualifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_lq_status ON lead_qualifications(status);
CREATE INDEX IF NOT EXISTS idx_lq_assigned_to ON lead_qualifications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lq_tenant_status ON lead_qualifications(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lq_project_id ON lead_qualifications(project_id);

-- RLS
ALTER TABLE lead_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead_qualifications for their tenant"
    ON lead_qualifications FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert lead_qualifications for their tenant"
    ON lead_qualifications FOR INSERT
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update lead_qualifications for their tenant"
    ON lead_qualifications FOR UPDATE
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete lead_qualifications for their tenant"
    ON lead_qualifications FOR DELETE
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access to lead_qualifications"
    ON lead_qualifications FOR ALL
    USING (auth.role() = 'service_role');

-- Grants for Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_qualifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_qualifications TO service_role;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_lead_qualifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lead_qualifications_updated_at
    BEFORE UPDATE ON lead_qualifications
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_qualifications_updated_at();
