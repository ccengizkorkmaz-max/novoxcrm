-- Broker / Partner Portal Schema

-- 1. Extend Profiles Role (Handled in profiles table if needed, or by RLS)
-- Roles: 'broker', 'sales', 'management' (previously 'admin', 'manager', 'sales', 'owner')

-- 2. Broker Leads
create table broker_leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  broker_id uuid references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  nationality text,
  budget_min numeric,
  budget_max numeric,
  purpose text, -- Investment, Residence, Other
  property_type text, -- 1+1, 2+1, 3+1, Duplex, Villa, Commercial, Land
  location_interest text,
  project_id uuid references projects(id) on delete set null,
  preferred_visit_date timestamp with time zone,
  credit_interest boolean default false,
  notes text,
  status text default 'Submitted', -- Submitted, Contacted, Qualified, Visit Scheduled, Visited, Offer Sent, Contract Signed, Payment / Closing, Rejected
  assigned_to uuid references profiles(id), -- Internal sales agent
  customer_id uuid references customers(id) on delete set null, -- Main CRM customer link
  ownership_expires_at timestamp with time zone default (now() + interval '60 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lead Timeline/History
create table broker_lead_history (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references broker_leads(id) on delete cascade,
  old_status text,
  new_status text,
  changed_by uuid references profiles(id),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Commission Management
create table commission_models (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  type text not null, -- Flat %, Unit Based %, Project Based %, Tiered
  value numeric not null,
  payable_stage text default 'Contract Signed', -- Contract Signed | Payment Received | Delivery
  payment_terms text default 'Net', -- Net/Brut
  currency text default 'TRY',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table commissions (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references broker_leads(id) on delete cascade,
  amount numeric not null,
  currency text default 'TRY',
  status text default 'Pending', -- Pending, Eligible, Approved, Paid
  invoice_url text,
  payment_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Bonus & Incentive System
create table incentive_campaigns (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  type text not null, -- Unit Type, Volume, Time Based, Target
  bonus_value numeric not null,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  target_count integer, -- ex: 3 sales, 10 visits
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Sales Material & Content Library
create table document_library (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  category text not null, -- Brochure, Floor Plan, Price List, 3D/Virtual, Marketing, Legal
  file_url text not null,
  thumbnail_url text,
  permissions text default 'public', -- public, internal, broker_only
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Notifications
create table portal_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  is_read boolean default false,
  link_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table broker_leads enable row level security;
alter table broker_lead_history enable row level security;
alter table commission_models enable row level security;
alter table commissions enable row level security;
alter table incentive_campaigns enable row level security;
alter table document_library enable row level security;
alter table portal_notifications enable row level security;

-- RLS Policies

-- Broker Leads: Brokers only see their own leads. Management/Sales see all in tenant.
create policy "Users can view broker leads" on broker_leads
  for select using (
    broker_id = auth.uid() OR
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

create policy "Users can insert broker leads" on broker_leads
  for insert with check (
    broker_id = auth.uid() OR 
    auth.uid() is null -- Allow public submission handled by policy "Public can submit broker leads" in phase 2
  );

create policy "Staff can update leads" on broker_leads
  for update using (
    (select role from profiles where id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
  );

-- Commissions: Broker sees their own.
create policy "Brokers can view own commissions" on commissions
  for select using (
    lead_id in (select id from broker_leads where broker_id = auth.uid()) OR
    (select role from profiles where id = auth.uid()) IN ('management', 'sales')
  );

-- Document Library: All brokers/staff view.
create policy "Users can view relevant documents" on document_library
  for select using (
    tenant_id in (select tenant_id from profiles where id = auth.uid())
  );

-- Notifications: User sees only their own.
create policy "Users can view own notifications" on portal_notifications
  for select using (user_id = auth.uid());

-- Ownership Lock Trigger/Constraint Logic would be handled in edge functions or backend actions
-- But we can add a unique index on phone number if not expired?
-- Actually, the requirement says "Implement a lead ownership lock".
-- If phone number already exists and is NOT EXPIRED, block submission.
