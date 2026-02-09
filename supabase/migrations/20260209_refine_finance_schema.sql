-- Refine Finance Module Schema for ERP-lite/Project-Centric requirements

-- 1. Update Financial Accounts
ALTER TABLE financial_accounts 
ADD COLUMN IF NOT EXISTS tax_no TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS risk_limit NUMERIC DEFAULT 0;

-- Update owner_type check constraint
ALTER TABLE financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_owner_type_check;
ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_owner_type_check CHECK (owner_type IN ('Customer', 'Tedarikçi', 'Personel', 'Broker', 'Diğer'));

-- 2. Update Finance Transactions
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- 3. Update Valuable Papers
ALTER TABLE valuable_papers
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'Alınan' CHECK (direction IN ('Alınan', 'Verilen')),
ADD COLUMN IF NOT EXISTS issuer TEXT, -- Keşideci / Borçlu
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE SET NULL;

-- Update status check constraint for Turkish terminology
ALTER TABLE valuable_papers DROP CONSTRAINT IF EXISTS valuable_papers_status_check;
ALTER TABLE valuable_papers ADD CONSTRAINT valuable_papers_status_check CHECK (status IN ('Portföyde', 'Tahsil Edildi', 'Ödendi', 'İade', 'Karşılıksız'));

-- Update default status to Turkish
ALTER TABLE valuable_papers ALTER COLUMN status SET DEFAULT 'Portföyde';
UPDATE valuable_papers SET status = 'Portföyde' WHERE status = 'Portfolio';
UPDATE valuable_papers SET status = 'Tahsil Edildi' WHERE status = 'Collected';
UPDATE valuable_papers SET status = 'İade' WHERE status = 'Returned';
