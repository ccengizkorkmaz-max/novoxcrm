-- Add Hot Lead Manager feature columns to profiles
-- is_hot_lead_manager: toggle to receive WhatsApp notifications for hot leads
-- phone: user's WhatsApp phone number for receiving notifications

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_hot_lead_manager BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for quick lookup of hot lead managers per tenant
CREATE INDEX IF NOT EXISTS idx_profiles_hot_lead_manager 
ON profiles (tenant_id, is_hot_lead_manager) 
WHERE is_hot_lead_manager = TRUE;

-- Add hot_lead_notified flag to conversations for deduplication
-- Prevents sending duplicate notifications for the same conversation
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS hot_lead_notified BOOLEAN DEFAULT FALSE;
