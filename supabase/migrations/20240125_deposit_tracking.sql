-- Migration for Deposit Tracking Module
-- Centralized table to track deposits for reservations and offers

-- 1. Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Link to either a sale (reservation) or an offer
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Cancelled')),
    
    notes TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a deposit is linked to EXACTLY one source
    CONSTRAINT deposit_source_check CHECK (
        (sale_id IS NOT NULL AND offer_id IS NULL) OR 
        (sale_id IS NULL AND offer_id IS NOT NULL)
    )
);

-- 2. Add RLS Policies for deposits
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant deposits" ON deposits
    FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own tenant deposits" ON deposits
    FOR INSERT WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own tenant deposits" ON deposits
    FOR UPDATE USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Update Sales and Offers Status constraints if necessary
-- Note: In Supabase/Postgres, we might need to recreate the CHECK constraint or just allow the new text values if they are simple text columns.
-- Checking previous schemas: sales.status is text with Lead, Prospect, Reservation, Contract, Sold
-- Checking previous schemas: offers.status is text with Draft, Sent, Accepted, Rejected, Expired

-- We don't have strict CHECK constraints in schema_complete.sql for sales, 
-- but offers has: CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'))

-- Drop and recreate offers status check
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE offers ADD CONSTRAINT offers_status_check CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Teklif - Kapora Bekleniyor'));

-- We will use:
-- sales.status: 'Opsiyon - Kapora Bekleniyor'
-- offers.status: 'Teklif - Kapora Bekleniyor'
