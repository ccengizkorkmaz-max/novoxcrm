-- 1. Create Missing ENUMS for Contracts (Safe Check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_role') THEN
        CREATE TYPE customer_role AS ENUM ('Primary', 'Spouse', 'Partner', 'Guarantor', 'Representative');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_plan_type') THEN
        CREATE TYPE payment_plan_type AS ENUM ('DownPayment', 'Installment', 'Balloon', 'DeliveryPayment', 'Other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Partial', 'Cancelled');
    END IF;
END $$;

-- 2. Create CONTRACT CUSTOMERS Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS contract_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    role customer_role DEFAULT 'Primary',
    share_percentage NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create/Sync PAYMENT PLANS Table for Contracts
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

-- 4. Enable RLS
ALTER TABLE contract_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies (Safe check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view related contract customers') THEN
        CREATE POLICY "Users can view related contract customers" ON contract_customers FOR SELECT USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_customers.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage related contract customers') THEN
        CREATE POLICY "Users can manage related contract customers" ON contract_customers FOR ALL USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_customers.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view related payment plans') THEN
        CREATE POLICY "Users can view related payment plans" ON payment_plans FOR SELECT USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = payment_plans.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage related payment plans') THEN
        CREATE POLICY "Users can manage related payment plans" ON payment_plans FOR ALL USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = payment_plans.contract_id AND c.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())));
    END IF;
END $$;
