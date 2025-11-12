-- ============================================
-- Check Realtime Status for INFORA Tables
-- Run this to see if realtime is already enabled
-- ============================================

-- Check which tables have realtime enabled
SELECT 
    tablename,
    '✓ REALTIME ENABLED' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename;

-- If a table is missing, it means realtime is NOT enabled for it
-- Expected result should show all 4 tables

-- Check all realtime tables in your database
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

