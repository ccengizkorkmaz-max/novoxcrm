-- Arama bekleyenler listesinden dismiss etmek için
-- first_contact'a dokunmadan ayrı bir flag
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS call_request_handled_at TIMESTAMPTZ;

COMMENT ON COLUMN sales.call_request_handled_at IS 'When set, dismisses the lead from the pending call list without changing first_contact';
