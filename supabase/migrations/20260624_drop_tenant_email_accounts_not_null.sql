-- Migration: Drop NOT NULL constraint on legacy columns in tenant_email_accounts
-- Purpose: The UI now saves incoming/smtp specific credentials, so legacy username/password columns should be nullable.

ALTER TABLE tenant_email_accounts ALTER COLUMN username DROP NOT NULL;
ALTER TABLE tenant_email_accounts ALTER COLUMN password DROP NOT NULL;
