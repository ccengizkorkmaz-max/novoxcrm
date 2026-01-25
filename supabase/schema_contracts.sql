
-- Create ENUMS
CREATE TYPE contract_status AS ENUM ('Draft', 'PendingSignature', 'Signed', 'Active', 'Completed', 'Cancelled', 'Transferred');
CREATE TYPE contract_type AS ENUM ('Sales', 'PreSales', 'Notary', 'Other');
CREATE TYPE payment_plan_type AS ENUM ('DownPayment', 'Installment', 'Balloon', 'DeliveryPayment', 'Other');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Partial', 'Cancelled');
CREATE TYPE customer_role AS ENUM ('Primary', 'Spouse', 'Partner', 'Guarantor', 'Representative');

-- Create CONTRACTS Table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    sales_rep_id UUID REFERENCES profiles(id),
    
    contract_number TEXT NOT NULL,
    status contract_status DEFAULT 'Draft',
    type contract_type DEFAULT 'Sales',
    
    contract_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    
    -- Financials
    currency TEXT DEFAULT 'TRY',
    amount NUMERIC NOT NULL DEFAULT 0, -- List Price
    discount_rate NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC NOT NULL DEFAULT 0, -- Net Price (Amount - Discount)
    vat_rate NUMERIC DEFAULT 0,
    vat_amount NUMERIC DEFAULT 0, -- (Final Amount * VAT Rate)
    total_amount NUMERIC NOT NULL DEFAULT 0, -- Gross Price (Final + VAT)
    
    down_payment_amount NUMERIC DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create CONTRACT CUSTOMERS Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS contract_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    role customer_role DEFAULT 'Primary',
    share_percentage NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create PAYMENT PLANS Table
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    
    payment_type payment_plan_type DEFAULT 'Installment',
    due_date DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    
    status payment_status DEFAULT 'Pending',
    paid_amount NUMERIC DEFAULT 0,
    paid_date DATE,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- Simple Tenant Policies (Assuming tenant_id presence and propagation)
CREATE POLICY "Users can view own tenant contracts" ON contracts FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own tenant contracts" ON contracts FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update own tenant contracts" ON contracts FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete own tenant contracts" ON contracts FOR DELETE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- For related tables, we check contract's tenant
CREATE POLICY "Users can view related contract customers" ON contract_customers FOR SELECT USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_customers.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can manage related contract customers" ON contract_customers FOR ALL USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_customers.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Users can view related payment plans" ON payment_plans FOR SELECT USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = payment_plans.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY "Users can manage related payment plans" ON payment_plans FOR ALL USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = payment_plans.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
