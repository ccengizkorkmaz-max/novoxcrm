-- Broker Application & Onboarding Schema

create table if not exists broker_applications (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  company_name text,
  email text not null,
  phone text not null,
  status text default 'Pending', -- Pending, Approved, Rejected
  notes text,
  admin_notes text,
  processed_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Enable RLS
alter table broker_applications enable row level security;

-- Policies
create policy "Public can insert applications" on broker_applications
  for insert with check (true);

create policy "Staff can view applications" on broker_applications
  for select using (
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

create policy "Staff can update applications" on broker_applications
  for update using (
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );
