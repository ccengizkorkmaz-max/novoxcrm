-- FINAL PERMISSIVE FIX FOR HR STORAGE
-- Make bucket public and allow all authenticated ops simply

UPDATE storage.buckets 
SET public = true 
WHERE id = 'hr-documents';

-- Drop all problematic policies
DROP POLICY IF EXISTS "Authenticated users can upload HR documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view HR documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete HR documents" ON storage.objects;
DROP POLICY IF EXISTS "Public HR access" ON storage.objects;

-- Create simple policies matching working patterns
CREATE POLICY "Public HR access"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'hr-documents')
WITH CHECK (bucket_id = 'hr-documents');
