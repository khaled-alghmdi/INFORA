-- ============================================
-- SAFE DATABASE CLEAR - KEEP khalid.alghamdi@tamergroup.com
-- This version checks first, then deletes with confirmation
-- ============================================

-- ============================================
-- STEP 1: CHECK WHAT WILL BE DELETED (DRY RUN)
-- ============================================

-- Count users to be deleted
SELECT 
    'USERS TO DELETE' as item,
    COUNT(*) as count
FROM users
WHERE email != 'khalid.alghamdi@tamergroup.com';

-- List users to be deleted
SELECT 
    'Users that will be DELETED:' as warning,
    email,
    full_name,
    department
FROM users
WHERE email != 'khalid.alghamdi@tamergroup.com';

-- Count requests to be deleted
SELECT 
    'REQUESTS TO DELETE' as item,
    COUNT(*) as count
FROM requests
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Count assignments to be deleted
SELECT 
    'ASSIGNMENTS TO DELETE' as item,
    COUNT(*) as count
FROM assignments
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Count devices to be unassigned
SELECT 
    'DEVICES TO UNASSIGN' as item,
    COUNT(*) as count
FROM devices
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);


-- ============================================
-- STEP 2: VERIFY KHALID'S DATA WILL BE KEPT
-- ============================================

-- Khalid's user record
SELECT 
    '✓ KHALID - WILL BE KEPT' as status,
    id,
    email,
    full_name,
    role
FROM users
WHERE email = 'khalid.alghamdi@tamergroup.com';

-- Khalid's devices
SELECT 
    '✓ KHALID DEVICES - WILL BE KEPT' as status,
    d.name,
    d.type,
    d.status
FROM devices d
WHERE d.assigned_to IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Khalid's requests
SELECT 
    '✓ KHALID REQUESTS - WILL BE KEPT' as status,
    r.title,
    r.status,
    r.created_at::date
FROM requests r
WHERE r.user_id IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Khalid's assignments
SELECT 
    '✓ KHALID ASSIGNMENTS - WILL BE KEPT' as status,
    a.assigned_date::date,
    d.name as device_name
FROM assignments a
JOIN devices d ON a.device_id = d.id
WHERE a.user_id IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);


-- ============================================
-- STEP 3: ACTUAL DELETION (Run only after reviewing above)
-- ============================================

-- ⚠️⚠️⚠️ UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE ⚠️⚠️⚠️

/*

-- Delete requests from other users
DELETE FROM requests
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Delete assignments from other users
DELETE FROM assignments
WHERE user_id NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Unassign devices from other users
UPDATE devices
SET 
    assigned_to = NULL,
    assigned_date = NULL,
    status = 'available'
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (
    SELECT id FROM users WHERE email = 'khalid.alghamdi@tamergroup.com'
);

-- Delete other users
DELETE FROM users
WHERE email != 'khalid.alghamdi@tamergroup.com';

-- Show final summary
SELECT 
    '✅ DELETION COMPLETE' as status,
    'Only khalid.alghamdi@tamergroup.com data remains' as message;

*/


-- ============================================
-- STEP 4: POST-DELETION VERIFICATION
-- ============================================

-- Run these after deletion to verify

/*

-- Final record counts
SELECT 'FINAL COUNTS' as report;

SELECT 'users' as table_name, COUNT(*) as remaining_records FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'requests', COUNT(*) FROM requests;

-- Verify only Khalid remains
SELECT 
    '✓ Remaining User' as status,
    email,
    full_name
FROM users;

*/

