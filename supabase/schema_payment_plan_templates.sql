-- Create payment_plan_templates table
create table if not exists payment_plan_templates (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text,
  project_id uuid references projects(id) on delete cascade,
  unit_type text, -- Optional: '2+1', '3+1' etc
  down_payment_rate numeric default 25,
  installment_count integer default 12,
  interim_payment_structure jsonb default '[]'::jsonb, -- Array of { month: number, rate: number }
  created_at timestamptz default now()
);

-- RLS Policies
alter table payment_plan_templates enable row level security;

create policy "Users can view own tenant templates"
  on payment_plan_templates for select
  using (tenant_id = (select tenant_id from profiles where id = auth.uid()));

create policy "Users can insert own tenant templates"
  on payment_plan_templates for insert
  with check (tenant_id = (select tenant_id from profiles where id = auth.uid()));

create policy "Users can update own tenant templates"
  on payment_plan_templates for update
  using (tenant_id = (select tenant_id from profiles where id = auth.uid()));

create policy "Users can delete own tenant templates"
  on payment_plan_templates for delete
  using (tenant_id = (select tenant_id from profiles where id = auth.uid()));
