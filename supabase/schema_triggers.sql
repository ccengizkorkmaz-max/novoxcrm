-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_tenant_id uuid;
begin
  -- 1. Create a default Tenant for the user
  insert into public.tenants (name)
  values (coalesce(new.raw_user_meta_data->>'company_name', 'My Company'))
  returning id into new_tenant_id;

  -- 2. Create the User Profile linked to the Tenant
  insert into public.profiles (id, tenant_id, full_name, role)
  values (
    new.id,
    new_tenant_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'owner' -- First user is always Owner
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Manual Fix for existing user (Run this once if needed)
-- This block attempts to fix the specific user if they already exist but have no profile
do $$
declare
  param_email text := 'ccengizkorkmaz@gmail.com';
  v_user_id uuid;
  v_tenant_id uuid;
begin
  -- Find the user ID from auth.users (requires permission, usually runs in SQL Editor with postgres role)
  select id into v_user_id from auth.users where email = param_email;
  
  if v_user_id is not null and not exists (select 1 from public.profiles where id = v_user_id) then
      -- Create tenant
      insert into public.tenants (name) values ('My Company') returning id into v_tenant_id;
      
      -- Create profile
      insert into public.profiles (id, tenant_id, full_name, role)
      values (v_user_id, v_tenant_id, 'Cengiz Korkmaz', 'owner');
      
      raise notice 'Fixed profile for user %', param_email;
  end if;
end;
$$;
