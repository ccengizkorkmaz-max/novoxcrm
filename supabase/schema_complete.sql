-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- BASE MODULE
-- ==========================================

-- 1. Tenants
create table if not exists tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Profiles (Users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  role text default 'sales', -- admin, manager, sales, owner
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Projects
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  city text,
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Blocks
create table if not exists blocks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null
);

-- 5. Units (Inventory)
create table if not exists units (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  block_id uuid references blocks(id) on delete set null,
  unit_number text not null,
  type text, -- 2+1, 3+1
  status text default 'For Sale', -- For Sale, Reserved, Sold
  price numeric,
  currency text default 'TRY',
  area_gross numeric,
  area_net numeric,
  floor integer,
  direction text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Customers
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  source text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Sales Pipeline
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  unit_id uuid references units(id) on delete cascade,
  assigned_to uuid references profiles(id),
  status text default 'Lead', -- Lead, Prospect, Reservation, Contract, Sold
  deposit_amount numeric default 0,
  reservation_expiry timestamp with time zone,
  contract_date timestamp with time zone,
  final_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- EXTENDED MODULE: CONTRACTS & FINANCE
-- ==========================================

-- 9. Contracts
create table if not exists contracts (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  sale_id uuid references sales(id) on delete cascade,
  contract_number text not null,
  contract_date date not null,
  signed_amount numeric not null,
  currency text default 'TRY',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Payment Plans
create table if not exists payment_plans (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  contract_id uuid references contracts(id) on delete cascade,
  name text, -- e.g. "Standard 12 Months"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Payment Items (Installments)
create table if not exists payment_items (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  payment_plan_id uuid references payment_plans(id) on delete cascade,
  due_date date not null,
  amount numeric not null,
  status text default 'Pending', -- Pending, Paid, Overdue, Cancelled
  paid_date date,
  description text, -- e.g. "Installment 1", "Down Payment"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table blocks enable row level security;
alter table units enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table contracts enable row level security;
alter table payment_plans enable row level security;
alter table payment_items enable row level security;

-- Policies (Re-run safe)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'View own tenant projects') then
    create policy "View own tenant projects" on projects for select using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where policyname = 'View own tenant units') then
    create policy "View own tenant units" on units for select using (project_id in (select id from projects where tenant_id in (select tenant_id from profiles where id = auth.uid())));
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'View own tenant contracts') then
    create policy "View own tenant contracts" on contracts for select using (tenant_id in (select tenant_id from profiles where id = auth.uid()));
  end if;
end
$$;
