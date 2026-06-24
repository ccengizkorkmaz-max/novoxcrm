-- ============================================================
-- NovoCRM: Firma (Kurumsal Müşteri) & Adres Yönetimi
-- SCRUM-16: companies tablosu
-- SCRUM-17: customer_addresses tablosu
-- ============================================================

-- ── 1. Companies (Kurumsal Müşteri / Firma) ──────────────────
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Firma Bilgileri
    name TEXT NOT NULL,
    tax_number TEXT,           -- Vergi No
    tax_office TEXT,           -- Vergi Dairesi
    trade_registry_no TEXT,    -- Ticaret Sicil No
    sector TEXT,               -- Sektör
    website TEXT,
    
    -- İletişim
    phone TEXT,
    email TEXT,
    
    -- Durum
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive')),
    notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_companies_tax ON companies(tenant_id, tax_number);

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_tenant_isolation" ON companies
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- updated_at trigger
CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── 2. customers → company ilişkisi ────────────────────────
ALTER TABLE customers 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);

-- ── 3. Customer Addresses (Yapısal Adres) ─────────────────
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Polymorphic: müşteri veya firma adresi olabilir
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Adres tipi
    address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'billing', 'shipping', 'other')),
    is_primary BOOLEAN DEFAULT false,
    label TEXT,                -- Kullanıcı verdiği etiket: "Ev", "Ofis" vb.
    
    -- Adres alanları
    address_line1 TEXT NOT NULL,  -- Sokak, Mahalle, No
    address_line2 TEXT,           -- Apartman, Kat, Daire
    district TEXT,                -- İlçe
    city TEXT NOT NULL,           -- İl
    state TEXT,                   -- Eyalet (uluslararası için)
    postal_code TEXT,             -- Posta kodu
    country TEXT DEFAULT 'Türkiye',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- En az biri dolu olmalı
    CONSTRAINT chk_address_owner CHECK (customer_id IS NOT NULL OR company_id IS NOT NULL)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_company ON customer_addresses(company_id);
CREATE INDEX IF NOT EXISTS idx_addresses_tenant ON customer_addresses(tenant_id);

-- RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses_tenant_isolation" ON customer_addresses
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- updated_at trigger
CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ── 4. leads → company_id (firma lead'i olabilir) ─────────
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS converted_company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- ── 5. Realtime ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_addresses;
