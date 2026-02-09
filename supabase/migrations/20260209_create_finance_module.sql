-- Finance Module Core Schema
-- 1. Financial Accounts (Cari Hesaplar)
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Owner can be a Customer, a Profile (Broker/Personnel), or an Employee
    owner_type TEXT NOT NULL CHECK (owner_type IN ('Customer', 'Broker', 'Employee', 'Tedarikçi', 'Diğer')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    account_name TEXT NOT NULL,
    account_code TEXT, -- Unique code like CARI-001
    balance NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure at least one owner or a name for generic accounts
    CONSTRAINT finance_account_owner_check CHECK (
        (customer_id IS NOT NULL) OR 
        (employee_id IS NOT NULL) OR 
        (profile_id IS NOT NULL) OR 
        (owner_type = 'Diğer')
    )
);

-- 2. General Ledger (Borç/Alacak Hareketleri)
-- Borç (Debit): Customer owes us (e.g., Sale)
-- Alacak (Credit): Customer paid us (e.g., Cash, Check)
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('Debit', 'Credit')), -- Borç (+) / Alacak (-)
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    
    -- Track source of transaction
    reference_type TEXT CHECK (reference_type IN ('Sale', 'Payment', 'Check', 'Note', 'Manual', 'Commission')),
    reference_id UUID, -- Links to sale_id, payment_plan_id, etc.
    
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. Valuable Papers (Çek / Senet)
CREATE TABLE IF NOT EXISTS valuable_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
    
    paper_type TEXT NOT NULL CHECK (paper_type IN ('Check', 'PromissoryNote')), -- Çek / Senet
    paper_no TEXT, -- Seri No
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TRY',
    due_date DATE NOT NULL,
    
    -- Bank details for checks
    bank_name TEXT,
    branch_name TEXT,
    account_no TEXT,
    
    status TEXT DEFAULT 'Portfolio' CHECK (status IN ('Portfolio', 'Collected', 'Endorsed', 'Rejected', 'Returned')),
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuable_papers ENABLE ROW LEVEL SECURITY;

-- Policy Generators
DO $$
BEGIN
    -- Financial Accounts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant financial_accounts') THEN
        CREATE POLICY "Users can view own tenant financial_accounts" ON financial_accounts
            FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Finance Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant finance_transactions') THEN
        CREATE POLICY "Users can view own tenant finance_transactions" ON finance_transactions
            FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;

    -- Valuable Papers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant valuable_papers') THEN
        CREATE POLICY "Users can view own tenant valuable_papers" ON valuable_papers
            FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;

-- 5. Helper Function to Update Balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'Debit' THEN
            UPDATE financial_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSE
            UPDATE financial_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'Debit' THEN
            UPDATE financial_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSE
            UPDATE financial_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance
AFTER INSERT OR DELETE ON finance_transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();
