-- Debug: Check if documents are being inserted
-- Run this query in Supabase SQL Editor to see all documents

SELECT 
    pd.*,
    p.name as project_name,
    prof.full_name as uploader_name
FROM project_documents pd
LEFT JOIN projects p ON pd.project_id = p.id
LEFT JOIN profiles prof ON pd.uploaded_by = prof.id
ORDER BY pd.created_at DESC
LIMIT 20;

-- Check if RLS policies are working
-- This should show your tenant_id
SELECT tenant_id FROM profiles WHERE id = auth.uid();

-- Check storage bucket
-- Make sure 'crm-images' bucket exists and has proper policies
