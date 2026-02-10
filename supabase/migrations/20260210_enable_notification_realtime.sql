-- Migration: Enable Realtime for Notifications
-- Created: 2026-02-10
-- Purpose: Ensure the system_notifications table is tracked by Supabase Realtime (supabase_realtime publication)

-- 1. Enable REPLICA IDENTITY FULL to ensure we get all data in payloads
ALTER TABLE system_notifications REPLICA IDENTITY FULL;

-- 2. Add table to the supabase_realtime publication if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Check if it's already in the publication
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'system_notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE system_notifications;
        END IF;
    ELSE
        -- If publication doesn't exist (rare in Supabase), create it
        CREATE PUBLICATION supabase_realtime FOR TABLE system_notifications;
    END IF;
END $$;
