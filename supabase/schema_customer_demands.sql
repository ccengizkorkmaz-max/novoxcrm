-- Customer Demands / Preferences
create table if not exists customer_demands (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade unique, -- One-to-one relationship
  min_price numeric,
  max_price numeric,
  currency text default 'TRY',
  room_count text[], -- e.g. ['2+1', '3+1']
  location_preference text,
  property_type text, -- Apartment, Villa, Office
  investment_purpose text, -- Living, Investment
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table customer_demands enable row level security;

-- Policy (using same logic as customers)
create policy "View own tenant customer demands" on customer_demands 
for select using (
  tenant_id in (select tenant_id from profiles where id = auth.uid())
);

create policy "Manage own tenant customer demands" on customer_demands 
for all using (
  tenant_id in (select tenant_id from profiles where id = auth.uid())
);
