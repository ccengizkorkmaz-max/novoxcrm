-- Add Netgsm SIP credentials to tenants table for Vapi / VoIP integrations
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS netgsm_sip_username text,
ADD COLUMN IF NOT EXISTS netgsm_sip_password text;

COMMENT ON COLUMN tenants.netgsm_sip_username IS 'Netgsm SIP account username (usually phone number starting with 212/850)';
COMMENT ON COLUMN tenants.netgsm_sip_password IS 'Netgsm SIP account password for VoIP and Vapi connections';
