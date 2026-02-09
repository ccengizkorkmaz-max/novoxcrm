-- Ensure the storage bucket exists
insert into storage.buckets (id, name, public)
values ('hr-documents', 'hr-documents', true)
on conflict (id) do update set public = true;

-- Drop existing storage policies for this bucket to avoid conflicts
drop policy if exists "Authenticated users can upload HR documents" on storage.objects;
drop policy if exists "Authenticated users can view HR documents" on storage.objects;
drop policy if exists "Authenticated users can delete HR documents" on storage.objects;

-- Create storage policies for the hr-documents bucket
-- For simplicity and consistency with the transition, we allow authenticated users 
-- to manage files. More granular path-based checks can be added if needed.

create policy "Authenticated users can upload HR documents"
on storage.objects for insert
to authenticated
with check (bucket_id = 'hr-documents');

create policy "Authenticated users can view HR documents"
on storage.objects for select
to authenticated
using (bucket_id = 'hr-documents');

create policy "Authenticated users can delete HR documents"
on storage.objects for delete
to authenticated
using (bucket_id = 'hr-documents');
