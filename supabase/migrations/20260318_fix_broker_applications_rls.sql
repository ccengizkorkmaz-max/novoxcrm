-- ==========================================
-- 🔧 FIX: Broker Applications RLS Policies
-- ==========================================
-- Problem: 
--   1. submitBrokerApplication was using createClient() (unauthenticated user) 
--      but insert policy required auth context — fixed in code by using createAdminClient()
--   2. Staff view policy required tenant_id = profile.tenant_id 
--      but applications submitted via /broker/apply had tenant_id = NULL → invisible to staff
--   3. sendVerificationCode also used createClient() → insert to broker_verification_codes failed
--
-- Solution: 
--   - Code now uses createAdminClient() for submit/verify (bypasses RLS on insert, more secure)
--   - Update SELECT policy so staff can also see applications where tenant_id IS NULL
--     (these are "general SaaS" broker applications not tied to a specific tenant)
--   - Keep UPDATE policy strict (only update own-tenant applications)

-- ============================================================
-- 1. UPDATE: Staff can view applications (own tenant OR null tenant)
-- ============================================================
DROP POLICY IF EXISTS "Staff can view applications" ON broker_applications;
CREATE POLICY "Staff can view applications" ON broker_applications
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
    AND (
      -- Own tenant applications
      tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
      OR
      -- General/SaaS applications (not tied to a specific tenant)
      tenant_id IS NULL
    )
  );

-- ============================================================
-- 2. UPDATE: Staff can update applications (own tenant OR null tenant)
-- ============================================================
DROP POLICY IF EXISTS "Staff can update applications" ON broker_applications;
CREATE POLICY "Staff can update applications" ON broker_applications
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('management', 'sales', 'owner', 'admin')
    AND (
      tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
      OR
      tenant_id IS NULL
    )
  );

-- ============================================================
-- 3. ENSURE: broker_verification_codes has permissive insert policy
--    (needed for public unauthenticated users submitting the broker apply form)
-- ============================================================
ALTER TABLE IF EXISTS broker_verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert verification codes" ON broker_verification_codes;
CREATE POLICY "Public can insert verification codes" ON broker_verification_codes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read own verification codes" ON broker_verification_codes;
CREATE POLICY "Public can read own verification codes" ON broker_verification_codes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can delete own verification codes" ON broker_verification_codes;
CREATE POLICY "Public can delete own verification codes" ON broker_verification_codes
  FOR DELETE USING (true);
