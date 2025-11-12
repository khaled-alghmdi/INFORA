-- ============================================
-- CLEAR DATABASE - KEEP ONLY khalid.alghamdi@tamergroup.com
-- This script removes all data EXCEPT records related to khalid.alghamdi@tamergroup.com
-- ============================================

-- ⚠️ WARNING: This will permanently delete data!
-- Run this in your Supabase SQL Editor
-- Make sure to backup your database before running this!

-- ============================================
-- STEP 1: Get the user ID for khalid.alghamdi@tamergroup.com
-- ============================================

-- First, verify the user exists
SELECT 
    id,
    email,
    full_name,
    department,
    role
FROM users
WHERE email = 'khalid.alghamdi@tamergroup.com';

-- Store the user ID (you'll see it in the results above)
-- Replace 'USER_ID_HERE' in the comments below if needed


-- ============================================
-- STEP 2: DELETE REQUESTS (Keep only Khalid's requests)
-- ============================================

-- Delete all requests NOT created by khalid.alghamdi@tamergroup.com
DELETE FROM requests
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Verify remaining requests
SELECT COUNT(*) as remaining_requests FROM requests;


-- ============================================
-- STEP 3: DELETE ASSIGNMENTS (Keep only Khalid's assignments)
-- ============================================

-- Delete all assignments NOT related to khalid.alghamdi@tamergroup.com
DELETE FROM assignments
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Verify remaining assignments
SELECT COUNT(*) as remaining_assignments FROM assignments;


-- ============================================
-- STEP 4: UPDATE DEVICES (Unassign devices from other users)
-- ============================================

-- Get Khalid's user ID first
DO $$
DECLARE
    khalid_user_id UUID;
BEGIN
    -- Get Khalid's user ID
    SELECT id INTO khalid_user_id 
    FROM users 
    WHERE email = 'khalid.alghamdi@tamergroup.com';

    -- Update devices: Keep devices assigned to Khalid, unassign others
    UPDATE devices
    SET 
        assigned_to = NULL,
        assigned_date = NULL,
        status = 'available'
    WHERE assigned_to IS NOT NULL 
    AND assigned_to != khalid_user_id;
END $$;

-- Verify devices
SELECT 
    status,
    COUNT(*) as device_count
FROM devices
GROUP BY status;


-- ============================================
-- STEP 5: DELETE OTHER USERS (Keep only Khalid)
-- ============================================

-- Delete all users EXCEPT khalid.alghamdi@tamergroup.com
DELETE FROM users
WHERE email != 'khalid.alghamdi@tamergroup.com';

-- Verify remaining users
SELECT 
    id,
    email,
    full_name,
    role,
    is_active
FROM users;


-- ============================================
-- STEP 6: OPTIONAL - Clear activity logs (if table exists)
-- ============================================

-- Uncomment if you have an activity_logs table
-- DELETE FROM activity_logs
-- WHERE user_id NOT IN (
--     SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
-- );


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check total records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'requests', COUNT(*) FROM requests;

-- Check Khalid's data
SELECT 
    'User Info' as info_type,
    u.email,
    u.full_name,
    u.department,
    u.role
FROM users u
WHERE u.email = 'khalid.alghamdi@tamergroup.com'

UNION ALL

SELECT 
    'Assigned Devices',
    d.name,
    d.type,
    d.status,
    ''
FROM devices d
WHERE d.assigned_to IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com')

UNION ALL

SELECT 
    'Requests',
    r.title,
    r.status,
    r.priority,
    ''
FROM requests r
WHERE r.user_id IN (SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com');


-- ============================================
-- SUMMARY REPORT
-- ============================================

SELECT 
    'Database cleared successfully!' as status,
    'Only data related to khalid.alghamdi@tamergroup.com remains' as message;

