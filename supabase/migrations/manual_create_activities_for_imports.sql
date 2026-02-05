-- SQL Script: Create Activities for Imported Customers
-- This script creates 'Completed' 'Call' activities for customers with source 'Excel Import' 
-- and non-empty notes, if they don't already have an import activity.

DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- 1. Identify a valid user ID to act as the creator/owner
    -- We'll try to find a profile with 'admin' role, or fallback to any profile
    SELECT id INTO v_admin_id FROM profiles ORDER BY created_at ASC LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'No profile found to assign activities to. Please ensure the profiles table is not empty.';
        RETURN;
    END IF;

    -- 2. Insert Activities
    INSERT INTO activities (
        tenant_id,
        customer_id,
        user_id,
        owner_id,
        assigned_by_id,
        topic,
        type,
        summary,
        description,
        notes,
        status,
        outcome,
        completed_at,
        due_date,
        done_at,
        created_at
    )
    SELECT 
        c.tenant_id,
        c.id as customer_id,
        v_admin_id as user_id,
        v_admin_id as owner_id,
        v_admin_id as assigned_by_id,
        'General' as topic,
        'Call' as type,
        'Excel Import Notu' as summary,
        c.notes as description,
        c.notes as notes,
        'Completed' as status,
        'Success' as outcome,
        c.created_at as completed_at,
        c.created_at as due_date,
        c.created_at as done_at,
        c.created_at as created_at
    FROM customers c
    WHERE c.source = 'Excel Import'
      AND c.notes IS NOT NULL 
      AND c.notes != ''
      -- Prevent duplicates
      AND NOT EXISTS (
          SELECT 1 FROM activities a 
          WHERE a.customer_id = c.id 
          AND a.summary = 'Excel Import Notu'
      );

    RAISE NOTICE 'Activities created successfully using profile ID: %', v_admin_id;

END $$;
