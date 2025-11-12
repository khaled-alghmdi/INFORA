-- ============================================
-- INFORA - Row Level Security (RLS) Check
-- Check RLS status and policies for all tables
-- ============================================

-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CHECK RLS STATUS ON ALL TABLES
-- ============================================

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ ENABLED' 
        ELSE '✗ DISABLED' 
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests', 'activity_logs')
ORDER BY tablename;

-- ============================================
-- 2. CHECK ALL RLS POLICIES
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN permissive = true THEN 'PERMISSIVE' 
        ELSE 'RESTRICTIVE' 
    END as policy_type,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests', 'activity_logs')
ORDER BY tablename, policyname;

-- ============================================
-- 3. DETAILED RLS CHECK FOR EACH TABLE
-- ============================================

-- Check DEVICES table
SELECT 
    'DEVICES' as table_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ HAS POLICIES' 
        ELSE '✗ NO POLICIES' 
    END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'devices';

-- Check USERS table
SELECT 
    'USERS' as table_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ HAS POLICIES' 
        ELSE '✗ NO POLICIES' 
    END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Check ASSIGNMENTS table
SELECT 
    'ASSIGNMENTS' as table_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ HAS POLICIES' 
        ELSE '✗ NO POLICIES' 
    END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'assignments';

-- Check REQUESTS table
SELECT 
    'REQUESTS' as table_name,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ HAS POLICIES' 
        ELSE '✗ NO POLICIES' 
    END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'requests';

-- ============================================
-- 4. SUMMARY REPORT
-- ============================================

SELECT 
    COUNT(DISTINCT tablename) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as tables_with_rls,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as tables_without_rls
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests', 'activity_logs');

-- ============================================
-- 5. RECOMMENDED RLS POLICIES (if not exist)
-- ============================================

/*
If RLS is not enabled, run these commands:

-- Enable RLS on all tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create basic policies for authenticated users

-- DEVICES policies
CREATE POLICY "Allow authenticated users to read devices"
ON devices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert devices"
ON devices FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update devices"
ON devices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- USERS policies
CREATE POLICY "Allow authenticated users to read users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update users"
ON users FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ASSIGNMENTS policies
CREATE POLICY "Allow authenticated users to read assignments"
ON assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update assignments"
ON assignments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- REQUESTS policies
CREATE POLICY "Allow authenticated users to read requests"
ON requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert requests"
ON requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update requests"
ON requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
*/

