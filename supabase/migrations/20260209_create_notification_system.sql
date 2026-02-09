-- Migration: Create Notification System Tables
-- Created: 2026-02-09
-- Purpose: Support centralized system notifications and SMS/Email settings

-- 1. Notification Settings (Tenant Level)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- SMS Configs
  sms_provider TEXT DEFAULT 'default', -- e.g., 'netgsm', 'iletimerkezi'
  sms_api_key TEXT,
  sms_api_secret TEXT,
  sms_header TEXT, -- Sender ID
  
  -- Email Configs (Fallback/Override)
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  notify_overdue_payments BOOLEAN DEFAULT TRUE,
  notify_approaching_checks BOOLEAN DEFAULT TRUE,
  notify_new_leads BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. System Notifications (UI Hub)
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Target user (null for all admins)
  
  type TEXT NOT NULL, -- 'Info', 'Warning', 'Alert', 'Success'
  category TEXT NOT NULL, -- 'Finance', 'CRM', 'System'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Internal app link
  
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notification Queue (SMS/Email History & Retries)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  recipient_type TEXT NOT NULL, -- 'Customer', 'User'
  recipient_id UUID, -- References profiles or customers
  recipient_contact TEXT NOT NULL, -- Email or Phone
  
  channel TEXT NOT NULL, -- 'SMS', 'Email'
  subject TEXT,
  content TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
CREATE POLICY "Tenant owners can manage notification settings"
  ON notification_settings FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- RLS Policies for system_notifications
CREATE POLICY "Users can view their own notifications"
  ON system_notifications FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));

CREATE POLICY "Users can mark their notifications as read"
  ON system_notifications FOR UPDATE
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) AND (user_id = auth.uid() OR user_id IS NULL));

-- Drop and Index
CREATE INDEX IF NOT EXISTS idx_sys_notif_user ON system_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_queue_status ON notification_queue(status);

-- Comments
COMMENT ON TABLE notification_settings IS 'Stores API keys and preferences for SMS/Email notifications';
COMMENT ON TABLE system_notifications IS 'Internal app notifications displayed in the bell hub';
COMMENT ON TABLE notification_queue IS 'Queue for outgoing SMS and Email messages';
