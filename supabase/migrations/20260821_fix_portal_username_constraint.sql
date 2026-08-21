-- Fix portal_username unique constraint
-- Problem: The UNIQUE constraint on portal_username causes errors when updating customers
-- because empty/null values conflict with each other.
-- Solution: Replace the strict UNIQUE constraint with a partial unique index
-- that only enforces uniqueness for non-null, non-empty values.

-- 1. Drop the existing unique constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_portal_username_key;

-- 2. Drop any existing indexes on portal_username
DROP INDEX IF EXISTS idx_customers_portal_username;
DROP INDEX IF EXISTS idx_customers_portal_username_unique;

-- 3. Clean up any empty string values (set them to NULL)
UPDATE customers SET portal_username = NULL WHERE portal_username = '';
UPDATE customers SET portal_password = NULL WHERE portal_password = '';

-- 4. Create a partial unique index (only applies to non-null, non-empty values)
CREATE UNIQUE INDEX idx_customers_portal_username_unique 
  ON customers (portal_username) 
  WHERE portal_username IS NOT NULL AND portal_username != '';
