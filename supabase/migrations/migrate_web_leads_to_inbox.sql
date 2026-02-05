-- Migration: Move existing web@novosirketlergrubu.com leads to Inbox
-- This is a one-time migration to populate the Inbox with existing web@ leads

UPDATE sales
SET status = 'Inbox'
FROM customers
WHERE sales.customer_id = customers.id
  AND customers.email = 'web@novosirketlergrubu.com'
  AND sales.status = 'Lead'
  AND sales.description IS NOT NULL;

-- Show results
SELECT 
    s.id,
    c.full_name,
    c.email,
    s.status,
    s.created_at
FROM sales s
JOIN customers c ON s.customer_id = c.id
WHERE c.email = 'web@novosirketlergrubu.com'
ORDER BY s.created_at DESC
LIMIT 10;
