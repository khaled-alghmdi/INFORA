-- ============================================
-- INFORA - Setup Row Level Security (RLS)
-- Complete RLS configuration for all tables
-- ============================================

-- Run this in your Supabase SQL Editor
-- This will enable RLS and create all necessary policies

-- ============================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable RLS on devices table
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on requests table
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Optional: Enable RLS on activity_logs if exists
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP EXISTING POLICIES (if any)
-- ============================================

-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated users to insert devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated users to update devices" ON devices;
DROP POLICY IF EXISTS "Allow authenticated users to delete devices" ON devices;

DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to insert users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to delete users" ON users;

DROP POLICY IF EXISTS "Allow authenticated users to read assignments" ON assignments;
DROP POLICY IF EXISTS "Allow authenticated users to insert assignments" ON assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update assignments" ON assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete assignments" ON assignments;

DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to update requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete requests" ON requests;

-- ============================================
-- STEP 3: CREATE POLICIES FOR DEVICES TABLE
-- ============================================

-- Allow everyone to read devices (public access)
-- Change to 'authenticated' if you want only logged-in users
CREATE POLICY "Allow authenticated users to read devices"
ON devices FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert devices
CREATE POLICY "Allow authenticated users to insert devices"
ON devices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update devices
CREATE POLICY "Allow authenticated users to update devices"
ON devices FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete devices
CREATE POLICY "Allow authenticated users to delete devices"
ON devices FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 4: CREATE POLICIES FOR USERS TABLE
-- ============================================

-- Allow authenticated users to read all users
CREATE POLICY "Allow authenticated users to read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert users (admin only in application logic)
CREATE POLICY "Allow authenticated users to insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update users
CREATE POLICY "Allow authenticated users to update users"
ON users FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Optionally allow delete
CREATE POLICY "Allow authenticated users to delete users"
ON users FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 5: CREATE POLICIES FOR ASSIGNMENTS TABLE
-- ============================================

-- Allow authenticated users to read assignments
CREATE POLICY "Allow authenticated users to read assignments"
ON assignments FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert assignments
CREATE POLICY "Allow authenticated users to insert assignments"
ON assignments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update assignments
CREATE POLICY "Allow authenticated users to update assignments"
ON assignments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete assignments
CREATE POLICY "Allow authenticated users to delete assignments"
ON assignments FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 6: CREATE POLICIES FOR REQUESTS TABLE
-- ============================================

-- Allow authenticated users to read all requests
CREATE POLICY "Allow authenticated users to read requests"
ON requests FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert requests
CREATE POLICY "Allow authenticated users to insert requests"
ON requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update requests
CREATE POLICY "Allow authenticated users to update requests"
ON requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete requests
CREATE POLICY "Allow authenticated users to delete requests"
ON requests FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON devices TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON requests TO authenticated;

-- Grant read-only to anonymous (if needed)
GRANT SELECT ON devices TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON assignments TO anon;
GRANT SELECT ON requests TO anon;

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✓ RLS ENABLED' 
        ELSE '✗ RLS DISABLED' 
    END as status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('devices', 'users', 'assignments', 'requests')
ORDER BY tablename;

-- Run this to see all policies
SELECT 
    tablename,
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

