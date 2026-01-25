-- Create OFFER_NEGOTIATIONS table
CREATE TABLE IF NOT EXISTS offer_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    proposed_by UUID REFERENCES profiles(id),
    source TEXT DEFAULT 'Sales' CHECK (source IN ('Sales', 'Customer')),
    
    proposed_price NUMERIC NOT NULL,
    proposed_currency TEXT DEFAULT 'TRY',
    proposed_valid_until DATE,
    proposed_payment_plan JSONB,

    
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE offer_negotiations ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own tenant negotiations') THEN
        CREATE POLICY "Users can view own tenant negotiations" ON offer_negotiations
            FOR SELECT
            USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert negotiations') THEN
        CREATE POLICY "Users can insert negotiations" ON offer_negotiations
            FOR INSERT
            WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own tenant negotiations') THEN
        CREATE POLICY "Users can update own tenant negotiations" ON offer_negotiations
            FOR UPDATE
            USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
    END IF;
END
$$;