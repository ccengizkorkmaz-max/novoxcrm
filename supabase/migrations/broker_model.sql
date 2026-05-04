-- =============================================
-- BROKER MODEL: Customers tablosu güncellemesi
-- =============================================

-- Kişi türü kolonu (seller/buyer/tenant/landlord)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_type text DEFAULT 'buyer';

-- Alıcı/Kiracı arama kriterleri
ALTER TABLE customers ADD COLUMN IF NOT EXISTS budget_min numeric;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS budget_max numeric;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS desired_rooms text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS desired_area_min numeric;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS desired_districts text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS listing_preference text; -- sale/rent
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- =============================================
-- BROKER MODEL: Sözleşmeler tablosu
-- =============================================

CREATE TABLE IF NOT EXISTS broker_contracts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    contract_type text NOT NULL DEFAULT 'authorization', -- authorization, sale, rental, commission
    customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
    portfolio_id uuid REFERENCES portfolios(id) ON DELETE SET NULL,
    title text NOT NULL DEFAULT 'Sözleşme',
    status text NOT NULL DEFAULT 'draft', -- draft, pending, active, expired, cancelled
    start_date date,
    end_date date,
    amount numeric,
    commission_rate numeric,
    commission_amount numeric,
    currency text DEFAULT 'TRY',
    notes text,
    template_design jsonb, -- Unlayer Document Builder design JSON
    template_html text,    -- Rendered HTML
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE broker_contracts ENABLE ROW LEVEL SECURITY;

-- Tenant isolation
CREATE POLICY "broker_contracts_tenant_isolation" ON broker_contracts
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_broker_contracts_tenant ON broker_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_broker_contracts_type ON broker_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_broker_contracts_status ON broker_contracts(status);
CREATE INDEX IF NOT EXISTS idx_broker_contracts_customer ON broker_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_broker_contracts_portfolio ON broker_contracts(portfolio_id);

-- Customers indexleri
CREATE INDEX IF NOT EXISTS idx_customers_contact_type ON customers(contact_type);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);
