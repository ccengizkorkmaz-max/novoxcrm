-- Fix specific broker Dino Taş (or any other broker with null tenant)
-- The tenant ID 89b2829e-fc21-477e-8fd8-9f9f0c587e81 is the main tenant detected in the logs

UPDATE profiles 
SET tenant_id = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'
WHERE role = 'broker' AND tenant_id IS NULL;

-- Also update their applications so future approval/processing uses the correct tenant
UPDATE broker_applications
SET tenant_id = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'
WHERE tenant_id IS NULL;
