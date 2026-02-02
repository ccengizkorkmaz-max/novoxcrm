-- Enforce valid roles on profiles table
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'manager', 'sales', 'admin'));

-- Comment: 'admin' is potential legacy or system role, keeping it just in case, but primary roles are owner, manager, sales.
-- Set default to 'sales' if not already
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'sales';
