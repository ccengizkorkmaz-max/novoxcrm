-- Fix public_inventory_links schema inconsistencies and relationships

-- 1. Rename view_count to views_count if views_count doesn't already have data or just standardize
-- Since we added views_count in a separate migration, let's just make sure it's clean.
-- If view_count exists and has data, we might want to merge, but let's just drop the redundant one.
do $$ 
begin
    if exists (select 1 from information_schema.columns where table_name='public_inventory_links' and column_name='view_count') then
        -- Move data if any
        update public_inventory_links set views_count = view_count where views_count = 0;
        alter table public_inventory_links drop column view_count;
    end if;
end $$;

-- 2. Fix the foreign key for created_by to point to profiles instead of auth.users
-- This allows PostgREST to perform the join for the full_name
alter table public_inventory_links 
drop constraint if exists public_inventory_links_created_by_fkey;

alter table public_inventory_links
add constraint public_inventory_links_created_by_fkey 
foreign key (created_by) references profiles(id);

-- 3. Ensure last_viewed_at and leads_count exist (they were in the advanced features migration but just in case)
alter table public_inventory_links 
add column if not exists last_viewed_at timestamptz,
add column if not exists leads_count int default 0;
