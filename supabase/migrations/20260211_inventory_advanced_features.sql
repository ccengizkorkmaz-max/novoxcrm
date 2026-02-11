-- Enhancement: Public Inventory Tracking & Lead Generation
-- 1. Tracking for public links
alter table public_inventory_links 
add column if not exists views_count int default 0,
add column if not exists last_viewed_at timestamptz,
add column if not exists leads_count int default 0;

-- 2. Public inquiries table (Leads from catalog)
create table if not exists public_inquiries (
    id uuid default gen_random_uuid() primary key,
    link_id uuid references public_inventory_links(id) on delete set null,
    tenant_id uuid references tenants(id) on delete cascade,
    unit_id uuid references units(id) on delete set null,
    full_name text not null,
    email text,
    phone text not null,
    message text,
    source text default 'catalog',
    status text default 'new', -- new, contacted, qualified, junk
    created_at timestamptz default now()
);

-- Enable RLS for public_inquiries
alter table public_inquiries enable row level security;

-- Policies for public_inquiries
create policy "Public can insert inquiries"
    on public_inquiries for insert
    with check (true);

create policy "Users can view inquiries from their tenant"
    on public_inquiries for select
    using (
        tenant_id in (
            select tenant_id from profiles where id = auth.uid()
        )
    );

create policy "Users can update inquiries from their tenant"
    on public_inquiries for update
    using (
        tenant_id in (
            select tenant_id from profiles where id = auth.uid()
        )
    );

-- 3. Price Automation Helpers
-- Add a price_multiplier column to units for bulk adjustments (optional, but good for tracking)
alter table units 
add column if not exists price_last_updated_at timestamptz default now();

-- Add a history/log for price changes could be a 5-star feature
create table if not exists unit_price_history (
    id uuid default gen_random_uuid() primary key,
    unit_id uuid references units(id) on delete cascade,
    old_price decimal(15,2),
    new_price decimal(15,2),
    currency text,
    reason text,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

alter table unit_price_history enable row level security;
create policy "Users can view price history from their tenantUnits"
    on unit_price_history for select
    using (
        unit_id in (
            select id from units where tenant_id in (
                select tenant_id from profiles where id = auth.uid()
            )
        )
    );
