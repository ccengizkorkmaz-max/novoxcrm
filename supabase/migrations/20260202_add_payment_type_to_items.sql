
-- Migration to add payment_type to payment_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payment_items' AND column_name='payment_type') THEN
        ALTER TABLE payment_items ADD COLUMN payment_type text;
    END IF;
END $$;
