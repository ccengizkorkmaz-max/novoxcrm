
-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unit_types_name ON unit_types (name);

-- Insert comprehensive list of unit types
-- Using ON CONFLICT (name) to update order_index if it exists, or insert if it doesn't.
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
('5+2', 220)
ON CONFLICT (name) DO UPDATE SET order_index = EXCLUDED.order_index;
