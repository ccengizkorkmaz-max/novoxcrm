-- Add parameters column to payment_plans to store calculation metadata
-- Using session_replication_role to bypass potential trigger failures during migration
SET session_replication_role = 'replica';
ALTER TABLE payment_plans ADD COLUMN IF NOT EXISTS parameters JSONB;
SET session_replication_role = 'origin';
