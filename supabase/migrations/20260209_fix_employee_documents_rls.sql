-- Add tenant_id to employee_documents table
alter table employee_documents 
add column if not exists tenant_id uuid references tenants(id) on delete cascade;

-- Update existing records to set tenant_id from employees table
update employee_documents ed
set tenant_id = e.tenant_id
from employees e
where ed.employee_id = e.id
and ed.tenant_id is null;

-- Drop old policies
drop policy if exists "View own employee documents" on employee_documents;
drop policy if exists "Manage own employee documents" on employee_documents;

-- Create new simplified policies using tenant_id
create policy "View own tenant employee documents" on employee_documents for select
using (tenant_id in (select tenant_id from profiles where id = auth.uid()));

create policy "Manage own tenant employee documents" on employee_documents for all
using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
