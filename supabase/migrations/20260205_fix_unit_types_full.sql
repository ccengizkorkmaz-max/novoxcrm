
-- FULL RESET script for unit_types
-- Run this to fix missing table or data issues.

-- 1. Drop existing table to ensure clean state
DROP TABLE IF EXISTS unit_types CASCADE;

-- 2. Create table
CREATE TABLE unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create unique index (Important for conflict handling)
CREATE UNIQUE INDEX idx_unit_types_name ON unit_types (name);

-- 4. Enable RLS
ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "Enable read access for all users" ON unit_types
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON unit_types
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON unit_types
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON unit_types
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Insert Data
INSERT INTO unit_types (name, order_index) VALUES
('Stüdyo (1+0)', 10),
('1+1', 20),
('1.5+1', 30),
('2+0', 40),
('2+1', 50),
('2.5+1', 60),
('2+2', 70),
('3+0', 80),
('3+1', 90),
('3.5+1', 100),
('3+2', 110),
('3+3', 120),
('4+0', 130),
('4+1', 140),
('4.5+1', 150),
('4.5+2', 160),
('4+2', 170),
('4+3', 180),
('4+4', 190),
('5+1', 200),
('5.5+1', 210),
('5+2', 220),
('Villa', 300),
('Ticari', 310),
('Ofis', 320),
('Depo', 330),
('Dubleks', 340),
('Penthouse', 350);
