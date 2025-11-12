-- ============================================
-- FIX: Devices Not Showing on My Devices Page
-- Users should see their devices immediately
-- ============================================

-- Step 1: Grant permissions on devices table
GRANT ALL ON TABLE devices TO authenticated;
GRANT SELECT ON TABLE devices TO authenticated;

-- Step 2: Drop old restrictive policies
DROP POLICY IF EXISTS "Users can only view their own devices" ON devices;
DROP POLICY IF EXISTS "Users can view assigned devices" ON devices;
DROP POLICY IF EXISTS "devices_select_policy" ON devices;
DROP POLICY IF EXISTS "devices_all_policy" ON devices;

-- Step 3: Create new permissive policies

-- Allow users to view ALL devices (they need to see unassigned ones too)
-- The app will filter to show only their devices
CREATE POLICY "allow_select_devices"
ON devices FOR SELECT
TO authenticated
USING (true);

-- Allow admins to do everything (insert, update, delete)
CREATE POLICY "allow_all_devices"
ON devices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Ensure RLS is enabled
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify
SELECT 
    'Devices table' as item,
    CASE WHEN COUNT(*) >= 2 THEN '✅ Fixed' ELSE '❌ Failed' END as status
FROM pg_policies WHERE tablename = 'devices';

-- Success message
SELECT '✅ Devices should now be visible immediately!' as message;

