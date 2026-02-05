-- Reassign activities from Cengiz Korkmaz to NovoTeam
-- Old ID (Cengiz): 60925a94-8539-484d-843d-a11ae0e00ddd
-- New ID (NovoTeam): 927a0ddc-4ad1-4957-a1e1-adf5f4eb167e

UPDATE activities
SET owner_id = '927a0ddc-4ad1-4957-a1e1-adf5f4eb167e'
WHERE owner_id = '60925a94-8539-484d-843d-a11ae0e00ddd';

-- Also update sales assignments if any
UPDATE sales
SET assigned_to = '927a0ddc-4ad1-4957-a1e1-adf5f4eb167e'
WHERE assigned_to = '60925a94-8539-484d-843d-a11ae0e00ddd';
