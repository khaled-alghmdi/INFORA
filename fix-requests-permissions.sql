-- ============================================
-- FIX REQUESTS PERMISSIONS - 100% Working
-- Ensure users and admins can create/manage requests
-- ============================================

-- ============================================
-- STEP 1: Grant Permissions on Requests Table
-- ============================================

-- Grant full permissions to authenticated users
GRANT ALL ON requests TO authenticated;
GRANT ALL ON requests TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;


-- ============================================
-- STEP 2: Fix RLS Policies for Requests
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to update requests" ON requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete requests" ON requests;

-- Create permissive policies for requests

-- Allow all authenticated users to read all requests
CREATE POLICY "Allow authenticated users to read requests"
ON requests FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert requests
CREATE POLICY "Allow authenticated users to insert requests"
ON requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update requests
CREATE POLICY "Allow authenticated users to update requests"
ON requests FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to delete requests (optional, for admins)
CREATE POLICY "Allow authenticated users to delete requests"
ON requests FOR DELETE
TO authenticated
USING (true);


-- ============================================
-- STEP 3: Ensure RLS is Enabled
-- ============================================

-- Enable RLS on requests table
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;


-- ============================================
-- STEP 4: Grant Permissions on Related Tables
-- ============================================

-- Ensure users can read from users table (for lookups)
GRANT SELECT ON users TO authenticated;


-- ============================================
-- STEP 5: Verify Permissions
-- ============================================

-- Check table permissions
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.table_privileges
WHERE table_name = 'requests'
    AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;


-- Check RLS status
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✓ RLS ENABLED' 
        ELSE '✗ RLS DISABLED' 
    END as rls_status
FROM pg_tables
WHERE tablename = 'requests';


-- Check RLS policies
SELECT 
    policyname,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation
FROM pg_policies
WHERE tablename = 'requests'
ORDER BY policyname;


-- ============================================
-- STEP 6: Test Request Creation
-- ============================================

-- Test if you can insert a request (this should work)
-- Uncomment to test:

/*
INSERT INTO requests (
    user_id,
    request_type,
    title,
    description,
    priority,
    status
) VALUES (
    (SELECT id FROM users LIMIT 1), -- Use first user as test
    'it_support',
    'Test Request',
    'This is a test request to verify permissions',
    'low',
    'pending'
);

-- Check if it was created
SELECT * FROM requests WHERE title = 'Test Request';

-- Delete test request
DELETE FROM requests WHERE title = 'Test Request';
*/


-- ============================================
-- EXPECTED RESULTS
-- ============================================

-- Permissions should show:
-- authenticated | INSERT  | requests
-- authenticated | SELECT  | requests
-- authenticated | UPDATE  | requests
-- authenticated | DELETE  | requests

-- RLS status should show:
-- ✓ RLS ENABLED

-- Policies should show:
-- Allow authenticated users to insert requests | INSERT
-- Allow authenticated users to read requests   | SELECT
-- Allow authenticated users to update requests | UPDATE
-- Allow authenticated users to delete requests | DELETE


-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 
    '✅ Requests permissions configured!' as status,
    'Users and admins can now create and manage requests' as message;

