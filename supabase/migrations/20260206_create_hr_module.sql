-- HR Module Schema
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null, -- Links to CRM user if applicable
  sicil_no text,
  first_name text not null,
  last_name text not null,
  department text,
  manager_id uuid references employees(id) on delete set null,
  salary numeric,
  currency text default 'TRY',
  hire_date date,
  termination_date date,
  phone text,
  email text,
  region text,
  photo_url text,
  assets jsonb default '[]'::jsonb, -- Store checkboxes like Laptop, Araç, etc.
  status text default 'Active', -- Active, Passive
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists employee_documents (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table employees enable row level security;
alter table employee_documents enable row level security;

-- Policies
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'View own tenant employees') then
    create policy "View own tenant employees" on employees for select 
    using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Manage own tenant employees') then
    create policy "Manage own tenant employees" on employees for all 
    using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'View own employee documents') then
     create policy "View own employee documents" on employee_documents for select
     using (employee_id in (select id from employees where tenant_id in (select tenant_id from profiles where id = auth.uid())));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Manage own employee documents') then
     create policy "Manage own employee documents" on employee_documents for all
     using (employee_id in (select id from employees where tenant_id in (select tenant_id from profiles where id = auth.uid())));
  end if;
end
$$;
