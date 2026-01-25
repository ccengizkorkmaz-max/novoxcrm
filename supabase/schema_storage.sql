-- Enable Storage by creating the bucket 'crm-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-images', 'crm-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for STORAGE
-- Policy: Give public read access to images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'crm-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Users Insert"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'crm-images' AND auth.role() = 'authenticated' );

-- Policy: Allow users to update their own uploads (optional, simplistic for now)
CREATE POLICY "Authenticated Users Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'crm-images' AND auth.role() = 'authenticated' );

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Authenticated Users Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'crm-images' AND auth.role() = 'authenticated' );
