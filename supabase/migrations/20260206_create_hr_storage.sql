-- Create storage bucket for HR documents
insert into storage.buckets (id, name, public)
values ('hr-documents', 'hr-documents', true)
on conflict (id) do nothing;

-- Set up access policies for the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'hr-documents' );

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'hr-documents' and auth.role() = 'authenticated' );

create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'hr-documents' and auth.role() = 'authenticated' );

create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'hr-documents' and auth.role() = 'authenticated' );
