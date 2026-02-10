-- =====================================================
-- INVENTORY FLOOR PLANS & VISUALIZATION
-- =====================================================

-- 1. Floor Plans Table
-- Stores the base image for a floor or site plan
CREATE TABLE IF NOT EXISTS project_floor_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    block TEXT, -- Optional, if plan is specific to a block
    floor TEXT, -- Optional, e.g. "Ground Floor", "1st Floor", or "Type A"
    title TEXT NOT NULL, -- "Block A Ground Floor Plan"
    image_url TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE project_floor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for floor_plans"
    ON project_floor_plans FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- 2. Unit Positions on Floor Plan
-- Maps a unit to a specific coordinate/shape on the floor plan
CREATE TABLE IF NOT EXISTS unit_floor_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    floor_plan_id UUID NOT NULL REFERENCES project_floor_plans(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    position_data JSONB NOT NULL, -- { type: "rect" | "poly", points: "...", x: 0, y: 0, width: 0, height: 0 }
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(floor_plan_id, unit_id) -- A unit should appear only once per plan (usually)
);

-- RLS
ALTER TABLE unit_floor_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for unit_positions"
    ON unit_floor_positions FOR ALL
    USING (tenant_id = (SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::uuid));

-- 3. Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Note: You might need to adjust these if they conflict with existing storage policies
-- Checks if policy exists before creating to avoid errors in repeated runs

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload floor plans'
    ) THEN
        CREATE POLICY "Authenticated users can upload floor plans"
            ON storage.objects FOR INSERT
            WITH CHECK (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view floor plans'
    ) THEN
        CREATE POLICY "Anyone can view floor plans"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'floor-plans');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete floor plans'
    ) THEN
        CREATE POLICY "Authenticated users can delete floor plans"
            ON storage.objects FOR DELETE
            USING (bucket_id = 'floor-plans' AND auth.role() = 'authenticated');
    END IF;
END $$;
