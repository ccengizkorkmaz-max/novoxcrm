-- ==========================================
-- 🚪 BROKER PROJECT ACCESS CONTROL & LEVELS
-- ==========================================

-- 1. Create Broker Levels Table
CREATE TABLE IF NOT EXISTS broker_levels (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    name text NOT NULL, -- Junior, Silver, Gold, Platinum
    min_sales_count integer DEFAULT 0,
    commission_bonus_percentage numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Level to Profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS broker_level_id uuid REFERENCES broker_levels(id) ON DELETE SET NULL;

-- 3. Modify Projects Table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS visibility_type text DEFAULT 'public' CHECK (visibility_type IN ('public', 'level_restricted', 'private')),
ADD COLUMN IF NOT EXISTS min_broker_level_id uuid REFERENCES broker_levels(id) ON DELETE SET NULL;

-- 4. Create Manual Override Table
CREATE TABLE IF NOT EXISTS project_broker_access (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    broker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id, broker_id)
);

-- 5. Enable RLS
ALTER TABLE broker_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_broker_access ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "View own tenant broker levels" ON broker_levels;
CREATE POLICY "View own tenant broker levels" ON broker_levels
    FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Manage own tenant project access" ON project_broker_access;
CREATE POLICY "Manage own tenant project access" ON project_broker_access
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. UPGRADE Projects RLS (The Core logic)
DROP POLICY IF EXISTS "View own tenant projects" ON projects;

CREATE POLICY "View own tenant projects" ON projects
    FOR SELECT USING (
        -- Rule 1: Same Tenant (Base)
        tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        AND (
            -- Rule 2: If staff (management, sales, owner, admin), see everything in tenant
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
            OR
            -- Rule 3: If broker, respect visibility rules
            (
                (SELECT role FROM profiles WHERE id = auth.uid()) = 'broker'
                AND (
                    -- Public visibility
                    visibility_type = 'public'
                    OR
                    -- Level restricted: Broker level must be high enough
                    (
                        visibility_type = 'level_restricted'
                        AND (
                            SELECT count(*) FROM broker_levels bl 
                            JOIN profiles p ON p.broker_level_id = bl.id
                            WHERE p.id = auth.uid() 
                            AND bl.min_sales_count >= (SELECT min_sales_count FROM broker_levels WHERE id = projects.min_broker_level_id)
                        ) > 0
                    )
                    OR
                    -- Private or Level restricted: Check for manual override
                    EXISTS (SELECT 1 FROM project_broker_access pba WHERE pba.project_id = projects.id AND pba.broker_id = auth.uid())
                )
            )
        )
    );
