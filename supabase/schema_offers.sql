-- Create Trigger Function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create OFFERS table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id), -- The sales rep who created it
    
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'TRY',
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired')),
    
    valid_until DATE,
    payment_plan JSONB, -- Stores structured payment terms (e.g. { "down_payment": 50000, "installments": 12 })
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for OFFERS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view offers from their own tenant
CREATE POLICY "Users can view own tenant offers" ON offers
    FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policy: Users can insert offers (must belong to their tenant)
CREATE POLICY "Users can insert offers" ON offers
    FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policy: Users can update offers from their own tenant
CREATE POLICY "Users can update own tenant offers" ON offers
    FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policy: Users can delete offers from their own tenant
CREATE POLICY "Users can delete own tenant offers" ON offers
    FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_offers_modtime
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
