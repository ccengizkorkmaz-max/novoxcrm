-- Fix generate_customer_number to support sequences over 9999
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INTEGER;
    seq_text TEXT;
BEGIN
    -- Get next sequence value from sequence generator
    seq_val := nextval('customer_number_seq');
    seq_text := seq_val::TEXT;
    
    -- Format: C-1001
    -- Avoid truncating sequences larger than 4 digits
    IF length(seq_text) < 4 THEN
        NEW.customer_number := 'C-' || LPAD(seq_text, 4, '0');
    ELSE
        NEW.customer_number := 'C-' || seq_text;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also fix duplicated customer_numbers created recently 
DO $$
DECLARE
    r RECORD;
    seq_val INTEGER;
    seq_text TEXT;
BEGIN
    FOR r IN SELECT id FROM customers 
             WHERE customer_number IN ('C-1123', 'C-1124', 'C-1125') 
             ORDER BY created_at ASC
    LOOP
        seq_val := nextval('customer_number_seq');
        seq_text := seq_val::TEXT;
        
        IF length(seq_text) < 4 THEN
            UPDATE customers SET customer_number = 'C-' || LPAD(seq_text, 4, '0') WHERE id = r.id;
        ELSE
            UPDATE customers SET customer_number = 'C-' || seq_text WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$;
