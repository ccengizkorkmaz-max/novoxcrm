-- Create contract_documents table for file attachments
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    document_name TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant contract documents' AND tablename = 'contract_documents') THEN
        CREATE POLICY "Users can view own tenant contract documents" ON contract_documents FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own tenant contract documents' AND tablename = 'contract_documents') THEN
        CREATE POLICY "Users can insert own tenant contract documents" ON contract_documents FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own tenant contract documents' AND tablename = 'contract_documents') THEN
        CREATE POLICY "Users can delete own tenant contract documents" ON contract_documents FOR DELETE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;
