-- Add customer_number column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number TEXT;

-- Create Sequence for Customer Numbers
CREATE SEQUENCE IF NOT EXISTS customer_number_seq START 1000;

-- Function to generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INTEGER;
BEGIN
    -- Get next sequence value
    seq_val := nextval('customer_number_seq');
    
    -- Format: C-1001
    NEW.customer_number := 'C-' || LPAD(seq_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger to auto-set customer_number
DROP TRIGGER IF EXISTS set_customer_number ON customers;
CREATE TRIGGER set_customer_number
    BEFORE INSERT ON customers
    FOR EACH ROW
    WHEN (NEW.customer_number IS NULL)
    EXECUTE FUNCTION generate_customer_number();

-- Backfill existing customers
DO $$
DECLARE
    r RECORD;
    seq_val INTEGER;
BEGIN
    FOR r IN SELECT id FROM customers WHERE customer_number IS NULL ORDER BY created_at ASC
    LOOP
        seq_val := nextval('customer_number_seq');
        UPDATE customers
        SET customer_number = 'C-' || LPAD(seq_val::TEXT, 4, '0')
        WHERE id = r.id;
    END LOOP;
END;
$$;
