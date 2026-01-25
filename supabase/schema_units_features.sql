-- Add unit features columns to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS parking_type text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS heating_type text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_builtin_kitchen boolean DEFAULT false;
ALTER TABLE units ADD COLUMN IF NOT EXISTS direction text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS kitchen_type text;
ALTER TABLE units ADD COLUMN IF NOT EXISTS has_master_bathroom boolean DEFAULT false;
ALTER TABLE units ADD COLUMN IF NOT EXISTS room_areas jsonb DEFAULT '[]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN units.parking_type IS 'Parking type: Kapalı Otopark, Açık Otopark, Yok';
COMMENT ON COLUMN units.heating_type IS 'Heating type: Kombi, Merkezi Sistem, etc.';
COMMENT ON COLUMN units.has_builtin_kitchen IS 'Has built-in kitchen appliances';
COMMENT ON COLUMN units.direction IS 'Unit direction: Kuzey, Güney, Doğu, Batı, etc.';
COMMENT ON COLUMN units.kitchen_type IS 'Kitchen type: Kapalı Mutfak, Açık Mutfak';
COMMENT ON COLUMN units.has_master_bathroom IS 'Has master bathroom (ebeveyn banyosu)';
COMMENT ON COLUMN units.room_areas IS 'Room area breakdown in JSON format: [{"room": "Salon", "area": 25}, ...]';
