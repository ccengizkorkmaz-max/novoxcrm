-- Create project_expenses table for construction and site cost management
CREATE TABLE IF NOT EXISTS project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                  -- Örn: C35 Hazır Beton Alımı
    category TEXT NOT NULL,               -- Beton, Demir, İşçilik, Ruhsat, Hafriyat vb.
    amount NUMERIC NOT NULL,              -- 450000.00
    currency TEXT DEFAULT 'TRY',          -- TRY, USD, EUR
    expense_date DATE NOT NULL,           -- Fatura / Harcama tarihi
    invoice_no TEXT,                      -- Fatura No
    supplier TEXT,                        -- Tedarikçi / Taşeron firma
    notes TEXT,                           -- Ek açıklamalar
    receipt_url TEXT,                     -- Fatura/belge linki
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_tenant_id ON project_expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_date ON project_expenses(expense_date);

-- RLS Enable
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view project_expenses of their tenant"
    ON project_expenses FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and managers can manage project_expenses"
    ON project_expenses FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'manager', 'crm_manager', 'super_admin')
        )
    );
