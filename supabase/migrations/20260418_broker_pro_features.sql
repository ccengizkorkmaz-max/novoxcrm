-- =====================================================
-- BELGE YÖNETİMİ (Document Management)
-- =====================================================

-- Doküman tablosu
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- İlişki (polymorphic)
    entity_type TEXT NOT NULL CHECK (entity_type IN ('portfolio', 'customer', 'sale', 'agent')),
    entity_id UUID NOT NULL,
    
    -- Dosya bilgileri
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    file_type TEXT, -- mime type
    
    -- Kategori
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN (
            'authorization',    -- Yetki Belgesi
            'title_deed',       -- Tapu
            'identity',         -- Kimlik / Pasaport
            'contract',         -- Sözleşme
            'appraisal',        -- Ekspertiz Raporu
            'zoning',           -- İmar Durumu
            'floor_plan',       -- Kat Planı
            'energy_cert',      -- Enerji Kimlik Belgesi
            'insurance',        -- Sigorta
            'invoice',          -- Fatura
            'receipt',          -- Makbuz
            'photo',            -- Fotoğraf
            'other'             -- Diğer
        )),
    
    -- Meta
    description TEXT,
    expiry_date DATE,           -- Son kullanma tarihi (yetki belgesi vs.)
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    
    -- Yükleyen
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_tenant_isolation" ON documents
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- PAZARLAMA OTOMASYONU (Marketing Automation)
-- =====================================================

-- Kampanya tablosu
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    
    -- Hedef kitle
    target_filter JSONB DEFAULT '{}',  -- { "status": "Lead", "source": "Sahibinden", ... }
    target_count INTEGER DEFAULT 0,
    
    -- İçerik
    subject TEXT,                       -- E-posta konusu
    body TEXT,                          -- İçerik (HTML veya plain text)
    template_id TEXT,                   -- Harici şablon ID
    
    -- Zamanlama
    schedule_type TEXT DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'scheduled', 'drip')),
    scheduled_at TIMESTAMPTZ,
    drip_delay_hours INTEGER,           -- Drip kampanyalarda bekleme süresi
    drip_sequence INTEGER DEFAULT 1,    -- Drip'te kaçıncı adım
    parent_campaign_id UUID REFERENCES campaigns(id), -- Drip zinciri
    
    -- İstatistikler
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    -- Meta
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kampanya alıcıları
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- E-posta şablonları
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'listing', 'follow_up', 'welcome', 'birthday', 'anniversary', 'price_change')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,         -- HTML template with {{variables}}
    variables JSONB DEFAULT '[]',  -- Available merge fields
    
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_tenant_isolation" ON campaigns
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "campaign_recipients_via_campaign" ON campaign_recipients
    FOR ALL USING (campaign_id IN (SELECT id FROM campaigns WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "email_templates_tenant_isolation" ON email_templates
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_customer ON campaign_recipients(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);

-- =====================================================
-- GELİŞMİŞ KOMİSYON SİSTEMİ
-- =====================================================

-- Komisyon planları
CREATE TABLE IF NOT EXISTS commission_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name TEXT NOT NULL,                -- Plan adı (örn: "Junior Plan", "Senior Plan")
    description TEXT,
    
    -- Split oranları
    agent_split_pct NUMERIC(5,2) NOT NULL DEFAULT 50,    -- Danışman payı %
    office_split_pct NUMERIC(5,2) NOT NULL DEFAULT 50,   -- Ofis payı %
    franchise_fee_pct NUMERIC(5,2) DEFAULT 0,            -- Franchise payı % (RE/MAX: 8%)
    
    -- CAP (Tavan)
    cap_enabled BOOLEAN DEFAULT false,
    cap_amount NUMERIC(12,2) DEFAULT 0,        -- Yıllık max ofis payı
    cap_period TEXT DEFAULT 'yearly' CHECK (cap_period IN ('yearly', 'quarterly', 'monthly')),
    
    -- Katmanlı split (tier-based)
    tier_enabled BOOLEAN DEFAULT false,
    tiers JSONB DEFAULT '[]',
    -- Örnek: [{"from": 0, "to": 500000, "agent_pct": 50}, {"from": 500000, "to": 1000000, "agent_pct": 60}, {"from": 1000000, "to": null, "agent_pct": 70}]
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Danışman → Plan eşleştirmesi
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission_plan_id UUID REFERENCES commission_plans(id);

-- RLS
ALTER TABLE commission_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_plans_tenant_isolation" ON commission_plans
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_commission_plans_tenant ON commission_plans(tenant_id);
