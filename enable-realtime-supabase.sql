-- ============================================
-- Enable Real-time Synchronization for INFORA
-- This allows multiple admins to see changes instantly
-- ============================================

-- ============================================
-- STEP 1: Check Which Tables Already Have Realtime
-- ============================================

-- Check current realtime tables
SELECT tablename 
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;


-- ============================================
-- STEP 2: Enable Realtime on Tables (Safe Method)
-- ============================================

-- Based on your check, 'requests' is already enabled
-- Only add the missing tables: devices, users, assignments

-- Add devices table to realtime
-- (Comment out if you get "already member" error)
ALTER PUBLICATION supabase_realtime ADD TABLE devices;

-- Add users table to realtime
-- (Comment out if you get "already member" error)
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Add assignments table to realtime
-- (Comment out if you get "already member" error)
ALTER PUBLICATION supabase_realtime ADD TABLE assignments;

-- requests is already enabled, so we skip it
-- ALTER PUBLICATION supabase_realtime ADD TABLE requests;  ← Skip this one


-- ============================================
-- STEP 2: Verify Realtime is Enabled
-- ============================================

-- Check which tables have realtime enabled
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;


-- ============================================
-- STEP 3: Grant Permissions (if needed)
-- ============================================

-- Ensure authenticated users can listen to changes
GRANT SELECT ON devices TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON assignments TO authenticated;
GRANT SELECT ON requests TO authenticated;


-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- This should show all tables with realtime enabled
SELECT 
    'Realtime enabled for: ' || tablename as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('devices', 'users', 'assignments', 'requests');


-- ============================================
-- EXPECTED RESULT
-- ============================================

-- You should see:
-- Realtime enabled for: devices
-- Realtime enabled for: users
-- Realtime enabled for: assignments
-- Realtime enabled for: requests


-- ============================================
-- NOTES
-- ============================================

-- After running this:
-- 1. Changes to devices will be broadcast to all connected clients
-- 2. Changes to users will be broadcast to all connected clients
-- 3. Changes to assignments will be broadcast to all connected clients
-- 4. Changes to requests will be broadcast to all connected clients
-- 5. All admins will see updates in real-time

