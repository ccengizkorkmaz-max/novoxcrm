
-- Broker Financial Management Extension

-- 1. Broker Payments Table
create table broker_payments (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references tenants(id) on delete cascade,
    broker_id uuid references profiles(id) on delete cascade,
    amount numeric not null,
    currency text default 'TRY',
    payment_date timestamp with time zone default timezone('utc'::text, now()),
    payment_method text, -- Bank Transfer, Cash, etc.
    reference_no text, -- Bank reference, receipt no
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Incentive Earnings Table (To capture earned bonuses)
create table incentive_earnings (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references tenants(id) on delete cascade,
    broker_id uuid references profiles(id) on delete cascade,
    campaign_id uuid references incentive_campaigns(id) on delete set null,
    amount numeric not null,
    currency text default 'TRY',
    status text default 'Eligible', -- Eligible, Approved, Paid
    description text,
    payment_id uuid references broker_payments(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Update Commissions Table
alter table commissions add column if not exists payment_id uuid references broker_payments(id) on delete set null;

-- Enable RLS
alter table broker_payments enable row level security;
alter table incentive_earnings enable row level security;

-- RLS Policies
create policy "Users can view broker payments" on broker_payments
  for select using (
    broker_id = auth.uid() OR
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

create policy "Staff can manage payments" on broker_payments
  for all using (
    (select role from profiles where id = auth.uid()) IN ('management', 'owner', 'admin')
  );

create policy "Users can view incentive earnings" on incentive_earnings
  for select using (
    broker_id = auth.uid() OR
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

create policy "Staff can manage incentive earnings" on incentive_earnings
  for all using (
    (select role from profiles where id = auth.uid()) IN ('management', 'owner', 'admin')
  );
