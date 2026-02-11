-- Fix RLS policy for public_inventory_links to be more reliable for inserts
drop policy if exists "Users can manage their tenant's links" on public_inventory_links;

create policy "Users can manage their tenant's links"
    on public_inventory_links for all
    using (
        tenant_id in (
            select tenant_id from profiles where id = auth.uid()
        )
    )
    with check (
        tenant_id in (
            select tenant_id from profiles where id = auth.uid()
        )
    );
