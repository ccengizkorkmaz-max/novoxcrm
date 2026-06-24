-- Add 'Contract' and 'Pending' to offers status check constraint
-- This fixes "Failed to update status" when starting contract process
-- and when marking offers as pending

ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE offers ADD CONSTRAINT offers_status_check 
    CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Teklif - Kapora Bekleniyor', 'Closed', 'Contract', 'Pending'));
