-- ============================================
-- Enable Realtime - Simple Method (No Errors)
-- Add only the tables that don't have realtime yet
-- ============================================

-- Based on your check, only 'requests' is currently enabled
-- We need to add: devices, users, assignments

-- ============================================
-- Add devices table to realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE devices;


-- ============================================
-- Add users table to realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE users;


-- ============================================
-- Add assignments table to realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE assignments;


-- ============================================
-- Note: requests already enabled (skip it)
-- ============================================

-- requests table already has realtime ✓


-- ============================================
-- Verify All Tables Now Have Realtime
-- ============================================

SELECT 
    tablename,
    '✓ REALTIME ENABLED' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename;

-- Expected result: All 4 tables should show

