ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS land_area numeric,
ADD COLUMN IF NOT EXISTS distance_to_sea numeric,
ADD COLUMN IF NOT EXISTS distance_to_forest numeric,
ADD COLUMN IF NOT EXISTS distance_to_city numeric;

COMMENT ON COLUMN projects.land_area IS 'Arsa metrekaresi (m2)';
COMMENT ON COLUMN projects.distance_to_sea IS 'Denize yakınlık (metre)';
COMMENT ON COLUMN projects.distance_to_forest IS 'Ormana yakınlık (metre)';
COMMENT ON COLUMN projects.distance_to_city IS 'Şehire yakınlık (dakika)';
