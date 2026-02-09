-- Drop and recreate policies with WITH CHECK for inserts
drop policy if exists "View own tenant employee documents" on employee_documents;
drop policy if exists "Manage own tenant employee documents" on employee_documents;

create policy "View own tenant employee documents" on employee_documents 
for select
using (tenant_id in (select tenant_id from profiles where id = auth.uid()));

create policy "Insert own tenant employee documents" on employee_documents 
for insert
with check (tenant_id in (select tenant_id from profiles where id = auth.uid()));

create policy "Update own tenant employee documents" on employee_documents 
for update
using (tenant_id in (select tenant_id from profiles where id = auth.uid()))
with check (tenant_id in (select tenant_id from profiles where id = auth.uid()));

create policy "Delete own tenant employee documents" on employee_documents 
for delete
using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
