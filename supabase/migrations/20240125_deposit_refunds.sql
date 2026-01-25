-- Update deposits status constraint to support refunds
ALTER TABLE deposits DROP CONSTRAINT IF EXISTS deposits_status_check;
ALTER TABLE deposits ADD CONSTRAINT deposits_status_check CHECK (status IN ('Pending', 'Paid', 'Cancelled', 'Refund Pending', 'Refunded'));
