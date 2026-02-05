
-- Create unit_types table
CREATE TABLE IF NOT EXISTS unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON unit_types
    FOR SELECT USING (true); -- Ideally filter by tenant_id if implementing multi-tenancy strictly, but broadly ok for now given current patterns

CREATE POLICY "Enable insert for authenticated users only" ON unit_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON unit_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON unit_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default values
INSERT INTO unit_types (name, order_index) VALUES
('1+1', 10),
('2+1', 20),
('3+1', 30),
('4+1', 40),
('Villa', 50),
('Ticari', 60),
('Ofis', 70),
('Depo', 80),
('Dubleks', 90),
('Penthouse', 100)
ON CONFLICT DO NOTHING;
