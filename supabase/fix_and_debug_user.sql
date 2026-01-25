-- Force fix for user (Idempotent / Safe to run multiple times)

DO $$
DECLARE
    target_email text := 'ccengizkorkmaz@gmail.com';
    user_id uuid;
    new_tenant_id uuid;
    current_tenant_id uuid;
BEGIN
    -- 1. Get User ID
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NULL THEN
        RAISE NOTICE 'User % not found in auth.users', target_email;
        RETURN;
    END IF;

    -- 2. Upsert Profile (Insert if missing, do nothing if exists)
    -- We can't use standard INSERT ON CONFLICT easily with anonymous blocks in some contexts without unique constraints known, 
    -- but we know PK is ID.
    
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RAISE NOTICE 'Profile already exists.';
    ELSE
        -- Create dummy tenant if we are creating a fresh profile
        INSERT INTO public.tenants (name) VALUES ('My Real Estate Firm') RETURNING id INTO new_tenant_id;
        INSERT INTO public.profiles (id, tenant_id, role, full_name) VALUES (user_id, new_tenant_id, 'owner', 'Cengiz Korkmaz');
        RAISE NOTICE 'Created new Profile.';
    END IF;

    -- 3. Ensure Tenant ID is set
    SELECT tenant_id INTO current_tenant_id FROM public.profiles WHERE id = user_id;
    
    IF current_tenant_id IS NULL THEN
        RAISE NOTICE 'Profile has NULL tenant. Fixing...';
        INSERT INTO public.tenants (name) VALUES ('My Real Estate Firm') RETURNING id INTO new_tenant_id;
        UPDATE public.profiles SET tenant_id = new_tenant_id WHERE id = user_id;
    ELSE
        RAISE NOTICE 'Profile has valid tenant: %', current_tenant_id;
    END IF;

END $$;
