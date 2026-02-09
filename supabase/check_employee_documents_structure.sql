-- Check if tenant_id column exists in employee_documents
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_documents';

-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'employee_documents';
