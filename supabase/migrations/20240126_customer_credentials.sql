-- Add portal credentials to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_username TEXT UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS portal_password TEXT;

-- Create index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_customers_portal_username ON customers(portal_username);
