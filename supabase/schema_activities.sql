-- 12. Activities
create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  user_id uuid references profiles(id), -- Assigned To / Created By
  type text not null, -- 'Phone', 'Email', 'Visit', 'Meeting', 'Other'
  summary text,
  notes text,
  due_date timestamp with time zone, -- For planning future activities
  completed_at timestamp with time zone, -- If null, it's pending/planned
  status text default 'Planned', -- 'Planned', 'Completed', 'Cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table activities enable row level security;

-- Policies
create policy "View own tenant activities" on activities
  for select using (tenant_id in (select tenant_id from profiles where id = auth.uid()));

create policy "Manage own tenant activities" on activities
  for all using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
