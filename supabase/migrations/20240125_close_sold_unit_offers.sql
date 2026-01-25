-- 1. Update Constraint to allow 'Closed' status
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE offers ADD CONSTRAINT offers_status_check 
    CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Teklif - Kapora Bekleniyor', 'Closed'));

-- 2. Update status of all open offers (Sent/Accepted) to 'Closed'
-- where the associated unit is already marked as 'Sold'.
UPDATE offers
SET status = 'Closed',
    updated_at = NOW()
WHERE unit_id IN (
    SELECT id 
    FROM units 
    WHERE status = 'Sold'
)
AND status IN ('Sent', 'Accepted');
