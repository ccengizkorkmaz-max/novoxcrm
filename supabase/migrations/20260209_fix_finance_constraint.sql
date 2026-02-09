-- Fix financial account owner constraint to allow stand-alone Supplier and Broker accounts
ALTER TABLE financial_accounts DROP CONSTRAINT IF EXISTS finance_account_owner_check;

ALTER TABLE financial_accounts ADD CONSTRAINT finance_account_owner_check CHECK (
    (customer_id IS NOT NULL) OR 
    (employee_id IS NOT NULL) OR 
    (profile_id IS NOT NULL) OR 
    (owner_type IN ('Tedarikçi', 'Diğer', 'Broker'))
);
