-- Add auto_action_on_new_lead column to tenants table
-- Values: 'whatsapp' (default, current behavior), 'ai_call' (Vapi AI call), 'none' (do nothing)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS auto_action_on_new_lead TEXT DEFAULT 'whatsapp';

-- Comment for clarity
COMMENT ON COLUMN tenants.auto_action_on_new_lead IS 'Action to take when a new lead arrives: whatsapp, ai_call, or none';
