-- 1. Add offer_number column
ALTER TABLE offers ADD COLUMN IF NOT EXISTS offer_number TEXT;

-- 2. Create Sequence
CREATE SEQUENCE IF NOT EXISTS offer_number_seq START 1;

-- 3. Create Function to generate offer number
CREATE OR REPLACE FUNCTION generate_offer_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INTEGER;
    year_val TEXT;
BEGIN
    -- Get next sequence value
    seq_val := nextval('offer_number_seq');
    -- Get current year
    year_val := to_char(NOW(), 'YYYY');
    
    -- Format: OFF-2024-0001
    NEW.offer_number := 'OFF-' || year_val || '-' || LPAD(seq_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger (only sets if null)
DROP TRIGGER IF EXISTS set_offer_number ON offers;
CREATE TRIGGER set_offer_number
    BEFORE INSERT ON offers
    FOR EACH ROW
    WHEN (NEW.offer_number IS NULL)
    EXECUTE FUNCTION generate_offer_number();

-- 5. Backfill existing records
DO $$
DECLARE
    r RECORD;
    seq_val INTEGER;
    year_val TEXT;
BEGIN
    FOR r IN SELECT id, created_at FROM offers WHERE offer_number IS NULL ORDER BY created_at ASC
    LOOP
        seq_val := nextval('offer_number_seq');
        year_val := to_char(r.created_at, 'YYYY'); -- Use creation year for backfill
        
        UPDATE offers
        SET offer_number = 'OFF-' || year_val || '-' || LPAD(seq_val::TEXT, 4, '0')
        WHERE id = r.id;
    END LOOP;
END;
$$;
