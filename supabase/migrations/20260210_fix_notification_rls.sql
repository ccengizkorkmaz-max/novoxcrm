-- Migration: Fix Notification RLS
-- Created: 2026-02-10
-- Purpose: Allow users to insert notifications for themselves and others in the same tenant

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_notifications' AND policyname = 'Users can create notifications for their tenant'
    ) THEN
        CREATE POLICY "Users can create notifications for their tenant"
          ON system_notifications FOR INSERT
          WITH CHECK (
            tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
          );
    END IF;
END $$;
