-- Phase 2: Advanced Commissions & External Lead Forms

-- 1. Commission Tiers
create table commission_tiers (
  id uuid primary key default uuid_generate_v4(),
  model_id uuid references commission_models(id) on delete cascade,
  min_units integer not null default 0,
  max_units integer, -- null means "and above"
  commission_value numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table commission_tiers enable row level security;

create policy "Management can manage commission tiers" on commission_tiers
  for all using (
    (select role from profiles where id = auth.uid()) IN ('management', 'sales')
  );

create policy "Brokers can view commission tiers" on commission_tiers
  for select using (
    exists (
      select 1 from commission_models m 
      where m.id = commission_tiers.model_id 
      and m.tenant_id = (select tenant_id from profiles where id = auth.uid())
    )
  );

-- 2. External Forms Support
alter table profiles add column if not exists broker_slug text unique;

-- Function to generate unique slug for existing brokers (one-time/manual or trigged)
-- For now, we'll allow brokers to set their slug or auto-generate on profile edit.

-- Enable public access for certain functions/tables if needed for public lead form
-- broker_leads insert needs to be public-accessible if we don't use a proxy action
-- but it's safer to use a service-role action for public submissions.

-- 4. Public Access for External Forms
-- Allow anyone to see basic broker info by slug
create policy "Public can view broker info by slug" on profiles
  for select using (broker_slug is not null);

-- Allow public lead submission
create policy "Public can submit broker leads" on broker_leads
  for insert with check (true);

-- Allow public lead history logging for submissions
create policy "Public can log lead history" on broker_lead_history
  for insert with check (true);
