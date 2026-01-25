-- Create contract_activities table for audit trail
CREATE TABLE IF NOT EXISTS contract_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'payment_confirmed', 'document_uploaded', 'document_deleted', 'status_changed', etc.
    description TEXT NOT NULL,
    metadata JSONB, -- Additional data like payment amount, document name, etc.
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contract_activities_contract_id ON contract_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_created_at ON contract_activities(created_at DESC);

-- Enable RLS
ALTER TABLE contract_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant contract activities' AND tablename = 'contract_activities') THEN
        CREATE POLICY "Users can view own tenant contract activities" ON contract_activities FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own tenant contract activities' AND tablename = 'contract_activities') THEN
        CREATE POLICY "Users can insert own tenant contract activities" ON contract_activities FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;
