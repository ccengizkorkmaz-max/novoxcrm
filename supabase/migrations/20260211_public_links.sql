-- Create public links table
create table public_inventory_links (
    id uuid default gen_random_uuid() primary key,
    tenant_id uuid references tenants(id) on delete cascade not null,
    slug text unique not null,
    title text,
    unit_ids uuid[] not null,
    is_active boolean default true,
    expires_at timestamptz,
    password_hash text,
    view_count int default 0,
    created_at timestamptz default now(),
    created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public_inventory_links enable row level security;

-- Public read access (if active and not expired)
-- We check for password logic in the application layer
create policy "Anyone can read active public links"
    on public_inventory_links for select
    using (
        is_active = true 
        and (expires_at is null or expires_at > now())
    );

-- User management (only their own tenant's links)
create policy "Users can manage their tenant's links"
    on public_inventory_links for all
    using (
        auth.uid() in (
            select id from profiles where tenant_id = public_inventory_links.tenant_id
        )
    );

-- Indexing
create index idx_public_links_slug on public_inventory_links(slug);
