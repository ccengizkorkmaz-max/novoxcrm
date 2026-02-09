-- TEMPORARY FIX: Disable RLS on employee_documents
ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;

-- This is NOT a permanent solution, just for testing
-- After confirming document upload works, we'll re-enable with proper policies
