-- =====================================================
-- INVENTORY ENHANCEMENTS MIGRATION
-- 1. Unit Images (Gallery)
-- 2. Unit Activity Log (Timeline)
-- 3. Extended Status Support
-- 4. Price History View (leveraging negotiations)
-- =====================================================

-- 1. UNIT IMAGES TABLE
CREATE TABLE IF NOT EXISTS unit_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- RLS for unit_images
ALTER TABLE unit_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unit_images"
    ON unit_images FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- 2. UNIT ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS unit_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'price_change', 'status_change', 'reservation', 'offer', 'sale', 'note', 'image_upload'
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS for unit_activity_log
ALTER TABLE unit_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unit_activity_log"
    ON unit_activity_log FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- 3. STORAGE BUCKET for unit images
INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-images', 'unit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload unit images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'unit-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view unit images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'unit-images');

CREATE POLICY "Authenticated users can delete unit images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'unit-images' AND auth.role() = 'authenticated');

-- 4. Add new status options: the status column already exists in units
-- We don't need to alter it since it's a text field, but let's add a comment for documentation
COMMENT ON COLUMN units.status IS 'Unit status: For Sale, Reserved, Sold, Blocked, Option, Rented, Delivered';

-- 5. Add created_at to units if not exists (for stock aging)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'listed_at') THEN
        ALTER TABLE units ADD COLUMN listed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Backfill listed_at from created_at
UPDATE units SET listed_at = created_at WHERE listed_at IS NULL AND created_at IS NOT NULL;

-- 6. CREATE INDEX for performance
CREATE INDEX IF NOT EXISTS idx_unit_images_unit_id ON unit_images(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_activity_log_unit_id ON unit_activity_log(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_activity_log_created_at ON unit_activity_log(created_at DESC);
