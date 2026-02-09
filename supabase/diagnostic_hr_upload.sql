-- COMPREHENSIVE DIAGNOSTIC SCRIPT
-- Run this in Supabase Dashboard and share results

-- 1. Check Table Structure
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'employee_documents';

-- 2. Check Database RLS Policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'employee_documents';

-- 3. Check Storage Bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'hr-documents';

SELECT 
    policyname, 
    permissive,
    roles,
    cmd,
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
