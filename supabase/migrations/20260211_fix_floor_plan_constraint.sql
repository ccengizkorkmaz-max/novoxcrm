-- =====================================================
-- FIX MISSING UNIQUE CONSTRAINT FOR UPSERT
-- Adds the necessary unique constraint for unit_floor_positions table
-- =====================================================

DO $$
BEGIN
    -- Only add constraint if it doesn't exist to avoid errors
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_unit_floor_pos'
    ) THEN
        -- Check if there is ANY unique constraint on (floor_plan_id, unit_id)
        -- If not, add one
         IF NOT EXISTS (
            SELECT 1 
            FROM pg_index i
            JOIN pg_attribute a ON (a.attrelid = i.indexrelid)
            WHERE i.indrelid = 'unit_floor_positions'::regclass
            AND i.indisunique = true
            AND array_to_string(array_agg(a.attname), ',') = 'floor_plan_id,unit_id'
            GROUP BY i.indexrelid, i.indisunique
        ) THEN
            ALTER TABLE unit_floor_positions 
            ADD CONSTRAINT unique_unit_floor_pos UNIQUE (floor_plan_id, unit_id);
        END IF;
    END IF;
END $$;

-- Also try to force it just in case logic above is complex
-- This line might error if it already exists, but that's fine.
ALTER TABLE unit_floor_positions ADD CONSTRAINT unique_unit_floor_pos_explicit UNIQUE (floor_plan_id, unit_id);
